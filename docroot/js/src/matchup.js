var myNamespace = myNamespace || {};

var debugmu = false;// debug flag

myNamespace.matchup = (function($, ns) {
	"use strict";

	// True if a raster file has been uploaded
	var uploadedRaster = false;

	function setUpOPeNDAPSelector() {
		var URLs = {
			"http://thredds.nersc.no/thredds/dodsC/greenpath/Model/topaz" : "Topaz",
			/*"http://thredds.nersc.no/thredds/dodsC/greenpath/Model/cmcc_phosphate" : "CMCC Phosphate",
			"http://thredds.nersc.no/thredds/dodsC/greenpath/Model/cmcc_chla" : "CMCC Chlorophyll-a",
			"http://thredds.nersc.no/thredds/dodsC/greenpath/Model/cmcc_sea_ice" : "CMCC Sea Ice",*/
			"http://thredds.nersc.no/thredds/dodsC/greenpath/EO/PML/chlor_seawifs_Sep97_Dec10_360x180gt" : "PML Chlorophyll-a",
			"http://thredds.nersc.no/thredds/dodsC/greenpath/EO/PML/fmicro_seawifs_Sep97_Dec10_360x180gt" : "PML Fraction of Microphytoplankton",
			"http://thredds.nersc.no/thredds/dodsC/greenpath/EO/PML/fnano_seawifs_Sep97_Dec10_360x180gt" : "PML Fraction of Nanophytoplankton",
			"http://thredds.nersc.no/thredds/dodsC/greenpath/EO/PML/fpico_seawifs_Sep97_Dec10_360x180gt" : "PML Fraction of Picophytoplankton",
			"http://thredds.nersc.no/thredds/dodsC/greenpath/EO/PML/zeu_seawifs_zmld_soda_Sep97_Dec07_360x180gt" : "PML Ratio euphotic depth to mixed layer depth",
			"http://thredds.nersc.no/thredds/dodsC/greenpath/EO/PML/phenology_seawifs_98_07_360x180g" : "PML Phenology",
			//"http://thredds.nersc.no/thredds/dodsC/greenpath/EO/PML/ssmicon" : "ssmicon",
		};

		var selectElement = ns.mapLayers.setUpSelector(URLs, "opendapDataURL");
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
		$("#compareRaster").html("Loading raster, please wait...");
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

	function setUpCompareRasterDiv(parameters) {
		var selectElement = "Raster variable:<select id=\"matchVariable\">";
		var options = "<option value='NONE'>Select variable</option>";
		$.each(parameters, function(key, val) {
			var variable = key.substring(0, key.indexOf("("));
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
		$("#compareRaster").append("<div id='searchBeforeMatchup'>"+"<br><br>"+searchBeforeMatchupText+"</div>");
	}
	
	function getMetaDimension(event){
		$("#matchVariable").after("<div id='timeElevationText' style='display: inline'>Loading Time/Elevation, please wait...</div>");
		$("#timeMatchupVariable").remove();
		$("#elevationText").remove();
		var rasterParameter = $("#matchVariable").find(":selected").val();
		ns.ajax.getDimension(rasterParameter);
	}	
	
	function setUpParameterMetaSelector(parameters){
		console.log(parameters);
		var selectElement = "<select id='timeMatchupVariable'>";
		var options = "";
		$.each(parameters.time, function(key, val) {
			options += "<option value=\"" + key + "\">" + val + "</option>";
		});
		selectElement += options + "</select>";
		if (!(typeof parameters.elevation === 'undefined')){
			selectElement += "<div id='elevationText' style='display: inline'>Elevation (Units:"+parameters.elevation.units+"):<select id='elevationMatchupVariable'></div>";
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
		options = "";
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

	// public interface
	return {
		setUpParameterMetaSelector:setUpParameterMetaSelector,
		setUpUploadRaster : setUpUploadRaster,
		initiateRasterData : initiateRasterData,
		setUpCompareRasterDiv : setUpCompareRasterDiv,
		updateMatchupParameter : updateMatchupParameter,
		setUpOPeNDAPSelector : setUpOPeNDAPSelector,
	};

}(jQuery, myNamespace));
