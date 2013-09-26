var myNamespace = myNamespace || {};

var debugq=true;// debug flag

myNamespace.query = (function(OL) {
	"use strict";

	var previousFilter;

	// construct an OGC XML filter object from attributes
	function constructFilter(bbox, date, attributes) {

		// should we filter at all?
		if (bbox || date || attributes) {
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

			// combine all filters together by logical AND
			return combineFilters(filterArray);
		} else {
			return null;
		}

	}

	function constructFilterString(bbox, date, attributes) {
		if (debugq) console.log("constructFilterString");// TEST
		// generate filter object
		var filterObject = constructFilter(bbox, date, attributes);

		return constructString(filterObject);

	}
	
	function constructParameterFilterString(parameters) {
		if (debugq) console.log("constructFilterString");// TEST
		// generate filter object
		var filterObject = requiredParameters(parameters);

		return constructString(filterObject);

	}

	function constructString(filter) {
		if (filter !== null) {
			// to string representation
			var strFilter = filterToXmlString(filter);

			// save filter string for use in contour plots
			previousFilter = strFilter;

			if (debugq) console.log("query.js: strFilter="+strFilter);// TEST
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
	
	function requiredParameters(parameters) {
		var requiredParamtersArray = [];
		for (var i = 0,len=parameters.length;i<len;i++){
			requiredParamtersArray.push(createRequiredParameterFilter(parameters[i]));
		}
		return combineFilters(requiredParamtersArray);
	}
	
	function createRequiredParameterFilter(parameter) {
		 var requiredArray = [];
		 requiredArray.push(new OL.Filter.Comparison({
	            type: OpenLayers.Filter.Comparison.NOT_EQUAL_TO,
	            property: parameter,
	            value: ""
	        }));
		 requiredArray.push(new OL.Filter.Comparison({
	            type: OpenLayers.Filter.Comparison.IS_NULL,
	            property: parameter,
	        }));
		 
		 return combineFiltersOr(requiredArray);
	}

	// "other attribute" filter
	// TODO: chg to reflect other attributes for greenseas
	function attributeFilter(attr) {
		var attrFilterArray = [];

		var countryFilter = addStringAttribute("stcountryname",
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
		// console.log("query.js: filter"+JSON.stringify(filter));//TEST
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
	
	function combineFiltersOr(filtersToCombine) {
		return new OL.Filter.Logical({
			type : OL.Filter.Logical.OR,
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
		constructFilterString : constructFilterString,
		constructParameterFilterString : constructParameterFilterString
	};

}(OpenLayers));
