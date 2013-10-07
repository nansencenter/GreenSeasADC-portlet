var myNamespace = myNamespace || {};

var debugq = false;// debug flag

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
		if (debugq)
			console.log("constructFilterString");// TEST
		// generate filter object
		var filterObject = constructFilter(bbox, date, attributes);

		return constructString(filterObject);

	}

	function constructParameterFilterString(parameters) {
		if (debugq)
			console.log("constructFilterString starting");// TEST
		// generate filter object
		var filterObject = requiredParameters(parameters);

		if (debugq)
			console.log("constructFilterString ending");// TEST
		return constructString(filterObject);

	}

	function constructString(filter) {
		if (debugq)
			console.log("constructString starting");// TEST
		if (filter !== null) {
			// to string representation
			if (debugq)
				console.log("trying filterToXmlString");// TEST
			var strFilter = filterToXmlString(filter);

			// save filter string for use in contour plots
			previousFilter = strFilter;

			if (debugq)
				console.log("query.js: strFilter=" + strFilter);// TEST
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
		// var dateTimeFilterArray = [];

		var dateFilter = new OL.Filter.Comparison({
			type : OL.Filter.Comparison.BETWEEN,
			property : "date",
			lowerBoundary : date.fromDate,
			upperBoundary : date.toDate
		});

		// dateTimeFilterArray.push(dateFilter);

		// var timeFilter = new OL.Filter.Comparison({
		// type : OL.Filter.Comparison.BETWEEN,
		// property : "time", // Was: sttime
		// lowerBoundary : date.fromTime,
		// upperBoundary : date.toTime
		// });

		// dateTimeFilterArray.push(timeFilter);

		return dateFilter;
		// return combineFilters(dateTimeFilterArray);
	}

	function requiredParameters(parameters) {
		var requiredParamtersArray = [];
		for ( var i = 0, len = parameters.length; i < len; i++) {
			requiredParamtersArray.push(createRequiredParameterFilter(parameters[i]));
		}
		return combineFiltersOr(requiredParamtersArray);
	}

	function createRequiredParameterFilter(parameter) {
		if (debugq)
			console.log("createRequiredParameterFilter starting");// TEST
		var requiredArray = [];
		requiredArray.push(combineFilters([ new OL.Filter.Comparison({
			type : OpenLayers.Filter.Comparison.NOT_EQUAL_TO,
			property : parameter,
			value : ""
		}), new OL.Filter.Comparison({
			type : OpenLayers.Filter.Comparison.NOT_EQUAL_TO,
			property : parameter,
			value : "null"
		}) ]));
		requiredArray.push(negateFilter([new OL.Filter.Comparison({
			type : OpenLayers.Filter.Comparison.IS_NULL,
			property : parameter,
		})]));

		if (debugq)
			console.log("createRequiredParameterFilter ending");// TEST
		return combineFilters(requiredArray);
	}

	// "other attribute" filter
	// TODO: chg to reflect other attributes for greenseas
	function attributeFilter(attr) {
		var attrFilterArray = [];

		var countryFilter = addStringAttribute("stcountryname", attr.countryname, attr.notcountry);
		if (countryFilter !== null) {
			attrFilterArray.push(countryFilter);
		}

		var vesselFilter = addStringAttribute("stvesselname", attr.vesselname, attr.notvessel);
		if (vesselFilter !== null) {
			attrFilterArray.push(vesselFilter);
		}

		var sourceFilter = addStringAttribute("stsource", attr.sourcename, attr.notsource);
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
		if (debugq)
		 console.log("filterToXmlString starting with filter:"+JSON.stringify(filter));//TEST
		var formatter = new OL.Format.Filter();
		if (debugq)
			 console.log("came thus far formatter:"+formatter);//TE
		var xmlFormat = new OL.Format.XML();
		if (debugq)
			 console.log("came thus far xmlFormat:"+xmlFormat);//TE
		var written = formatter.write(filter);
		if (debugq)
			 console.log("written:"+written);//TEST
		var writtenXML = xmlFormat.write(written);
		return writtenXML;
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
