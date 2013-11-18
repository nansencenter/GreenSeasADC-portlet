var myNamespace = myNamespace || {};

var debugMl = true;// debug flag

myNamespace.mapLayers = (function(jQ, bH) {
	"use strict";

	var activeLayers = 0;
	function addWMSLayerSelector() {
		var URLs = {
			"NONE" : "Select layer",
			"http://localhost:8081/thredds/wms/greenpath/Model/topaz" : "Topaz",
			"http://localhost:8081/thredds/wms/greenseasAllData/NACDAILY_2009_06.nc" : "Topaz NACDAILY_2009_06",
			"http://localhost:8081/thredds/wms/greenseasAllData/ssmicon20100830_test.nc" : "ssmicon20100830",
			"http://localhost:8081/thredds/wms/greenseasAllData/seawifs01_05_chl_8Day_360_180_test.nc" : "seawifs01_05_chl_8Day_360_180",
			"http://localhost:8081/thredds/wms/greenseasAllData/chl_seawifs_global_monthly_512x256_test.nc" : "chl_seawifs_global_monthly_512x256",
			"http://localhost:8081/thredds/wms/cmccModel/N1p_2000_2005_merged_mesh.nc" : "CMCC Phosphate"
		};

		var selectElement = setUpSelector(URLs, "mapLayersWMSURL" + activeLayers, activeLayers);
		var button = "<input type='button' id='toggleLayerButton" + activeLayers + "' name='" + activeLayers
				+ "' value='Update layer' />";
		$("#layerURLSelectorContainer").append(button + selectElement);
		bH.change("#mapLayersWMSURL" + activeLayers, addWMSLayerVariableSelector);
		bH.callFromControl("#toggleLayerButton" + activeLayers, toggleLayerButton);
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
		}
		var zAxis = "";
		if (!(typeof obj.zaxis === 'undefined')) {
			if (!(typeof obj.zaxis.values === 'undefined')) {
				var units = "";
				if (!(typeof obj.zaxis.units === 'undefined')) {
					units = "(Units:" + obj.zaxis.units + ")";
				}
				zAxis = "Elevation" + units + ":";
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
			tAxisMap = {
				"NONE" : "Select date",
			};
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
		var colorscalerange = "Colorscalerange " + units + "(Auto:<input type='checkbox' id='colorscalerangeAuto"
				+ activeLayer + "'/>)" + " from <input type='text' id='colorscalerangeMin" + activeLayer
				+ "' size='3' value='0'/>" + "to <input type='text' id='colorscalerangeMax" + activeLayer
				+ "' size='3' value='1'/>";
		var styles = {
			"boxfill" : "Boxfill",
			"contour" : "Contour",
		};
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
			if (date != "NONE") {
				myNamespace.WebMapService.getTimesteps(function(response) {
					setUpTimeSelector(response, activeLayer);
				}, $('#mapLayersWMSURL' + activeLayer).val(), $('#WMSLayerVariable' + activeLayer).find(":selected")
						.val(), date);

			} else
				$("#timeVariable" + activeLayer).remove();
		});
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
			updateAutoRange();
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
		if ($("#" + selectedElement.id + "variable" + activeLayer).length) {
			if (debugMl)
				console.log("Changing the value");
			$("#" + selectedElement.id + "variable" + activeLayer).html(html);
		} else {
			if (debugMl)
				console.log("Setting value");
			$(selectedElement).after(
					"<div id ='" + selectedElement.id + "variable" + activeLayer + "' style='display: inline'>" + html
							+ "</div>");
		}
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

	function toggleLayerButton(event) {
		activeLayer = event.target.name;
		if (debugMl)
			console.log("Toggleing layer #" + activeLayer);
		var date = $('#dateVariable' + activeLayer).find(":selected").val();
		if (typeof date === 'undefined' || date == "" || date == "NONE") {
			if (debugMl)
				console.log("No date (layer) selected");
			return;
		}
		var url = $('#mapLayersWMSURL' + activeLayer).val();
		if (url == "NONE")
			return;
		var name = $('#mapLayersWMSURL' + activeLayer).find(":selected").text() + ":"
				+ $('#WMSLayerVariable' + activeLayer).find(":selected").text();
		var layer = $('#WMSLayerVariable' + activeLayer).find(":selected").val();
		var colorscalerange = $('#colorscalerangeMin' + activeLayer).val() + ","
				+ $('#colorscalerangeMax' + activeLayer).val();
		var style = $('#styleVariable' + activeLayer).find(":selected").val();
		var logscale = $('#logscaleVariable' + activeLayer).find(":selected").val();
		if (debugMl)
			console.log("logscale:" + logscale);
		var elevation = $('#zAxisVariable' + activeLayer).find(":selected").val();
		var time = $('#timeVariable' + activeLayer).find(":selected").val();
		myNamespace.mapViewer.addWMSLayer(url, name, layer, colorscalerange, style, logscale, elevation, date + "T"
				+ time);
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
