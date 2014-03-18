var myNamespace = myNamespace || {};

var debugmu = false;// debug flag

myNamespace.matchup = (function($, ns) {
	"use strict";

	// True if a raster file has been uploaded
	var uploadedRaster = false;

	function setUpOPeNDAPSelector() {
		var selectElement = ns.utilities.setUpSelectorArray(window.openDAPURLs, "opendapDataURL");
		$("#opendapURLContainer").html(selectElement);
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

	function initiateRasterData() {
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
		ns.ajax.getLayersFromNetCDFFile(useOpendap, opendapDataURL);
	}

	function setUpCompareRasterDiv(parameters) {
		var selectElement = "Raster variable:<select id=\"matchVariable\">";
		var options = "<option value='NONE'>Select variable</option>";
		$.each(parameters, function(key, val) {
			var variable = key;
			var variableName = val.trim();
			if (variableName == "")
				variableName = variable;
			options += "<option value=\"" + variable + "\">" + variableName + "</option>";
		});
		selectElement += options + "</select>";
		selectElement += "<br>Parameter from the search:<select id=\"matchVariable2\">";
		var selectedParameters = ns.handleParameters.chosenParameters.allSelected;
		options = generateOptionsFromAllSelectedParameters();
		selectElement += options + "</select>";

		selectElement += "<br><input type='checkbox'id='updateComparedParameterInData'/>"
				+ "Update the compared parameter to the data output "
				+ "(this will join the new parameter from the raster to the output in the search results-tab)";

		$("#compareRaster").html(selectElement);
		ns.buttonEventHandlers.change("#matchVariable", getMetaDimension);
		var searchBeforeMatchupText = "";
		if (selectedParameters.length != 0) {
			$("#compareRasterButton").show();
		} else {
			searchBeforeMatchupText = "You need to search for data to be able to do a matchup";
		}
		$("#compareRaster").append("<div id='searchBeforeMatchup'>" + "<br><br>" + searchBeforeMatchupText + "</div>");
	}

	function getMetaDimension(event) {
		var loadingText = "Loading Time/Elevation, please wait...";
		if ($("#timeElevationText").length)
			$("#timeElevationText").html(loadingText);
		else
			$("#matchVariable").after("<div id='timeElevationText' style='display: inline'>" + loadingText + "</div>");
		$("#timeMatchupVariable").remove();
		$("#elevationText").remove();
		var rasterParameter = $("#matchVariable").find(":selected").val();
		ns.ajax.getDimension(rasterParameter);
	}

	function setUpParameterMetaSelector(parameters) {
		console.log(parameters);
		var selectElement = "<select id='timeMatchupVariable'>";
		var options = "";
		$.each(parameters.time, function(key, val) {
			options += "<option value=\"" + key + "\">" + val + "</option>";
		});
		selectElement += options + "</select>";
		if (!(typeof parameters.elevation === 'undefined')) {
			selectElement += "<div id='elevationText' style='display: inline'>Elevation (Units:"
					+ parameters.elevation.units + "):<select id='elevationMatchupVariable'></div>";
			delete parameters.elevation.units;
			options = "";
			$.each(parameters.elevation, function(key, val) {
				options += "<option value=\"" + key + "\">" + val + "</option>";
			});
			selectElement += options + "</select>";
		}
		$("#timeElevationText").remove();
		$("#matchVariable").after(selectElement);
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
	}

	function compareRaster(data) {
		var rasterParameter = $("#matchVariable").find(":selected").val();
		if (rasterParameter == "NONE") {
			ns.errorMessage.showErrorMessage("You must choose a parameter from the raster");
			return;
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
		var values = ns.ajax.getDatavaluesFromRaster(dataRequest, data);
	}

	function compareData(responseData, data) {
		var scatterData = [];
		var databaseVariable = $("#matchVariable2").find(":selected").val();
		if (Boolean(document.getElementById('updateComparedParameterInData').checked))
			ns.control.addAParameterToData(responseData, $("#matchVariable").find(":selected").html());
		var minX, minY, maxX, maxY;
		$.each(responseData, function(i, val) {
			var databaseValue = parseFloat(data[i].properties[databaseVariable]);
			if (databaseValue != -999 && val.value != null) {
				val.value = parseFloat(val.value);
				var properties = {
					id : data[i].id,
					depth : data[i].properties[depthParameterName],
					lat : data[i].geometry.coordinates[0],
					long : data[i].geometry.coordinates[1],
					rasterLat : val.lat,
					rasterLong : val.lon,
					x : val.value,
					y : databaseValue
				};
				if (data[i].properties.date) {
					var dateArr = data[i].properties.date.split("-");
					if (dateArr.length == 3) {
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
							if (timeSplit.length == 3) {
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
		$('#highchartsContainer').highcharts(
				{
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
					tooltip : {
						formatter : function() {
							var time = "";
							if (!(typeof this.point.date === "undefined")) {
								time = " Time:" + Highcharts.dateFormat('%Y-%m-%d', this.point.date);
							}
							if (this.point.time) {
								time += " " + Highcharts.dateFormat("%H:%M:%S", this.point.date);
							}
							var depth = "";
							if (!(typeof this.point.depth === "undefined"))
								depth = " Depth:" + this.point.depth;
							return 'ID:' + this.point.id + time + '<br>Lat:' + this.point.lat + ' Long:'
									+ this.point.long + depth + '<br>' + 'Database value:' + ':' + this.y
									+ '<br>Raster Lat:' + this.point.rasterLat + ' Raster Long:'
									+ this.point.rasterLong + '</b><br/>' + 'Raster value:' + ':' + this.x;
						}
					},
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
		compareData : compareData,
		generateOptionsFromAllSelectedParameters : generateOptionsFromAllSelectedParameters
	};

}(jQuery, myNamespace));
