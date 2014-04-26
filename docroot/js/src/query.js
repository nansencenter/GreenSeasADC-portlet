var myNamespace = myNamespace || {};

var debugq = false;// debug flag

myNamespace.query = (function(OL, $,ns) {
	"use strict";

	var previousFilter;

	// construct an OGC XML filter object from attributes
	function constructFilter(bbox, date, depth, param, months, region, cruise) {

		// should we filter at all?
		if (bbox || date || depth || param || months || region || cruise) {
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
				if (depthFilter !== null)
					filterArray.push(depthFilter);
			}

			// parametersfilter
			if (param) {
				var parametersFilter = requiredParameters(param);
				filterArray.push(parametersFilter);
			}
			if (months) {
				var monthsFilter = createMonthFilter(months);
				filterArray.push(monthsFilter);
			}
			if (region) {
				var regionFilter = createRegionFilter(region);
				filterArray.push(regionFilter);
			}

			if (cruise) {
				var cruiseFilter = createCruiseFilter(cruise);
				filterArray.push(cruiseFilter);
				if (debugq)
					console.log("Added cruisefilter for:" + cruise);
			}

			// combine all filters together by logical AND
			return combineFilters(filterArray);
		} else {
			return null;
		}

	}

	function createCruiseFilter(cruise) {
		var cruiseFilter = new OL.Filter.Comparison({
			type : OpenLayers.Filter.Comparison.EQUAL_TO,
			property : "cruise_id",
			value : cruise
		});
		return cruiseFilter;
	}

	function createDepthFilter(depth) {
		var depthFilter = new OL.Filter.Comparison({
			type : OL.Filter.Comparison.BETWEEN,
			property : depthParameterName,
			lowerBoundary : depth.min,
			upperBoundary : depth.max
		});

		return depthFilter;
	}

	function createRegionFilter(region) {
		if (debugq)
			console.log("createRegionFilter");
		if (region === 'gsadbcRegionFilterPlaceHolder')
			return new OL.Filter.Spatial({
				type : OL.Filter.Spatial.WITHIN,
				value : region,
				property : window.geometryParameter
			});
		// var format = new OpenLayers.Format.WKT();
		var geometry = OL.Geometry.fromWKT(window.polygon[region]);
		if (debugq)
			console.log(geometry);
		var regionFilter = new OL.Filter.Spatial({
			type : OL.Filter.Spatial.WITHIN,
			value : geometry,
			property : window.geometryParameter
		});
		if (debugq)
			console.log("createRegionFilter done");
		return regionFilter;
	}

	function constructFilterString(bbox, date, attributes, depth, months, region, cruise) {
		if (debugq)
			console.log("constructFilterString");
		// generate filter object
		var filterObject = constructFilter(bbox, date, depth, null, months, region, cruise);

		return constructString(filterObject);

	}

	function constructParameterFilterString(parameters, depth, bbox, date, months, region, cruise) {
		if (debugq)
			console.log("constructParameterFilterString starting");
		// generate filter object
		var filterObject = constructFilter(bbox, date, depth, parameters, months, region, cruise);

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
			property : window.geometryParameter
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

	function createMonthFilter(months) {
		var monthFilterArray = [];
		for (var i = 0, len = months.length; i < len; i++) {
			var filter = new OL.Filter.Comparison({
				type : OpenLayers.Filter.Comparison.EQUAL_TO,
				property : "month",
				value : months[i]
			});
			monthFilterArray.push(filter);
		}
		return combineFiltersOr(monthFilterArray);
	}
	function requiredParameters(parameters) {
		var requiredParamtersArray = [];
		for (var i = 0, len = parameters.length; i < len; i++) {
			requiredParamtersArray.push(createRequiredParameterFilter(parameters[i]));
		}
		return combineFiltersOr(requiredParamtersArray);
	}

	function createRequiredParameterFilter(parameter) {
		if (debugq)
			console.log("createRequiredParameterFilter starting");// TEST
		if (window.databaseMayContainEmptyStrings) {
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
		} else
			return negateFilter([ new OL.Filter.Comparison({
				type : OpenLayers.Filter.Comparison.IS_NULL,
				property : parameter,
			}) ]);
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
		if (debugq) {
			console.log("filterToXmlString starting with filter:");// TEST
			console.log(filter);// TEST
			// console.log("filterToXmlString starting with filter:" +
			// JSON.stringify(filter));// TEST
		}
		var formatter = new OL.Format.Filter.v1_1_0();
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

	// non-public
	function createfilterBoxHashMap() {
		var filterBbox = null;
		if (document.getElementById('bboxEnabledCheck').checked) {
			var top = $('#top').val(), left = $('#left').val(), right = $('#right').val(), bottom = $('#bottom').val();
			// bbox for filter
			filterBbox = new OL.Bounds(bottom, left, top, right);
		}
		return filterBbox;
	}

	function createDateHashMap() {
		var date = null;
		if (document.getElementById('dateEnabledCheck').checked) {
			if (debugq)
				console.log("Date is enabled");
			date = {};

			date.fromDate = $('#fromDate').val();
			date.toDate = $('#toDate').val();

			date.time = document.getElementById('timeEnabledCheck').checked;
			date.fromTime = $('#fromTime').val();
			date.toTime = $('#toTime').val();
			if (date.time)
				date.dateString = date.fromDate + " " + date.fromTime + " - " + date.toDate + " " + date.toTime;
			else
				date.dateString = date.fromDate + " - " + date.toDate;
		}
		return date;
	}

	function createRegionArray() {
		if (debugq)
			console.log("createRegionArray");

		if (document.getElementById('regionEnabledCheck').checked) {
			var region = $("#longhurstRegionSelected").find(":selected").val();
			if (!(!(typeof window.polygon === 'undefined') && !(typeof window.polygon[region] === 'undefined')))
				ns.ajax.getLonghurstPolygon(region);
			return region;
		}
	}

	function createMonthArray() {
		if (debugq)
			console.log("createMonthArray");
		var months = null;
		if (document.getElementById('monthEnabledCheck').checked) {
			var allMonths = [ "January", "February", "March", "April", "May", "June", "July", "August", "September",
					"October", "November", "December" ];
			var fromMonth = $('#fromMonth').val();
			if (debugq)
				console.log("fromMonth:" + fromMonth);
			fromMonth = allMonths.indexOf(fromMonth);
			var toMonth = $('#toMonth').val();
			if (debugq)
				console.log("toMonth:" + toMonth);
			toMonth = allMonths.indexOf(toMonth);
			if (fromMonth === -1 || toMonth === -1)
				return months;
			months = [];
			for (; fromMonth !== toMonth; fromMonth = (fromMonth + 1) % 12) {
				months.push(allMonths[fromMonth]);
			}
			months.push(allMonths[toMonth]);
		}
		if (debugq)
			console.log(months);
		return months;
	}

	function createDepthHashMap() {
		var depth = null;
		if (document.getElementById('depthEnabledCheck').checked) {
			depth = {};
			depth.min = $('#depthMin').val();
			depth.max = $('#depthMax').val();
			depth.depthString = depth.min + " - " + depth.max;
		}
		return depth;
	}

	// public interface
	return {
		createfilterBoxHashMap : createfilterBoxHashMap,
		createRegionArray : createRegionArray,
		createDateHashMap : createDateHashMap,
		createMonthArray : createMonthArray,
		createDepthHashMap : createDepthHashMap,
		constructFilter : constructFilter,
		constructFilterString : constructFilterString,
		constructParameterFilterString : constructParameterFilterString,
		createRegionFilter : createRegionFilter,
		constructString : constructString,
	};

}(OpenLayers, jQuery,myNamespace));
