var myNamespace = myNamespace || {};

var debugq = false;// debug flag

myNamespace.query = (function(OL) {
	"use strict";

	var previousFilter;

	// construct an OGC XML filter object from attributes
	function constructFilter(bbox, date, depth, param) {

		// should we filter at all?
		if (bbox || date || depth || param) {
			var filterArray = [];

			// bbox filter
			if (bbox) {
				filterArray.push(bboxFilter(bbox));
			}

			// date/time filter
			if (date) {
				filterArray.push(dateFilter(date));
			}

			// depth filter
			if (depth) {
				var depthFilter = createDepthFilter(depth);
				if (depthFilter != null)
					filterArray.push(depthFilter);
			}

			// parametersfilter
			if (param) {
				var parametersFilter = requiredParameters(param);
				filterArray.push(parametersFilter);
			}

			// combine all filters together by logical AND
			return combineFilters(filterArray);
		} else {
			return null;
		}

	}

	function createDepthFilter(depth) {
		var depthFilter = new OL.Filter.Comparison({
			type : OL.Filter.Comparison.BETWEEN,
			property : myNamespace.handleParameters.depthParameterName,
			lowerBoundary : depth.min,
			upperBoundary : depth.max
		});

		return depthFilter;
	}

	function constructFilterString(bbox, date, attributes, depth) {
		if (debugq)
			console.log("constructFilterString");
		// generate filter object
		var filterObject = constructFilter(bbox, date, depth);

		return constructString(filterObject);

	}

	function constructParameterFilterString(parameters, depth, bbox, date) {
		if (debugq)
			console.log("constructParameterFilterString starting");
		// generate filter object
		var filterObject = constructFilter(bbox, date, depth, parameters);

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
	// issues - time option is currently disabled because not all data had a
	// time included
	function dateFilter(date) {

		var dateFilter = new OL.Filter.Comparison({
			type : OL.Filter.Comparison.BETWEEN,
			property : "date",
			lowerBoundary : date.fromDate,
			upperBoundary : date.toDate
		});
		if (date.time) {
			var dateTimeFilterArray = [];
			dateTimeFilterArray.push(dateFilter);

			var timeFilter = new OL.Filter.Comparison({
				type : OL.Filter.Comparison.BETWEEN,
				property : "time", // Was: sttime
				lowerBoundary : date.fromTime,
				upperBoundary : date.toTime
			});

			dateTimeFilterArray.push(timeFilter);
			return combineFilters(dateTimeFilterArray);
		} else {
			return dateFilter;
		}
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
		requiredArray.push(new OL.Filter.Comparison({
			type : OpenLayers.Filter.Comparison.NOT_EQUAL_TO,
			property : parameter,
			value : ""
		}));
		/*
		 * requiredArray.push( new OL.Filter.Comparison({ type :
		 * OpenLayers.Filter.Comparison.NOT_EQUAL_TO, property : parameter,
		 * value : "null" }));
		 */
		requiredArray.push(negateFilter([ new OL.Filter.Comparison({
			type : OpenLayers.Filter.Comparison.IS_NULL,
			property : parameter,
		}) ]));
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
			console.log("filterToXmlString starting with filter:" + JSON.stringify(filter));// TEST
		var formatter = new OL.Format.Filter();
		var xmlFormat = new OL.Format.XML();
		var written = formatter.write(filter);
		var writtenXML = xmlFormat.write(written);
		return writtenXML;
	}

	// combine array of filters to single filter with AND
	function combineFilters(filtersToCombine) {
		return new OL.Filter.Logical({
			type : OL.Filter.Logical.AND,
			filters : filtersToCombine
		});
	}

	// combine array of filters to single filter with OR
	function combineFiltersOr(filtersToCombine) {
		return new OL.Filter.Logical({
			type : OL.Filter.Logical.OR,
			filters : filtersToCombine
		});
	}

	// negate a filter
	function negateFilter(filterArray) {
		return new OL.Filter.Logical({
			type : OL.Filter.Logical.NOT,
			filters : filterArray
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
