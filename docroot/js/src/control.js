var myNamespace = myNamespace || {};

var debugc = false;// debug flag

myNamespace.mainQueryArray = null;
myNamespace.mainQueryObject = null;
myNamespace.parametersQueryString = null;
myNamespace.parameterQueryArray = null;

myNamespace.control = (function($, OL, ns) {
	"use strict";

	// List of tables that is selected for querying in a parameter-filter
	var tablesToQuery = [];
	// All the filtered search data is stored here.
	var data = null;
	// The data from the basic search result is stored for being able to
	// re-apply parameter-filter without having to do the basic query
	var basicData = null;

	function init() {
		if (debugc) {
			console.log("control.js: starting init() method...");// TEST
		}
		tablesToQuery = [];
		data = null;
		basicData = null;

		setHTMLInit();

		// Initialize onchange for save query boxes:
		setUpOnChangeForSaveQueryBoxes();

		// initialize map viewer
		ns.mapViewer.initMap();

		// Initialize the data from layers in WFS
		ns.WebFeatureService.describeFeatureType({
			TYPENAME : metaDataTable,
		}, function(response) {
			initiateMetadata(response);
		});

		// set event handlers on buttons
		ns.buttonEventHandlers.initHandlers();

		setBboxInputToCurrentMapExtent();

		// Set up legend inline (special display case for ie and firefox)
		ns.mapLayers.setUpStyleForLegend();

		setUpRegions();
		setUpCruiseSelector();
		ns.matchup.setUpUploadRaster();
		ns.matchup.setUpOPeNDAPSelector();
		regenerateSavedQuery()

		$('#gsadbcPortlet [title]').qtip();
		ns.mapLayers.generateLayerTable();
	}

	function setUpOnChangeForSaveQueryBoxes() {
		ns.buttonEventHandlers.change("#saveQueryRunMainQuery", saveQueryRunMainQueryChange);
		ns.buttonEventHandlers.change("#saveQueryUpdateInventory", saveQueryUpdateInventoryChange);
		ns.buttonEventHandlers.change("#saveQueryRunParameterFilter", saveQueryRunParameterFilterChange);
		ns.buttonEventHandlers.change("#saveQueryAutoDownloadCSV", saveQueryAutoDownloadCSVChange);
	}

	function saveQueryRunMainQueryChange() {
		if (!$('#saveQueryRunMainQuery').is(':checked')) {
			if ($('#saveQueryUpdateInventory').is(':checked')) {
				$("#saveQueryUpdateInventory").click();
			}
			if ($('#saveQueryRunParameterFilter').is(':checked')) {
				$("#saveQueryRunParameterFilter").click();
			}
		}
	}
	function saveQueryUpdateInventoryChange() {
		if ($('#saveQueryUpdateInventory').is(':checked')) {
			if (!$('#saveQueryRunMainQuery').is(':checked')) {
				$("#saveQueryRunMainQuery").click();
			}
		}
	}
	function saveQueryRunParameterFilterChange() {
		if ($('#saveQueryRunParameterFilter').is(':checked')) {
			if (!$('#saveQueryRunMainQuery').is(':checked')) {
				$("#saveQueryRunMainQuery").click();
			}
		} else {
			if ($('#saveQueryAutoDownloadCSV').is(':checked')) {
				$("#saveQueryAutoDownloadCSV").click();
			}
		}
	}
	function saveQueryAutoDownloadCSVChange() {
		if ($('#saveQueryAutoDownloadCSV').is(':checked')) {
			if (!$('#saveQueryRunParameterFilter').is(':checked')) {
				$("#saveQueryRunParameterFilter").click();
			}
		}
	}

	function regenerateSavedQuery() {
		if (ns.parameters.linkedQuery !== "null") {

			// TODO: Set some sort of message that it is loaded
			var filters = ns.parameters.linkedQuery.split(";");
			for (var j = 0, len = filters.length; j < len; j++) {
				var split = filters[j].split("::");
				switch (split[0]) {
				case 'filterBbox':
					$("#bboxEnabledCheck").prop("checked", false);
					$("#bboxEnabledCheck").trigger('click');
					var filterBbox = split[1].split(",");
					$('#top').val(filterBbox[2]);
					$('#left').val(filterBbox[1]);
					$('#right').val(filterBbox[3]);
					$('#bottom').val(filterBbox[0]);
					break;
				case 'date':
					var date = split[1].split(",");
					$("#dateEnabledCheck").prop("checked", false);
					$("#dateEnabledCheck").trigger('click');
					$('#fromDate').val(date[0]);
					$('#toDate').val(date[1]);
					if (date.length === 4) {
						$("#timeEnabledCheck").prop("checked", false);
						$("#timeEnabledCheck").trigger('click');
						$('#fromTime').val(date[2]);
						$('#toTime').val(date[3]);
					}
					break;
				case 'attr':
					break;
				case 'depth':
					var depth = split[1].split(",");
					$("#depthEnabledCheck").prop("checked", false);
					$("#depthEnabledCheck").trigger('click');
					$('#depthMin').val(depth[0]);
					$('#depthMax').val(depth[1]);
					break;
				case 'months':
					$("#monthEnabledCheck").prop("checked", false);
					$("#monthEnabledCheck").trigger('click');
					var months = split[1].split(",");
					$('#fromMonth').val(months[0]);
					$('#toMonth').val(months[1]);
					break;
				case 'region':
					// TODO: ensure its loaded!
					$("#regionEnabledCheck").prop("checked", false);
					$("#regionEnabledCheck").trigger('click');
					$("#longhurstRegionSelected").val(split[1]);
					break;
				case 'cruise':
					$("#cruiseEnabledCheck").prop("checked", false);
					$("#cruiseEnabledCheck").trigger('click');
					$("#cruiseSelected").val(split[1]);
					break;
				case 'metaData':
					$("#metadataEnabledCheck").prop("checked", false);
					$("#metadataEnabledCheck").trigger('click');
					metaDataFromStore = split[1].split(",");
					if (initatedMetadata) {
						for (var i = 0, l = metaDataFromStore.length; i < l; i++) {
							$("#metadataTree").jstree("select_node",
									"#" + window.metaDataTable + "\\:" + metaDataFromStore[i]);
						}
					}
					break;
				case 'parameters':
					parametersFromQuery = split[1].split(",");
					for (var i = 0, l = parametersFromQuery.length; i < l; i++) {
						checkNodeInTree(parametersFromQuery[i], "#parametersTree");
					}
					break;
				case 'otherOptions':
					ns.savedOptions = split[1].split(",");
					break;
				default:
					break;
				}
			}
		}
	}

	function setUpCruiseSelector() {
		$("#cruiseSelectorDiv").html(
				ns.utilities.setUpSelectorArray(window.cruisesList, "cruiseSelected", "cruiseSelected"));
	}

	function setUpRegions() {
		var findRegions = "<a href='"
				+ "http://tomcat.nersc.no:8080/geoserver/greensad/wms?service=WMS&version=1.1.0&request=GetMap&layers=greensad:Longhurst_world_v4_2010&styles=&bbox=-180.00000000000003,-78.50015647884042,180.0,90.00000190734869&width=705&height=330&srs=EPSG:4326&format=application/openlayers'"
				+ " target='_new'>Use this link to find your region</a><br>";
		$("#regionList").html(
				findRegions
						+ ns.utilities.setUpSelector(window.longhurstRegions, "longhurstRegionSelected",
								"longhurstRegionSelected"));
		var my_options = $("#longhurstRegionSelected option");

		my_options.sort(function(a, b) {
			if (a.text > b.text)
				return 1;
			else if (a.text < b.text)
				return -1;
			else
				return 0;
		});

		$("#longhurstRegionSelected").empty().append(my_options);
	}

	function mainQueryButton() {
		// removing the parameterlayers from previous searches
		ns.mapViewer.removeAllParameterLayers();
		ns.mapViewer.removeBasicSearchLayer();
		ns.ajax.resetParameterDataSearch();
		ns.parametersQueryString = null;
		setHTMLLoadingMainQuery();

		var filterBbox = ns.query.createfilterBoxHashMap();
		if (document.lonlatform.updatemapcheck.checked) {
			ns.mapViewer.zoomToExtent(filterBbox, true);
		}
		var date = ns.query.createDateHashMap();
		var months = ns.query.createMonthArray();
		var depth = ns.query.createDepthHashMap();
		var region = ns.query.createRegionArray();
		var cruise = null;
		if (document.getElementById('cruiseEnabledCheck').checked) {
			cruise = $("#cruiseSelected").find(":selected").val();
			if (debugc)
				console.log("Cruise enabled:" + cruise);
		}
		// no attributes are currently supported
		var attr = null;
		var mainQueryArray = [];
		var mainQueryObject = {};
		if (filterBbox) {
			mainQueryArray.push("Bounding box:" + filterBbox);
			mainQueryObject.filterBbox = filterBbox;
		}
		if (date) {
			mainQueryArray.push("Date:" + date.dateString);
			mainQueryObject.date = date;
		}
		if (attr) {
			mainQueryArray.push("Attributes:" + attr);
			mainQueryObject.attr = attr;
		}
		if (depth) {
			mainQueryArray.push("Depth:" + depth.depthString);
			mainQueryObject.depth = depth;
		}
		if (months) {
			mainQueryArray.push("Months:" + months);
			mainQueryObject.months = months;
		}
		if (region) {
			mainQueryArray.push("Region:" + $("#longhurstRegionSelected").find(":selected").html());
			mainQueryObject.region = region;
		}
		if (cruise) {
			mainQueryArray.push("Cruise:" + $("#cruiseSelected").find(":selected").html());
			mainQueryObject.cruise = cruise;
		}

		var propertyName = [];
		// Adding the parameters to the array
		if (document.getElementById('metadataEnabledCheck').checked) {
			chosenMetaDataString = "Chosen Metadata:";
			ns.handleParameters.selectMetadata($("#metadataTree").jstree("get_checked", null, true));
			propertyName = [ window.geometryParameter ];
			mainQueryObject.metaData = [];
			$.each(ns.handleParameters.mainParameters.chosenMetadata, function(j, parameter) {
				propertyName.push(parameter);
				mainQueryObject.metaData.push(parameter);
				chosenMetaDataString += ns.handleParameters.getHeader(parameter, window.metaDataTable) + ", ";
			});
			mainQueryArray.push(chosenMetaDataString);
		} else {
			ns.handleParameters.resetMetadataSelection();
			propertyName = ns.handleParameters.mainParameters.parameters;
		}

		ns.mainQueryArray = mainQueryArray;
		ns.mainQueryObject = mainQueryObject;

		if (debugc)
			console.log("control.js: calling ns.query.constructFilterString()"); // TEST

		var filter = ns.query.constructFilterString(filterBbox, date, attr, depth, months, region, cruise);

		// GetFeature request with filter, callback handles result
		if (debugc)
			console.log("control.js: calling ns.WebFeatureService.getFeature()"); // TEST
		ns.WebFeatureService.getFeature({
			TYPENAME : metaDataTable,
			PROPERTYNAMES : propertyName,
			FILTER : filter
		}, function(response) {
			displayFeatures(response, filter);
		});

		if (debugc)
			console.log("control.js: calling ns.WebFeatureService.getPreviousRequestParameters()"); // TEST

		$("#featuresAndParams").show();
	}

	// non-public
	function displayFeatures(response, filter) {
		if (debugc)
			console.log("DisplayFeatures");
		// did an error occur?
		if (response.status !== 200) {
			// print error message and terminate
			ns.errorMessage.showErrorMessage(response.responseText);
			return;
		}
		// if response status is OK, parse result

		// **** output to table ****

		// $("#loadingText").html("<br>The data has been downloaded and is now
		// being processed.<br>Please wait for the data to finish loading...");

		var text = response.responseText;
		var jsonObject = JSON.parse(text);
		var length = jsonObject.features.length;
		// saving the data for merging
		basicData = jsonObject.features;
		replaceId(basicData);
		basicData = convertArrayToHashMap(basicData);
		data = $.extend(true, {}, basicData);

		if (length < 1) {
			$("#loadingText").html("");
			$("#list").html("No results found");
		} else {
			updateTreeInventoryNumbers();
			highLightFeaturesWMS(filter, metaDataTable, window.basicSearchName);
			var constructedTable = "<table id='mainQueryTable' class='table'></table>";

			// remove "loading..." text
			$("#loadingText").html("");

			$('#list').html(constructedTable);
			var aoColumns = ns.tableConstructor.generateAoColumns(data);
			var tableData = ns.tableConstructor.generateTableData(data);
			// TODO: could it be even more efficient now? This is the slow part
			// of the software
			$('#mainQueryTable').dataTable({
				"bDeferRender" : true,
				'aaSorting' : [],
				// "bProcessing" : true,
				"aaData" : tableData,
				"aoColumns" : aoColumns
			});
			$("#filterParameters").show();
			if (typeof ns.savedOptions !== "undefined") {
				var index = ns.savedOptions.indexOf("runParameterFilter");
				if (index !== -1) {
					filterParametersButton();
					ns.savedOptions.splice(index, 1);
				} else {
					ns.savedOptions = [];
				}
			}
		}
	}

	// view all parameters of a feature
	function filterParametersButton() {
		var allSelected = $("#parametersTree").jstree("get_checked", null, true);
		var selected = [];
		var parametersQueryString = "Selected parameters:";
		var parameterQueryArray = [];
		var delimiter = "";
		$.each(allSelected, function(i, val) {
			if (val.getAttribute("rel") !== "noBox") {
				var id = val.getAttribute("id");
				selected.push(id);
				parameterQueryArray.push(id);
				parametersQueryString += delimiter + ns.handleParameters.getHeaderFromRawData(id) + "";
				delimiter = ", ";
			}
		});

		if (debugc)
			console.log(selected);
		if (selected.length !== 0) {
			// removing the parameterlayers from previous searches
			ns.mapViewer.removeAllParameterLayers();
			ns.parametersQueryString = parametersQueryString;
			ns.parameterQueryArray = parameterQueryArray;
			setHTMLLoadingParameters();
			ns.handleParameters.selectParameters(selected, document.getElementById('qualityFlagsEnabledCheck').checked);

			// Resetting tablesToQuery between filters
			tablesToQuery = [];

			// Cloning in the data from the basic search
			data = $.extend(true, {}, basicData);
			if (debugc)
				console.log("Adding all selected tables to tablesSelected");

			// Adding all selected layers to tablesToQuery
			$.each(ns.handleParameters.chosenParameters.tablesSelected, function(i, table) {
				tablesToQuery.push(table);
			});
			// query the first layer
			queryLayer();

			// jump to the parameters tab
			$('#tabs').tabs("option", "active", 1);
		} else {
			ns.errorMessage.showErrorMessage("You need to select at least one parameter before filtering");
		}
	}

	function setHTMLInit() {

		// hide export option until we have something to export
		ns.mapLayers.updateHTML('init');
		$("#exportParametersDiv").hide();
		$("#filterParameters").hide();
		$("#statistics").hide();
		$("#timeSeriesDiv").hide();
		$("#propertiesPlotDiv").hide();
		$("#compareRasterButton").hide();

		$("#queryOptions").accordion({
			collapsible : true,
			active : false,
			heightStyle : "content"
		});
		$("#statsOptions").accordion({
			collapsible : true,
			active : false,
			heightStyle : "content"
		});
		$("#modelOptions").accordion({
			collapsible : true,
			active : false,
			heightStyle : "content"
		});
		$("#rasterLayersDiv").accordion({
			collapsible : true,
			active : false,
			heightStyle : "content"
		});

		$("#saveAccordionDiv").accordion({
			collapsible : true,
			active : false,
			heightStyle : "content"
		});

		// Make the tabs jquery-tabs
		$("#tabs").tabs();
	}

	function setHTMLLoadingMainQuery() {
		// set loading text and empty parameter HTML
		ns.mapLayers.updateHTML('mainSearch');
		$("#exportParametersDiv").hide();
		$("#featuresAndParams").hide();
		$("#loadingText").html("Loading data, please wait...");
		$("#list").html("");
		$("#parametersTable").html("");
		$("#statistics").hide();
		$("#timeSeriesDiv").hide();
		$("#propertiesPlotDiv").hide();
		$("#statisticsContainer").html("");
		$("#timeSeriesContainer").html("");
		$("#propertiesPlotContainer").html("");
		$("#matchVariable2").html("");
		$("#compareRasterButton").hide();
		$("#searchBeforeMatchup").html("You need to search for data in order to be able to do a matchup");
		$("#highchartsContainer").html("");
	}

	function setHTMLLoadingParameters() {
		ns.mapLayers.updateHTML('loadingParameters');
		$("#parametersTable").html("Loading parameters, please wait...");
		$("#statistics").hide();
		$("#timeSeriesDiv").hide();
		$("#propertiesPlotDiv").hide();
		$("#statisticsContainer").html("");
		$("#timeSeriesContainer").html("");
		$("#propertiesPlotContainer").html("");
		$("#matchVariable2").html("");
		$("#compareRasterButton").hide();
		$("#searchBeforeMatchup").html("You need to search for data in order to be able to do a matchup");
		$("#highchartsContainer").html("");
	}

	function setHTMLParametersLoaded() {
		ns.mapLayers.updateHTML('loadedParameters');

		$("#parametersTable").html(
				"Entries where the selected parameters are available<br>"
						+ "<table id='parametersResultTable' class='table'></table>");

		var aoColumns = ns.tableConstructor.generateAoColumns(data);
		var tableData = ns.tableConstructor.generateTableData(data);
		// TODO: performance! this is extremely slow!
		$("#parametersResultTable").dataTable({
			"bDeferRender" : true,
			'aaSorting' : [],
			"aaData" : tableData,
			"aoColumns" : aoColumns
		});

		ns.statistics.setUpTimeSeriesVariables();
		ns.statistics.setUpPropertiesPlotVariables();
		linkParametersExportButton();
		document.getElementById('exportParameter').disabled = false;
		$("#statistics").show();
		$("#timeSeriesDiv").show();
		$("#propertiesPlotDiv").show();
		$("#exportParametersDiv").show();
		ns.matchup.updateMatchupParameter();
	}

	function hasMainQueryObjectChanged() {
		if (ns.mainQueryObject == null)
			return true;
		var filterBbox = ns.query.createfilterBoxHashMap();
		if (filterBbox) {
			if (ns.mainQueryObject.filterBbox) {
				if (filterBbox.bottom !== ns.mainQueryObject.filterBbox.bottom)
					return true;
				if (filterBbox.left !== ns.mainQueryObject.filterBbox.left)
					return true;
				if (filterBbox.right !== ns.mainQueryObject.filterBbox.right)
					return true;
				if (filterBbox.top !== ns.mainQueryObject.filterBbox.top)
					return true;
			} else {
				return true;
			}
		} else if (ns.mainQueryObject.filterBbox)
			return true;

		var date = ns.query.createDateHashMap();
		if (date) {
			if (ns.mainQueryObject.date) {
				if (date.fromDate !== ns.mainQueryObject.date.fromDate)
					return true;
				if (date.toDate !== ns.mainQueryObject.date.toDate)
					return true;
				if (date.time !== ns.mainQueryObject.date.time)
					return true;
				if (date.fromTime !== ns.mainQueryObject.date.fromTime)
					return true;
				if (date.toTime !== ns.mainQueryObject.date.toTime)
					return true;
			} else {
				return true;
			}
		} else if (ns.mainQueryObject.date)
			return true;

		var depth = ns.query.createDepthHashMap();
		if (depth) {
			if (ns.mainQueryObject.depth) {
				if (depth.max !== ns.mainQueryObject.depth.max)
					return true;
				if (depth.min !== ns.mainQueryObject.depth.min)
					return true;
			} else {
				return true;
			}
		} else if (ns.mainQueryObject.depth) {
			return true;
		}

		var region = ns.query.createRegionArray();
		if (region) {
			if (ns.mainQueryObject.region) {
				if (region !== ns.mainQueryObject.region) {
					return true;
				}
			} else {
				return true;
			}
		} else {
			if (ns.mainQueryObject.region) {
				return true;
			}
		}

		var cruise = null;
		if (document.getElementById('cruiseEnabledCheck').checked) {
			cruise = $("#cruiseSelected").find(":selected").val();
		}
		if (cruise) {
			if (ns.mainQueryObject.cruise) {
				if (cruise !== ns.mainQueryObject.cruise)
					return true;
			} else
				return true;
		} else if (ns.mainQueryObject.cruise)
			return true;

		// TODO: does not handle metadata

		var months = ns.query.createMonthArray();
		if (months)
			if (ns.mainQueryObject.months) {
				if (!months.compare(ns.mainQueryObject.months))
					return true;
			} else
				return true;
		else if (ns.mainQueryObject.months)
			return true;
		return false;
	}

	function queryLayer() {
		if (hasMainQueryObjectChanged())
			ns.errorMessage
					.showErrorMessage("You seem to have changed the main query options since you ran the main query."
							+ " The filtering will happen with the options as they were when you last ran the main query.");
		var layer = tablesToQuery.pop();
		// Array with all parameters for the current layer
		var propertyName = [];
		var propertyNameNeed = [];

		// Add qualityFlags?
		var qf = document.getElementById('qualityFlagsEnabledCheck').checked;

		// Adding the parameters to the array
		$.each(ns.handleParameters.chosenParameters.parametersByTable[layer], function(j, parameter) {
			propertyName.push(parameter);
			propertyNameNeed.push(parameter);
			if (qf) {
				propertyName.push(parameter + qfPostFix);
			}
		});
		var filter = ns.query.constructParameterFilterString(propertyNameNeed, ns.mainQueryObject.depth,
				ns.mainQueryObject.filterBbox, ns.mainQueryObject.date, ns.mainQueryObject.months,
				ns.mainQueryObject.region, ns.mainQueryObject.cruise);
		// Requesting features from the first layer through an asynchronous
		// request and sending response to displayParameter
		ns.WebFeatureService.getFeature({
			TYPENAME : layer,
			PROPERTYNAMES : [ window.geometryParameter ].concat(propertyName),
			FILTER : filter,
		}, function(response) {
			displayParameter(response, layer, filter);
		});
	}

	// non-public
	function highLightFeaturesWMS(filter, layer, name) {
		ns.mapViewer.addLayerWMS(filter, layer, name);
	}

	function linkParametersExportButton() {
		ns.buttonEventHandlers.linkParametersExportButton(ns.fileCreation.createCSV, data,
				"data:text/csv;charset=utf-8", "Greenseas_Downloaded_Parameters.csv");
	}

	// display a parameter as a table
	// non-public
	function displayParameter(response, layer, filterIn) {
		highLightFeaturesWMS(filterIn, layer, ns.handleParameters.getTableHeader(layer));
		var responseAsJSON;
		if (debugc)
			console.log("qmeter: parameter=" + layer);// TEST
		try {
			responseAsJSON = JSON.parse(response.responseText);
		} catch (SyntaxError) {
			if (debugc)
				console.error("Could not parse response to parameter data request");
			return;
		}
		addData(responseAsJSON);
		if (tablesToQuery.length === 0) {
			if (debugc)
				console.log("tablesToQuery.length === 0");
			ns.mapViewer.addFeaturesFromData(data, "All parameters");
			setHTMLParametersLoaded();
			// save-options

			if (typeof ns.savedOptions !== "undefined") {
				index = ns.savedOptions.indexOf("autoDownloadCSV");
				if (index !== -1) {
					$("#exportParameter").click();
					ns.savedOptions.splice(index, 1);
				} else {
					ns.savedOptions = [];
				}
			}
		} else {
			queryLayer();
		}
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
		return (featureArray === null) ? null : featureArray[0];
	}

	// non-public
	function convertArrayToHashMap(inputArray) {
		if (debugc)
			console.log("convertArrayToHashMap");
		var output = {};
		$.each(inputArray, function(k, dataValue) {
			if ((typeof dataValue) !== 'function') {
				output[dataValue.id] = dataValue;
			}
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

		if (layer === null) {
			data = {};
			return;
		}

		if ($.isEmptyObject(data))
			return;

		var combined = [];
		// Add all combine filters for this layer to combined (val could be
		// "combined:temperature")
		$.each(ns.handleParameters.chosenParameters.combined, function(i, val) {
			if (window.combinedParameters[val].layer === layer) {
				combined.push(val);
			}
		});

		// Add qualityFlags?
		var qf = document.getElementById('qualityFlagsEnabledCheck').checked;
		// TODO: inconsistency if this changes between search and response

		var outPutParameters = ns.handleParameters.chosenParameters.allSelected;// parametersByTable[layer];

		if (debugc) {
			console.log(features);
			console.log(combined);
			console.log(outPutParameters);
		}
		var currentStations = {};
		console.log(1);
		// cruise_ID and station_ID will always need to be a part of metadata
		$.each(data, function(i, val) {
			var stationDOI = val.properties[metaDataTable + ":" + cruiseIDParameterName]
					+ val.properties[metaDataTable + ":" + stationIDParameterName];
			currentStations[stationDOI] = true;
		});
		console.log(2);
		console.log(basicData);
		// Go through all features from the response
		$.each(features, function(i, feature) {
			console.log(2.1 + ": " + feature.id);
			var stationDOI = basicData[feature.id].properties[metaDataTable + ":" + cruiseIDParameterName]
					+ basicData[feature.id].properties[metaDataTable + ":" + stationIDParameterName];
			//console.log(2.2);
			if (currentStations[stationDOI]) {
				// Go through all paramters from the current feature
				// and add them to newData if it matches with the other layers
				$.each(feature.properties, function(j, parameter) {
					if (outPutParameters.indexOf(layer + ":" + j) > -1) {
						if (typeof newData[feature.id] === 'undefined')
							newData[feature.id] = data[feature.id];
						if (typeof newData[feature.id] === 'undefined')
							newData[feature.id] = basicData[feature.id];
						newData[feature.id].properties[layer + ":" + j] = parameter;
						if (qf) {
							newData[feature.id].properties[layer + ":" + j + qfPostFix] = feature.properties[j
									+ qfPostFix];
						}
					}
				});
				// Go through all combined layers and check for a value
				// (only supported for prioritized atm)
				$.each(combined, function(j, comb) {
					if (combinedParameters[comb].method === "prioritized") {
						if (typeof newData[feature.id].properties[comb] !== 'undefined') {
							var val = null;
							var qfString = "";
							for (var k = 0, l = combinedParameters[comb].parameters.length; k < l; k++) {
								// TODO: this is not always a string
								// (should usually be a number
								// if the database is "correct")
								if (feature.properties[combinedParameters[comb].parameters[k]] !== null
										&& feature.properties[combinedParameters[comb].parameters[k]].trim() !== "") {
									val = feature.properties[combinedParameters[comb].parameters[k]];
									if (qf)
										qfString = feature.properties[combinedParameters[comb].parameters[k]
												+ qfPostFix];
									break;
								}
							}
							if (typeof newData[feature.id] === 'undefined')
								newData[feature.id] = data[feature.id];
							if (typeof newData[feature.id] === 'undefined')
								newData[feature.id] = basicData[feature.id];
							newData[feature.id].properties[comb] = val;
							if (qf)
								newData[feature.id].properties[comb + qfPostFix] = qfString;
						}
					} else {
						console.log("typeof newData[feature.id].properties[comb] === 'undefined'");
					}
				});
			}
		});
		console.log(3);
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

	var incomingRequests = 0;
	function updateTreeWithInventoryNumbers(response, length) {
		incomingRequests++;
		for ( var key in response) {
			if (response.hasOwnProperty(key)) {
				var element = $(document.getElementById(key));
				var numberOfFeatures = response[key];
				var newText = element.data("baseheader") + " [" + numberOfFeatures + "]";
				$("#parametersTree").jstree("set_text", element, newText);
			}
		}
		if (incomingRequests === length) {
			$("#loadTreeNumbersDiv").html("Loading of inventory numbers is complete");
		} else {
			var percentage = Math.round(incomingRequests * 100 / length);
			$("#loadTreeNumbersDiv").html("<b><i>Loaded " + percentage + "% of the parameters.</i></b>");
		}
	}

	function getParametersFromMulti(comb) {
		if (debugc)
			console.log("getParametersFromMulti:" + comb);
		var properties = [];
		var layer = null;
		if (window.combinedParameters[comb].method.indexOf("multi") === 0) {
			$.each(window.combinedParameters[comb].parameters, function(i, val) {
				var splitString = val.split(":");
				if (splitString[0] === "combined") {
					var tempProp = getParametersFromMulti(val);
					layer = tempProp.pop();
					properties = properties.concat(tempProp);
				} else {
					layer = splitString[0];
					properties.push(splitString[1]);
				}
			});
		} else {
			layer = window.combinedParameters[comb].layer;
			properties = window.combinedParameters[comb].parameters;
		}
		properties.push(layer);
		return properties;
	}

	function updateTreeInventoryNumbers() {
		var myTreeContainer = $.jstree._reference("#parametersTree").get_container();
		var allChildren = myTreeContainer.find("li");
		var requestData = [];
		var region = ns.mainQueryObject.region;
		if ((typeof ns.mainQueryObject.region !== 'undefined') && (ns.mainQueryObject.region !== null)) {
			region = 'gsadbcRegionFilterPlaceHolder';
		}
		$.each(allChildren, function(i, val) {
			if ((typeof window.combinedParameters[val.id] === "undefined")
					|| (window.combinedParameters[val.id].method !== "groupLayers")) {
				var splitString = val.id.split(":");
				var layer, propertyNames, par;
				if (splitString.length === 2) {
					par = splitString[1];
					if (splitString[0] === "combined") {
						if (window.combinedParameters[val.id].method.indexOf("multi") === 0) {
							propertyNames = getParametersFromMulti(val.id);
							layer = propertyNames.pop();
						} else {
							layer = window.combinedParameters[val.id].layer;
							propertyNames = window.combinedParameters[val.id].parameters;
						}
					} else {
						layer = splitString[0];
						propertyNames = [ splitString[1] ];
					}
				} else {
					par = null;
					layer = splitString[0];
					propertyNames = [];
					var mySubChildren = $(val).children().find("li");
					$.each(mySubChildren, function(j, val2) {
						var splitString2 = val2.id.split(":");
						if (splitString2.length === 2) {
							if (splitString2[0] !== "combined")
								propertyNames.push(splitString2[1]);
						}
					});
				}
				if (layer !== null) {
					var element = $(document.getElementById(val.id));
					var newText = element.data("baseheader");
					$("#parametersTree").jstree("set_text", element, newText);
					// Should optimize this, most of the above is not needed if
					// this is the case
					if ($('#updateParametersList').is(':checked')) {
						var id;
						if (par === null) {
							id = splitString[0];
						} else {
							id = splitString[0] + ":" + par;
						}
						requestData.push([
								layer,
								id,
								ns.query.constructParameterFilterString(propertyNames, ns.mainQueryObject.depth,
										ns.mainQueryObject.filterBbox, ns.mainQueryObject.date,
										ns.mainQueryObject.months, region, ns.mainQueryObject.cruise) ]);
					}
				}
			}
		});
		if (requestData.length !== 0) {
			incomingRequests = 0;
			if (region === 'gsadbcRegionFilterPlaceHolder') {
				ns.WebFeatureService.getUpdatedParameters(requestData, ns.query.constructString(ns.query
						.createRegionFilter(ns.mainQueryObject.region)));
			} else {
				ns.WebFeatureService.getUpdatedParameters(requestData);
			}
			$("#loadTreeNumbersDiv").html("<b><i>Loading inventory numbers, please wait...</i></b>");
		}
	}

	var initatedMetadata = false;
	var metaDataFromStore = null;
	function initiateMetadata(input) {
		for ( var table in allLayers) {
			if (allLayers.hasOwnProperty(table)) {
				ns.WebFeatureService.describeFeatureType({
					TYPENAME : table,
				}, function(response) {
					initiateParameters(response);
				});
			}
		}
		ns.handleParameters.initiateParameters(input);
		$("#metadataTree").html(ns.tableConstructor.metadataList());
		$("#metadataTree").jstree({
			"plugins" : [ "themes", "html_data", "checkbox", "ui" ],
			"themes" : {
				"theme" : "default",
				/*
				 * Specification of the style is not necessary - The loading of
				 * it is disabled in jstree - Liferay loads the css itself - see
				 * liferay-portlet.xml to change the theme
				 */
				"icons" : false
			},
		});
		$("#metadataTree").bind("select_node.jstree", function(event, data) {
			// `data.rslt.obj` is the jquery extended node that was clicked
			if ($("#metadataTree").jstree("is_checked", data.rslt.obj))
				$("#metadataTree").jstree("uncheck_node", data.rslt.obj);
			else
				$("#metadataTree").jstree("check_node", data.rslt.obj);
		});
		if (metaDataFromStore !== null) {
			for (var i = 0, l = metaDataFromStore.length; i < l; i++) {
				checkNodeInTree(window.metaDataTable + ":" + metaDataFromStore[i], "#metadataTree");
			}
		}
		initatedMetadata = true;
	}

	function checkNodeInTree(id, tree) {
		window.setTimeout(function() {
			$(tree).jstree("select_node", document.getElementById(id));
		}, 0);
	}

	function initiateParameters(input) {
		if (debugc) {
			console.log("Input values of initiateparameters");
		}
		if (input) {
			var table = ns.handleParameters.initiateParameters(input);
			allLayers[table] = true;
		}
		var html = ns.tableConstructor.parametersList();
		setupTree(html);
	}

	function setupTree(html) {
		$("#parametersTree").html(html);
		// init the parameters tree
		$("#parametersTree").jstree({
			"plugins" : [ "themes", "html_data", "checkbox", "ui", "search", "sort" ],
			"checkbox" : {
				"two_state" : true
			},
			"themes" : {
				"theme" : "default",
				/*
				 * Specification of the style is not necessary - The loading of
				 * it is disabled in jstree - Liferay loads the css itself - see
				 * liferay-portlet.xml to change the theme
				 */
				"icons" : false
			},
			"sort" : function(a, b) {
				var indexA = parseInt($(a).data("index"));
				var indexB = parseInt($(b).data("index"));
				if (indexA !== indexB)
					return indexA > indexB ? 1 : -1;
				else
					return this.get_text(a) > this.get_text(b) ? 1 : -1;
			}
		});
		// Toggle node when clicking the text.
		$("#parametersTree").bind("select_node.jstree", function(event, data) {
			if ($("#parametersTree").jstree("is_checked", data.rslt.obj))
				$("#parametersTree").jstree("uncheck_node", data.rslt.obj);
			else
				$("#parametersTree").jstree("check_node", data.rslt.obj);
		});
		$("#parametersTree").bind("loaded.jstree", function(event, data) {
			$(this).find('li[rel=noBox]').find('.jstree-checkbox:first').hide();
		});
		$('#treeSearchParameter').on('keypress', function(e) {
			var code = (e.keyCode ? e.keyCode : e.which);
			if (code === 13) {
				e.preventDefault();
				filterParametersTreeButton();
			}
		});

		if (parametersFromQuery != null) {
			for (var i = 0, l = parametersFromQuery.length; i < l; i++) {
				checkNodeInTree(parametersFromQuery[i], "#parametersTree");
			}
		}

		var countDown = Object.keys(allLayers).length;
		for ( var table in allLayers) {
			if (allLayers.hasOwnProperty(table)) {
				if (allLayers[table])
					countDown--;
				else
					break;
			}
		}
		if (countDown === 0) {
			allParametersInitiated();
		}

		// Wait 1 second for the tree to load and then create qtip-tooltips
		setTimeout(function() {
			$("#parametersTree [title]").qtip();
		}, 1000);
	}
	var parametersFromQuery = null;

	function allParametersInitiated() {
		if (typeof ns.savedOptions !== "undefined") {
			var index = ns.savedOptions.indexOf("updateInventory");
			if (index === -1) {
				$('#updateParametersList').prop('checked', false);
			} else {
				$('#updateParametersList').prop('checked', true);
				ns.savedOptions.splice(index, 1);
			}
			index = ns.savedOptions.indexOf("runMainQuery");
			if (index !== -1) {
				mainQueryButton();
				ns.savedOptions.splice(index, 1);
			} else {
				ns.savedOptions = [];
			}
		}
	}

	function compareRasterButton() {
		ns.matchup.compareRaster(data);
	}

	function addAParameterToData(values, parameter, timeTable, elevationTable) {
		$.each(data, function(id) {
			val = null;
			lat = null;
			lon = null;
			time = null;
			if (!(typeof values[id] === 'undefined')) {
				val = values[id].value;
				lat = values[id].lat;
				lon = values[id].lon;
			}
			data[id].properties["Model value for " + parameter] = val;
			data[id].properties["Model lat for " + parameter] = lat;
			data[id].properties["Model lon for " + parameter] = lon;
			data[id].properties["Model time for " + parameter] = Highcharts.dateFormat('%Y-%m-%d %H:%M',
					timeTable[data[id].matchedTime]);
			data[id].properties["Model elevation for " + parameter] = elevationTable[data[id].matchedElevation];
		});
		setHTMLParametersLoaded();
	}

	function initiateRasterDataButton() {
		ns.matchup.initiateRasterData();
	}

	function viewParameterNames(parameters) {
		ns.matchup.setUpCompareRasterDiv(parameters);
	}

	function calculateStatisticsButton() {
		ns.statistics.generateStatistics(data);
	}

	function toggleLayerButton() {
		ns.mapLayers.toggleLayerButton();
	}

	function addLayerButton() {
		ns.mapLayers.addWMSLayerSelector();
	}

	var lastSearchString = null;
	function filterParametersTreeButton() {
		var searchString = $("#treeSearchParameter").val();
		if (searchString !== lastSearchString) {
			console.log("filterParametersTreeButton");
			$("#parametersTree").jstree("clear_search");
			$("#parametersTree").jstree("search", searchString);
			lastSearchString = searchString;
			$("#parametersTree [title]").qtip({
				position : {
					corner : {
						target : 'bottomLeft',
						tooltip : 'bottomLeft'
					}
				}
			});
		}
	}

	function collapseAllButton() {
		$('#parametersTree').jstree('close_all');
	}
	function expandAllButton() {
		$('#parametersTree').jstree('open_all');
	}

	function toggleOrderPlanktonButton() {
		lastSearchString = null;
		// TODO: make the "2" seperate from this logic
		var multi = [ 0, 2 ];
		if ($('#toggleOrderPlanktonButton').val() === "Sort plankton by type") {
			multi = [ 1, 2 ];
			// $('#toggleOrderPlanktonButton').val("Sort plankton by element");
			// } else
			// if ($('#toggleOrderPlanktonButton').val()
			// == "Sort plankton by element") {
			// multi = [ 2 ];
			$('#toggleOrderPlanktonButton').val("Sort plankton by size");
		} else {
			$('#toggleOrderPlanktonButton').val("Sort plankton by type");
		}
		var html = ns.tableConstructor.parametersList(multi);
		setupTree(html);
	}

	function clearSelectionButton() {
		$("#parametersTree").jstree("uncheck_all");
	}

	function addTimeSeriesVariableButton() {
		ns.statistics.addTimeSeriesVariable();
	}

	function timeSeriesButton() {
		ns.statistics.generateTimeSeries(data);
	}

	function propertiesPlotButton() {
		ns.statistics.generatePropertiesPlot(data);
	}

	function activateBbox() {
		// first set to false, then trigger to true (to get correct behaviour)
		$("#bboxEnabledCheck").prop("checked", false);
		$("#bboxEnabledCheck").trigger('click');
	}

	function getData() {
		return data;
	}

	function saveQueryButton() {
		var query = "";
		if (ns.mainQueryObject == null) {
			ns.errorMessage
					.showErrorMessage("You seem to not have performed a query. Please do so before you can save it.");
			return;
		}
		if (hasMainQueryObjectChanged()) {
			ns.errorMessage
					.showErrorMessage("You seem to have changed the main query options since you ran the main query."
							+ " The last main query which was executed will be saved.");
		}
		var delimiter = "";
		var equalsSign = "::";
		// TODO: delimiter?
		for (filter in ns.mainQueryObject) {
			if (ns.mainQueryObject.hasOwnProperty(filter)) {
				var object = ns.mainQueryObject[filter];
				if (filter === 'date') {
					query += delimiter;
					query += filter + equalsSign + object.fromDate + ',' + object.toDate;
					if (object.time) {
						query += ',' + object.fromTime + ',' + object.toTime;
					}
				} else if (filter === 'depth') {
					query += delimiter + filter + equalsSign + object.min + ',' + object.max;
				} else if (filter === 'months') {
					query += delimiter + filter + equalsSign + object[0] + ',' + object[object.length - 1];
				} else {
					query += delimiter + filter + equalsSign + object;
				}
				delimiter = ';';
			}
		}
		var message = "";
		if (ns.parameterQueryArray !== null) {
			query += delimiter + "parameters" + equalsSign + ns.parameterQueryArray;
			delimiter = ';';
		}
		var otherOptions = "";
		var otherOptionsDelimiter = "";
		if ($("#saveQueryRunMainQuery").is(":checked")) {
			otherOptions += otherOptionsDelimiter + "runMainQuery";
			otherOptionsDelimiter = ",";
		}
		if ($("#saveQueryUpdateInventory").is(":checked")) {
			otherOptions += otherOptionsDelimiter + "updateInventory";
			otherOptionsDelimiter = ",";
		}
		if ($("#saveQueryRunParameterFilter").is(":checked")) {
			otherOptions += otherOptionsDelimiter + "runParameterFilter";
			otherOptionsDelimiter = ",";
		}
		if ($("#saveQueryAutoDownloadCSV").is(":checked")) {
			otherOptions += otherOptionsDelimiter + "autoDownloadCSV";
			otherOptionsDelimiter = ",";
		}
		if ($("#saveQueryDisableMap").is(":checked")) {
			otherOptions += otherOptionsDelimiter + "disableMap";
			otherOptionsDelimiter = ",";
		}
		if (otherOptions.length !== 0) {
			query += delimiter + "otherOptions" + equalsSign + otherOptions;
		}
		if (query.length === 0) {
			message = "<b>The query is empty!</b><br>";
		}
		// TODO: check if parameters are selected in case filter is not run and
		// throw a warning
		var url = ns.parameters.portletURL;
		if (query.length !== 0)
			url += "?query=" + encodeURIComponent(query);
		$("#saveContainer").html(message + "<a href='" + url + "'>" + url + "</a>");
	}

	function loadFileFromIDButton() {
		// TODO: move
		var statusElement = $("#loadFileFromIDMessage");
		if (statusElement.length === 0) {
			$("#loadFromFileIDDiv").append("<div id='loadFileFromIDMessage'></div>");
			statusElement = $("#loadFileFromIDMessage");
		}
		statusElement.html("Loading file...");
		ns.ajax.loadFileFromID($("#rasterUploadedFileID").val());
	}

	function downloadSelectedParInfoButton() {
		var allSelected = $("#parametersTree").jstree("get_checked", null, true);
		var separator = ";"
		var content = "\uFEFFsep=" + separator + "\nShort Header" + separator + "Long Header(units)" + separator
				+ "Description\n";
		for (var i = 0, l = allSelected.length; i < l; i++) {
			var split = allSelected[i].id.split(":");
			content += ns.handleParameters.getShortHeader(split[1], split[0]) + separator
					+ ns.handleParameters.getHeader(split[1], split[0]) + separator
					+ ns.handleParameters.getTooltip(split[1], split[0]) + "\n";
		}
		ns.utilities.downloadData(content, "data:text/csv;charset=utf-8", "GreenSeas-ParameterInfo.csv");
	}

	function createNetCDFUsingHOneButton() {
		ns.fileCreation.createNetCDFUsingHOne(data);
	}
	// public interface
	return {
		activateBbox : activateBbox,
		init : init,
		viewParameterNames : viewParameterNames,
		initiateParameters : initiateParameters,
		setLonLatInput : setLonLatInput,
		setBboxInputToCurrentMapExtent : setBboxInputToCurrentMapExtent,
		lonLatAnywhere : lonLatAnywhere,
		addAParameterToData : addAParameterToData,
		getData : getData,
		updateTreeWithInventoryNumbers : updateTreeWithInventoryNumbers,

		// Buttons
		saveQueryButton : saveQueryButton,
		loadFileFromIDButton : loadFileFromIDButton,
		mainQueryButton : mainQueryButton,
		filterParametersButton : filterParametersButton,
		linkParametersExportButton : linkParametersExportButton,
		propertiesPlotButton : propertiesPlotButton,
		initiateRasterDataButton : initiateRasterDataButton,
		compareRasterButton : compareRasterButton,
		filterParametersTreeButton : filterParametersTreeButton,
		addLayerButton : addLayerButton,
		toggleLayerButton : toggleLayerButton,
		timeSeriesButton : timeSeriesButton,
		addTimeSeriesVariableButton : addTimeSeriesVariableButton,
		calculateStatisticsButton : calculateStatisticsButton,
		collapseAllButton : collapseAllButton,
		expandAllButton : expandAllButton,
		toggleOrderPlanktonButton : toggleOrderPlanktonButton,
		clearSelectionButton : clearSelectionButton,
		downloadSelectedParInfoButton : downloadSelectedParInfoButton,

		createNetCDFUsingHOneButton : createNetCDFUsingHOneButton,
	};

}(jQuery, OpenLayers, myNamespace));
