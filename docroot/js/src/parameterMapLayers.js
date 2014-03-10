var myNamespace = myNamespace || {};

var debugMl = false;// debug flag

myNamespace.mapLayers = (function($, bH) {
	"use strict";

	var activeLayers = 0;
	function addWMSLayerSelector() {
		var widthAvailable = document.getElementById("mapContainer").offsetWidth
				- document.getElementById("simple_map").offsetWidth;
		var maxLayers = 0;
		// if more than 10 layers, layer from 11th uses 61 pixels, not 57
		// (add 40 to make up for the first 10 layers using 4 pixels less)
		if (widthAvailable > 570)
			maxLayers = Math.floor((widthAvailable + 40) / 61);
		else
			maxLayers = Math.floor(widthAvailable / 57);
		if (activeLayers >= maxLayers) {
			myNamespace.errorMessage.showErrorMessage("Adding more than " + maxLayers
					+ " layers to the map might cause a display-problem with the legends, use with caution."
					+ " Possible solutions: Increase your window-size or zoom out (in the browser, not on the map).");
		}
		var selectElement = setUpSelectorArray(window.wmsLayers, "mapLayersWMSURL" + activeLayers, activeLayers);
		var button = "<input type='button' id='toggleLayerButton" + activeLayers + "' name='" + activeLayers
				+ "' value='Update on map'/>";
		$("#layerURLSelectorContainer").append("<br><h5>Raster " + activeLayers + "</h5>" + button + selectElement);
		bH.change("#mapLayersWMSURL" + activeLayers, addWMSLayerVariableSelector);
		bH.callFromControl("#toggleLayerButton" + activeLayers, toggleLayerButton);
		$("#toggleLayerButton" + activeLayers).prop("disabled", true);
		activeLayers++;
	}

	var whichWMSLayerVariableSelectorQueries = {};

	function addWMSLayerVariableSelector(event) {
		var activeLayer = event.target.name;
		if (debugMl) {
			console.log("addWMSLayerVariableSelector for " + activeLayer);
			console.log(event);
		}
		var selectedElement = event.target;
		if (selectedElement.options[selectedElement.selectedIndex].value == "NONE") {
			if (debugMl)
				console.log("No layer selected");
			$("#WMSLayerVariable" + activeLayer).html("");
			$("#layerMetaData" + activeLayer).html("");
			return;
		}
		var identifier = myNamespace.utilities.rand();
		whichWMSLayerVariableSelectorQueries[activeLayer] = identifier;
		var html = "Loading variables, please wait...";

		var selectedOption = selectedElement.options[selectedElement.selectedIndex].value;
		if (debugMl) {
			console.log(selectedOption);
		}
		if ($("#" + selectedElement.id + "variable" + activeLayer).length) {
			$("#" + selectedElement.id + "variable" + activeLayer).html(html);
		} else {
			if (debugMl)
				console.log("Setting value");
			$(selectedElement).after(
					"<div id ='" + selectedElement.id + "variable" + activeLayer + "' style='display: inline'>" + html
							+ "</div>");
		}
		myNamespace.WebMapService.getCapabilities(function(response) {
			if (identifier == whichWMSLayerVariableSelectorQueries[activeLayer]) {
				setupVariableSelectorForWMSLayer(response, selectedElement);
				if (debugMl)
					console.log("identifier:" + identifier + " matches stored value for element:" + activeLayer);
			} else if (debugMl)
				console.log("identifier:" + identifier + " is not equal to stored:"
						+ whichWMSLayerVariableSelectorQueries[activeLayer] + " for element:" + activeLayer);
		}, selectedOption);
	}

	function setUpSelectorArray(array, id, name) {
		name = "name='" + name + "'";
		var selectElement = "<select id='" + id + "' " + name + ">";
		var options = "";
		$.each(array, function(i, val) {
			options += "<option value=\"" + val.value + "\">" + val.name + "</option>";
		});
		selectElement += options + "</select>";
		return selectElement;
	}

	function setUpSelector(hashMap, id, name) {
		name = "name='" + name + "'";
		var selectElement = "<select id='" + id + "' " + name + ">";
		var options = "";
		$.each(hashMap, function(i, val) {
			options += "<option value=\"" + i + "\">" + val + "</option>";
		});
		selectElement += options + "</select>";
		return selectElement;
	}

	function setUpLayerMetaData(response, activeLayer) {
		if (debugMl)
			console.log("Setting up setUpLayerMetaData for:" + activeLayer + ":"
					+ $('#WMSLayerVariable' + activeLayer).find(":selected").val());
		if (debugMl)
			console.log(response);
		var obj = $.parseJSON(response.responseText);
		if (debugMl)
			console.log(obj);
		var units = "";
		if (!(typeof obj.units === 'undefined')) {
			units = "(Units:" + obj.units + ")";
			if (debugMl)
				console.log(units);
		}
		var zAxis = "";
		if (!(typeof obj.zaxis === 'undefined')) {
			if (!(typeof obj.zaxis.values === 'undefined')) {
				var unitsZ = "";
				if (!(typeof obj.zaxis.units === 'undefined')) {
					unitsZ = "(Units:" + obj.zaxis.units + ")";
				}
				zAxis = "Elevation" + unitsZ + ":";
				zAxisMap = {};
				$.each(obj.zaxis.values, function(i, val) {
					zAxisMap[val] = val;
				});
			}
			zAxis += setUpSelector(zAxisMap, "zAxisVariable" + activeLayer, activeLayer);
		}
		var tAxis = "";
		// time = "T00:00:00.000Z";
		// 2005-12-15T16%3A42%3A25.789Z
		if (!(typeof obj.datesWithData === 'undefined')) {
			var date;
			tAxisMap = {};
			$.each(obj.datesWithData, function(year, val) {
				$.each(val, function(month, days) {
					var monthInt = parseInt(month) + 1;
					$.each(days, function(i, day) {
						date = year + "-" + monthInt + "-" + day;
						tAxisMap[date] = date;
					});
				});
			});
			tAxis = setUpSelector(tAxisMap, "dateVariable" + activeLayer, activeLayer);
		}
		var colorscaleMin = 0;
		var colorscaleMax = 1;
		if (!(typeof obj.scaleRange === 'undefined')) {
			if (obj.scaleRange.length == 2) {
				colorscaleMin = obj.scaleRange[0];
				colorscaleMax = obj.scaleRange[1];
			}
		}
		var colorscalerange = "Colorscalerange " + units + "(Auto:<input type='checkbox' id='colorscalerangeAuto"
				+ activeLayer + "'/>)" + " from <input type='text' id='colorscalerangeMin" + activeLayer
				+ "' size='3' value='" + colorscaleMin + "'/>" + "to <input type='text' id='colorscalerangeMax"
				+ activeLayer + "' size='3' value='" + colorscaleMax + "'/>";
		var styles = {};
		$.each(obj.supportedStyles, function(i, val) {
			styles[val] = val;
		});
		var logscales = {
			"false" : "Linear Scale",
			"true" : "Logarithmic Scale",
		};
		// TOOD: disable logscale for colorscalerange with values <= 0
		var styleSelector = setUpSelector(styles, "styleVariable" + activeLayer, activeLayer);
		var logscaleSelector = setUpSelector(logscales, "logscaleVariable" + activeLayer, activeLayer);

		var html = colorscalerange + styleSelector + logscaleSelector + zAxis + tAxis;
		$("#layerMetaData" + activeLayer).html(html);
		bH.change("#colorscalerangeAuto" + activeLayer, function(event) {
			// console.log(this.checked);
			if (this.checked) {
				$("#colorscalerangeMin" + activeLayer).prop('disabled', true);
				$("#colorscalerangeMax" + activeLayer).prop('disabled', true);
				updateAutoRange(activeLayer);
			} else {
				$("#colorscalerangeMin" + activeLayer).prop('disabled', false);
				$("#colorscalerangeMax" + activeLayer).prop('disabled', false);
			}

		});
		bH.change("#dateVariable" + activeLayer, function(event) {
			var date = event.target.options[event.target.selectedIndex].value;
			myNamespace.WebMapService.getTimesteps(function(response) {
				setUpTimeSelector(response, activeLayer);
			}, $('#mapLayersWMSURL' + activeLayer).val(), $('#WMSLayerVariable' + activeLayer).find(":selected").val(),
					date);
		});
		$("#toggleLayerButton" + activeLayer).prop("disabled", false);
		$("#dateVariable" + activeLayer).trigger("change");
	}

	function updateAutoRange(activeLayer) {
		var date = $('#dateVariable' + activeLayer).find(":selected").val();
		var time = $('#timeVariable' + activeLayer).find(":selected").val();
		var dateTime = null;
		if ((!(typeof date === 'undefined')) && (!(typeof time === 'undefined')) && date != "" && time != "") {
			dateTime = date + "T" + time;
			myNamespace.WebMapService.getMinMax(function(response) {
				setUpAutoRange(response, activeLayer);
			}, $('#mapLayersWMSURL' + activeLayer).val(), $('#WMSLayerVariable' + activeLayer).find(":selected").val(),
					$('#zAxisVariable' + activeLayer).find(":selected").val(), dateTime);
		}
	}
	function setUpAutoRange(response, activeLayer) {
		if (debugMl)
			console.log("setUpAutoRange activeLayer:" + activeLayer);
		var obj = $.parseJSON(response.responseText);
		if (debugMl)
			console.log(obj);
		$("#colorscalerangeMin" + activeLayer).val(obj.min);
		$("#colorscalerangeMax" + activeLayer).val(obj.max);
	}

	function setUpTimeSelector(response, activeLayer) {
		var obj = $.parseJSON(response.responseText);
		var timeMap = {};
		$.each(obj.timesteps, function(i, time) {
			timeMap[time] = time;
		});
		var selectElement = setUpSelector(timeMap, "timeVariable" + activeLayer);
		$("#timeVariable" + activeLayer).remove();
		$("#dateVariable" + activeLayer).after(selectElement);
		if ($('#colorscalerangeAuto' + activeLayer).is(":checked"))
			updateAutoRange(activeLayer);
	}

	function setupVariableSelectorForWMSLayer(response, selectedElement) {

		var activeLayer = selectedElement.name;
		if (debugMl)
			console.log(selectedElement);
		if (debugMl)
			console.log("setupVariableSelectorForWMSLayer activeLayer:" + activeLayer);

		var variables = myNamespace.XMLParser.extractWMSParameters(response);
		var hashMap = {
			"NONE" : "Select variable",
		};
		$.each(variables, function(i, val) {
			hashMap[i] = val;
		});
		var selectElement = setUpSelector(hashMap, "WMSLayerVariable" + activeLayer, activeLayer);

		var html = selectElement + "<div id='layerMetaData" + activeLayer + "'></div>";
		$("#" + selectedElement.id + "variable" + activeLayer).html(html);
		bH.change("#WMSLayerVariable" + activeLayer, updateMetaDataSelection);
	}

	var whichupdateMetaDataSelection = {};

	function updateMetaDataSelection(event) {
		var activeLayer = event.target.name;
		if (debugMl)
			console.log("updateMetaDataSelection");
		if (event.target.options[event.target.selectedIndex].value == "NONE") {
			$("#layerMetaData" + activeLayer).html("");
			return;
		}
		var identifier = myNamespace.utilities.rand();
		whichupdateMetaDataSelection[activeLayer] = identifier;
		if ($('#colorscalerangeAuto' + activeLayer).is(":checked"))
			updateAutoRange(activeLayer);
		myNamespace.WebMapService.getMetadata(function(response) {
			if (identifier == whichupdateMetaDataSelection[activeLayer]) {
				setUpLayerMetaData(response, activeLayer);
			}
		}, $('#mapLayersWMSURL' + activeLayer).val(), $('#WMSLayerVariable' + activeLayer).find(":selected").val());
	}

	// TODO: The layer does not need a time variable - topaz sea floor depth
	function toggleLayerButton(event) {
		activeLayer = event.target.name;
		if (debugMl)
			console.log("Toggleing layer #" + activeLayer);
		var date = $('#dateVariable' + activeLayer).find(":selected").val();
		var url = $('#mapLayersWMSURL' + activeLayer).val();
		if (url == "NONE")
			return;
		var name = "Raster " + activeLayer;
		var layer = $('#WMSLayerVariable' + activeLayer).find(":selected").val();
		var min = $('#colorscalerangeMin' + activeLayer).val();
		var max = $('#colorscalerangeMax' + activeLayer).val();
		var colorscalerange = min + "," + max;
		min = parseFloat(min);
		max = parseFloat(max);
		var style = $('#styleVariable' + activeLayer).find(":selected").val();
		var logscale = $('#logscaleVariable' + activeLayer).find(":selected").val();
		if (debugMl)
			console.log("logscale:" + logscale);
		// Adding the colorscaleLegend
		if ($('#colorScaleLegend' + activeLayer).length == 0) {
			$("#legend").append("<div id='colorScaleLegend" + activeLayer + "' class='colorScaleLegend'></div>");
		}
		var colorScaleLegendDiv = $('#colorScaleLegend' + activeLayer);
		
		var layerAsText = $('#mapLayersWMSURL' + activeLayer).find(":selected").text();
		var variableAsText = $('#WMSLayerVariable' + activeLayer).find(":selected").text();
		var longName = layerAsText + ":" + variableAsText;
		
		// if not countour, then add logscale
		if (style == "contour")
			colorScaleLegendDiv.html("");
		else {
			var legend = "<img src='" + window.contextPath + "/images/legendGraphicV.png' alt='Color Scale'>";
			var isLogscale = (logscale == "true");
			// console.log(isLogscale);
			var minT = isLogscale ? Math.log(min) : min;
			var maxT = isLogscale ? Math.log(max) : max;
			var third = (maxT - minT) / 3;
			var scaleOneThird = isLogscale ? Math.exp(minT + third) : minT + third;
			var scaleTwoThird = isLogscale ? Math.exp(minT + 2 * third) : minT + 2 * third;
			var minDiv = "<div id='scaleMin'>" + parseFloat(min.toPrecision(3)).toExponential() + "</div>";
			var oneThirdDiv = "<div id='scaleOneThird'>" + parseFloat(scaleOneThird.toPrecision(3)).toExponential()
					+ "</div>";
			var nameDiv = "<div id='scaleName'>" + name + "</div>";
			var twoThirdDiv = "<div id='scaleTwoThird'>" + parseFloat(scaleTwoThird.toPrecision(3)).toExponential()
					+ "</div>";
			var maxDiv = "<div id='scaleMax'>" + parseFloat(max.toPrecision(3)).toExponential() + "</div>";
			colorScaleLegendDiv.html(legend + maxDiv + twoThirdDiv + nameDiv + oneThirdDiv + minDiv);
		}
		var elevation = $('#zAxisVariable' + activeLayer).find(":selected").val();
		var time = $('#timeVariable' + activeLayer).find(":selected").val();
		myNamespace.mapViewer.addWMSLayer(url, activeLayer, name, layer, colorscalerange, style, logscale, elevation,
				date + "T" + time,longName);
		if (debugMl)
			console.log("Toggled layer");
	}

	function setUpStyleForLegend() {
		var browser = myNamespace.utilities.findBrowser();
		// console.log("Browser:" + browser);
		var legend = $("#legend");
		if (browser == "Trident") {
			legend.css("display", [ "-ms-inline-flexbox" ]);
		} else if (browser == "Firefox") {
			legend.css("display", [ "inline-flex" ]);
		} else {
			legend.css("display", [ "-webkit-inline-box" ]);
		}
	}

	// public interface
	return {
		setUpSelector : setUpSelector,
		setUpSelectorArray : setUpSelectorArray,
		setUpStyleForLegend : setUpStyleForLegend,
		addWMSLayerSelector : addWMSLayerSelector,
		toggleLayerButton : toggleLayerButton,
	};

}(jQuery, myNamespace.buttonEventHandlers));
