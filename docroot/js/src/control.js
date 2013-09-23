var myNamespace = myNamespace || {};

var debugc=true;//debug flag

myNamespace.control = (function($, OL, ns) {
	"use strict";

	function init() {
		//if (debugc) alert("control.js: starting init() method...");//TEST
		// hide export option until we have something to export
		$("#exportDiv").hide();
		$("#exportTemperatureDiv").hide();
		$("#exportChlorophyllDiv").hide();
		$("#exportPlanktonDiv").hide();
		$("#exportFlagellateDiv").hide();

		// initialize map viewer
		ns.mapViewer.initMap();

		// set event handlers on buttons
		ns.buttonEventHandlers.initHandlers();

		setBboxInputToCurrentMapExtent();

		$("#tabs").tabs();
		
		$("#densityButton").hide();

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
		//if (debugc) alert("control.js: start of filterButton()");//TEST
		// set loading text and empty parameter HTML
		$("#featuresAndParams").hide();
		$("#loadingText").html("Loading data, please wait...");

		$("#temperature").html("");
		$("#chlorophyll").html(""); // Was: "#salinity"
		$("#plankton").html(""); // New
		$("#flagellate").html(""); // New
		//TODO: remove or 'recycle' plots below
		$("#temperaturePlot").html("");
		$("#salinityPlot").html("");
		$("#multiPlots").html("");

		// delete any multiPlot chart
		//if (debugc) alert("control.js: calling ns.Charter.resetMultiPlot()"); //TEST
		ns.Charter.resetMultiPlot();

		// should be currently selected layer, e.g. floats or station etc.
		var layer = "gsadb3"; // MOD (floats)

		var filterBbox = null, zoomBbox;
		// add bbox?
		if (document.getElementById('bboxEnabledCheck').checked) {

			var top = $('#top').val(), left = $('#left').val(), right = $(
					'#right').val(), bottom = $('#bottom').val();

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
			date = {};

			date.fromDate = $('#fromDate').val();
			date.toDate = $('#toDate').val();

			date.fromTime = $('#fromTime').val();
			date.toTime = $('#toTime').val();
		}

		// other attributes
		//TODO: update to reflect actual other attributes for greenseas
		var attr = null;
		if (document.getElementById('attributesEnabledCheck').checked) {
			attr = {};

			attr.countryname = $('#countrynameAttribute').find(":selected")
					.val();
			attr.notcountry = document.getElementById("notCountry").checked;

			attr.vesselname = $('#vesselnameAttribute').find(":selected").val();
			attr.notvessel = document.getElementById("notVessel").checked;

			attr.sourcename = $('#sourceAttribute').find(":selected").val();
			attr.notsource = document.getElementById("notSource").checked;
		}

		//if (debugc) alert("control.js: calling ns.query.constructFilterString()"); //TEST
		var filter = ns.query.constructFilterString(filterBbox, date, attr);

		// GetFeature request with filter, callback handles result
		//if (debugc) alert("control.js: calling ns.WebFeatureService.getFeature()"); // TEST
		ns.WebFeatureService.getFeature({
			TYPENAME : "gsadb3",  // MOD (station)
			FILTER : filter
		}, displayFeatures);
		
		prevFilter = filter; // store for parameter retrieval

		//if (debugc) alert("control.js: calling ns.WebFeatureService.getPreviousRequestParameters()"); //TEST
		previousFilterParams = ns.WebFeatureService
				.getPreviousRequestParameters();

		$("#featuresAndParams").show();

		// link the button for exporting with new params
		//if (debugc) alert("control.js: calling linkExportButton()"); //TEST
		linkExportButton();

		// construct query string for display
		queryString = ns.WFSserver + "?"
				+ OL.Util.getParameterString(previousFilterParams);
		//if (debugc) alert("queryString:"+queryString); //TEST

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
	
	var selectedChlorophyllFormat = "csv";

	function formatChlorophyllChange() {
		var s = document.getElementById('exportChlorophyllFormats');
		selectedChlorophyllFormat = s.options[s.selectedIndex].value;

		linkChlorophyllExportButton();
	}

	var selectedPlanktonFormat = "csv";

	function formatPlanktonChange() {
		var s = document.getElementById('exportPlanktonFormats');
		selectedPlanktonFormat = s.options[s.selectedIndex].value;

		linkPlanktonExportButton();
	}
	
	var selectedFlagellateFormat = "csv";

	function formatFlagellateChange() {
		var s = document.getElementById('exportFlagellateFormats');
		selectedFlagellateFormat = s.options[s.selectedIndex].value;

		linkFlagellateExportButton();
	}
	
	var previousFilterParams = "";
	var exportButtonURL = "";

	function linkExportButton() {
		// get a copy of params so we don't change the original
		var params = $.extend({}, previousFilterParams);

		// update params to selected format instead of json
		params.OUTPUTFORMAT = selectedFormat;

		// construct URL
		exportButtonURL = ns.WFSserver + "?"
				+ OL.Util.getParameterString(params);
		//alert("TEST: linkExportBUtton: exportButtonURL="+exportButtonURL);//TEST

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
		exportTemperatureButtonURL = ns.WFSserver + "?"
				+ OL.Util.getParameterString(params);
		//alert("TEST: linkTemperatureExportBUtton: exportTemperatureButtonURL="+exportTemperatureButtonURL);//TEST

		ns.buttonEventHandlers.linkTemperatureExportButton(exportTemperatureButtonURL);
		
		//alert("TEST: exportTemperatureDiv="+$("#exportTemperatureDiv").html());//TEST
		//alert("TEST: exportDiv="+$("#exportDiv").html());//TEST
	}
	
	var previousChlorophyllFilterParams = "";
	var exportChlorophyllButtonURL = "";

	function linkChlorophyllExportButton() {
		// get a copy of params so we don't change the original
		var params = $.extend({}, previousChlorophyllFilterParams);

		// update params to selected format instead of json
		params.OUTPUTFORMAT = selectedChlorophyllFormat;

		// construct URL
		exportChlorophyllButtonURL = ns.WFSserver + "?"
				+ OL.Util.getParameterString(params);
		//alert("TEST: linkChlorophyllExportBUtton: exportChlorophyllButtonURL="+exportChlorophyllButtonURL);//TEST

		ns.buttonEventHandlers.linkChlorophyllExportButton(exportChlorophyllButtonURL);
		
		//alert("TEST: exportChlorophyllDiv="+$("#exportChlorophyllDiv").html());//TEST
		//alert("TEST: exportDiv="+$("#exportDiv").html());//TEST
	}
	
	var previousPlanktonFilterParams = "";
	var exportPlanktonButtonURL = "";

	function linkPlanktonExportButton() {
		// get a copy of params so we don't change the original
		var params = $.extend({}, previousPlanktonFilterParams);

		// update params to selected format instead of json
		params.OUTPUTFORMAT = selectedPlanktonFormat;

		// construct URL
		exportPlanktonButtonURL = ns.WFSserver + "?"
				+ OL.Util.getParameterString(params);
		//alert("TEST: linkPlanktonExportBUtton: exportPlanktonButtonURL="+exportPlanktonButtonURL);//TEST

		ns.buttonEventHandlers.linkPlanktonExportButton(exportPlanktonButtonURL);
		
		//alert("TEST: exportPlanktonDiv="+$("#exportPlanktonDiv").html());//TEST
		//alert("TEST: exportDiv="+$("#exportDiv").html());//TEST
	}
	
	var previousFlagellateFilterParams = "";
	var exportFlagellateButtonURL = "";

	function linkFlagellateExportButton() {
		// get a copy of params so we don't change the original
		var params = $.extend({}, previousFlagellateFilterParams);

		// update params to selected format instead of json
		params.OUTPUTFORMAT = selectedFlagellateFormat;

		// construct URL
		exportFlagellateButtonURL = ns.WFSserver + "?"
				+ OL.Util.getParameterString(params);
		//alert("TEST: linkFlagellateExportBUtton: exportFlagellateButtonURL="+exportFlagellateButtonURL);//TEST

		ns.buttonEventHandlers.linkFlagellateExportButton(exportFlagellateButtonURL);
		
		//alert("TEST: exporFlagellateDiv="+$("#exportFlagellateDiv").html());//TEST
		//alert("TEST: exportDiv="+$("#exportDiv").html());//TEST
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
			//if (debugc) alert("TEST-displayFeatures: jsonObject.features="+JSON.stringify(jsonObject)); //TEST
			var headers = [ "ID", "Lat (dec.deg)", "Long (dec.deg)", "Area", "Depth of Sea (m)", 
					"Depth of Sample (m)", "Date", "Time", ];

			var tableAndIds = ns.tableConstructor.featureTable("filterTable",
					jsonObject.features, headers);
			//if (debugc) alert("TEST-displayFeatures: tableAndIds="+JSON.stringify(tableAndIds)); //TEST
			var constructedTable = tableAndIds.table;
			currentFeatureIds = tableAndIds.ids;
			//if (debugc) alert("TEST-displayFeatures: currentFeatureIds="+JSON.stringify(currentFeatureIds)); //TEST

			document.getElementById('list').innerHTML = "Click a row to view parameters<br> "
					+ "<div>" + constructedTable + "</div><br>";
			document.getElementById('export').disabled = false;
			$("#exportDiv").show();
			$('#filterTable').dataTable({
				'aaSorting' : []
			});
		}
	}

	// make a plot of a selected parameter for all currently displayed features
	function multiParamPlot() {

		$.each(currentFeatureIds, function(i, id) {
			ns.WebFeatureService.getFeature({
				TYPENAME : "gsadb3",
				VIEWPARAMS : 'n:' + id
			}, function(request) {
				var features = JSON.parse(request.responseText).features;
				ns.Charter.addMultiPlotSeries(features, "multiPlots",
						currentFeatureIds.length);
			});
		});
	}

	// can't do density plots until both are fully loaded
	var salinityResponse, temperatureResponse;

	// known parameters, and how they are prefixed in the backend
	// e.g. concatenation of prefix and element must be a valid layer in backend
	var knownParameters = [ "temperature", "chlorophyll", "plankton", "flagellate" ], 
	    parameterPrefix = "v3_"/*"list_"*/;

	// view all parameters of a feature
	function viewParams(id) {
		//if (debugc) alert("TEST: viewParams started... - currentFeatureIds="+currentFeatureIds); //TEST
		
		// new request, reset loaded-status
		salinityResponse = null;
		temperatureResponse = null;
		
		// format list of point IDs for WFS query
		var idList="";
		$.each(currentFeatureIds, function(i, val) { 
			idList+=val+"\\,";
		});
		idList=idList.substring(0, idList.length - 2);
		//if (debugc) alert("TEST: viewParams: idList="+idList); //TEST
		
		// extract filter
		var paramFilter = prevFilter;
		//if (debugc) alert("TEST: viewParams: prevFilter="+prevFilter); //TEST
		paramFilter = "left:-63.0;bottom:-53.0;right:-55.0;top:-48.0";
		//if (debugc) alert("TEST: viewParams: dummy paramFilter="+paramFilter); //TEST
		// extract each value and insert into view param string
		var str2 = "";
		if (document.getElementById('bboxEnabledCheck').checked) {
			str2="left:"+$('#left').val()+";bottom:"+$('#bottom').val()
			     +";right:"+$('#right').val()+";top:"+$('#top').val();
		} else {
			str2="left:-180.0;bottom:-90.0;right:180.0;top:90.0";// default bbox, global
		}
		if (document.getElementById('dateEnabledCheck').checked) {
			str2+=";sdate:"+$('#fromDate').val()+";edate:"+$('#toDate').val();
		} else {
			//do nothing, we don't search for dates
		}
		//if (debugc) alert("TEST: viewParams: new FILTER="+str2); //TEST
		paramFilter = str2;
		

		// iterate through all known parameters, request and display result
		// through callback
		$.each(knownParameters, function(i, val) {
			//if (debugc) alert("TEST: viewParams: TYPENAME="+parameterPrefix + val); //TEST
			ns.WebFeatureService.getFeature({
				TYPENAME : parameterPrefix + val,
				//VIEWPARAMS : 'n:' + id
				////VIEWPARAMS : 'list:' + idList
				VIEWPARAMS : '' + paramFilter
			}, function(response) {
				displayParameter(response, val);
			});
			switch (val) {
			case "flagellate":
				previousFlagellateFilterParams = ns.WebFeatureService.getPreviousRequestParameters();
				break;
			case "plankton":
				previousPlanktonFilterParams = ns.WebFeatureService.getPreviousRequestParameters();
				break;
			case "chlorophyll":
				previousChlorophyllFilterParams = ns.WebFeatureService.getPreviousRequestParameters();
				break;
			case "temperature":
				previousTemperatureFilterParams = ns.WebFeatureService.getPreviousRequestParameters();
				break;
			}
		});
		
		//previousTemperatureFilterParams = ns.WebFeatureService.getPreviousRequestParameters();
		//if (debugc) alert("TEST: viewParams: previousTemperatureFilterParams="+JSON.stringify(previousTemperatureFilterParams)); //TEST
		
		// link the buttons for exporting parameter values
		linkTemperatureExportButton(); //TODO-turn into array of buttons, previous-variables
		linkChlorophyllExportButton();
		linkPlanktonExportButton();
		linkFlagellateExportButton();
		
		// jump to the parameters tab
		$('#tabs').tabs( "option", "active", 1);

		$("#densityButton").show();
		
		document.getElementById('exportTemperature').disabled = false;
		$("#exportTemperatureDiv").show();
		document.getElementById('exportChlorophyll').disabled = false;
		$("#exportChlorophyllDiv").show();
		document.getElementById('exportPlankton').disabled = false;
		$("#exportPlanktonDiv").show();
		document.getElementById('exportFlagellate').disabled = false;
		$("#exportFlagellateDiv").show();
	}

	// plot a density graph based on currently loaded salinity and temperature-----
	function plotDensity() {

		if (!salinityResponse || !temperatureResponse) {
			console.error("not ready to calculate, or not available data");
			return;
		}

		// calculate densities, store in computedData
		var sal = salinityResponse, temp = temperatureResponse, computedData = [], i, tempLength, salLength;

		// use density for calculation
		var calculatorFunction = ns.densityCalculator.density;

		tempLength = temp.features.length;
		salLength = sal.features.length;

		if (tempLength !== salLength) {
			console.error("Different length in parameters for density plot..");
			return;
		}

		// add data elements in pair (level, value) where value is computed
		// from values of temp. and sal. at that level
		for (i = 0; i < tempLength; i += 1) {
			var level = temp.features[i].properties.level, tempVal = temp.features[i].properties.value, salVal = sal.features[i].properties.value;

			// create computedData in the same format as GeoJSON responses, so
			// it may be used easily by utility modules
			computedData[i] = {
				properties : {}
			};

			computedData[i].properties.level = level;
			computedData[i].properties.value = calculatorFunction(salVal,
					tempVal, level);
			computedData[i].properties.flag = "X";
		}

		console.log("done computing");

		// draw table
		var table = ns.tableConstructor.parameterTable("densityTable",
				computedData);
		
		$("#densityTableDiv").html("<div> " + table + " </div>");
		$("#densityTable").dataTable({
			'bFilter' : false
		});

		console.log("table drawn");

		// plot chart
		ns.Charter.densityPlot(temp, sal, computedData, "generatedPlot");

		console.log("plot charted");

	}

	// display a parameter as a table and graph plot
	function displayParameter(response, parameter) {
		//if (debugc) alert("control.js: displayParameter: parameter="+parameter);//TEST
		try {
			response = JSON.parse(response.responseText);
		} catch (SyntaxError) {
			console.error("Could not parse response to parameter data request");
			return;
		}

		//TODO: plot scatterplot of points with _real_ values
		//ns.Charter.plotParameter(response, parameter + "Plot", parameter,
		//		parameter + " by level");

		var tableId = parameter + "Table";
		switch (parameter) {
		case "flagellate":
			constructedTable = ns.tableConstructor.parameterTableFlagellate(tableId,
					response.features);
			break;
		case "plankton":
			constructedTable = ns.tableConstructor.parameterTablePlankton(tableId,
					response.features);
			break;
		case "chlorophyll":
			constructedTable = ns.tableConstructor.parameterTableChlorophyll(tableId,
					response.features);
			break;
		case "temperature":
			constructedTable = ns.tableConstructor.parameterTableTemperatures(tableId,
					response.features);
			break;
		}
		//var constructedTable = ns.tableConstructor.parameterTableTemperatures(tableId,
		//		response.features);
		//if (debugc) alert("control.js: displayParameter: constructedTable="+constructedTable);//TEST

		$("#" + parameter).html(
				parameter + "<br>" + "<div class='scrollArea'>"
						+ constructedTable + "</div>");
		//if (debugc) alert("control.js: parameter table html="+$("#" + parameter).html());//TEST

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
		multiParamPlot : multiParamPlot,
		plotDensity : plotDensity,
		linkExportButton : linkExportButton,
		linkTemperatureExportButton : linkTemperatureExportButton,
		linkChloroophyllExportButton : linkChlorophyllExportButton,
		linkPlanktonExportButton : linkPlanktonExportButton,
		linkFlagellateExportButton : linkFlagellateExportButton,
		setSelectedFormat : function(format) {
			selectedFormat = format;
		}
		//,setSelectedTemperatureFormat : function(format) {
		//	selectedTemperatureFormat = format;
		//}
		//,setSelectedChlorophyllFormat : function(format) {
		//	selectedChlorophyllFormat = format;
		//}
		//,setSelectedPlanktonFormat : function(format) {
		//	selectedPlanktonFormat = format;
		//}
		//setSelectedFlagellateFormat : function(format) {
		//	selectedFlagellateFormat = format;
		//}
	};

}(jQuery, OpenLayers, myNamespace));
