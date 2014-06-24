var myNamespace = myNamespace || {};

myNamespace.buttonEventHandlers = (function($, ns) {
	"use strict";

	function add(element, eventFunction) {
		$(element).click(eventFunction);
	}

	function setThisOfFunction(functionValue, thisValue, additionalArguments) {
		return function() {
			functionValue.call(thisValue, additionalArguments);
		};
	}

	function callFromControl(element, functionValue) {
		add(element, functionValue);
	}

	function toggleButton(buttonId, buttonName, div) {
		return function() {
			$(div).toggle("blind");

			var shownName = "Hide " + buttonName, hiddenName = "Show " + buttonName, isShown = $(buttonId).val() === hiddenName;

			if (isShown) {
				$(buttonId).val(shownName);
			} else {
				$(buttonId).val(hiddenName);
			}
		};
	}

	function checkParameter(checkBoxId, divName, divId) {
		return function() {
			if (document.getElementById(checkBoxId).checked) {
				$(divId).html(divName + " <em>(on)</em>");
			} else {
				$(divId).html(divName + " <em>(off)</em>");
			}
		};
	}
	function checkParameters(checkBoxIds, divName, divId) {
		return function() {
			var checked = false;
			for (var i = 0, l = checkBoxIds.length; !checked && i < l; i++) {
				// TODO: possible optimization by not traversing the dom for
				// all? (atm only used for a few parameters though)
				if (document.getElementById(checkBoxIds[i]).checked)
					checked = true;
			}
			if (checked) {
				$(divId).html(divName + " <em>(on)</em>");
			} else {
				$(divId).html(divName + " <em>(off)</em>");
			}
		};
	}

	function initHandlers() {
		// on click events
		add("#toggleMap", toggleButton("#toggleMap", "map", "#simple_map"));
		add("#toggleQuery", toggleButton("#toggleQuery", "query", "#search"));
		add("#toggleResults", toggleButton("#toggleResults", "results", "#featuresAndParams"));

		add("#bboxEnabledCheck", checkParameter("bboxEnabledCheck", "Bounding box", "#bboxHeaderText"));
		add("#cruiseEnabledCheck", checkParameter("cruiseEnabledCheck", "Cruise/Station", "#cruiseHeaderText"));
		add("#biomesEnabledCheck", checkParameter("biomesEnabledCheck", "GreenSeas Biomes", "#biomesHeaderText"));
		add("#regionEnabledCheck", checkParameter("regionEnabledCheck", "Longhurst region", "#regionHeaderText"));

		add("#dateEnabledCheck", checkParameters([ "monthEnabledCheck", "dateEnabledCheck" ], "Date/Time/Month",
				"#dateHeaderText"));
		add("#monthEnabledCheck", checkParameters([ "monthEnabledCheck", "dateEnabledCheck" ], "Date/Time/Month",
				"#dateHeaderText"));

		add("#depthEnabledCheck", checkParameter("depthEnabledCheck", "Depth", "#depthHeaderText"));
		add("#metadataEnabledCheck", checkParameter("metadataEnabledCheck", "Metadata", "#metadataHeaderText"));

		// matchup
		add("#fileOptionCheck", checkParameter("fileOptionCheck", "Upload NetCDF File", "#modelOptionsHeaderText"));
		add("#opendapDataURLCheck", checkParameter("opendapDataURLCheck", "Use dataset from OpenDAP",
				"#openDAPOptionHeaderText"));

		// buttons that call methods
		callFromControl("#filterParameters", ns.control.filterParametersButton);
		callFromControl("#filterParametersTreeButton", ns.control.filterParametersTreeButton);
		callFromControl("#toggleOrderPlanktonButton", ns.control.toggleOrderPlanktonButton);
		callFromControl("#clearSelectionButton", ns.control.clearSelectionButton);
		callFromControl("#collapseAllButton", ns.control.collapseAllButton);
		callFromControl("#expandAllButton", ns.control.expandAllButton);
		callFromControl("#addLayerButton", ns.control.addLayerButton);
		callFromControl("#compareRasterButton", ns.control.compareRasterButton);
		callFromControl("#addTimeSeriesVariableButton", ns.control.addTimeSeriesVariableButton);
		callFromControl("#propertiesPlotButton", ns.control.propertiesPlotButton);
		callFromControl("#timeSeriesButton", ns.control.timeSeriesButton);
		callFromControl("#filter", ns.control.mainQueryButton);
		callFromControl("#toCurrentExtent", ns.control.setBboxInputToCurrentMapExtent);
		callFromControl("#anywhereButton", ns.control.lonLatAnywhere);
		callFromControl("#initiateRasterDataButton", ns.control.initiateRasterDataButton);
		callFromControl("#calculateStatisticsButton", ns.control.calculateStatisticsButton);
		callFromControl("#saveQueryButton", ns.control.saveQueryButton);
		callFromControl("#loadFileFromIDButton", ns.control.loadFileFromIDButton);
		callFromControl("#downloadSelectedParInfoButton", ns.control.downloadSelectedParInfoButton);

		// on change events
		$("#exportParametersFormats").change(function() {
			var s = document.getElementById('exportParametersFormats');
			// should so something here when we get more formats
		});
	}

	function linkParametersExportButton(callback, data, type, name) {
		$("#exportParameter").unbind("click");
		add(
				"#exportParameter",
				function() {
					$("#exportParameter").prop("disabled",true);
					$("#exportParameter").prop("title","Loading data, please wait...");
					$("#exportParameter").qtip();
					csvContent = callback(data);
					try {
						saveAs(new Blob([ csvContent ], {
							type : type
						}), name);
					} catch (e) {
						window.BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder
								|| window.MSBlobBuilder || window.webkitURL;
						if (e.name === 'TypeError' && window.BlobBuilder) {
							var bb = new BlobBuilder();
							bb.append([ csvContent ]);
							saveAs(bb.getBlob(type), name);
						} else if (e.name === "InvalidStateError") {
							// InvalidStateError (tested on FF13 WinXP)
							saveAs(new Blob([ csvContent ], {
								type : type
							}), name);
						} else {
							// saveAs("data:"+type+";base64,"+
							// btoa(csvContent),name);
							ns.errorMessage
									.showErrorMessage("Can not download because blob consutrctor is not supported in this browser!\nKnown supported browsers: \nChrome 29 on Windows\nFirefox 24 on Windows\nInternet Explorer 10 on Windows\n\nKnown not supported browsers:\nSafari 5 on Windows");
						}
					}
					enableExportButton();
				});
		enableExportButton();
	}
	
	function enableExportButton(){
		$("#exportParameter").prop("disabled",false);
		$("#exportParameter").qtip('option', 'content.text', "Export data")
	}

	function linkParametersExportButton3(callback, data, name) {
		$("#exportParameter").unbind("click");
		add("#exportParameter", function() {
			$("#exportParameter").prop("disabled",true);
			$("#exportParameter").qtip('option', 'content.text', "Loading data, please wait...")
			callback(data, name, enableExportButton);
		});
		enableExportButton();
	}

	function change(element, eventFunction) {
		$(element).unbind("change", eventFunction);
		$(element).change(eventFunction);
	}

	// public interface
	return {
		change : change,
		linkParametersExportButton3 : linkParametersExportButton3,
		callFromControl : callFromControl,
		initHandlers : initHandlers,
		linkParametersExportButton : linkParametersExportButton,
	};

}(jQuery, myNamespace));
