var myNamespace = myNamespace || {};

myNamespace.buttonEventHandlers = (function(jQ) {
	"use strict";

	function add(element, eventFunction) {
		jQ(element).click(eventFunction);
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
			jQ(div).toggle("blind");

			var shownName = "Hide " + buttonName, hiddenName = "Show " + buttonName, isShown = jQ(buttonId).val() === hiddenName;

			if (isShown) {
				jQ(buttonId).val(shownName);
			} else {
				jQ(buttonId).val(hiddenName);
			}
		};
	}

	function checkParameter(checkBoxId, divName, divId) {
		return function() {
			if (document.getElementById(checkBoxId).checked) {
				jQ(divId).html(divName + " <em>(on)</em>");
			} else {
				jQ(divId).html(divName + " <em>(off)</em>");
			}
		};
	}
	function checkParameters(checkBoxIds, divName, divId) {
		return function() {
			var checked = false;
			for ( var i = 0; !checked && i < checkBoxIds.length; i++)
				if (document.getElementById(checkBoxIds[i]).checked)
					checked = true;
			if (checked) {
				jQ(divId).html(divName + " <em>(on)</em>");
			} else {
				jQ(divId).html(divName + " <em>(off)</em>");
			}
		};
	}

	function initHandlers() {
		// on click events
		add("#toggleMap", toggleButton("#toggleMap", "map", "#simple_map"));
		add("#toggleQuery", toggleButton("#toggleQuery", "query", "#search"));
		add("#toggleResults", toggleButton("#toggleResults", "results", "#featuresAndParams"));

		add("#bboxEnabledCheck", checkParameter("bboxEnabledCheck", "Bounding box", "#bboxHeaderText"));
		add("#cruiseEnabledCheck", checkParameter("cruiseEnabledCheck", "Cruise", "#cruiseHeaderText"));
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
		var c = myNamespace.control;
		callFromControl("#filterParameters", c.filterParametersButton);
		callFromControl("#filterParametersTreeButton", c.filterParametersTreeButton);
		callFromControl("#toggleOrderPlanktonButton", c.toggleOrderPlanktonButton);
		callFromControl("#clearSelectionButton", c.clearSelectionButton);
		callFromControl("#collapseAllButton", c.collapseAllButton);
		callFromControl("#expandAllButton", c.expandAllButton);
		callFromControl("#addLayerButton", c.addLayerButton);
		callFromControl("#compareRasterButton", c.compareRasterButton);
		callFromControl("#addTimeSeriesVariableButton", c.addTimeSeriesVariableButton);
		callFromControl("#propertiesPlotButton", c.propertiesPlotButton);
		callFromControl("#timeSeriesButton", c.timeSeriesButton);
		callFromControl("#filter", c.mainQueryButton);
		callFromControl("#toCurrentExtent", c.setBboxInputToCurrentMapExtent);
		callFromControl("#anywhereButton", c.lonLatAnywhere);
		callFromControl("#initiateRasterDataButton", c.initiateRasterDataButton);
		callFromControl("#calculateStatisticsButton", c.calculateStatisticsButton);

		// on change events
		jQ("#exportParametersFormats").change(function() {
			var s = document.getElementById('exportParametersFormats');
			// should so something here when we get more formats
		});
	}

	function linkParametersExportButton(callback, data, type, name) {
		jQ("#exportParameter").unbind("click");
		add(
				"#exportParameter",
				function() {
					csvContent = callback(data);
					try {
						saveAs(new Blob([ csvContent ], {
							type : type
						}), name);
					} catch (e) {
						window.BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder
								|| window.MSBlobBuilder || window.webkitURL;
						if (e.name == 'TypeError' && window.BlobBuilder) {
							var bb = new BlobBuilder();
							bb.append([ csvContent ]);
							saveAs(bb.getBlob(type), name);
						} else if (e.name == "InvalidStateError") {
							// InvalidStateError (tested on FF13 WinXP)
							saveAs(new Blob([ csvContent ], {
								type : type
							}), name);
						} else {
							// saveAs("data:"+type+";base64,"+
							// btoa(csvContent),name);
							myNamespace.errorMessage
									.showErrorMessage("Can not download because blob consutrctor is not supported in this browser!\nKnown supported browsers: \nChrome 29 on Windows\nFirefox 24 on Windows\nInternet Explorer 10 on Windows\n\nKnown not supported browsers:\nSafari 5 on Windows");
						}
					}

				});
	}

	function change(element, eventFunction) {
		jQ(element).change(eventFunction);
	}

	// public interface
	return {
		change : change,
		callFromControl : callFromControl,
		initHandlers : initHandlers,
		linkParametersExportButton : linkParametersExportButton,
	};

}(jQuery));
