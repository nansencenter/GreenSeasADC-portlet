var myNamespace = myNamespace || {};

var debugMl = true;// debug flag

myNamespace.mapLayers = (function(jQ, bH) {
	"use strict";

	var activeLayers = 0;
	function addWMSLayerSelector() {
		var URLs = {
			"NONE" : "Select layer",
			"http://thredds.nersc.no/thredds/wms/greenpath/Model/topaz" : "Topaz",
			"http://thredds.nersc.no/thredds/wms/greenpath/Model/cmcc_phosphate" : "CMCC Phosphate",
			"http://thredds.nersc.no/thredds/wms/greenpath/Model/cmcc_chla" : "CMCC Chlorophyll-a",
			"http://thredds.nersc.no/thredds/wms/greenpath/Model/cmcc_sea_ice" : "CMCC Sea Ice",
			"http://thredds.nersc.no/thredds/wms/greenpath/EO/PML/chlor_seawifs_Sep97_Dec10_360x180gt" : "PML Chlorophyll-a",
			"http://thredds.nersc.no/thredds/wms/greenpath/EO/PML/fmicro_seawifs_Sep97_Dec10_360x180gt" : "PML Fraction of Microphytoplankton",
			"http://thredds.nersc.no/thredds/wms/greenpath/EO/PML/fnano_seawifs_Sep97_Dec10_360x180gt" : "PML Fraction of Nanophytoplankton",
			"http://thredds.nersc.no/thredds/wms/greenpath/EO/PML/fpico_seawifs_Sep97_Dec10_360x180gt" : "PML Fraction of Picophytoplankton",
			"http://thredds.nersc.no/thredds/wms/greenpath/EO/PML/zeu_seawifs_zmld_soda_Sep97_Dec07_360x180gt" : "PML Ratio euphotic depth to mixed layer depth",
			"http://thredds.nersc.no/thredds/wms/greenpath/EO/PML/phenology_seawifs_98_07_360x180g" : "PML Phenology",
			"http://thredds.nersc.no/thredds/wms/greenpath/EO/PML/ssmicon" : "NERSC Arctic ice concentration maps from SSMI data based on the NORSEX algorithm",
		};

		var selectElement = setUpSelector(URLs, "mapLayersWMSURL" + activeLayers, activeLayers);
		var button = "<input type='button' id='toggleLayerButton" + activeLayers + "' name='" + activeLayers
				+ "' value='Update on map'/>";
		$("#layerURLSelectorContainer").append(button + selectElement);
		bH.change("#mapLayersWMSURL" + activeLayers, addWMSLayerVariableSelector);
		bH.callFromControl("#toggleLayerButton" + activeLayers, toggleLayerButton);
		$("#toggleLayerButton" + activeLayers).prop("disabled", true);
		activeLayers++;
	}

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

		var selectedOption = selectedElement.options[selectedElement.selectedIndex].value;
		if (debugMl) {
			console.log(selectedOption);
		}
		var html = "Loading variables, please wait...";
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
			setupVariableSelectorForWMSLayer(response, selectedElement);
		}, selectedOption);
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
		var obj = jQuery.parseJSON(response.responseText);
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
		var obj = jQuery.parseJSON(response.responseText);
		if (debugMl)
			console.log(obj);
		$("#colorscalerangeMin" + activeLayer).val(obj.min);
		$("#colorscalerangeMax" + activeLayer).val(obj.max);
	}

	function setUpTimeSelector(response, activeLayer) {
		var obj = jQuery.parseJSON(response.responseText);
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

	function updateMetaDataSelection(event) {
		var activeLayer = event.target.name;
		if (debugMl)
			console.log("updateMetaDataSelection");
		if (event.target.options[event.target.selectedIndex].value == "NONE") {
			$("#layerMetaData" + activeLayer).html("");
			return;
		}
		if ($('#colorscalerangeAuto' + activeLayer).is(":checked"))
			updateAutoRange(activeLayer);
		myNamespace.WebMapService.getMetadata(function(response) {
			setUpLayerMetaData(response, activeLayer);
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
		var layerAsText = $('#mapLayersWMSURL' + activeLayer).find(":selected").text();
		var variableAsText = $('#WMSLayerVariable' + activeLayer).find(":selected").text();
		var name = layerAsText + ":" + variableAsText;
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
		if (!(typeof $('#colorScaleLegend' + activeLayer) === 'undefined')) {
			$("#legend").append("<div id='colorScaleLegend" + activeLayer + "' class='colorScaleLegend'></div>");
		}

		var colorScaleLegendDiv = $('#colorScaleLegend' + activeLayer);
		var legend = "<img src='" + window.contextPath + "/images/legendGraphicV.png' alt='Color Scale'>";
		var isLogscale = (logscale == "true");
		console.log(isLogscale);
	    var minT = isLogscale ? Math.log(min) : min;
	    var maxT = isLogscale ? Math.log(max) : max;
		var third = (maxT - minT) / 3;
		var scaleOneThird = isLogscale ? Math.exp(minT + third) : minT + third;
		var scaleTwoThird = isLogscale ? Math.exp(minT + 2 * third) : minT + 2 * third;
		var minDiv = "<div id='scaleMin'>" + min.toPrecision(4) + "</div>";
		var oneThirdDiv = "<div id='scaleOneThird'>" + scaleOneThird.toPrecision(4) + "</div>";
		var nameDiv = "<div id='scaleName'>" + layerAsText + "<br>" + variableAsText + "</div>";
		var twoThirdDiv = "<div id='scaleTwoThird'>" + scaleTwoThird.toPrecision(4) + "</div>";
		var maxDiv = "<div id='scaleMax'>" + max.toPrecision(4) + "</div>";
		colorScaleLegendDiv.html(legend + maxDiv + twoThirdDiv + nameDiv + oneThirdDiv + minDiv);
		var elevation = $('#zAxisVariable' + activeLayer).find(":selected").val();
		var time = $('#timeVariable' + activeLayer).find(":selected").val();
		myNamespace.mapViewer.addWMSLayer(url, activeLayer, name, layer, colorscalerange, style, logscale, elevation,
				date + "T" + time);
		if (debugMl)
			console.log("Toggled layer");
	}

	// public interface
	return {
		setUpSelector : setUpSelector,
		addWMSLayerSelector : addWMSLayerSelector,
		toggleLayerButton : toggleLayerButton,
	};

}(jQuery, myNamespace.buttonEventHandlers));
