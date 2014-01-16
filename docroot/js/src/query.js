var myNamespace = myNamespace || {};

var debugq = false;// debug flag

myNamespace.query = (function(OL, $) {
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
				if (depthFilter != null)
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
		// var format = new OpenLayers.Format.WKT();
		var geometry = OL.Geometry.fromWKT(region);
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
		for ( var i = 0, len = months.length; i < len; i++) {
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

			// bbox for zoom
			var zoomBbox = new OL.Bounds(left, bottom, right, top);

			if (document.lonlatform.updatemapcheck.checked) {
				myNamespace.mapViewer.zoomToExtent(zoomBbox, true);
			}
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
		}
		return date;
	}

	function createRegionArray() {
		if (debugq)
			console.log("createRegionArray");

		if (document.getElementById('regionEnabledCheck').checked) {
			var region = $("#longhurstRegionSelected").find(":selected").val();
			if (!(typeof window.polygon === 'undefined') && !(typeof window.polygon[region] === 'undefined'))
				return window.polygon[region];
			myNamespace.ajax.getLonghurstPolygon(region);

			var isNECS = (window.polygon[region] == "MULTIPOLYGON (((-19.499999999999886 -6.499999999999986, -18.499999999999915 -6.4999999999999005, -17.499999999999943 -6.4999999999999005, -16.499999999999943 -6.4999999999999005, -15.499999999999886 -6.4999999999999005, -15.499999999999886 -7.499999999999872, -15.499999999999886 -8.499999999999858, -15.499999999999886 -9.499999999999915, -15.499999999999886 -10.4999999999999, -14.499999999999915 -10.4999999999999, -13.499999999999943 -10.4999999999999, -12.499999999999943 -10.4999999999999, -11.499999999999886 -10.4999999999999, -10.499999999999915 -10.4999999999999, -9.499999999999915 -10.4999999999999, -8.499999999999943 -10.4999999999999, -7.499999999999886 -10.4999999999999, -6.499999999999915 -10.4999999999999, -5.499999999999915 -10.4999999999999, -4.499999999999943 -10.4999999999999, -3.4999999999998863 -10.4999999999999, -2.4999999999998863 -10.4999999999999, -1.4999999999999147 -10.4999999999999, -0.4999999999999432 -10.4999999999999, -0.4999999999999432 -11.499999999999872, -0.4999999999999432 -12.499999999999858, 0.5000000000001137 -12.499999999999858, 1.5000000000001137 -12.499999999999858, 2.5000000000000853 -12.499999999999858, 3.500000000000057 -12.499999999999858, 4.500000000000142 -12.499999999999858, 5.500000000000114 -12.499999999999858, 6.500000000000085 -12.499999999999858, 7.500000000000057 -12.499999999999858, 8.500000000000057 -12.499999999999858, 9.500000000000114 -12.499999999999858, 9.500000000000114 -13.499999999999929, 9.500000000000114 -14.4999999999999, 9.500000000000114 -15.499999999999886, 9.500000000000114 -16.499999999999943, 8.500000000000057 -16.499999999999943, 7.500000000000057 -16.499999999999943, 7.500000000000057 -17.500000000000014, 7.500000000000057 -18.5, 7.500000000000057 -19.49999999999997, 7.500000000000057 -20.499999999999957, 7.500000000000057 -21.49999999999993, 7.500000000000057 -22.5, 7.500000000000057 -23.49999999999997, 7.500000000000057 -24.499999999999957, 8.500000000000057 -24.499999999999957, 9.500000000000114 -24.499999999999957, 9.500000000000114 -25.49999999999993, 9.500000000000114 -26.5, 9.500000000000114 -27.499999999999986, 9.500000000000114 -28.500000000000043, 9.500000000000114 -29.499999999999943, 9.500000000000114 -30.5, 9.500000000000114 -31.499999999999986, 10.500000000000085 -31.499999999999986, 11.500000000000057 -31.499999999999986, 12.500000000000057 -31.499999999999986, 13.500000000000114 -31.499999999999986, 13.500000000000114 -32.49999999999996, 13.500000000000114 -33.49999999999994, 13.500000000000114 -34.500000000000014, 13.500000000000114 -35.50000000000007, 14.500000000000085 -35.50000000000007, 15.500000000000085 -35.50000000000007, 15.500000000000085 -36.49999999999997, 15.500000000000085 -37.49999999999994, 15.500000000000085 -38.500000000000014, 15.500000000000085 -39.499999999999986, 14.500000000000085 -39.4999999999999, 13.500000000000114 -39.4999999999999, 12.500000000000057 -39.4999999999999, 11.500000000000057 -39.4999999999999, 10.500000000000085 -39.4999999999999, 9.500000000000114 -39.4999999999999, 8.500000000000057 -39.4999999999999, 7.500000000000057 -39.4999999999999, 6.500000000000085 -39.4999999999999, 5.500000000000114 -39.4999999999999, 4.500000000000142 -39.4999999999999, 3.500000000000057 -39.4999999999999, 2.5000000000000853 -39.4999999999999, 1.5000000000001137 -39.4999999999999, 0.5000000000001137 -39.4999999999999, -0.4999999999999432 -39.4999999999999, -1.4999999999999147 -39.4999999999999, -2.4999999999998863 -39.4999999999999, -3.4999999999998863 -39.4999999999999, -4.499999999999943 -39.4999999999999, -5.499999999999915 -39.4999999999999, -5.499999999999915 -38.49999999999993, -5.499999999999915 -37.49999999999986, -6.499999999999915 -37.49999999999986, -7.499999999999886 -37.49999999999986, -8.499999999999943 -37.49999999999986, -9.499999999999915 -37.49999999999986, -10.499999999999915 -37.49999999999986, -11.499999999999886 -37.49999999999986, -12.499999999999943 -37.49999999999986, -13.499999999999943 -37.49999999999986, -14.499999999999915 -37.49999999999986, -15.499999999999886 -37.49999999999986, -16.499999999999943 -37.49999999999986, -17.499999999999943 -37.49999999999986, -18.499999999999915 -37.49999999999986, -19.499999999999886 -37.49999999999986, -20.49999999999997 -37.49999999999986, -21.499999999999943 -37.49999999999986, -22.499999999999915 -37.49999999999986, -23.499999999999886 -37.49999999999986, -23.499999999999886 -38.49999999999993, -23.499999999999886 -39.4999999999999, -24.499999999999886 -39.4999999999999, -25.499999999999943 -39.4999999999999, -26.499999999999915 -39.4999999999999, -27.499999999999886 -39.4999999999999, -28.49999999999997 -39.4999999999999, -29.499999999999943 -39.4999999999999, -30.499999999999915 -39.4999999999999, -31.499999999999915 -39.4999999999999, -32.49999999999997 -39.4999999999999, -33.49999999999994 -39.4999999999999, -34.499999999999915 -39.4999999999999, -35.499999999999915 -39.4999999999999, -36.499999999999886 -39.4999999999999, -37.49999999999994 -39.4999999999999, -37.49999999999994 -40.499999999999886, -37.49999999999994 -41.49999999999986, -38.49999999999994 -41.49999999999986, -39.499999999999915 -41.49999999999986, -40.499999999999886 -41.49999999999986, -41.49999999999994 -41.49999999999986, -42.49999999999994 -41.49999999999986, -43.499999999999915 -41.49999999999986, -44.499999999999886 -41.49999999999986, -45.49999999999997 -41.49999999999986, -46.49999999999994 -41.49999999999986, -47.499999999999915 -41.49999999999986, -48.499999999999886 -41.49999999999986, -49.49999999999997 -41.49999999999986, -50.49999999999994 -41.49999999999986, -51.499999999999915 -41.49999999999994, -51.499999999999915 -40.49999999999997, -51.499999999999915 -39.499999999999986, -52.499999999999886 -39.499999999999986, -53.49999999999997 -39.499999999999986, -53.49999999999997 -38.500000000000014, -53.49999999999997 -37.49999999999994, -53.49999999999997 -36.49999999999997, -53.49999999999997 -35.50000000000007, -52.499999999999886 -35.50000000000007, -51.499999999999915 -35.50000000000007, -51.499999999999915 -34.500000000000014, -51.499999999999915 -33.49999999999994, -50.50000000000003 -33.49999999999994, -49.49999999999997 -33.49999999999994, -49.49999999999997 -32.49999999999996, -49.49999999999997 -31.499999999999986, -48.499999999999886 -31.499999999999986, -47.5 -31.499999999999986, -47.5 -30.5, -47.5 -29.499999999999943, -47.5 -28.500000000000043, -46.50000000000003 -28.500000000000043, -45.49999999999997 -28.500000000000043, -45.49999999999997 -27.499999999999986, -45.49999999999997 -26.5, -44.499999999999886 -26.5, -43.5 -26.5, -43.5 -25.49999999999993, -43.5 -24.499999999999957, -42.50000000000003 -24.499999999999957, -41.49999999999994 -24.499999999999957, -40.49999999999997 -24.499999999999957, -39.499999999999915 -24.499999999999957, -39.499999999999915 -23.49999999999997, -39.499999999999915 -22.5, -38.49999999999994 -22.5, -37.49999999999994 -22.5, -37.49999999999994 -21.49999999999993, -37.49999999999994 -20.499999999999957, -37.49999999999994 -19.49999999999997, -37.49999999999994 -18.5, -37.49999999999994 -17.500000000000014, -37.49999999999994 -16.499999999999943, -36.49999999999997 -16.499999999999943, -35.499999999999915 -16.499999999999943, -35.499999999999915 -15.499999999999972, -35.499999999999915 -14.499999999999986, -35.499999999999915 -13.500000000000014, -35.499999999999915 -12.499999999999943, -34.499999999999915 -12.499999999999943, -33.49999999999994 -12.499999999999943, -33.49999999999994 -11.499999999999972, -33.49999999999994 -10.499999999999986, -33.49999999999994 -9.499999999999915, -33.49999999999994 -8.499999999999858, -33.49999999999994 -7.499999999999872, -33.49999999999994 -6.4999999999999005, -33.49999999999994 -5.499999999999915, -33.49999999999994 -4.499999999999844, -34.499999999999915 -4.499999999999844, -35.499999999999915 -4.499999999999844, -35.499999999999915 -3.499999999999872, -35.499999999999915 -2.499999999999986, -34.499999999999915 -2.499999999999986, -33.49999999999994 -2.499999999999986, -32.50000000000006 -2.499999999999986, -31.499999999999915 -2.499999999999986, -30.499999999999915 -2.499999999999986, -29.50000000000003 -2.499999999999986, -29.50000000000003 -3.4999999999999574, -29.50000000000003 -4.499999999999943, -29.50000000000003 -5.5, -29.50000000000003 -6.499999999999986, -28.49999999999997 -6.499999999999986, -27.499999999999886 -6.499999999999986, -26.499999999999915 -6.499999999999986, -25.499999999999943 -6.499999999999986, -24.499999999999886 -6.499999999999986, -23.499999999999886 -6.499999999999986, -22.499999999999915 -6.499999999999986, -21.499999999999943 -6.499999999999986, -20.49999999999997 -6.499999999999986, -19.499999999999886 -6.499999999999986), (-5.78722479776971 -16.009162907518558, -5.768468780619656 -16.021942962963948, -5.7291658688821485 -16.005490963365204, -5.712974881749005 -15.992863961472224, -5.710553852829065 -15.99639190452858, -5.700419796585493 -16.003753897746208, -5.660414816636063 -15.985699948808147, -5.646392898412728 -15.958339908024527, -5.645285816638221 -15.939997956892455, -5.671394774550407 -15.909442902247534, -5.699519915458097 -15.903754942736754, -5.71639486589217 -15.905284975346703, -5.728886919143633 -15.91388899898027, -5.748605849333217 -15.929162000075024, -5.768891899093148 -15.947359950110084, -5.792777808638988 -15.991108958580412, -5.78722479776971 -16.009162907518558)))");
			// console.log(window.polygon);
			// console.log(isNECS);
			return window.polygon[region];
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
			if (fromMonth == -1 || toMonth == -1)
				return months;
			months = [];
			for (; fromMonth != toMonth; fromMonth = (fromMonth + 1) % 12) {
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
		constructParameterFilterString : constructParameterFilterString
	};

}(OpenLayers, jQuery));
