var myNamespace = myNamespace || {};

var debugc = true;// debug flag
var tablesDone;

myNamespace.control = (function($, OL, ns) {
	"use strict";

	function init() {
		tablesDone = {
			v3_chlorophyll : false,
			v3_temperature : false,
			v3_plankton : false,
			v3_flagellate : false
		};

		if (debugc)
			console.log("control.js: starting init() method...");// TEST
		// hide export option until we have something to export
		$("#exportDiv").hide();
		$("#exportTemperatureDiv").hide();

		// initialize map viewer
		ns.mapViewer.initMap();

		for ( var table in tablesDone) {
			ns.WebFeatureService.describeFeatureType({
				TYPENAME : table, // MOD (station)
			}, function(response) {
				initiateParameters(response);
			});
		}

		// set event handlers on buttons
		ns.buttonEventHandlers.initHandlers();

		setBboxInputToCurrentMapExtent();

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
	var currentBbox = null;
	var currentFeatureIds = [];
	var prevFilter = "";

	function filterButton() {
		if (debugc)
			console.log("control.js: start of filterButton()");// TEST
		// set loading text and empty parameter HTML
		$("#featuresAndParams").hide();
		$("#loadingText").html("Loading data, please wait...");

		$("#temperature").html("");

		// delete any multiPlot chart
		// if (debugc) console.log("control.js: calling
		// ns.Charter.resetMultiPlot()");
		// //TEST
		// ns.Charter.resetMultiPlot();

		// should be currently selected layer, e.g. floats or station etc.
		var layer = "gsadb3"; // MOD (floats)

		var filterBbox = null, zoomBbox;
		// add bbox?
		if (document.getElementById('bboxEnabledCheck').checked) {

			var top = $('#top').val(), left = $('#left').val(), right = $('#right').val(), bottom = $('#bottom').val();

			// for use in contouring
			currentBbox = bottom + "," + left + "," + top + "," + right;

			// bbox for filter
			filterBbox = new OL.Bounds(bottom, left, top, right);

			// bbox for zoom
			zoomBbox = new OL.Bounds(left, bottom, right, top);

			if (document.lonlatform.updatemapcheck.checked) {
				ns.mapViewer.zoomToExtent(zoomBbox, true);
			}
		}

		// add date?
		var date = null;
		if (document.getElementById('dateEnabledCheck').checked) {
			if (debugc)
				console.log("Date is enabled");
			date = {};

			date.fromDate = $('#fromDate').val();
			date.toDate = $('#toDate').val();

			date.fromTime = $('#fromTime').val();
			date.toTime = $('#toTime').val();
		}

		var par = null;
		if (document.getElementById('parametersEnabledCheck').checked) {
			par = new Array();
			for (parameter in document.getElementById('parameters')) {
				par.push(parameter);
			}
			console.log(par.toString());
		}

		var attr = null;
		if (debugc)
			console.log("control.js: calling ns.query.constructFilterString()"); // TEST
		var filter = ns.query.constructFilterString(filterBbox, date, attr);

		// GetFeature request with filter, callback handles result
		if (debugc)
			console.log("control.js: calling ns.WebFeatureService.getFeature()"); // TEST
		ns.WebFeatureService.getFeature({
			TYPENAME : "gsadb3", // MOD (station)
			FILTER : filter
		}, displayFeatures);

		prevFilter = filter; // store for parameter retrieval

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
		var params = $.extend({}, previousTemperatureFilterParams);

		// update params to selected format instead of json
		params.OUTPUTFORMAT = selectedTemperatureFormat;

		// construct URL
		exportTemperatureButtonURL = ns.WFSserver + "?" + OL.Util.getParameterString(params);
		// console.log("TEST: linkTemperatureExportBUtton:
		// exportTemperatureButtonURL="+exportTemperatureButtonURL);//TEST

		ns.buttonEventHandlers.linkTemperatureExportButton(exportTemperatureButtonURL);

		// console.log("TEST:
		// exportTemperatureDiv="+$("#exportTemperatureDiv").html());//TEST
		// console.log("TEST: exportDiv="+$("#exportDiv").html());//TEST
	}

	function displayFeatures(input) {

		// did an error occur?
		if (input.status != 200) {
			// print error message and terminate
			ns.errorMessage.showErrorMessage(input.responseText);
			return;
		}

		// if response status is OK, parse result

		// highlight on map
		var gformat = new OL.Format.GeoJSON();
		var features = gformat.read(input.responseText);

		// !!! CODE BELOW IS A HACK !!!
		// swap x/y because of GeoJSON parsing issues (lat read as lon, and vice
		// versa).
		$.each(features, function(i, val) {
			var a = val.geometry, tmp = a.x;

			a.x = a.y;
			a.y = tmp;
		});

		ns.mapViewer.highlightFeatures(features);

		// wipe currentFeatureIds before rebuilding
		currentFeatureIds = [];

		// remove "loading..." text
		$("#loadingText").html("");

		// **** output to table ****
		var jsonObject = JSON.parse(input.responseText);

		var length = jsonObject.features.length;

		if (length < 1) {
			document.getElementById('list').innerHTML = "No results found.";
			document.getElementById('export').disabled = true;
			$("#exportDiv").hide();
		} else {
			// if (debugc) console.log("TEST-displayFeatures:
			// jsonObject.features="+JSON.stringify(jsonObject)); //TEST
			var headers = [ "ID", "Lat (dec.deg)", "Long (dec.deg)", "Area", "Depth of Sea (m)", "Depth of Sample (m)",
					"Date", "Time", ];

			var tableAndIds = ns.tableConstructor.featureTable("filterTable", jsonObject.features, headers);
			// if (debugc) console.log("TEST-displayFeatures:
			// tableAndIds="+JSON.stringify(tableAndIds)); //TEST
			var constructedTable = tableAndIds.table;
			currentFeatureIds = tableAndIds.ids;
			// if (debugc) console.log("TEST-displayFeatures:
			// currentFeatureIds="+JSON.stringify(currentFeatureIds)); //TEST

			document.getElementById('list').innerHTML = "Click a row to view parameters<br> " + "<div>"
					+ constructedTable + "</div><br>";
			document.getElementById('export').disabled = false;
			$("#exportDiv").show();
			$('#filterTable').dataTable({
				'aaSorting' : []
			});
		}
	}

	// known parameters, and how they are prefixed in the backend
	// e.g. concatenation of prefix and element must be a valid layer in backend
	var knownParameters = [ "temperature" ]; // , "chlorophyll", "plankton",
	// "flagellate", ],
	var parameterPrefix = "v3_"/* "list_" */;

	// view all parameters of a feature
	function viewParams() {

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
		if (debugc) {
			console.log("ns.handleParameters.getChosenParameters:" + ns.handleParameters.getChosenParameters());
		}
		// iterate through all known parameters, request and display result
		// through callback
		$.each(knownParameters, function(i, val) {
			if (debugc)
				console.log("TEST: viewParams: TYPENAME=" + parameterPrefix + val); // TEST
			ns.WebFeatureService.getFeature({
				TYPENAME : parameterPrefix + val,
				PROPERTYNAME : ns.handleParameters.getChosenParameters().concat(ns.handleParameters.alwaysSelect)
						.toString(),
				FILTER : ns.query.constructParameterFilterString(ns.handleParameters.getChosenParameters()),
				VIEWPARAMS : '' + paramFilter
			}, function(response) {
				displayParameter(response, val);
			});
			switch (val) {
			case "temperature":
				previousTemperatureFilterParams = ns.WebFeatureService.getPreviousRequestParameters();
				break;
			}
		});

		// link the buttons for exporting parameter values
		linkTemperatureExportButton(); // TODO-turn into array of buttons,
		// previous-variables

		// jump to the parameters tab
		$('#tabs').tabs("option", "active", 1);

		document.getElementById('exportTemperature').disabled = false;
		$("#exportTemperatureDiv").show();
	}

	// display a parameter as a table
	function displayParameter(response, parameter) {
		if (debugc)
			console.log("control.js: displayParameter: parameter=" + parameter);// TEST
		try {
			response = JSON.parse(response.responseText);
		} catch (SyntaxError) {
			console.error("Could not parse response to parameter data request");
			return;
		}

		var tableId = parameter + "Table";
		switch (parameter) {
		case "temperature":
			constructedTable = ns.tableConstructor.parameterTableTemperatures(tableId, response.features);
			break;
		}
		if (debugc)
			console.log("control.js: displayParameter: constructedTable=" + constructedTable);// TEST

		$("#" + parameter).html(parameter + "<br>" + "<div class='scrollArea'>" + constructedTable + "</div>");
		if (debugc)
			console.log("control.js: parameter table html=" + $("#" + parameter).html());// TEST

		$("#" + tableId).dataTable({
			// search functionality not needed for parameter tables
			'bFilter' : false
		});
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
		var table = ns.handleParameters.initiateParameters(input);
		tablesDone[table] = true;
		var done = true;
		// for ( var tableCheck in tablesDone) {
		// if (debugc)
		// console.log("Checking done for table:"+tableCheck+" and
		// tablesDone[table]:"+tablesDone[tableCheck]); // TEST
		// done &= tablesDone[tableCheck];
		// }
		// if (done) {
//		if (debugc)
//			console.log("Done!"); // TEST
		$("#parameters").html(ns.tableConstructor.parametersList(tablesDone));
		// init the parameters tree
		// TO CREATE AN INSTANCE
		// select the tree container using jQuery

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
		// each plugin you have included can have its own config object
		// "core" : { "initially_open" : [ "phtml_1" ] }
		// it makes sense to configure a plugin only if overriding the
		// defaults
		})
		// EVENTS
		// each instance triggers its own events - to process those listen
		// on
		// the container
		// all events are in the `.jstree` namespace
		// so listen for `function_name`.`jstree` - you can function names
		// from
		// the docs
		.bind("loaded.jstree", function(event, data) {
			// you get two params - event & data - check the core docs for a
			// detailed description
		});
		// }
		// }
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
