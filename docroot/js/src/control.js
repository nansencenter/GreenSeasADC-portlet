var myNamespace = myNamespace || {};

var debugc = false;// debug flag
var tablesDone;

myNamespace.control = (function($, OL, ns) {
	"use strict";

	function init() {
		//ns.ajax.doAjax();
		tablesDone = {
			v4_chlorophyll : false,
			v4_temperature : false,
			v5_plankton : false,
			v4_flagellate : false
		};

		if (debugc) {
			console.log("control.js: starting init() method...");// TEST
			
		}
		// hide export option until we have something to export
		$("#exportDiv").hide();
		$("#exportTemperatureDiv").hide();
		$("#filterParameters").hide();

		// initialize map viewer
		ns.mapViewer.initMap();

		// Initialize the data from layers in WFS
		for ( var table in tablesDone) {
			ns.WebFeatureService.describeFeatureType({
				TYPENAME : table,
			}, function(response) {
				initiateParameters(response);
			});
		}
		ns.WebFeatureService.describeFeatureType({
			TYPENAME : ns.handleParameters.mainTable.name,
		}, function(response) {
			initiateParameters(response);
		});

		// set event handlers on buttons
		ns.buttonEventHandlers.initHandlers();

		setBboxInputToCurrentMapExtent();

		// Make the tabs jquery-tabs
		$("#tabs").tabs();

		$("#queryOptions").accordion({
			collapsible : true,
			active : false,
			heightStyle : "content"
		});

		$("#rawRequestDialog").dialog({
			autoOpen : false
		});

	}

	var queryString = "No query run yet!";

	function createfilterBoxHashMap() {
		var filterBbox = null;
		if (document.getElementById('bboxEnabledCheck').checked) {
			var top = $('#top').val(), left = $('#left').val(), right = $('#right').val(), bottom = $('#bottom').val();

			// bbox for filter
			filterBbox = new OL.Bounds(bottom, left, top, right);

			// bbox for zoom
			var zoomBbox = new OL.Bounds(left, bottom, right, top);

			if (document.lonlatform.updatemapcheck.checked) {
				ns.mapViewer.zoomToExtent(zoomBbox, true);
			}
		}
		return filterBbox;
	}

	function createDateHashMap() {
		var date = null;
		if (document.getElementById('dateEnabledCheck').checked) {
			if (debugc)
				console.log("Date is enabled");
			date = {};

			date.fromDate = $('#fromDate').val();
			date.toDate = $('#toDate').val();

			// date.fromTime = $('#fromTime').val();
			// date.toTime = $('#toTime').val();
		}
		return date;
	}

	function createParameterArray() {
		var par = null;
		if (document.getElementById('parametersEnabledCheck').checked) {
			par = new Array();
			for (parameter in document.getElementById('parameters')) {
				par.push(parameter);
			}
			if (debugc)
				console.log(par.toString());
		}
		return par;
	}
	function filterButton() {
		if (debugc)
			console.log("control.js: start of filterButton()");// TEST
		// set loading text and empty parameter HTML
		$("#featuresAndParams").hide();
		$("#loadingText").html("Loading data, please wait...");

		$("#temperature").html("");

		// should be currently selected layer
		var layer = ns.handleParameters.mainTable.name;

		// add bbox?
		var filterBbox = createfilterBoxHashMap();

		// add date?
		var date = createDateHashMap();

		// add parameters
		var par = createParameterArray();

		var attr = null; // no attributes are currently supported

		if (debugc)
			console.log("control.js: calling ns.query.constructFilterString()"); // TEST
		var filter = ns.query.constructFilterString(filterBbox, date, attr);

		// GetFeature request with filter, callback handles result
		if (debugc)
			console.log("control.js: calling ns.WebFeatureService.getFeature()"); // TEST
		ns.WebFeatureService.getFeature({
			TYPENAME : layer,
			FILTER : filter
		}, displayFeatures);

		if (debugc)
			console.log("control.js: calling ns.WebFeatureService.getPreviousRequestParameters()"); // TEST
		previousFilterParams = ns.WebFeatureService.getPreviousRequestParameters();

		$("#featuresAndParams").show();

		// link the button for exporting with new params
		if (debugc)
			console.log("control.js: calling linkExportButton()"); // TEST
		linkExportButton();

		// construct query string for display
		queryString = ns.WFSserver + "?" + OL.Util.getParameterString(previousFilterParams);
		if (debugc)
			console.log("queryString:" + queryString); // TEST
		$("#filterParameters").show();
	}

	var selectedFormat = "csv";

	function formatChange() {
		var s = document.getElementById('exportFormats');
		selectedFormat = s.options[s.selectedIndex].value;

		linkExportButton();
	}

	var selectedTemperatureFormat = "csv";

	function formatTemperatureChange() {
		var s = document.getElementById('exportTemperatureFormats');
		selectedTemperatureFormat = s.options[s.selectedIndex].value;

		linkTemperatureExportButton();
	}

	var previousFilterParams = "";
	var exportButtonURL = "";

	function linkExportButton() {
		// get a copy of params so we don't change the original
		var params = $.extend({}, previousFilterParams);

		// update params to selected format instead of json
		params.OUTPUTFORMAT = selectedFormat;

		// construct URL
		exportButtonURL = ns.WFSserver + "?" + OL.Util.getParameterString(params);
		// console.log("TEST: linkExportBUtton:
		// exportButtonURL="+exportButtonURL);//TEST

		ns.buttonEventHandlers.linkExportButton(exportButtonURL);
	}

	var previousTemperatureFilterParams = "";
	var exportTemperatureButtonURL = "";

	function linkTemperatureExportButton() {
		// get a copy of params so we don't change the original
		// var params = $.extend({}, previousTemperatureFilterParams);

		// update params to selected format instead of json
		// params.OUTPUTFORMAT = selectedTemperatureFormat;

		// construct URL
		// exportTemperatureButtonURL = ns.WFSserver + "?" +
		// OL.Util.getParameterString(params);
		// console.log("TEST: linkTemperatureExportBUtton:
		// exportTemperatureButtonURL="+exportTemperatureButtonURL);//TEST

		ns.buttonEventHandlers.linkTemperatureExportButton(ns.fileCreation.createCSV(data),
				"data:text/csv;charset=utf-8", "Greenseas_Downloaded_Parameters.csv");

		// console.log("TEST:
		// exportTemperatureDiv="+$("#exportTemperatureDiv").html());//TEST
		// console.log("TEST: exportDiv="+$("#exportDiv").html());//TEST
	}

	function convertInputToFeatures(input){
		var gformat = new OL.Format.GeoJSON();
		var features = gformat.read(input.responseText);
		return features;
	}
	function highLightFeatures(features, mainSearch, layer) {
		// highlight on map

		// !!! CODE BELOW IS A HACK !!!
		// swap x/y because of GeoJSON parsing issues (lat read as lon, and vice
		// versa).
		$.each(features, function(i, val) {
			var a = val.geometry, tmp = a.x;

			a.x = a.y;
			a.y = tmp;
		});
		if (mainSearch) {
			ns.mapViewer.highlightFeatures(features);
		} else {
			ns.mapViewer.addLayer(features, ns.handleParameters.getTableHeader(layer) || layer);
		}
	}

	function displayFeatures(input) {
		if (debugc)
			console.log("DisplayFeatures");
		// did an error occur?
		if (input.status != 200) {
			// print error message and terminate
			ns.errorMessage.showErrorMessage(input.responseText);
			return;
		}
		// if response status is OK, parse result

		highLightFeatures(convertInputToFeatures(input), true);

		// remove "loading..." text
		$("#loadingText").html("");

		// **** output to table ****
		var jsonObject = JSON.parse(input.responseText);

		// saving the data for merging
		basicData = jsonObject.features;

		replaceId(basicData);
		var length = jsonObject.features.length;

		if (length < 1) {
			document.getElementById('list').innerHTML = "No results found.";
			document.getElementById('export').disabled = true;
			$("#exportDiv").hide();
		} else {
			// if (debugc) console.log("TEST-displayFeatures:
			// jsonObject.features="+JSON.stringify(jsonObject)); //TEST

			var constructedTable = ns.tableConstructor.featureTable("filterTable", jsonObject.features);

			document.getElementById('list').innerHTML = "Click a row to view parameters<br> " + "<div>"
					+ constructedTable + "</div><br>";
			document.getElementById('export').disabled = false;
			// $("#exportDiv").show();
			$('#filterTable').dataTable({
				'aaSorting' : []
			});
		}
	}

	// view all parameters of a feature
	function viewParams() {

		// removing the parameterlayers from previous searches
		ns.mapViewer.removeAllParameterLayers();
		// extract each value and insert into view param string
		var paramString = "";
		if (document.getElementById('bboxEnabledCheck').checked) {
			paramString = "left:" + $('#left').val() + ";bottom:" + $('#bottom').val() + ";right:" + $('#right').val()
					+ ";top:" + $('#top').val();
		} else {
			paramString = "left:-180.0;bottom:-90.0;right:180.0;top:90.0";// default
			// bbox,
			// global
		}
		if (document.getElementById('dateEnabledCheck').checked) {
			paramString += ";sdate:" + $('#fromDate').val() + ";edate:" + $('#toDate').val();
		} else {
			// do nothing, we don't search for dates
		}

		if (debugc)
			console.log("TEST: viewParams: new FILTER=" + paramString); // TEST

		var paramFilter = paramString;

		if (document.getElementById('parametersEnabledCheck').checked) {
			ns.handleParameters.selectParameters($("#parameters").jstree("get_checked", null, true));
		}
		// go through all the first requested tables/parameters, request and
		// display
		// result
		// through callback
		tablesToQuery = [];
		data = convertArrayToHashMap(basicData);
		if (debugc)
			console.log("Going through all selected tables");
		$.each(ns.handleParameters.chosenParameters.tablesSelected, function(i, table) {
			tablesToQuery.push(table);
		});
		var layer = tablesToQuery.pop();
		var propertyName = [];
		if (debugc)
			console.log("Going through all parameters in:" + layer);
		$.each(ns.handleParameters.chosenParameters.parametersByTable[layer], function(j, parameter) {
			propertyName.push(parameter);
		});
		if (debugc)
			console.log("Went through all parameters in:" + layer);
		ns.WebFeatureService.getFeature({
			TYPENAME : layer,
			PROPERTYNAME : [ "point" ].concat(propertyName).toString(),
			FILTER : ns.query.constructParameterFilterString(propertyName),
			VIEWPARAMS : '' + paramFilter
		}, function(response) {
			displayParameter(response, layer);
		});
		if (debugc)
			console.log("Sendt request:" + layer);

		// jump to the parameters tab
		$('#tabs').tabs("option", "active", 1);

		document.getElementById('exportTemperature').disabled = false;
		$("#exportTemperatureDiv").show();
	}

	var tablesToQuery = [];
	var data = null;
	var basicData = null;

	// display a parameter as a table
	function displayParameter(response, layer) {
		highLightFeatures(convertInputToFeatures(response), false, layer);
		var responseAsJSON;
		if (debugc)
			console.log("qmeter: parameter=" + layer);// TEST
		try {
			responseAsJSON = JSON.parse(response.responseText);
		} catch (SyntaxError) {
			console.error("Could not parse response to parameter data request");
			return;
		}
		addData(responseAsJSON);
		// if (debugc) {
		// console.log("DATA VALUES:");
		// $.each(data, function(i, dataValue) {
		// console.log(dataValue);
		// });
		// }
		if (tablesToQuery.length == 0) {
			if (debugc)
				console.log("tablesToQuery.length == 0");
			var constructedTable = ns.tableConstructor.parameterTableTemperatures(layer, data);
			// if (debugc)
			// console.log("control.js: displayParameter: constructedTable=" +
			// constructedTable);// TEST

			$("#temperature").html("Entries where the selected parameters were available<br>" + "<div class='scrollArea'>" + constructedTable + "</div>");
			// if (debugc)
			// console.log("control.js: parameter table html=" +
			// $("#temperature").html());// TEST

			$("#" + layer + "Table").dataTable({
				// search functionality not needed for parameter tables
				'bFilter' : false
			});
			linkTemperatureExportButton();
			ns.mapViewer.addFeaturesFromData(data,"All parameters");
		} else {
			var layer = tablesToQuery.pop();
			var paramString = "";
			if (document.getElementById('bboxEnabledCheck').checked) {
				paramString = "left:" + $('#left').val() + ";bottom:" + $('#bottom').val() + ";right:"
						+ $('#right').val() + ";top:" + $('#top').val();
			} else {
				paramString = "left:-180.0;bottom:-90.0;right:180.0;top:90.0";// default
				// bbox,
				// global
			}
			if (document.getElementById('dateEnabledCheck').checked) {
				paramString += ";sdate:" + $('#fromDate').val() + ";edate:" + $('#toDate').val();
			} else {
				// do nothing, we don't search for dates
			}

			if (debugc)
				console.log("TEST: viewParams: new FILTER=" + paramString); // TEST

			var paramFilter = paramString;
			if (debugc)
				console.log("tablesToQuery.length != 0 AND layer=" + layer);
			var propertyName = [];
			if (debugc)
				console.log("Going through all parameters in:" + layer);
			$.each(ns.handleParameters.chosenParameters.parametersByTable[layer], function(j, parameter) {
				propertyName.push(parameter);
			});
			ns.WebFeatureService.getFeature({
				TYPENAME : layer,
				PROPERTYNAME : [ "point" ].concat(propertyName).toString(),
				FILTER : ns.query.constructParameterFilterString(propertyName),
				VIEWPARAMS : '' + paramFilter
			}, function(response) {
				displayParameter(response, layer);
			});
		}
	}

	function replaceId(features) {
		if (debugc)
			console.log("Replacing ID's");
		var featureArray = null;
		$.each(features, function(i, feature) {
			featureArray = feature.id.split(".");
			feature.id = featureArray[1];
		});
		if (debugc)
			console.log("Replaced ID's");
		return (featureArray == null) ? null : featureArray[0];
	}

	function convertArrayToHashMap(inputArray) {
		if (debugc)
			console.log("convertArrayToHashMap");
		var output = {};
		$.each(inputArray, function(k, dataValue) {
			output[dataValue.id] = dataValue;
		});
		if (debugc)
			console.log("Converted Array");
		return output;
	}
	function addData(response) {
		if (debugc) {
			console.log("Startet adding Data:");
		}
		// if (debugc) {
		// console.log("addData:");
		// console.log("DATA VALUES:");
		// $.each(data, function(i, dataValue) {
		// console.log(dataValue);
		// });
		// }
		// if (debugc) {
		// console.log("response VALUES:");
		// $.each(response, function(i, dataValue) {
		// console.log(dataValue);
		// });
		// }
		var features = response.features;
		// if (debugc) {
		// console.log("features VALUES:");
		// $.each(features, function(i, dataValue) {
		// console.log(dataValue);
		// });
		// }
		var layer = replaceId(features);
		// if (debugc) {
		// console.log("features VALUES:");
		// $.each(features, function(i, dataValue) {
		// console.log(dataValue);
		// });
		// }
		var newData = {};

		if (layer == null) {
			data = {};
			return;
		}
		if (debugc) {
			console.log(features);
		}
		$.each(features, function(i, feature) {
			$.each(feature.properties, function(j, parameter) {
				// if (debugc)
				// console.log("feature.id:" + feature.id);
				if (feature.id in data) {
					newData[feature.id] = data[feature.id];
					newData[feature.id].properties[layer + ":" + j] = parameter;
				}
			});
		});
		data = newData;
		if (debugc) {
			console.log("Ended adding Data:");
		}
	}

	function setBboxInputToCurrentMapExtent() {
		var mbounds = ns.mapViewer.getExtent().clone();

		setLonLatInput(mbounds.left, mbounds.bottom, mbounds.top, mbounds.right);
	}

	function lonLatAnywhere() {
		setLonLatInput(-180, -90, 90, 180);
	}

	function setLonLatInput(left, bottom, top, right) {
		$("#left").val(left);
		$("#bottom").val(bottom);
		$("#top").val(top);
		$("#right").val(right);
	}

	function setRawRequestDialog() {
		$("#rawRequestText").html(queryString);
		$("#rawRequestDialog").dialog('open');
	}

	function initiateParameters(input) {
		if (debugc) {
			console.log("Input values of initiateparameters");
			$.each(input, function(i, dataValue) {
				console.log(dataValue);
			});
		}
		var table = ns.handleParameters.initiateParameters(input);
		if (table != ns.handleParameters.mainTable.name) {
			tablesDone[table] = true;
		}
		$("#parameters").html(ns.tableConstructor.parametersList(tablesDone));
		// init the parameters tree
		$("#parameters")
		// call `.jstree` with the options object
		.jstree({
			// the `plugins` array allows you to configure the active
			// plugins on
			// this instance
			"plugins" : [ "themes", "html_data", "ui", "checkbox" ],
			"themes" : {
				"theme" : "default",
				"dots" : false,
				"icons" : false
			}
		});
	}

	// public interface
	return {
		init : init,
		initiateParameters : initiateParameters,
		setLonLatInput : setLonLatInput,
		filterButton : filterButton,
		viewParams : viewParams,
		setBboxInputToCurrentMapExtent : setBboxInputToCurrentMapExtent,
		lonLatAnywhere : lonLatAnywhere,
		setRawRequestDialog : setRawRequestDialog,
		linkExportButton : linkExportButton,
		linkTemperatureExportButton : linkTemperatureExportButton,
		setSelectedFormat : function(format) {
			selectedFormat = format;
		}
	};

}(jQuery, OpenLayers, myNamespace));
