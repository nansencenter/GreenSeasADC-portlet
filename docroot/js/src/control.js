var myNamespace = myNamespace || {};

var debugc = true;// debug flag

myNamespace.control = (function($, OL, ns) {
	"use strict";

	// List of tables that is selected for querying in a parameter-filter
	var tablesToQuery = [];
	// All the filtered search data is stored here.
	var data = null;
	// The data from the basic search result is stored for being able to
	// re-apply parameter-filter without having to do the basic query
	var basicData = null;
	// Table of all tables available in the database and a boolean that
	// represents if they have been initiated/analyzed
	var tablesDone;

	function init() {
		if (debugc) {
			console.log("control.js: starting init() method...");// TEST

			tablesToQuery = [];
			data = null;
			basicData = null;
			// ns.ajax.doAjax();
			tablesDone = {
				v4_chlorophyll : false,
				v4_temperature : false,
				v5_plankton : false,
				v4_flagellate : false
			};

		}
		// hide export option until we have something to export
		$("#exportParametersDiv").hide();
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
				ns.mapViewer.zoomToExtent(zoomBbox, true);
			}
		}
		return filterBbox;
	}

	// non-public
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

	// non-public
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

	function createDepthHashMap() {
		var depth = null;
		if (document.getElementById('depthEnabledCheck').checked) {
			depth = {};
			depth.min = $('#depthMin').val();
			depth.max = $('#depthMax').val();
		}
		return depth;
	}

	function filterButton() {
		$("#exportParametersDiv").hide();
		if (debugc)
			console.log("control.js: start of filterButton()");// TEST
		// set loading text and empty parameter HTML
		$("#featuresAndParams").hide();
		$("#loadingText").html("Loading data, please wait...");

		$("#parametersTable").html("");

		// should be the meta-data-layer
		var layer = ns.handleParameters.mainTable.name;

		// add bbox?
		var filterBbox = createfilterBoxHashMap();

		// add date?
		var date = createDateHashMap();

		// add parameters
		var par = createParameterArray();

		var depth = createDepthHashMap();

		// no attributes are currently supported
		var attr = null;

		if (debugc)
			console.log("control.js: calling ns.query.constructFilterString()"); // TEST

		var filter = ns.query.constructFilterString(filterBbox, date, attr, depth);

		// GetFeature request with filter, callback handles result
		if (debugc)
			console.log("control.js: calling ns.WebFeatureService.getFeature()"); // TEST
		ns.WebFeatureService.getFeature({
			TYPENAME : layer,
			FILTER : filter
		}, displayFeatures);

		if (debugc)
			console.log("control.js: calling ns.WebFeatureService.getPreviousRequestParameters()"); // TEST

		$("#featuresAndParams").show();
	}

	function linkParametersExportButton() {
		ns.buttonEventHandlers.linkParametersExportButton(ns.fileCreation.createCSV(data),
				"data:text/csv;charset=utf-8", "Greenseas_Downloaded_Parameters.csv");
	}

	// non-public
	function convertInputToFeatures(input) {
		var gformat = new OL.Format.GeoJSON();
		var features = gformat.read(input.responseText);
		return features;
	}

	// non-public
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

	// non-public
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
		} else {
			updateTreeInventoryNumbers();
			var constructedTable = ns.tableConstructor.featureTable("filterTable", jsonObject.features);

			document.getElementById('list').innerHTML = "<div>" + constructedTable + "</div><br>";
			$('#filterTable').dataTable({
				'aaSorting' : []
			});
			$("#filterParameters").show();
		}
	}

	// view all parameters of a feature
	function viewParams() {
		if (document.getElementById('parametersEnabledCheck').checked) {
			$("#parametersTable").html("Loading parameters..");

			// removing the parameterlayers from previous searches
			ns.mapViewer.removeAllParameterLayers();
			// extract each value and insert into view param string
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

			if (document.getElementById('parametersEnabledCheck').checked) {
				ns.handleParameters.selectParameters($("#parametersTree").jstree("get_checked", null, true));
			}

			// Resetting tablesToQuery between filters
			tablesToQuery = [];

			// Cloning in the data from the basic search
			data = convertArrayToHashMap($.extend(true, {}, basicData));
			if (debugc)
				console.log("Adding all selected tables to tablesSelected");

			// Adding all selected layers to tablesToQuery
			$.each(ns.handleParameters.chosenParameters.tablesSelected, function(i, table) {
				tablesToQuery.push(table);
			});

			if (debugc)
				console.log("Popping first layer");
			// pop the first layer
			var layer = tablesToQuery.pop();
			// Array with all parameters for the current layer
			var propertyName = [];

			if (debugc)
				console.log("Adding the parameters to the array");
			// Adding the parameters to the array
			$.each(ns.handleParameters.chosenParameters.parametersByTable[layer], function(j, parameter) {
				propertyName.push(parameter);
			});

			if (debugc)
				console.log("Requesting features from the first layer");
			// Requesting features from the first layer through an asynchronous
			// request and sending response to displayParameter
			ns.WebFeatureService.getFeature({
				TYPENAME : layer,
				PROPERTYNAME : [ "point" ].concat(propertyName).toString(),
				FILTER : ns.query.constructParameterFilterString(propertyName, createDepthHashMap()),
				VIEWPARAMS : '' + paramFilter
			}, function(response) {
				displayParameter(response, layer);
			});

			// jump to the parameters tab
			$('#tabs').tabs("option", "active", 1);
		} else {
			ns.errorMessage
					.showErrorMessage("You need to enable parameters in the query and select parameters before filtering");
		}
	}

	// display a parameter as a table
	// non-public
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
		if (tablesToQuery.length == 0) {
			if (debugc)
				console.log("tablesToQuery.length == 0");
			var constructedTable = ns.tableConstructor.parameterTable(data);

			$("#parametersTable").html(
					"Entries where the selected parameters were available<br>" + "<div class='scrollArea'>"
							+ constructedTable + "</div>");

			$("#parametersResultTable").dataTable({
				// search functionality not needed for parameter tables
				'bFilter' : false
			});
			linkParametersExportButton();
			ns.mapViewer.addFeaturesFromData(data, "All parameters");
			document.getElementById('exportParameter').disabled = false;
			$("#exportParametersDiv").show();
		} else {
			var layer = tablesToQuery.pop();
			var paramFilter = generateParamStringFrombboxAndDate();
			var propertyName = [];
			$.each(ns.handleParameters.chosenParameters.parametersByTable[layer], function(j, parameter) {
				propertyName.push(parameter);
			});
			ns.WebFeatureService.getFeature({
				TYPENAME : layer,
				PROPERTYNAME : [ "point" ].concat(propertyName).toString(),
				FILTER : ns.query.constructParameterFilterString(propertyName, createDepthHashMap()),
				VIEWPARAMS : '' + paramFilter
			}, function(response) {
				displayParameter(response, layer);
			});
		}
	}

	function generateParamStringFrombboxAndDate() {
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

		return paramString;
	}

	// non-public
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

	// non-public
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

	// non-public
	function addData(response) {
		if (debugc) {
			console.log("Started adding Data:");
		}
		var features = response.features;
		var layer = replaceId(features);
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

	function updateTreeWithInventoryNumbers(response, par, layer) {
		if (debugc) {
			console.log("Started updateTreeWithInventoryNumbers:" + par);
		}
		var numberOfFeatures = ns.XMLParser.getNumberOfFeatures(response);
		var newText = ns.handleParameters.getHeader(par, layer) + " [" + numberOfFeatures + "]";
		$("#parametersTree").jstree("set_text", $(document.getElementById(layer + ":" + par)), newText);
	}

	function updateTreeInventoryNumbers() {
		var myTreeContainer = $.jstree._reference("#parametersTree").get_container();
		var allChildren = myTreeContainer.find("li");
		$.each(allChildren, function(i, val) {
			var splitString = val.id.split(":");
			if (splitString.length == 2) {
				var layer = splitString[0];
				var paramFilter = generateParamStringFrombboxAndDate();
				ns.WebFeatureService.getFeature({
					TYPENAME : layer,
					PROPERTYNAME : splitString[1],
					FILTER : ns.query.constructParameterFilterString([ splitString[1] ], createDepthHashMap()),
					VIEWPARAMS : '' + paramFilter,
					RESULTTYPE : "hits"
				}, function(response) {
					updateTreeWithInventoryNumbers(response, splitString[1], splitString[0]);
				});
			}
		});
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
		$("#parametersTree").html(ns.tableConstructor.parametersList(tablesDone));
		// init the parameters tree
		$("#parametersTree")
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
		linkParametersExportButton : linkParametersExportButton,
	};

}(jQuery, OpenLayers, myNamespace));
