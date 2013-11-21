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
	// True if a raster file has been uploaded
	var uploadedRaster = false;

	function init() {
		if (debugc) {
			console.log("control.js: starting init() method...");// TEST
		}
		tablesToQuery = [];
		data = null;
		basicData = null;
		// ns.ajax.doAjax();

		// hide export option until we have something to export
		$("#exportParametersDiv").hide();
		$("#filterParameters").hide();
		$("#statistics").hide();
		$("#timeSeriesDiv").hide();
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
		$("#modelOptions").accordion({
			collapsible : true,
			active : false,
			heightStyle : "content"
		});

		// Make the tabs jquery-tabs
		$("#tabs").tabs();

		var bar = $('#bar');
		var percent = $('#percent');
		var status = $('#status');
		// Make the upload raster function
		$('#uploadRasterForm').ajaxForm({
			beforeSend : function() {
				status.empty();
				var percentVal = '0%';
				bar.width(percentVal);
				percent.html(percentVal);
			},
			uploadProgress : function(event, position, total, percentComplete) {
				var percentVal = percentComplete + '%';
				bar.width(percentVal);
				percent.html(percentVal);
			},
			success : function() {
				var percentVal = '100%';
				bar.width(percentVal);
				percent.html(percentVal);
			},
			complete : function(xhr) {
				if (xhr.status == 200) {
					status.html("File uploaded succesfully");
					uploadedRaster = true;
				} else {
					status.html("Something went wrong in the file upload");
					uploadedRaster = false;
				}
			}
		});
		setUpOPeNDAPSelector();
		ns.mapLayers.addWMSLayerSelector();
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
		$("#statisticsContainer").html("");
		$("#timeSeriesContainer").html("");
		$("#matchVariable2").html("");
		$("#compareRasterButton").hide();
		$("#searchBeforeMatchup").html("You need to search for data in order to be able to do a matchup");
		$("#highchartsContainer").html("");

		var filterBbox = ns.query.createfilterBoxHashMap();
		var date = ns.query.createDateHashMap();
		var months = ns.query.createMonthArray();
		var depth = ns.query.createDepthHashMap();

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

		var filter = ns.query.constructFilterString(filterBbox, date, attr, depth, months);

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
		var jsonObject = JSON.parse(response.responseText);
		// saving the data for merging
		basicData = jsonObject.features;
		replaceId(basicData);
		data = convertArrayToHashMap($.extend(true, {}, basicData));

		var length = jsonObject.features.length;

		if (length < 1) {
			document.getElementById('list').innerHTML = "No results found.";
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
		if (document.getElementById('parametersEnabledCheck').checked) {
			// removing the parameterlayers from previous searches
			ns.mapViewer.removeAllParameterLayers();
			$("#parametersTable").html("Loading parameters..");
			$("#statistics").hide();
			$("#timeSeriesDiv").hide();
			$("#statisticsContainer").html("");
			$("#timeSeriesContainer").html("");
			$("#matchVariable2").html("");
			$("#compareRasterButton").hide();
			$("#searchBeforeMatchup").html("You need to search for data in order to be able to do a matchup");
			$("#highchartsContainer").html("");

			ns.handleParameters.selectParameters($("#parametersTree").jstree("get_checked", null, true), document
					.getElementById('qualityFlagsEnabledCheck').checked);

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

			// pop the first layer
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
			var filterBbox = ns.query.createfilterBoxHashMap();
			var date = ns.query.createDateHashMap();
			var months = ns.query.createMonthArray();

			var filter = ns.query.constructParameterFilterString(propertyNameNeed, depth, filterBbox, date, months);
			// Requesting features from the first layer through an asynchronous
			// request and sending response to displayParameter
			ns.WebFeatureService.getFeature({
				TYPENAME : layer,
				PROPERTYNAMES : [ window.geometryParameter ].concat(propertyName),
				FILTER : filter,
			}, function(response) {
				displayParameter(response, layer, filter);
			});

			// jump to the parameters tab
			$('#tabs').tabs("option", "active", 1);
		} else {
			ns.errorMessage
					.showErrorMessage("You need to enable parameters in the query and select parameters before filtering");
		}
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

			$("#parametersResultTable").dataTable();
			linkParametersExportButton();
			ns.mapViewer.addFeaturesFromData(data, "All parameters");
			document.getElementById('exportParameter').disabled = false;
			$("#exportParametersDiv").show();
			updateMatchupParameter();
		} else {
			var depth = ns.query.createDepthHashMap();
			var filterBbox = ns.query.createfilterBoxHashMap();
			var date = ns.query.createDateHashMap();
			var months = ns.query.createMonthArray();
			var layer = tablesToQuery.pop();
			var propertyName = [];
			var propertyNameNeed = [];
			// Add qualityFlags?
			var qf = document.getElementById('qualityFlagsEnabledCheck').checked;
			$.each(ns.handleParameters.chosenParameters.parametersByTable[layer], function(j, parameter) {
				propertyName.push(parameter);
				propertyNameNeed.push(parameter);
				if (qf) {
					propertyName.push(parameter + qfPostFix);
				}
			});

			var filter = ns.query.constructParameterFilterString(propertyNameNeed, depth, filterBbox, date, months);
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
		var numberOfFeatures = ns.XMLParser.getNumberOfFeatures(response);
		var newText = ns.handleParameters.getHeader(par, layer) + " [" + numberOfFeatures + "]";
		$("#parametersTree").jstree("set_text", $(document.getElementById(layer + ":" + par)), newText);
	}

	function updateTreeInventoryNumbers() {
		var filterBbox = ns.query.createfilterBoxHashMap();
		var date = ns.query.createDateHashMap();
		var months = ns.query.createMonthArray();
		var myTreeContainer = $.jstree._reference("#parametersTree").get_container();
		var allChildren = myTreeContainer.find("li");
		$.each(allChildren, function(i, val) {
			var splitString = val.id.split(":");
			if (splitString.length == 2) {
				var layer = splitString[0];
				ns.WebFeatureService.getFeature({
					TYPENAME : layer,
					PROPERTYNAME : splitString[1],
					FILTER : ns.query.constructParameterFilterString([ splitString[1] ], ns.query.createDepthHashMap(),
							filterBbox, date, months),
					RESULTTYPE : "hits"
				}, function(response) {
					updateTreeWithInventoryNumbers(response, splitString[1], splitString[0]);
				});
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
			"plugins" : [ "themes", "html_data", "checkbox" ],
			"themes" : {
				"theme" : "default",
				/*
				 * Specification of the style is not necessary - The loading of
				 * it is disabled in jstree - Liferay loads the css itself - see
				 * liferay-portlet.xml to change the theme
				 */
				"icons" : false
			}
		});
	}

	function initiateParameters(input) {
		if (debugc) {
			console.log("Input values of initiateparameters");
		}
		var table = ns.handleParameters.initiateParameters(input);
		allLayers[table] = true;
		$("#parametersTree").html(ns.tableConstructor.parametersList());
		// init the parameters tree
		$("#parametersTree").jstree({
			"plugins" : [ "themes", "html_data", "checkbox" ],
			"themes" : {
				"theme" : "default",
				/*
				 * Specification of the style is not necessary - The loading of
				 * it is disabled in jstree - Liferay loads the css itself - see
				 * liferay-portlet.xml to change the theme
				 */
				"icons" : false
			}
		});
	}

	function compareRasterButton() {
		if (debugc) {
			console.log("compareRasterButton for par:" + $("#matchVariable").find(":selected").val());
			console.log($("#matchVariable").find(":selected"));
		}
		var dataRequest = {};
		var useOpendap = Boolean(document.getElementById('opendapDataURLCheck').checked);
		dataRequest[portletNameSpace + 'requestType'] = "getDataValuesOf:"
				+ $("#matchVariable").find(":selected").val();
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
//		console.log("addAParameterToData:"+values+","+parameter);
//		console.log(values);
//		console.log(data);
		$.each(data, function(id) {
			val = null;
			if (!(typeof values[id] === 'undefined')){
				val = values[id];
			}
			data[id].properties[parameter] = val;
		});
//		console.log(data);
		var constructedTable = ns.tableConstructor.parameterTable(data);
//		console.log(constructedTable);
		$("#parametersTable").html(
				"Entries where the selected parameters are available<br>" + "<div class='scrollArea'>"
						+ constructedTable + "</div>");
		$("#parametersResultTable").dataTable();
//		console.log("addAParameterToData DONE");
	}

	function compareData(responseData) {
		var scatterData = [];
		var databaseVariable = $("#matchVariable2").find(":selected").val();
		if (Boolean(document.getElementById('updateComparedParameterInData').checked))
			addAParameterToData(responseData, $("#matchVariable").find(":selected").val());
		console.log(data);
		var minX, minY, maxX, maxY;
		$.each(responseData, function(i, val) {
			var databaseValue = parseFloat(data[i].properties[databaseVariable]);
			if (databaseValue != -999 && val != null) {
				val = parseFloat(val);
				scatterData.push([ val, databaseValue ]);
				if (!minX || minX > val)
					minX = val;
				if (!minY || minY > databaseValue)
					minY = databaseValue;
				if (!maxX || maxX < val)
					maxX = val;
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
		$(function() {
			$('#highchartsContainer').highcharts({
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
		});
	}

	function extractParameterNamesButton() {
		$("#compareRaster").html("");
		var useOpendap = Boolean(document.getElementById('opendapDataURLCheck').checked);
		if (!useOpendap)
			if (!document.getElementById('fileOptionCheck').checked) {
				ns.errorMessage.showErrorMessage("Either file or dataset options have to be turned on");
				return;
			} else if (!uploadedRaster) {
				ns.errorMessage.showErrorMessage("A file must be successfully uploaded first.");
				return;
			}
		var opendapDataURL = $("#opendapDataURL").find(":selected").val();
		ns.ajax.getLayersFromNetCDFFile(useOpendap, opendapDataURL);
	}

	function viewParameterNames(parameters) {
		if (debugc)
			console.log("Starting viewParameterNames");
		var list = "";
		$.each(parameters, function(i, val) {
			list += i + ":" + val + "<br>";
		});
		setUpCompareRasterDiv(parameters);
	}

	function setUpCompareRasterDiv(parameters) {
		var selectElement = "<select id=\"matchVariable\">";
		var options = "";
		$.each(parameters, function(key, val) {
			var variable = key.substring(0, key.indexOf("("));
			var variableName = val.trim();
			if (variableName == "")
				variableName = variable;
			options += "<option value=\"" + variable + "\">" + variableName + "</option>";
		});
		selectElement += options + "</select>";
		selectElement += "<select id=\"matchVariable2\">";
		var selectedParameters = ns.handleParameters.chosenParameters.allSelected;
		options = generateOptionsFromAllSelectedParameters();
		selectElement += options + "</select>";

		selectElement += "<br><input type='checkbox'id='updateComparedParameterInData'/>"
				+ "Update the compared parameter to the dataoutput "
				+ "(this will join the new parameter from the raster to the output in the parameters-tab)";

		if (selectedParameters.length != 0) {
			$("#compareRasterButton").show();
			$("#compareRaster").html(selectElement + "<div id='searchBeforeMatchup'></div>");
		} else
			$("#compareRaster")
					.html(
							selectElement
									+ "<div id='searchBeforeMatchup'>You need to search for data in order to be able to do a matchup</div>");
	}

	function generateOptionsFromAllSelectedParameters() {
		var selectedParameters = ns.handleParameters.chosenParameters.allSelected;
		options = "";
		$.each(selectedParameters, function(i, val) {
			options += "<option value=\"" + val + "\">" + ns.handleParameters.getHeaderFromRawData(val) + "</option>";
		});
		return options;
	}

	function updateMatchupParameter() {
		if (!(typeof $("#matchVariable2") === 'undefined')) {
			var options = generateOptionsFromAllSelectedParameters();
			$("#matchVariable2").html(options);
			if (!(typeof $("#searchBeforeMatchup") === 'undefined')) {
				$("#searchBeforeMatchup").html("");
			}
			$("#compareRasterButton").show();
		}
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

	function setUpOPeNDAPSelector() {
		var URLs = {
			"http://thredds.nersc.no/thredds/dodsC/greenpath/Model/topaz" : "Topaz",
			"http://thredds.nersc.no/thredds/dodsC/greenpath/Model/cmcc_phosphate" : "CMCC Phosphate",
			"http://thredds.nersc.no/thredds/dodsC/greenpath/Model/cmcc_chla" : "CMCC Chlorophyll-a",
			"http://thredds.nersc.no/thredds/dodsC/greenpath/Model/cmcc_sea_ice" : "CMCC Sea Ice",
			"http://thredds.nersc.no/thredds/dodsC/greenpath/EO/PML/chlor_seawifs_Sep97_Dec10_360x180gt" : "PML Chlorophyll-a",
			"http://thredds.nersc.no/thredds/dodsC/greenpath/EO/PML/fmicro_seawifs_Sep97_Dec10_360x180gt" : "PML Fraction of Microphytoplankton",
			"http://thredds.nersc.no/thredds/dodsC/greenpath/EO/PML/fnano_seawifs_Sep97_Dec10_360x180gt" : "PML Fraction of Nanophytoplankton",
			"http://thredds.nersc.no/thredds/dodsC/greenpath/EO/PML/fpico_seawifs_Sep97_Dec10_360x180gt" : "PML Fraction of Picophytoplankton",
			"http://thredds.nersc.no/thredds/dodsC/greenpath/EO/PML/zeu_seawifs_zmld_soda_Sep97_Dec07_360x180gt" : "PML Ratio euphotic depth to mixed layer depth",
			"http://thredds.nersc.no/thredds/dodsC/greenpath/EO/PML/ssmicon" : "ssmicon",
		};

		var selectElement = myNamespace.mapLayers.setUpSelector(URLs, "opendapDataURL");
		$("#opendapURLContainer").html(selectElement);
	}

	function addLayerButton() {
		ns.mapLayers.addWMSLayerSelector();
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
		extractParameterNamesButton : extractParameterNamesButton,
		compareData : compareData,
		compareRasterButton : compareRasterButton,
		initiateParameters : initiateParameters,
		setLonLatInput : setLonLatInput,
		mainQueryButton : mainQueryButton,
		filterParametersButton : filterParametersButton,
		setBboxInputToCurrentMapExtent : setBboxInputToCurrentMapExtent,
		lonLatAnywhere : lonLatAnywhere,
		linkParametersExportButton : linkParametersExportButton,
	};

}(jQuery, OpenLayers, myNamespace));
