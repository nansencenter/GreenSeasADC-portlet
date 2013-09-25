var myNamespace = myNamespace || {};

var debugc = false;// debug flag

myNamespace.control = (function($, OL, ns) {
	"use strict";

	function init() {
		 if (debugc) alert("control.js: starting init() method...");//TEST
		// hide export option until we have something to export
		$("#exportDiv").hide();
		$("#exportTemperatureDiv").hide();

		// initialize map viewer
		ns.mapViewer.initMap();

		// set event handlers on buttons
		ns.buttonEventHandlers.initHandlers();

		setBboxInputToCurrentMapExtent();

		$("#tabs").tabs();

		$("#queryOptions").accordion({
			collapsible : true,
			active : false
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
		 if (debugc) alert("control.js: start of filterButton()");//TEST
		// set loading text and empty parameter HTML
		$("#featuresAndParams").hide();
		$("#loadingText").html("Loading data, please wait...");

		$("#temperature").html("");

		// delete any multiPlot chart
//		 if (debugc) alert("control.js: calling ns.Charter.resetMultiPlot()");
		// //TEST
//		ns.Charter.resetMultiPlot();

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
			 if (debugc) alert("Date is enabled");
			date = {};

			date.fromDate = $('#fromDate').val();
			date.toDate = $('#toDate').val();

			date.fromTime = $('#fromTime').val();
			date.toTime = $('#toTime').val();
		}

		var attr = null;
		 if (debugc) alert("control.js: calling ns.query.constructFilterString()"); //TEST
		var filter = ns.query.constructFilterString(filterBbox, date, attr);

		// GetFeature request with filter, callback handles result
		 if (debugc) alert("control.js: calling ns.WebFeatureService.getFeature()"); // TEST
		ns.WebFeatureService.getFeature({
			TYPENAME : "gsadb3", // MOD (station)
			FILTER : filter
		}, displayFeatures);

		prevFilter = filter; // store for parameter retrieval

		 if (debugc) alert("control.js: calling ns.WebFeatureService.getPreviousRequestParameters()"); //TEST
		previousFilterParams = ns.WebFeatureService.getPreviousRequestParameters();

		$("#featuresAndParams").show();

		// link the button for exporting with new params
		 if (debugc) alert("control.js: calling linkExportButton()"); //TEST
		linkExportButton();

		// construct query string for display
		queryString = ns.WFSserver + "?" + OL.Util.getParameterString(previousFilterParams);
		 if (debugc) alert("queryString:"+queryString); //TEST

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
		// alert("TEST: linkExportBUtton:
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
		// alert("TEST: linkTemperatureExportBUtton:
		// exportTemperatureButtonURL="+exportTemperatureButtonURL);//TEST

		ns.buttonEventHandlers.linkTemperatureExportButton(exportTemperatureButtonURL);

		// alert("TEST:
		// exportTemperatureDiv="+$("#exportTemperatureDiv").html());//TEST
		// alert("TEST: exportDiv="+$("#exportDiv").html());//TEST
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
			// if (debugc) alert("TEST-displayFeatures:
			// jsonObject.features="+JSON.stringify(jsonObject)); //TEST
			var headers = [ "ID", "Lat (dec.deg)", "Long (dec.deg)", "Area", "Depth of Sea (m)", "Depth of Sample (m)",
					"Date", "Time", ];

			var tableAndIds = ns.tableConstructor.featureTable("filterTable", jsonObject.features, headers);
			// if (debugc) alert("TEST-displayFeatures:
			// tableAndIds="+JSON.stringify(tableAndIds)); //TEST
			var constructedTable = tableAndIds.table;
			currentFeatureIds = tableAndIds.ids;
			// if (debugc) alert("TEST-displayFeatures:
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
	var knownParameters = [ "temperature", "chlorophyll", "plankton", "flagellate", ], parameterPrefix = "v3_"/* "list_" */;

	// view all parameters of a feature
	function viewParams(id) {
		if (debugc) alert("TEST: viewParams started...  currentFeatureIds=" + currentFeatureIds); // TEST

		// format list of point IDs for WFS query
		var idList = "";
		$.each(currentFeatureIds, function(i, val) {
			idList += val + "\\,";
		});
		idList = idList.substring(0, idList.length - 2);
		if (debugc)
			alert("TEST: viewParams: idList=" + idList); // TEST

		// extract filter
		var paramFilter = prevFilter;
		if (debugc)
			alert("TEST: viewParams: prevFilter=" + prevFilter); // TEST
		paramFilter = "left:-63.0;bottom:-53.0;right:-55.0;top:-48.0";
		if (debugc)
			alert("TEST: viewParams: dummy paramFilter=" + paramFilter); // TEST
		// extract each value and insert into view param string
		var str2 = "";
		if (document.getElementById('bboxEnabledCheck').checked) {
			str2 = "left:" + $('#left').val() + ";bottom:" + $('#bottom').val() + ";right:" + $('#right').val()
					+ ";top:" + $('#top').val();
		} else {
			str2 = "left:-180.0;bottom:-90.0;right:180.0;top:90.0";// default
			// bbox,
			// global
		}
		if (document.getElementById('dateEnabledCheck').checked) {
			str2 += ";sdate:" + $('#fromDate').val() + ";edate:" + $('#toDate').val();
		} else {
			// do nothing, we don't search for dates
		}
		if (debugc)
			alert("TEST: viewParams: new FILTER=" + str2); // TEST
		paramFilter = str2;

		// iterate through all known parameters, request and display result
		// through callback
		$.each(knownParameters, function(i, val) {
			if (debugc)
				alert("TEST: viewParams: TYPENAME=" + parameterPrefix + val); // TEST
			ns.WebFeatureService.getFeature({
				TYPENAME : parameterPrefix + val,
				// VIEWPARAMS : 'n:' + id
				// //VIEWPARAMS : 'list:' + idList
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
		// if (debugc) alert("control.js: displayParameter:
		// parameter="+parameter);//TEST
		try {
			response = JSON.parse(response.responseText);
		} catch (SyntaxError) {
			console.error("Could not parse response to parameter data request");
			return;
		}

		// TODO: plot scatterplot of points with _real_ values
		// ns.Charter.plotParameter(response, parameter + "Plot", parameter,
		// parameter + " by level");

		var tableId = parameter + "Table";
		switch (parameter) {
		case "temperature":
			constructedTable = ns.tableConstructor.parameterTableTemperatures(tableId, response.features);
			break;
		}
		alert("control.js: displayParameter: constructedTable="+constructedTable);//TEST

		$("#" + parameter).html(parameter + "<br>" + "<div class='scrollArea'>" + constructedTable + "</div>");
		 if (debugc) alert("control.js: parameter table html="+$("#" +parameter).html());//TEST

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

	// public interface
	return {
		init : init,
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
