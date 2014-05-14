var myNamespace = myNamespace || {};

var debugSt = false;// debug flag

myNamespace.statistics = (function($, ns) {

	function generateOneTimeSeriesData(variable, allData) {
		var tsData = [];
		$.each(allData, function(i, val) {
			/*
			 * if (debugc) console.log("Checking:"); if (debugc)
			 * console.log(val);
			 */
			if (val.properties[variable]) {
				var value = parseFloat(val.properties[variable]);
				// if (debugc)
				// console.log(value);
				if (value !== -999 && val.properties.date) {
					var dateArr = val.properties.date.split("-");
					if (dateArr.length === 3) {
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
							if (timeSplit.length === 3) {
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
							time : time,
							depth : val.properties[depthParameterName],
							lat : val.geometry.coordinates[0],
							lon : val.geometry.coordinates[1]
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

	function generateTimeSeriesData(allData) {
		var selectElements = $("select[name=timeSeriesVariable]");

		var variables = [];
		$.each(selectElements, function(i, val) {
			variables.push(val.value);
		});

		var data = [];

		$.each(variables, function(i, val) {
			data.push(generateOneTimeSeriesData(val, allData));
		});
		var colors = [ '#89A54E', '#4572A7', '#AA4643', '#D4C601', '#BA00CB', '#15E1C9' ];
		var opposite = [ false, true, true ];

		var tsData = {};
		var extraColors = [];
		for (var i = colors.length - 1, l = variables.length; i < l; i++) {
			extraColors.push(ns.utilities.getRandomColor());
		}
		tsData.series = [];
		$.each(variables, function(i, val) {
			var color = "#AAAAAA";
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
			var color = "#AAAAAA";
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

	function generatePropertiesPlot(allData) {
		var horizontalPar = $("#propertiesPlotVariable1").find(":selected").val();
		var verticalPar = $("#propertiesPlotVariable2").find(":selected").val();
		var ppData = generatePropertiesPlotData(horizontalPar, verticalPar, allData);
		console.log(ppData);
		$('#propertiesPlotContainer').highcharts(
				{
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
									+ this.point.lon + depth + '</b><br/>'
									+ ns.handleParameters.getHeaderFromRawData(horizontalPar) + ':' + this.x + '<br>'
									+ ns.handleParameters.getHeaderFromRawData(verticalPar) + ':' + this.y;
						}
					},
					series : [ {
						yAxis : 0,
						xAxis : 0,
						showInLegend : false,
						data : ppData,
						cropThreshold : 50000,
						animation : false
					} ]
				});
	}

	function generatePropertiesPlotData(horizontalPar, verticalPar, allData) {
		var ppData = [];
		$.each(allData, function(i, val) {
			if (val.properties[horizontalPar]) {
				var x = parseFloat(val.properties[horizontalPar]);
				// if (debugc)
				// console.log(value);
				if (x !== -999 && val.properties[verticalPar]) {
					if (val.properties[verticalPar]) {
						var y = parseFloat(val.properties[verticalPar]);
						if (y !== -999) {
							var properties = {
								// TODO: add time
								x : x,
								y : y,
								id : val.id,
								depth : val.properties[depthParameterName],
								lat : val.geometry.coordinates[0],
								lon : val.geometry.coordinates[1]
							};
							if (val.properties.date) {
								var dateArr = val.properties.date.split("-");
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
									if (val.properties.time) {
										var timeSplit = val.properties.time.split(":");
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
							ppData.push(properties);
						}
					}
				}
			}
		});
		return ppData;
	}

	function generateTimeSeries(allData) {
		if (ns.mainQueryObject.metaData)
			if (ns.mainQueryObject.metaData.indexOf("date") < 0) {
				ns.errorMessage
						.showErrorMessage("You need to select date amongst the metadata if you want to create a timeseries");
				return;
			}
		var tsData = generateTimeSeriesData(allData);
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
							var depth = "";
							if (!(typeof this.point.depth === "undefined"))
								depth = " Depth:" + this.point.depth;
							return '<b> ' + this.series.name + ' <br>ID:' + this.point.id + '<br>Lat:' + this.point.lat
									+ ' Long:' + this.point.lon + depth + '</b><br/>'
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

	function generateStatistics(data) {
		var statisticsTable = ns.tableConstructor.generateStatistics(data);
		$("#statisticsContainer").html(statisticsTable);
		$("#generalStatisticsTable").dataTable({
			// search functionality not needed for statistics table
			'bFilter' : false
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

	function addTimeSeriesVariable() {
		var selectElement = "<br><select name=\"timeSeriesVariable\">";
		var selectedParameters = ns.handleParameters.chosenParameters.allSelected;
		var options = "";
		$.each(selectedParameters, function(i, val) {
			options += "<option value=\"" + val + "\">" + ns.handleParameters.getHeaderFromRawData(val) + "</option>";
		});
		selectElement += options + "</select>";
		$("#timeSeriesVariableDiv").append(selectElement);
	}

	return {
		setUpTimeSeriesVariables : setUpTimeSeriesVariables,
		setUpPropertiesPlotVariables : setUpPropertiesPlotVariables,
		addTimeSeriesVariable : addTimeSeriesVariable,
		generateTimeSeries : generateTimeSeries,
		generatePropertiesPlot : generatePropertiesPlot,
		generateStatistics : generateStatistics
	};
}(jQuery, myNamespace));