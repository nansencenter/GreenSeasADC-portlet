var myNamespace = myNamespace || {};

myNamespace.query = (function(OL) {
	"use strict";

	var previousFilter;

	// construct an OGC XML filter object from attributes
	function constructFilter(bbox, date, attributes, par) {

		// should we filter at all?
		if (bbox || date || attributes || par) {
			var filterArray = [];

			// bbox filter
			if (bbox) {
				filterArray.push(bboxFilter(bbox));
			}

			// date/time filter
			if (date) {
				filterArray.push(dateFilter(date));
			}

			if (attributes) {
				var attrFilter = attributeFilter(attributes);
				
				// only add the filter if it produced a result
				if (attrFilter !== null) {
					filterArray.push(attrFilter);
				}
			}
			
			if (par) {
				if (par.temperature){
					filterArray.push(new OL.Filter.Comparison({
				type : OL.Filter.Comparison.NOT_EQUAL_TO,
				property : "temperature",
				value : ""
			}));
				}		
				if (par.chlorophyll ){
					
				}		
			}

			// combine all filters together by logical AND
			return combineFilters(filterArray);
		} else {
			return null;
		}

	}

	function constructFilterString(bbox, date, attributes, par) {

		// generate filter object
		var filterObject = constructFilter(bbox, date, attributes, par);

		if (filterObject !== null) {
			// to string representation
			var strFilter = filterToXmlString(filterObject);

			// save filter string for use in contour plots
			previousFilter = strFilter;

				//alert("query.js: strFilter="+strFilter);//TEST
			return strFilter;
		} else
			return null;
	}

	function bboxFilter(bbox) {
		return new OL.Filter.Spatial({
			type : OL.Filter.Spatial.BBOX,
			value : bbox,
			property : "point" // Was: stpoint
		});
	}

	// dates returned from geoserver currently one day off due to time zone
	// issues
	function dateFilter(date) {
		var dateTimeFilterArray = [];

		var dateFilter = new OL.Filter.Comparison({
			type : OL.Filter.Comparison.BETWEEN,
			property : "date", // Was: stdate
			lowerBoundary : date.fromDate,
			upperBoundary : date.toDate
		});

		dateTimeFilterArray.push(dateFilter);

		var timeFilter = new OL.Filter.Comparison({
			type : OL.Filter.Comparison.BETWEEN,
			property : "time", // Was: sttime
			lowerBoundary : date.fromTime,
			upperBoundary : date.toTime
		});

		dateTimeFilterArray.push(timeFilter);

		return combineFilters(dateTimeFilterArray);
	}

	// "other attribute" filter
	// TODO: chg to reflect other attributes for greenseas
	function attributeFilter(attr) {
		var attrFilterArray = [];

		var countryFilter = addStringAttribute("location",
				attr.countryname, attr.notcountry);
		if (countryFilter !== null) {
			attrFilterArray.push(countryFilter);
		}

		var vesselFilter = addStringAttribute("stvesselname", attr.vesselname,
				attr.notvessel);
		if (vesselFilter !== null) {
			attrFilterArray.push(vesselFilter);
		}

		var sourceFilter = addStringAttribute("stsource", attr.sourcename,
				attr.notsource);
		if (sourceFilter !== null) {
			attrFilterArray.push(sourceFilter);
		}

		// all attributes may have been set to "any", so we
		// might have to omit this filter even though it is enabled
		if (attrFilterArray.length > 0) {
			// combine all attribute filters
			return combineFilters(attrFilterArray);
		} else {
			return null;
		}
	}

	// write OpenLayers filter object to OGC XML filter encoding
	function filterToXmlString(filter) {
		//alert("query.js: filter"+JSON.stringify(filter));//TEST
		var formatter = new OL.Format.Filter(), xmlFormat = new OL.Format.XML();
		return xmlFormat.write(formatter.write(filter));
	}

	// combine array of filters to single filter
	function combineFilters(filtersToCombine) {
		return new OL.Filter.Logical({
			type : OL.Filter.Logical.AND,
			filters : filtersToCombine
		});
	}

	// negate a filter
	function negateFilter(filter) {
		return new OL.Filter.Logical({
			type : OL.Filter.Logical.NOT,
			filters : filter
		});
	}

	function addStringAttribute(inProperty, inValue, not) {

		// skip if set to "any"
		if (inValue !== "ANY") {
			var filter = new OL.Filter.Comparison({
				type : OL.Filter.Comparison.LIKE,
				property : inProperty,
				value : inValue
			});

			// should this attribute be added as NOT?
			if (not) {
				// "NOT" takes array, so convert argument to array
				filter = negateFilter([ filter ]);
			}

			return filter;
		} else {
			return null;
		}
	}

	// public interface
	return {
		constructFilter : constructFilter,
		constructFilterString : constructFilterString
	};

}(OpenLayers));
