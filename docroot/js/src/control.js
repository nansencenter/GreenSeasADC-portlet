var myNamespace = myNamespace || {};

var debugc = false;// debug flag

myNamespace.mainQueryArray = null;
myNamespace.mainQueryObject = null;
myNamespace.parametersQueryString = null;

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
		ns.mapLayers.addWMSLayerSelector();
	}

	function setUpCruiseSelector() {
		$("#cruiseSelectorDiv").html(
				ns.mapLayers.setUpSelectorArray(window.cruisesList, "cruiseSelected", "cruiseSelected"));
	}

	function setUpRegions() {
		var findRegions = "<a href='"
				+ "http://tomcat.nersc.no:8080/geoserver/greensad/wms?service=WMS&version=1.1.0&request=GetMap&layers=greensad:Longhurst_world_v4_2010&styles=&bbox=-180.00000000000003,-78.50015647884042,180.0,90.00000190734869&width=705&height=330&srs=EPSG:4326&format=application/openlayers'"
				+ " target='_new'>Use this link to find your region</a><br>";
		$("#regionList").html(
				findRegions
						+ ns.mapLayers.setUpSelector(window.longhurstRegions, "longhurstRegionSelected",
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

	var queryHasChanged = false;
	function mainQueryButton() {
		queryHasChanged = false;
		// removing the parameterlayers from previous searches
		ns.mapViewer.removeAllParameterLayers();
		ns.mapViewer.removeBasicSearchLayer();
		myNamespace.parametersQueryString = null;
		setHTMLLoadingMainQuery();

		var filterBbox = ns.query.createfilterBoxHashMap();
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

		myNamespace.mainQueryArray = mainQueryArray;
		myNamespace.mainQueryObject = mainQueryObject;

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
		data = convertArrayToHashMap($.extend(true, {}, basicData));

		if (length < 1) {
			$("#loadingText").html("");
			$("#list").html("No results found");
		} else {
			highLightFeaturesWMS(filter, metaDataTable, window.basicSearchName);
			updateTreeInventoryNumbers();
			var constructedTable = ns.tableConstructor.featureTable("filterTable", data);

			// remove "loading..." text
			$("#loadingText").html("");

			document.getElementById('list').innerHTML = "<div>" + constructedTable + "</div><br>";
			$('#filterTable').dataTable({
				'aaSorting' : []
			});
			$("#filterParameters").show();
		}
	}

	// view all parameters of a feature
	function filterParametersButton() {
		var allSelected = $("#parametersTree").jstree("get_checked", null, true);
		var selected = [];
		var parametersQueryString = "Selected parameters:";
		var delimiter = "";
		$.each(allSelected, function(i, val) {
			if (val.getAttribute("rel") !== "noBox") {
				var id = val.getAttribute("id");
				selected.push(id);
				parametersQueryString += delimiter + ns.handleParameters.getHeaderFromRawData(id) + "";
				delimiter = ", ";
			}
		});

		if (debugc)
			console.log(selected);
		if (selected.length !== 0) {
			// removing the parameterlayers from previous searches
			ns.mapViewer.removeAllParameterLayers();
			myNamespace.parametersQueryString = parametersQueryString;
			setHTMLLoadingParameters();
			ns.handleParameters.selectParameters(selected);

			// Resetting tablesToQuery between filters
			tablesToQuery = [];

			// Cloning in the data from the basic search
			data = convertArrayToHashMap($.extend(true, {}, basicData));
			if (debugc)
				console.log("Adding all selected tables to tablesSelected");

			// var foundCombine = false;
			// Adding all selected layers to tablesToQuery
			$.each(ns.handleParameters.chosenParameters.tablesSelected, function(i, table) {
				// if (table !== "combined")
				tablesToQuery.push(table);
				// else
				// foundCombine = true;
			});/*
				 * // Adding extra layers from combined to tablesToQuery: if
				 * (foundCombine)
				 * $.each(ns.handleParameters.chosenParameters.parametersByTable.combined,
				 * function(i, val) { var table =
				 * window.combinedParameters[val].layer; if (typeof
				 * tablesToQuery[table] === "undefined")
				 * tablesToQuery.push(table); });
				 */
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
		$("#exportParametersDiv").hide();
		$("#filterParameters").hide();
		$("#statistics").hide();
		$("#parameterLayerVariableContainer").hide();
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

		// Make the tabs jquery-tabs
		$("#tabs").tabs();
	}

	function setHTMLLoadingMainQuery() {
		// set loading text and empty parameter HTML
		$("#exportParametersDiv").hide();
		$("#featuresAndParams").hide();
		$("#loadingText").html("Loading data, please wait...");
		$("#list").html("");
		$("#parametersTable").html("");
		$("#statistics").hide();
		$("#parameterLayerVariableContainer").hide();
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
		var constructedTable = ns.tableConstructor.parameterTable(data);

		$("#parametersTable").html(
				"Entries where the selected parameters are available<br>" + "<div class='scrollArea'>"
						+ constructedTable + "</div>");
		ns.statistics.setUpTimeSeriesVariables();
		setUpParameterLayerVariables();
		ns.statistics.setUpPropertiesPlotVariables();

		$("#parametersResultTable").dataTable();
		linkParametersExportButton();
		document.getElementById('exportParameter').disabled = false;
		$("#statistics").show();
		$("#parameterLayerVariableContainer").show();
		$("#timeSeriesDiv").show();
		$("#propertiesPlotDiv").show();
		$("#exportParametersDiv").show();
		myNamespace.matchup.updateMatchupParameter();
	}

	function setHTMLLoadingParameters() {
		$("#parametersTable").html("Loading parameters, please wait...");
		$("#statistics").hide();
		$("#parameterLayerVariableContainer").hide();
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

	function hasMainQueryObjectChanged() {
		var filterBbox = ns.query.createfilterBoxHashMap();
		if (filterBbox) {
			if (myNamespace.mainQueryObject.filterBbox) {
				if (filterBbox.bottom !== myNamespace.mainQueryObject.filterBbox.bottom)
					return true;
				if (filterBbox.left !== myNamespace.mainQueryObject.filterBbox.left)
					return true;
				if (filterBbox.right !== myNamespace.mainQueryObject.filterBbox.right)
					return true;
				if (filterBbox.top !== myNamespace.mainQueryObject.filterBbox.top)
					return true;
			} else {
				return true;
			}
		} else if (myNamespace.mainQueryObject.filterBbox)
			return true;

		var date = ns.query.createDateHashMap();
		if (date) {
			if (myNamespace.mainQueryObject.date) {
				if (date.fromDate !== myNamespace.mainQueryObject.date.fromDate)
					return true;
				if (date.toDate !== myNamespace.mainQueryObject.date.toDate)
					return true;
				if (date.time !== myNamespace.mainQueryObject.date.time)
					return true;
				if (date.fromTime !== myNamespace.mainQueryObject.date.fromTime)
					return true;
				if (date.toTime !== myNamespace.mainQueryObject.date.toTime)
					return true;
			} else {
				return true;
			}
		} else if (myNamespace.mainQueryObject.date)
			return true;

		var depth = ns.query.createDepthHashMap();
		if (depth) {
			if (myNamespace.mainQueryObject.depth) {
				if (depth.max !== myNamespace.mainQueryObject.depth.max)
					return true;
				if (depth.min !== myNamespace.mainQueryObject.depth.min)
					return true;
			} else {
				return true;
			}
		} else if (myNamespace.mainQueryObject.depth)
			return true;

		var region = ns.query.createRegionArray();
		if (region) {
			if (myNamespace.mainQueryObject.region) {
				if (region !== myNamespace.mainQueryObject.region)
					return true;
			} else
				return true;
		} else if (myNamespace.mainQueryObject.region)
			return true;
		var cruise = null;
		if (document.getElementById('cruiseEnabledCheck').checked) {
			cruise = $("#cruiseSelected").find(":selected").val();
		}
		if (cruise) {
			if (myNamespace.mainQueryObject.cruise) {
				if (cruise !== myNamespace.mainQueryObject.cruise)
					return true;
			} else
				return true;
		} else if (myNamespace.mainQueryObject.cruise)
			return true;

		// TODO: does not handle metadata

		var months = ns.query.createMonthArray();
		if (months)
			if (myNamespace.mainQueryObject.months) {
				if (!months.compare(myNamespace.mainQueryObject.months))
					return true;
			} else
				return true;
		else if (myNamespace.mainQueryObject.months)
			return true;
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
		var filter = ns.query.constructParameterFilterString(propertyNameNeed, myNamespace.mainQueryObject.depth,
				myNamespace.mainQueryObject.filterBbox, myNamespace.mainQueryObject.date,
				myNamespace.mainQueryObject.months, myNamespace.mainQueryObject.region,
				myNamespace.mainQueryObject.cruise);
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

		var outPutParameters = ns.handleParameters.chosenParameters.parametersByTable[layer];

		if (debugc) {
			console.log(features);
			console.log(combined);
			console.log(outPutParameters);
		}
		$.each(features, function(i, feature) {
			$.each(feature.properties, function(j, parameter) {
				if (outPutParameters.indexOf(j) > -1) {
					if (feature.id in data) {
						newData[feature.id] = data[feature.id];
						newData[feature.id].properties[layer + ":" + j] = parameter;
						if (qf) {
							newData[feature.id].properties[layer + ":" + j + window.qfPostFix] = feature.properties[j
									+ window.qfPostFix];
						}
					}
				}
			});
			$.each(combined, function(j, comb) {
				// if (debugc) {
				// console.log("Checking:" + comb);
				// }
				if (window.combinedParameters[comb].method === "prioritized") {
					var val = null;
					var qfString = "";
					for ( var k = 0, l = window.combinedParameters[comb].parameters.length; k < l; k++) {
						if (feature.properties[window.combinedParameters[comb].parameters[k]] !== null
								&& feature.properties[window.combinedParameters[comb].parameters[k]].trim() !== "") {
							val = feature.properties[window.combinedParameters[comb].parameters[k]];
							if (qf)
								qfString = feature.properties[window.combinedParameters[comb].parameters[k]
										+ window.qfPostFix];
							break;
						}
					}
					if (feature.id in data) {
						newData[feature.id] = data[feature.id];
						newData[feature.id].properties[comb] = val;
						if (qf)
							newData[feature.id].properties[comb + window.qfPostFix] = qfString;
					}
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

	function updateTreeWithInventoryNumbers(response, layer, par) {
		var id;
		if (par === null) {
			id = layer;
		} else {
			id = layer + ":" + par;
		}
		var element = $(document.getElementById(id));
		var numberOfFeatures = ns.XMLParser.getNumberOfFeatures(response);
		var newText = element.data("baseheader") + " [" + numberOfFeatures + "]";
		$("#parametersTree").jstree("set_text", element, newText);
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
						ns.WebFeatureService.getFeature({
							TYPENAME : layer,
							FILTER : ns.query.constructParameterFilterString(propertyNames,
									myNamespace.mainQueryObject.depth, myNamespace.mainQueryObject.filterBbox,
									myNamespace.mainQueryObject.date, myNamespace.mainQueryObject.months,
									myNamespace.mainQueryObject.region, myNamespace.mainQueryObject.cruise),
							RESULTTYPE : "hits"
						}, function(response) {
							updateTreeWithInventoryNumbers(response, splitString[0], par);
						});
					}
				}
			}
		});
	}

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
		/*
		 * "types" : { "types" : { "layer" : { // Defining new type 'disabled'
		 * "check_node" : false, "uncheck_node" : false }, "default" : { //
		 * Override default functionality "check_node" : function(node) {
		 * $(node).children('ul').children('li').children('a').children('.jstree-checkbox').click();
		 * return true; }, "uncheck_node" : function(node) {
		 * $(node).children('ul').children('li').children('a').children('.jstree-checkbox').click();
		 * return true; } } } }
		 */
		});
		$("#metadataTree").bind("select_node.jstree", function(event, data) {
			// `data.rslt.obj` is the jquery extended node that was clicked
			if ($("#metadataTree").jstree("is_checked", data.rslt.obj))
				$("#metadataTree").jstree("uncheck_node", data.rslt.obj);
			else
				$("#metadataTree").jstree("check_node", data.rslt.obj);
			// if ($("#metadataTree").jstree("is_open", data.rslt.obj))
			// $("#metadataTree").jstree("close_node", data.rslt.obj);
			// else
			// $("#metadataTree").jstree("open_node", data.rslt.obj);
		});

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
			// `data.rslt.obj` is the jquery extended node that was clicked
			console.log(data.rslt.obj);
			if ($("#parametersTree").jstree("is_checked", data.rslt.obj))
				$("#parametersTree").jstree("uncheck_node", data.rslt.obj);
			else
				$("#parametersTree").jstree("check_node", data.rslt.obj);
			// if ($("#parametersTree").jstree("is_open", data.rslt.obj))
			// $("#parametersTree").jstree("close_node", data.rslt.obj);
			// else
			// $("#parametersTree").jstree("open_node", data.rslt.obj);
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
	}

	function compareRasterButton() {
		ns.matchup.compareRaster(data);
	}

	function addAParameterToData(values, parameter) {
		// console.log("addAParameterToData:"+values+","+parameter);
		// console.log(values);
		// console.log(data);
		$.each(data, function(id) {
			val = null;
			lat = null;
			lon = null;
			if (!(typeof values[id] === 'undefined')) {
				val = values[id].value;
				lat = values[id].lat;
				lon = values[id].lon;
			}
			data[id].properties[parameter] = val;
			data[id].properties["Model lat for " + parameter] = lat;
			data[id].properties["Model lon for " + parameter] = lon;
		});
		// console.log(data);
		var constructedTable = ns.tableConstructor.parameterTable(data);
		// console.log(constructedTable);
		$("#parametersTable").html(
				"Entries where the selected parameters are available<br>" + "<div class='scrollArea'>"
						+ constructedTable + "</div>");
		$("#parametersResultTable").dataTable();
		// console.log("addAParameterToData DONE");
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
		var multi = [ 0 ];
		if ($('#toggleOrderPlanktonButton').val() === "Sort plankton by type") {
			multi = [ 1 ];
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

	function setUpParameterLayerVariables() {
		var selectElement = "<select id=\"parameterLayerVariable\">";
		var selectedParameters = myNamespace.handleParameters.chosenParameters.allSelected;
		var options = myNamespace.matchup.generateOptionsFromAllSelectedParameters();
		selectElement += options + "</select>";
		$("#parameterLayerVariableDiv").html(selectElement);
	}

	function addParametersLayerButton() {
		var parameter = $("#parameterLayerVariable").find(":selected").val();
		ns.mapViewer.addFeaturesFromDataWithColor(data, parameter);
	}
	// public interface
	return {
		activateBbox : activateBbox,
		addLayerButton : addLayerButton,
		toggleLayerButton : toggleLayerButton,
		addTimeSeriesVariableButton : addTimeSeriesVariableButton,
		timeSeriesButton : timeSeriesButton,
		init : init,
		calculateStatisticsButton : calculateStatisticsButton,
		viewParameterNames : viewParameterNames,
		initiateRasterDataButton : initiateRasterDataButton,
		compareRasterButton : compareRasterButton,
		initiateParameters : initiateParameters,
		setLonLatInput : setLonLatInput,
		mainQueryButton : mainQueryButton,
		filterParametersButton : filterParametersButton,
		setBboxInputToCurrentMapExtent : setBboxInputToCurrentMapExtent,
		lonLatAnywhere : lonLatAnywhere,
		linkParametersExportButton : linkParametersExportButton,
		propertiesPlotButton : propertiesPlotButton,
		filterParametersTreeButton : filterParametersTreeButton,
		collapseAllButton : collapseAllButton,
		expandAllButton : expandAllButton,
		toggleOrderPlanktonButton : toggleOrderPlanktonButton,
		clearSelectionButton : clearSelectionButton,
		addAParameterToData : addAParameterToData,
		addParametersLayerButton : addParametersLayerButton,
	};

}(jQuery, OpenLayers, myNamespace));
