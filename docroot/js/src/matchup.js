var myNamespace = myNamespace || {};

var debugmu = false;// debug flag

myNamespace.matchup = (function($, ns) {
	"use strict";

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
	
	function initiateRasterData(){
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
		} else {
			var searchBeforeMatchup = "<div id='searchBeforeMatchup'>You need to search for data in order to be able to do a matchup</div>";
			$("#compareRaster").html(selectElement + searchBeforeMatchup);
		}
	}

	function generateOptionsFromAllSelectedParameters() {
		var selectedParameters = ns.handleParameters.chosenParameters.allSelected;
		options = "";
		$.each(selectedParameters, function(i, val) {
			options += "<option value=\"" + val + "\">" + ns.handleParameters.getHeaderFromRawData(val) + "</option>";
		});
		return options;
	}

	// public interface
	return {
		initiateRasterData:initiateRasterData,
		setUpCompareRasterDiv : setUpCompareRasterDiv,
		updateMatchupParameter : updateMatchupParameter,
		setUpOPeNDAPSelector : setUpOPeNDAPSelector,
	};

}(jQuery, myNamespace));
