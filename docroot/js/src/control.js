var myNamespace = myNamespace || {};

var debugc = false;// debug flag

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

		// hide export option until we have something to export
		$("#exportParametersDiv").hide();
		$("#filterParameters").hide();
		$("#statistics").hide();
		$("#timeSeriesDiv").hide();
		$("#propertiesPlotDiv").hide();
		$("#compareRasterButton").hide();

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

		// Make the tabs jquery-tabs
		$("#tabs").tabs();

		setUpRegions();
		ns.matchup.setUpUploadRaster();
		ns.matchup.setUpOPeNDAPSelector();
		ns.mapLayers.addWMSLayerSelector();
	}

	function setUpRegions() {
		var findRegions = "<a href='"
				+ "http://geonode.iwlearn.org/geoserver/geonode/wms?service=WMS&version=1.1.0&request=GetMap&layers=geonode:Longhurst_world_v4_2010&styles=&bbox=-180.0,-78.5001564788404,180.0,90.0000019073487&width=705&height=330&srs=EPSG:4326&format=application/openlayers'"
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

	function mainQueryButton() {
		// removing the parameterlayers from previous searches
		ns.mapViewer.removeAllParameterLayers();
		ns.mapViewer.removeBasicSearchLayer();
		$("#exportParametersDiv").hide();
		if (debugc)
			console.log("control.js: start of mainQueryButton()");// TEST
		// set loading text and empty parameter HTML
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

		var filterBbox = ns.query.createfilterBoxHashMap();
		var date = ns.query.createDateHashMap();
		var months = ns.query.createMonthArray();
		var depth = ns.query.createDepthHashMap();
		var region = ns.query.createRegionArray();

		var propertyName = [];
		// Adding the parameters to the array
		if (document.getElementById('metadataEnabledCheck').checked) {
			ns.handleParameters.selectMetadata($("#metadataTree").jstree("get_checked", null, true));
			propertyName = [ window.geometryParameter ];
			$.each(ns.handleParameters.mainParameters.chosenMetadata, function(j, parameter) {
				propertyName.push(parameter);
			});
		} else {
			ns.handleParameters.resetMetadataSelection();
			propertyName = ns.handleParameters.mainParameters.parameters;
		}

		// no attributes are currently supported
		var attr = null;

		if (debugc)
			console.log("control.js: calling ns.query.constructFilterString()"); // TEST

		var filter = ns.query.constructFilterString(filterBbox, date, attr, depth, months, region);

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
		if (response.status != 200) {
			// print error message and terminate
			ns.errorMessage.showErrorMessage(response.responseText);
			return;
		}
		// if response status is OK, parse result

		// **** output to table ****

		
//		$("#loadingText").html("<br>The data has been downloaded and is now being processed.<br>Please wait for the data to finish loading...");
		
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
		$.each(allSelected, function(i, val) {
			if (val.getAttribute("rel") != "noBox")
				selected.push(val.getAttribute("id"));
		});

		if (debugc)
			console.log(selected);
		if (selected.length != 0) {
			// removing the parameterlayers from previous searches
			ns.mapViewer.removeAllParameterLayers();
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
				// if (table != "combined")
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

	function queryLayer() {
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

		var depth = ns.query.createDepthHashMap();
		var region = ns.query.createRegionArray();
		var filterBbox = ns.query.createfilterBoxHashMap();
		var date = ns.query.createDateHashMap();
		var months = ns.query.createMonthArray();

		var filter = ns.query.constructParameterFilterString(propertyNameNeed, depth, filterBbox, date, months, region);
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
		if (tablesToQuery.length == 0) {
			if (debugc)
				console.log("tablesToQuery.length == 0");
			var constructedTable = ns.tableConstructor.parameterTable(data);

			$("#parametersTable").html(
					"Entries where the selected parameters are available<br>" + "<div class='scrollArea'>"
							+ constructedTable + "</div>");
			$("#statistics").show();
			setUpTimeSeriesVariables();
			$("#timeSeriesDiv").show();
			setUpPropertiesPlotVariables();
			$("#propertiesPlotDiv").show();

			$("#parametersResultTable").dataTable();
			linkParametersExportButton();
			ns.mapViewer.addFeaturesFromData(data, "All parameters");
			document.getElementById('exportParameter').disabled = false;
			$("#exportParametersDiv").show();
			myNamespace.matchup.updateMatchupParameter();
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

		var combined = [];
		// Add all combine filters for this layer to combined (val could be
		// "combined:temperature")
		$.each(ns.handleParameters.chosenParameters.combined, function(i, val) {
			if (window.combinedParameters[val].layer == layer) {
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
				if (window.combinedParameters[comb].method == "prioritized") {
					var val = null;
					var qfString = "";
					for ( var k = 0; k < window.combinedParameters[comb].parameters.length; k++) {
						if (feature.properties[window.combinedParameters[comb].parameters[k]] != null
								&& feature.properties[window.combinedParameters[comb].parameters[k]].trim() != "") {
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
						// if (debugc) {
						// console.log("Found and added:" + val);
						// }
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
		if (par == null) {
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
		if (window.combinedParameters[comb].method.indexOf("multi") == 0) {
			$.each(window.combinedParameters[comb].parameters, function(i, val) {
				var splitString = val.split(":");
				if (splitString[0] == "combined") {
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
		var filterBbox = ns.query.createfilterBoxHashMap();
		var date = ns.query.createDateHashMap();
		var months = ns.query.createMonthArray();
		var depth = ns.query.createDepthHashMap();
		var region = ns.query.createRegionArray();
		var myTreeContainer = $.jstree._reference("#parametersTree").get_container();
		var allChildren = myTreeContainer.find("li");
		$.each(allChildren, function(i, val) {
			if ((typeof window.combinedParameters[val.id] === "undefined")
					|| (window.combinedParameters[val.id].method != "groupLayers")) {
				var splitString = val.id.split(":");
				var layer, propertyNames, par;
				if (splitString.length == 2) {
					par = splitString[1];
					if (splitString[0] == "combined") {
						if (window.combinedParameters[val.id].method.indexOf("multi") == 0) {
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
						if (splitString2.length == 2) {
							if (splitString2[0] != "combined")
								propertyNames.push(splitString2[1]);
						}
					});
				}
				if (layer != null) {
					var element = $(document.getElementById(val.id));
					var newText = element.data("baseheader");
					$("#parametersTree").jstree("set_text", element, newText);
					ns.WebFeatureService.getFeature({
						TYPENAME : layer,
						FILTER : ns.query.constructParameterFilterString(propertyNames, depth, filterBbox, date,
								months, region),
						RESULTTYPE : "hits"
					}, function(response) {
						updateTreeWithInventoryNumbers(response, splitString[0], par);
					});
				}
			}
		});
	}

	function initiateMetadata(input) {
		for ( var table in allLayers) {
			ns.WebFeatureService.describeFeatureType({
				TYPENAME : table,
			}, function(response) {
				initiateParameters(response);
			});
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
				if (indexA != indexB)
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
			if (code == 13) {
				e.preventDefault();
				filterParametersTreeButton();
			}
		});
	}

	function compareRasterButton() {
		var rasterParameter = $("#matchVariable").find(":selected").val();
		if (rasterParameter == "NONE") {
			ns.errorMessage.showErrorMessage("You must choose a parameter from the raster");
			return;
		}
		if (debugc) {
			console.log("compareRasterButton for par:" + rasterParameter);
			console.log($("#matchVariable").find(":selected"));
		}
		var dataRequest = {};
		var useOpendap = Boolean(document.getElementById('opendapDataURLCheck').checked);
		dataRequest[portletNameSpace + 'requestType'] = "getDataValuesOf:" + rasterParameter;
		// TODO: ensure that these are selected and exists
		dataRequest[portletNameSpace + 'time'] = $("#timeMatchupVariable").find(":selected").val();
		dataRequest[portletNameSpace + 'elevation'] = $("#elevationMatchupVariable").find(":selected").val();
		$.each(data, function(i, val) {
			var point = {};
			var pos = val.geometry.coordinates;
			point["lat"] = pos[0];
			point["lon"] = pos[1];
			/*
			 * point[""]= val.date+";"+val.time+";"; point[""]= val.location;
			 */
			var id = val.id;
			dataRequest[portletNameSpace + id] = JSON.stringify(point);
		});
		if (useOpendap)
			dataRequest[portletNameSpace + 'opendapDataURL'] = $("#opendapDataURL").find(":selected").val();
		var values = ns.ajax.getDatavaluesFromRaster(dataRequest);
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

	function compareData(responseData) {
		var scatterData = [];
		var databaseVariable = $("#matchVariable2").find(":selected").val();
		if (Boolean(document.getElementById('updateComparedParameterInData').checked))
			addAParameterToData(responseData, $("#matchVariable").find(":selected").html());
		console.log(data);
		var minX, minY, maxX, maxY;
		$.each(responseData, function(i, val) {
			var databaseValue = parseFloat(data[i].properties[databaseVariable]);
			if (databaseValue != -999 && val.value != null) {
				val.value = parseFloat(val.value);
				scatterData.push([ val.value, databaseValue ]);
				if (!minX || minX > val.value)
					minX = val.value;
				if (!minY || minY > databaseValue)
					minY = databaseValue;
				if (!maxX || maxX < val.value)
					maxX = val.value;
				if (!maxY || maxY < databaseValue)
					maxY = databaseValue;
			}
		});
		minX = (minX - 0.5).toFixed();
		maxX = (maxX + 0.5).toFixed();
		minY = (minY - 0.5).toFixed();
		maxY = (maxY + 0.5).toFixed();
		var min = minX < minY ? minX : minY;
		var max = maxX > maxY ? maxX : maxY;
		min = parseFloat(min);
		max = parseFloat(max);

		if (debugc) {
			console.log("min/max:" + minX + "," + minY + "," + maxX + "," + maxY);

			console.log(responseData);
			console.log("scatterData:");
			var sd = "[";
			$.each(scatterData, function(i, d) {
				sd += "[" + d[0] + "," + d[1] + "],";
			});
			console.log(sd + "]");
		}
		// $(function() {
		$('#highchartsContainer').highcharts({
			chart : {
				zoomType : 'xy'
			},
			title : {
				text : 'Scatter plot'
			},
			xAxis : [ {
				min : min,
				max : max,
				title : {
					enabled : true,
					text : 'Model value'
				}
			}, ],
			yAxis : [ {
				min : min,
				max : max,
				title : {
					enabled : true,
					text : 'Database value'
				}
			}, ],
			series : [ {
				yAxis : 0,
				xAxis : 0,
				type : 'scatter',
				name : ns.handleParameters.getHeaderFromRawData(databaseVariable),
				data : scatterData,
				// cropThreshold : 20000,
				animation : false
			}, {
				showInLegend : false,
				yAxis : 0,
				xAxis : 0,
				type : 'line',
				name : 'X=Y',
				data : [ [ min, min ], [ max, max ] ],
				animation : false,
				marker : {
					enabled : false
				},
				states : {
					hover : {
						lineWidth : 0
					}
				},
				enableMouseTracking : false
			} ]
		});
		// });
	}

	function initiateRasterDataButton() {
		ns.matchup.initiateRasterData();
	}

	function viewParameterNames(parameters) {
		ns.matchup.setUpCompareRasterDiv(parameters);
	}

	function calculateStatisticsButton() {
		var statisticsTable = ns.tableConstructor.generateStatistics(data);
		$("#statisticsContainer").html(statisticsTable);
		$("#generalStatisticsTable").dataTable({
			// search functionality not needed for statistics table
			'bFilter' : false
		});
	}

	function generateOneTimeSeriesData(variable) {
		var tsData = [];
		$.each(data, function(i, val) {
			/*
			 * if (debugc) console.log("Checking:"); if (debugc)
			 * console.log(val);
			 */
			if (val.properties[variable]) {
				var value = parseFloat(val.properties[variable]);
				// if (debugc)
				// console.log(value);
				if (value != -999 && val.properties.date) {
					var dateArr = val.properties.date.split("-");
					if (dateArr.length == 3) {
						var year = parseInt(dateArr[0]);
						// Note that in JavaScript, months start at 0 for
						// January, 1 for February etc.
						var month = parseInt(dateArr[1]) - 1;
						var day = parseInt(dateArr[2].substring(0, dateArr[2].length));
						// Set to mid-day if no time is set
						var hours = 12, minutes = 0, seconds = 0;
						var time = false;
						if (val.properties.time) {
							var timeSplit = val.properties.time.split(":");
							if (timeSplit.length == 3) {
								hours = parseInt(timeSplit[0]);
								minutes = parseInt(timeSplit[1]);
								seconds = parseInt(timeSplit[2].substring(0, timeSplit[2].length));
								time = true;
							}
						}
						tsData.push({
							x : Date.UTC(year, month, day, hours, minutes, seconds),
							y : value,
							id : val.id,
							time : time
						});
					}
				}
			}
		});
		tsData.sort(function(a, b) {
			return (a.x - b.x);
		});
		return tsData;
	}

	function generateTimeSeriesData() {
		var selectElements = $("select[name=timeSeriesVariable]");

		var variables = [];
		$.each(selectElements, function(i, val) {
			variables.push(val.value);
		});

		var data = [];

		$.each(variables, function(i, val) {
			data.push(generateOneTimeSeriesData(val));
		});
		var colors = [ '#89A54E', '#4572A7', '#AA4643', '#D4C601', '#BA00CB', '#15E1C9' ];
		var opposite = [ false, true, true ];

		var tsData = {};
		var extraColors = [];
		for ( var i = colors.length - 1; i < variables.length; i++) {
			extraColors.push(ns.mapViewer.getRandomColor());
		}
		tsData.series = [];
		$.each(variables, function(i, val) {
			color = "#AAAAAA";
			if (i < colors.length)
				color = colors[i];
			else
				color = extraColors[i - colors.length];
			tsData.series.push({
				name : ns.handleParameters.getHeaderFromRawData(val),
				data : data[i],
				turboThreshold : 100000,
				yAxis : i,
				color : color
			});
		});
		tsData.yAxis = [];
		$.each(variables, function(i, val) {
			var opp = true;
			if (i < opposite.length)
				opp = opposite[i];
			color = "#AAAAAA";
			if (i < colors.length)
				color = colors[i];
			else
				color = extraColors[i - colors.length];
			tsData.yAxis.push({
				title : {
					text : ns.handleParameters.getHeaderFromRawData(val),
					style : {
						color : color
					}
				},
				labels : {
					style : {
						color : color
					}
				},
				opposite : opp
			});
		});
		return tsData;
	}

	function propertiesPlotButton() {
		var horizontalPar = $("#propertiesPlotVariable1").find(":selected").val();
		var verticalPar = $("#propertiesPlotVariable2").find(":selected").val();
		var ppData = generatePropertiesPlotData(horizontalPar, verticalPar);
		// $(function() {
		$('#propertiesPlotContainer').highcharts({
			chart : {
				type : 'scatter',
				zoomType : 'xy'
			},
			title : {
				text : 'Properties Plot'
			},
			xAxis : [ {
				title : {
					enabled : true,
					text : ns.handleParameters.getHeaderFromRawData(horizontalPar)
				}
			} ],
			yAxis : [ {
				title : {
					enabled : true,
					text : ns.handleParameters.getHeaderFromRawData(verticalPar)
				}
			} ],
			series : [ {
				yAxis : 0,
				xAxis : 0,
				showInLegend : false,
				data : ppData,
				// cropThreshold : 20000,
				animation : false
			} ]
		});
		// });
	}

	function generatePropertiesPlotData(horizontalPar, verticalPar) {
		var ppData = [];
		$.each(data, function(i, val) {
			if (val.properties[horizontalPar]) {
				var x = parseFloat(val.properties[horizontalPar]);
				// if (debugc)
				// console.log(value);
				if (x != -999 && val.properties[verticalPar]) {
					if (val.properties[verticalPar]) {
						var y = parseFloat(val.properties[verticalPar]);
						if (y != -999) {
							ppData.push(/*
										 * { x : x, y : y }
										 */[ x, y ]);
							// console.log("Added data:" + x + "," + y);
						}
					}
				}
			}
		});
		return ppData;
	}

	function timeSeriesButton() {
		var tsData = generateTimeSeriesData();
		$('#timeSeriesContainer').highcharts(
				{
					chart : {
						zoomType : 'x',
						type : 'line'
					},
					title : {
						text : 'Timeseries chart'
					},
					subtitle : {
						text : ''
					},
					xAxis : {
						type : 'datetime',
					},
					yAxis : tsData.yAxis,
					tooltip : {
						formatter : function() {
							var clock = "";
							if (this.point.time) {
								clock = " " + Highcharts.dateFormat("%H:%M:%S", this.x);
							}
							return '<b> ' + this.series.name + ' <br>ID:' + this.point.id + '</b><br/>'
									+ Highcharts.dateFormat('%Y-%m-%d', this.x) + clock + '<br>Value:' + this.y;
						}
					},
					legend : {
						layout : 'vertical',
						borderWidth : 0
					},

					series : tsData.series
				});
	}

	function setUpPropertiesPlotVariables() {
		var selectElement1 = "Horizontal Axis: <select id='propertiesPlotVariable1'>";
		var selectedParameters = ns.handleParameters.chosenParameters.allSelected;
		var options = "";
		$.each(selectedParameters, function(i, val) {
			options += "<option value=\"" + val + "\">" + ns.handleParameters.getHeaderFromRawData(val) + "</option>";
		});
		selectElement1 += options + "</select>";
		var selectElement2 = " Vertical Axis: <select id='propertiesPlotVariable2'>";
		options = "";
		$.each(selectedParameters, function(i, val) {
			options += "<option value=\"" + val + "\">" + ns.handleParameters.getHeaderFromRawData(val) + "</option>";
		});
		selectElement2 += options + "</select>";
		$("#propertiesPlotVariableDiv").html(selectElement1 + selectElement2);
	}

	function setUpTimeSeriesVariables() {
		var selectElement = "<select name=\"timeSeriesVariable\">";
		var selectedParameters = ns.handleParameters.chosenParameters.allSelected;
		var options = "";
		$.each(selectedParameters, function(i, val) {
			options += "<option value=\"" + val + "\">" + ns.handleParameters.getHeaderFromRawData(val) + "</option>";
		});
		selectElement += options + "</select>";
		$("#timeSeriesVariableDiv").html(selectElement);
	}

	function addTimeSeriesVariableButton() {
		var selectElement = "<br><select name=\"timeSeriesVariable\">";
		var selectedParameters = ns.handleParameters.chosenParameters.allSelected;
		var options = "";
		$.each(selectedParameters, function(i, val) {
			options += "<option value=\"" + val + "\">" + ns.handleParameters.getHeaderFromRawData(val) + "</option>";
		});
		selectElement += options + "</select>";
		$("#timeSeriesVariableDiv").append(selectElement);
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
		if (searchString != lastSearchString) {
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
		if ($('#toggleOrderPlanktonButton').val() == "Sort plankton by type") {
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

	// public interface
	return {
		addLayerButton : addLayerButton,
		toggleLayerButton : toggleLayerButton,
		addTimeSeriesVariableButton : addTimeSeriesVariableButton,
		timeSeriesButton : timeSeriesButton,
		init : init,
		calculateStatisticsButton : calculateStatisticsButton,
		viewParameterNames : viewParameterNames,
		initiateRasterDataButton : initiateRasterDataButton,
		compareData : compareData,
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
	};

}(jQuery, OpenLayers, myNamespace));
