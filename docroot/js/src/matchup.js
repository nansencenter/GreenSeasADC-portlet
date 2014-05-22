var myNamespace = myNamespace || {};

var debugmu = false;// debug flag
myNamespace.matchup = (function($, ns) {
	"use strict";

	// True if a raster file has been uploaded
	var uploadedRaster = false;
	var uploadedFile = null;

	function setUpOPeNDAPSelector() {
		var selectElement = ns.utilities.setUpSelectorArray(window.openDAPURLs, "opendapDataURL");
		$("#opendapURLContainer").html(selectElement);
	}

	function updateMatchupParameter() {
		if (rasterDataIsInitiated && $("#matchVariable2").length === 0) {
			var options = generateOptionsFromAllSelectedParameters();
			$("#matchVariable2").html(options);
			if (!(typeof $("#searchBeforeMatchup") === 'undefined')) {
				$("#searchBeforeMatchup").html("");
			}
			$("#compareRasterButton").show();
		}
	}

	function initiateRasterData() {
		rasterDataIsInitiated = false;
		var useOpendap = Boolean(document.getElementById('opendapDataURLCheck').checked);
		var fileOptionEnabled = document.getElementById('fileOptionCheck').checked;
		if (!useOpendap) {
			if (!fileOptionEnabled) {
				ns.errorMessage.showErrorMessage("Either file or dataset options have to be turned on");
				return;
			} else if (!uploadedRaster) {
				ns.errorMessage.showErrorMessage("A file must be successfully uploaded first.");
				return;
			}
		} else if (fileOptionEnabled) {
			ns.errorMessage.showErrorMessage("Both file and dataset options are turned on. Please choose just one.");
			return;
		}
		$("#compareRaster").html("Loading raster, please wait...");
		var opendapDataURL = $("#opendapDataURL").find(":selected").val();
		ns.ajax.getLayersFromNetCDFFile(useOpendap, opendapDataURL, uploadedFile);
	}

	function setUpCompareRasterDiv(parameters) {
		rasterDataIsInitiated = false;
		timeInterpolationVariables = 0;
		var selectElement = "<h3>Raster variable</h3><select id=\"matchVariable\">";
		var options = "";
		var count = 0;
		$.each(parameters, function(key, val) {
			var variable = key;
			var variableName = val.trim();
			if (variableName === "")
				variableName = variable;
			options += "<option value=\"" + variable + "\">" + variableName + "</option>";
			count++;
		});
		if (count > 1) {
			options = "<option value='NONE'>Select variable</option>" + options;
		}
		selectElement += options + "</select>";
		selectElement += "<br><h3>Parameter from the search</h3><select id=\"matchVariable2\">";
		var selectedParameters = ns.handleParameters.chosenParameters.allSelected;
		options = generateOptionsFromAllSelectedParameters();
		selectElement += options + "</select>";

		selectElement += "<br><input type='checkbox'id='updateComparedParameterInData'/>"
				+ "Update the compared parameter to the data output "
				+ "(this will join the new parameter from the raster to the output in the search results-tab)";

		$("#compareRaster").html(selectElement);
		var searchBeforeMatchupText = "";
		if (selectedParameters.length !== 0) {
			$("#compareRasterButton").show();
		} else {
			searchBeforeMatchupText = "You need to search for data to be able to do a matchup";
		}
		$("#compareRaster").append("<div id='searchBeforeMatchup'>" + "<br><br>" + searchBeforeMatchupText + "</div>");
		if (count > 1)
			ns.buttonEventHandlers.change("#matchVariable", getMetaDimension);
		else {
			getMetaDimension();
		}
	}

	function getMetaDimension() {
		rasterDataIsInitiated = false;
		var loadingText = "Loading Time/Elevation, please wait...";
		if ($("#timeElevationText").length)
			$("#timeElevationText").html(loadingText);
		else
			$("#matchVariable").after("<div id='timeElevationText' style='display: inline'>" + loadingText + "</div>");
		$("#matchupTimeInterpolationDiv").remove();
		$("#matchupElevationInterpolationDiv").remove();
		var rasterParameter = $("#matchVariable").find(":selected").val();
		ns.ajax.getDimension(rasterParameter);
	}

	var timeInterpolationVariables = 0;
	function addNewSelection() {
		var selectionMethod = "<div id='timeMatchupVariableSelectionMethodDiv" + timeInterpolationVariables + "'>"
				+ ns.utilities.setUpSelectorArray([ {
					value : "month",
					name : "Month"
				}, {
					value : "year",
					name : "Year"
				}, /***********************************************************
					 * {value:"dayOfMonth",name:"Day of Month"} / ,{ value :
					 * "date", name : "Month+Day of Month" }, { value :
					 * "timeod", name : "Time of day" }, { value : "week", name :
					 * "Week" }
					 */
				], "timeMatchupVariableSelectionMethodVariable" + timeInterpolationVariables)
				+ ns.utilities.setUpSelectorArray([ {
					value : "exact",
					name : "Exact match"
				}, {
					value : "nearest",
					name : "Nearest match"
				} ], "timeMatchupVariableSelectionMethod" + timeInterpolationVariables) + "</div>";
		if (timeInterpolationVariables === 0) {
			var addNewMatchupParButton = "<input type='button' id='addNewMatchupParButton' value='Add' />";
			$("#matchupTimeInterpolationDiv").append(selectionMethod + addNewMatchupParButton);
			ns.buttonEventHandlers.callFromControl($("#addNewMatchupParButton"), addNewSelection);
		} else {
			var matchupTimeInterpolRemoveButton = $("#matchupTimeInterpolRemoveButton");
			if (matchupTimeInterpolRemoveButton.length !== 0)
				matchupTimeInterpolRemoveButton.remove();
			matchupTimeInterpolRemoveButton = "<input type='button' id='matchupTimeInterpolRemoveButton' value='Remove last' />";
			$("#timeMatchupVariableSelectionMethodDiv" + (timeInterpolationVariables - 1)).after(selectionMethod);
			$("#addNewMatchupParButton").after(matchupTimeInterpolRemoveButton);
			ns.buttonEventHandlers.callFromControl($("#matchupTimeInterpolRemoveButton"), removeLastVariable);
		}
		timeInterpolationVariables++;
	}

	function removeLastVariable() {
		if (timeInterpolationVariables > 1) {
			timeInterpolationVariables--;
			$("#timeMatchupVariableSelectionMethodDiv" + timeInterpolationVariables).remove();
			if (timeInterpolationVariables === 1)
				$("#matchupTimeInterpolRemoveButton").remove();
		}
	}
	var rasterDataIsInitiated = false;
	var allTimesFromRaster = null;
	var allElevationsFromRaster = null;
	function setUpParameterMetaSelector(parameters) {
		if (timeInterpolationVariables !== 0) {
			timeInterpolationVariables = 0;
			$("#matchupTimeInterpolationDiv").remove();
		}

		var selectElement = "Available time(s):<select id='timeMatchupVariable'>";
		var options = "";
		allTimesFromRaster = [];
		$.each(parameters.time, function(key, val) {
			options += "<option value=\"" + key + "\">" + val + "</option>";
			allTimesFromRaster.push(new Date(val));
		});
		selectElement += options + "</select>";
		if (typeof parameters.elevation !== 'undefined') {
			var selectionMethod = ns.utilities.setUpSelectorArray([ {
				value : "nearest",
				name : "Nearest match"
			}, {
				value : "exact",
				name : "Match all to the same elevation"
			} /*
				 * , { value : "custom", name : "Custom interpolation" }
				 */], "elevationMatchupVariableSelectionMethod");
			options = "";
			// TODO: something when count is 1(or 0) var count = 0;
			var units = parameters.elevation.units;
			delete parameters.elevation.units;
			allElevationsFromRaster = [];
			$.each(parameters.elevation, function(key, val) {
				options += "<option value=\"" + key + "\">" + val + "</option>";
				allElevationsFromRaster.push(parseFloat(val));
				// count++;
			});
			selectElement += "<div id='matchupElevationInterpolationDiv'><h6>Elevation interpolation</h6>"
					+ selectionMethod + "<br>Available Elevations (Units:" + units
					+ "):<select id='elevationMatchupVariable'>" + options + "</select></div>";

		} else {
			selectElement += "<div id='matchupElevationInterpolationDiv'>No elevation available.</div>";
		}
		$("#timeElevationText").remove();
		$("#matchVariable").after("<div id='matchupTimeInterpolationDiv'><h6>Time interpolation</h6></div>");
		addNewSelection();
		var lf = "<br>";
		$("#matchupTimeInterpolationDiv").append(lf + selectElement);
		rasterDataIsInitiated = true;
	}

	function generateOptionsFromAllSelectedParameters() {
		var selectedParameters = ns.handleParameters.chosenParameters.allSelected;
		var options = "";
		$.each(selectedParameters, function(i, val) {
			options += "<option value=\"" + val + "\">" + ns.handleParameters.getHeaderFromRawData(val) + "</option>";
		});
		return options;
	}
	function setUpUploadRaster() {
		var bar = $('#bar');
		var percent = $('#percent');
		var status = $('#status');
		// Make the upload raster function
		$('#uploadRasterForm')
				.ajaxForm(
						{
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

								if (xhr.status === 200) {
									uploadedFile = xhr.getResponseHeader("fileID");
									if (uploadedFile !== null) {
										$("#rasterUploadedFileID").val(uploadedFile);
										status
												.html("File uploaded succesfully. "
														+ "<br><em>Tip:Files uploaded are kept a short period (no exact timeout is set and it "
														+ "may dissapear at any time) and may during this period be reloaded without having to "
														+ "upload the file again. Copy the file ID from below and use it to load the file later "
														+ "on.</em>");
										var statusElement = $("#loadFileFromIDMessage");
										if (statusElement.length !== 0) {
											statusElement.html("");
										}
										uploadedRaster = true;
									} else {
										$("#rasterUploadedFileID").val("");
										status.html("Something went wrong in the file upload");
										uploadedRaster = false;
									}
								} else {
									$("#rasterUploadedFileID").val("");
									status.html("Something went wrong in the file upload");
									uploadedRaster = false;
								}
							}
						});
	}

	function loadFileFromID(responseData, fileID) {
		var statusElement = $("#loadFileFromIDMessage");
		if (statusElement.length === 0) {
			$("#loadFromFileIDDiv").append("<div id='loadFileFromIDMessage'></div>");
			statusElement = $("#loadFileFromIDMessage");
		}
		if (responseData.fileIDExists === true) {
			uploadedRaster = true;
			uploadedFile = fileID;
			statusElement.html("Loaded file succesfully");
		} else {
			statusElement.html("Could not find the file.");
		}
	}

	function matchDate(variable, date, dataPoint) {
		switch (variable) {
		case "month":
			if ((new Date(dataPoint.properties.date)).getMonth() === date.getMonth())
				return true;
			break;
		case "year":
			if ((new Date(dataPoint.properties.date)).getYear() === date.getYear())
				return true;
			break;
		case "dayOfMonth":
			if ((new Date(dataPoint.properties.date)).getUTCDate() === date.getUTCDate())
				return true;
			break;
		default:
			console.log("Method not defined:'" + variable + "':" + (typeof variable));
			break;
		}
		return false;
	}

	function generateTimeMatchTables() {
		var exact = [];
		var nearest = [];
		for (var i = 0; i < timeInterpolationVariables; i++) {
			var variable = $("#timeMatchupVariableSelectionMethodVariable" + i).find(":selected").val();
			var method = $("#timeMatchupVariableSelectionMethod" + i).find(":selected").val();
			switch (method) {
			case 'exact':
				exact.push(variable);
				break;
			case 'nearest':
				nearest.push(variable);
				break;

			default:
				break;
			}
		}
		return {
			exact : exact,
			nearest : nearest
		};
	}

	function compareDate(variable, date, dataPoint) {
		switch (variable) {
		case "month":
			return Math.abs((new Date(dataPoint.properties.date)).getMonth() - date.getMonth());
			break;
		case "year":
			return Math.abs((new Date(dataPoint.properties.date)).getYear() - date.getYear());
			break;
		case "dayOfMonth":
			return Math.abs((new Date(dataPoint.properties.date)).getUTCDate() - date.getUTCDate());
			break;
		default:
			console.log("Method not defined:'" + variable + "':" + (typeof variable));
			break;
		}
		return null;
	}

	function findTimeMatch(dataPoint, matchTables) {
		var exactLenght = matchTables.exact.length;
		var matches = [];
		// Start matching all variables with the first exact critera (if it
		// exists, else "all" matches)
		if (exactLenght > 0) {
			var variable = matchTables.exact[0];
			for (var i = 0, l = allTimesFromRaster.length; i < l; i++) {
				if (matchDate(variable, allTimesFromRaster[i], dataPoint))
					matches.push({
						index : i,
						date : allTimesFromRaster[i]
					});
			}
		} else {
			for (var i = 0, l = allTimesFromRaster.length; i < l; i++) {
				matches.push({
					index : i,
					date : allTimesFromRaster[i]
				});
			}
		}
		for (var i = 1; i < exactLenght; i++) {
			var newMatches = [];
			for (var j = 0, l2 = matches.length; j < l2; j++) {
				if (matchDate(matchTables.exact[i], matches[j].date, dataPoint))
					newMatches.push(matches[j]);
			}
			matches = newMatches;
		}
		// Find nearest index
		var exactLenght = matchTables.nearest.length;
		for (var i = 0; i < exactLenght; i++) {
			var newMatches = [];
			var nearest = null;
			for (var j = 0, l2 = matches.length; j < l2; j++) {
				var comparedValue = compareDate(matchTables.nearest[i], matches[j].date, dataPoint);
				// console.log([comparedValue,matchTables.nearest[i],
				// matches[j].date, dataPoint]);
				if (nearest === null || nearest > comparedValue) {
					nearest = comparedValue;
					newMatches = [ matches[j] ];
				} else if (nearest === comparedValue) {
					newMatches.push(matches[j]);

				}
			}
			matches = newMatches;
		}
		if (matches.length > 0)
			return matches[0].index;
		else
			return null;
	}

	function compareRaster(data) {
		var chart = $('#highchartsContainer').highcharts();
		if (typeof chart !== 'undefined')
			chart.destroy();
		var chart = $('#highchartsContainer').html("Loading chart...");

		var rasterParameter = $("#matchVariable").find(":selected").val();
		if (rasterParameter === "NONE") {
			ns.errorMessage.showErrorMessage("You must choose a parameter from the raster");
			return;
		}
		var dataRequest = {};
		var useOpendap = Boolean(document.getElementById('opendapDataURLCheck').checked);
		dataRequest[portletNameSpace + 'requestType'] = "getDataValuesOf:" + rasterParameter;
		if (ns.fileID !== null)
			dataRequest[portletNameSpace + 'fileID'] = ns.fileID;
		else if (ns.opendapDataURL !== null)
			dataRequest[portletNameSpace + 'opendapDataURL'] = ns.opendapDataURL;

		var timeMatchTables = generateTimeMatchTables();
		$.each(data, function(index, dataPoint) {
			var point = {};
			point.time = findTimeMatch(dataPoint, timeMatchTables);
			if (point.time !== null) {
				if (allElevationsFromRaster !== null) {
					if ($("#elevationMatchupVariableSelectionMethod").find(":selected").val() === "nearest") {
						var length = allElevationsFromRaster.length;
						if (allElevationsFromRaster.length > 0) {
							var value = parseFloat(dataPoint.properties[window.depthParameterName]);
							var closest = 0, closestValue = Math.abs(value - allElevationsFromRaster[0]);
							for (var i = 1; i < length; i++) {
								var thisValue = Math.abs(value - allElevationsFromRaster[i]);
								if (thisValue < closestValue) {
									closest = i;
									closestValue = thisValue;
								}
							}
							point.elevation = closest;
						} else {
							// only one elevation
							point.elevation = 0;
						}
					} else {
						if ($("#elevationMatchupVariableSelectionMethod").find(":selected").val() === "exact") {
							point.elevation = parseInt($("#elevationMatchupVariable").find(":selected").val());
						}
					}
				}
				var pos = dataPoint.geometry.coordinates;
				point.lat = pos[0];
				point.lon = pos[1];
				var id = dataPoint.id;
				if (typeof point.elevation !== 'undefined')
					dataPoint.matchedElevation = point.elevation;
				dataPoint.matchedTime = point.time;
				dataRequest[portletNameSpace + id] = JSON.stringify(point);
			}
		});
		if (useOpendap)
			dataRequest[portletNameSpace + 'opendapDataURL'] = $("#opendapDataURL").find(":selected").val();
		var values = ns.ajax.getDatavaluesFromRaster(dataRequest, data, compareData);
	}

	function compareData(responseData, data) {
		var scatterData = [];
		var databaseVariable = $("#matchVariable2").find(":selected").val();
		if (Boolean(document.getElementById('updateComparedParameterInData').checked))
			ns.control.addAParameterToData(responseData, $("#matchVariable").find(":selected").html(),
					allTimesFromRaster, allElevationsFromRaster);
		var minX, minY, maxX, maxY;
		var count = 0;
		$.each(responseData, function(i, val) {
			var databaseValue = parseFloat(data[i].properties[databaseVariable]);
			if (!isNaN(databaseValue) && databaseValue !== -999 && val.value !== null) {
				console.log("----------------");
				console.log(data[i]);
				console.log(val);
				val.value = parseFloat(val.value);
				var properties = {
					id : data[i].id,
					depth : data[i].properties[depthParameterName],
					lat : data[i].geometry.coordinates[0],
					lon : data[i].geometry.coordinates[1],
					rasterLat : val.lat,
					rasterLong : val.lon,
					x : val.value,
					y : databaseValue,
					matchedTime : allTimesFromRaster[data[i].matchedTime],
				};
				if (typeof data[i].matchedElevation !== 'undefined') {
					properties.matchedElevation = allElevationsFromRaster[data[i].matchedElevation];
				}
				if (data[i].properties.date) {
					var dateArr = data[i].properties.date.split("-");
					if (dateArr.length === 3) {
						var year = parseInt(dateArr[0]);
						// Note that in JavaScript, months start at
						// 0 for
						// January, 1 for February etc.
						var month = parseInt(dateArr[1]) - 1;
						var day = parseInt(dateArr[2].substring(0, dateArr[2].length));
						// Set to mid-day if no time is set
						var hours = 12, minutes = 0, seconds = 0;
						var time = false;
						if (data[i].properties.time) {
							var timeSplit = data[i].properties.time.split(":");
							if (timeSplit.length === 3) {
								hours = parseInt(timeSplit[0]);
								minutes = parseInt(timeSplit[1]);
								seconds = parseInt(timeSplit[2].substring(0, timeSplit[2].length));
								time = true;
							}
						}
						properties.time = time;
						properties.date = Date.UTC(year, month, day, hours, minutes, seconds);
					}
				}
				scatterData.push(properties);
				if (!minX || minX > val.value)
					minX = val.value;
				if (!minY || minY > databaseValue)
					minY = databaseValue;
				if (!maxX || maxX < val.value)
					maxX = val.value;
				if (!maxY || maxY < databaseValue)
					maxY = databaseValue;
				count++;
			}
		});
		minX = parseFloat((minX - 0.5).toFixed());
		maxX = parseFloat((maxX + 0.5).toFixed());
		minY = parseFloat((minY - 0.5).toFixed());
		maxY = parseFloat((maxY + 0.5).toFixed());
		var min = minX < minY ? minX : minY;
		var max = maxX > maxY ? maxX : maxY;
		// min = parseFloat(min);
		// max = parseFloat(max);

		if (debugmu) {
			console.log("min/max:" + minX + "," + minY + "," + maxX + "," + maxY + "->" + min + "," + max);
			console.log(responseData);
			console.log(scatterData);
		}
		console.log("Count:" + count);
		if (count > 0) {
			$('#highchartsContainer').highcharts(
					{
						chart : {
							zoomType : 'xy'
						},
						title : {
							text : 'Scatter plot'
						},
						xAxis : [ {
							min : minX,
							max : maxX,
							title : {
								enabled : true,
								text : 'Model value'
							}
						}, ],
						yAxis : [ {
							min : minY,
							max : maxY,
							title : {
								enabled : true,
								text : 'Database value'
							}
						}, ],
						tooltip : {
							formatter : function() {
								var time = "";
								if (!(typeof this.point.date === "undefined")) {
									time = " Time:" + Highcharts.dateFormat('%Y-%m-%d', this.point.date);
								}
								if (this.point.time) {
									time += " " + Highcharts.dateFormat("%H:%M", this.point.date);
								}
								var matchupTime = "Time:"
										+ Highcharts.dateFormat('%Y-%m-%d %H:%M', this.point.matchedTime);
								var matchupElevation = '';
								if (typeof this.point.matchedElevation !== 'undefined')
									matchupElevation += " Elevation:" + this.point.matchedElevation;
								var depth = "";
								if (!(typeof this.point.depth === "undefined"))
									depth = " Depth:" + this.point.depth;
								return '<b>Database</b><br>ID:' + this.point.id + time + '<br>Lat:' + this.point.lat
										+ ' Long:' + this.point.lon + depth + '<br>' + 'Value:' + this.y
										+ "<br><b>Raster</b><br>" + matchupTime + '<br>Lat:' + this.point.rasterLat
										+ ' Long:' + this.point.rasterLong + matchupElevation + '<br/>' + 'Value:'
										+ this.x;
							}
						},
						series : [ {
							yAxis : 0,
							xAxis : 0,
							type : 'scatter',
							name : ns.handleParameters.getHeaderFromRawData(databaseVariable),
							data : scatterData,
							turboThreshold : 50000,
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
		} else {
			$('#highchartsContainer').html("No data matched.")
		}
	}

	// public interface
	return {
		setUpParameterMetaSelector : setUpParameterMetaSelector,
		setUpUploadRaster : setUpUploadRaster,
		initiateRasterData : initiateRasterData,
		setUpCompareRasterDiv : setUpCompareRasterDiv,
		updateMatchupParameter : updateMatchupParameter,
		setUpOPeNDAPSelector : setUpOPeNDAPSelector,
		compareRaster : compareRaster,
		// compareData : compareData,
		generateOptionsFromAllSelectedParameters : generateOptionsFromAllSelectedParameters,
		loadFileFromID : loadFileFromID,
	};

}(jQuery, myNamespace));
