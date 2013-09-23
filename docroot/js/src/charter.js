var myNamespace = myNamespace || {};

myNamespace.Charter = (function(jQ, HC) {
	"use strict";

	var multiPlot = null, progressUpdater = null;

	function resetMultiPlot() {
		multiPlot = null;
	}

	// redo this entire function to new density style
	function densityPlot(temp, sal, computed, container) {

		var tempSeries = {
			name : "Temperature",
			data : dataFromFeature(temp.features),
			dashStyle : 'shortdot',
			type : 'spline',
			yAxis : 1
		}, salSeries = {
			name : "Salinity",
			data : dataFromFeature(sal.features),
			dashStyle : 'shortdot',
			type : 'spline',
			yAxis : 2
		}, computedSeries = {
			name : "Density",
			data : dataFromFeature(computed),
			type : 'spline',
			yAxis : 0
		};

		var yAxis = [ {
			reversed : false,
			title : {
				text : "Density"
			},
			labels : {
				formatter : function() {
					return this.value;
				}
			},
			lineWidth : 3
		}, {
			reversed : false,
			title : {
				text : "Temp"
			},
			labels : {
				formatter : function() {
					return this.value;
				}
			},
			lineWidth : 2
		}, {
			reversed : false,
			title : {
				text : "Salinity"
			},
			labels : {
				formatter : function() {
					return this.value;
				}
			},
			lineWidth : 2
		} ];

		var densityPlot = plotChart(container, [ computedSeries ], "Level",
				"Density", "Density by level", "spline", yAxis);

		// add remaining series, redraw
		densityPlot.addSeries(tempSeries, false, false);
		densityPlot.addSeries(salSeries, true, true);

	}

	function plotParameter(parameter, container, parameterTitle,
			parameterDescription) {

		plotChart(container, [ {
			name : parameterTitle,
			data : dataFromFeature(parameter.features)
		} ], "Level", parameterTitle, parameterDescription, "spline");
	}

	function addMultiPlotSeries(data, container, finalSize) {

		var series = {
			// all elements in a series share absnum, so pick any
			name : data[0].properties.absnum,
			data : dataFromFeature(data)
		};

		if (multiPlot) {// already created
			// don't redraw, don't animate
			multiPlot.addSeries(series, false, false);

		} else { // not created, so we create it now
			multiPlot = plotChart(container, [ series ], "Level",
					"Temperature", "Temperatures by level", "line");

			// initiate a progress bar
			jQ("#multiPlotProgress").progressbar({
				max : finalSize,
				value : 1
			});

			// update prog.bar every second
			progressUpdater = setInterval(function() {
				jQ("#multiPlotProgress").progressbar("value",
						multiPlot.series.length);
			}, 500);
		}

		// draw plot if all series are now loaded
		if (multiPlot.series.length === finalSize) {
			multiPlot.redraw();
			clearInterval(progressUpdater);
			jQ("#multiPlotProgress").progressbar("destroy");
		}
	}

	function plotChart(container, data, xAxis, yAxis, title, type, yAxisParam) {

		// see Highcharts documentation for information on plotting options
		return new HC.Chart({
			chart : {
				renderTo : container,
				type : type,
				width: jQ(container).width(),
				inverted : true,
				zoomType : "x",
				style : {
					margin : '0 auto'
				}
			},

			title : {
				text : title
			},

			credits : {
				enabled : false
			},

			xAxis : {
				reversed : true,
				title : {
					enabled : true,
					text : xAxis
				},
				labels : {
					formatter : function() {
						return this.value + 'm';
					}
				},
				maxPadding : 0.05,
				showLastLabel : true
			},
			yAxis : yAxisParam || {
				reversed : false,
				title : {
					text : yAxis
				},
				labels : {
					formatter : function() {
						return this.value;
					}
				},
				lineWidth : 2
			},
			legend : {
				enabled : true
			},
			tooltip : {
				formatter : function() {
					// put proper units on later
					return this.series.name + "<br>" + this.x + 'm: ' + this.y
							+ 'C';
				}
			},
			plotOptions : {
				spline : {
					marker : {
						enabled : false,
						states : {
							hover : {
								enabled : true,
								symbol : 'circle',
								radius : 5,
								lineWidth : 1
							}
						}
					}
				},
				line : {
					marker : {
						enabled : false
					}
				}
			},
			series : data
		});
	}

	function dataFromFeature(feature) {
		return jQ.map(feature, function(item, i) {
			return [ [ item.properties.level, item.properties.value ] ];
		});
	}

	// public interface
	return {
		plotParameter : plotParameter,
		resetMultiPlot : resetMultiPlot,
		addMultiPlotSeries : addMultiPlotSeries,
		densityPlot : densityPlot
	};

}(jQuery, Highcharts));
