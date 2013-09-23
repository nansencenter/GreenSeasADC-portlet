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
		add(element, setThisOfFunction(functionValue, myNamespace.control));
	}

	function toggleButton(buttonId, buttonName, div) {
		return function() {
			jQ(div).toggle("blind");

			var shownName = "Hide " + buttonName, hiddenName = "Show "
					+ buttonName, isShown = jQ(buttonId).val() === hiddenName;

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
				jQ(divId).html(divName + " <em>(enabled)</em>");
			} else {
				jQ(divId).html(divName + " <em>(disabled)</em>");
			}
		};
	}

	function initHandlers() {
		// on click events
		add("#toggleMap", toggleButton("#toggleMap", "map", "#simple_map"));
		add("#toggleQuery", toggleButton("#toggleQuery", "query", "#search"));
		add("#toggleResults", toggleButton("#toggleResults", "results",
				"#featuresAndParams"));

		add("#bboxEnabledCheck", checkParameter("bboxEnabledCheck",
				"Bounding box", "#bboxHeaderText"));
		add("#dateEnabledCheck", checkParameter("dateEnabledCheck",
				"Date/Time", "#dateHeaderText"));
		add("#attributesEnabledCheck", checkParameter("attributesEnabledCheck",
				"Attributes", "#attributesHeaderText"));

		// buttons that call methods of control - should have control as "this"
		var c = myNamespace.control;
		callFromControl("#filter", c.filterButton);
		callFromControl("#toCurrentExtent", c.setBboxInputToCurrentMapExtent);
		callFromControl("#anywhereButton", c.lonLatAnywhere);
		callFromControl("#showRawQueryButton", c.setRawRequestDialog);
		callFromControl("#multiPlot", c.multiParamPlot);
		callFromControl("#densityButton", c.plotDensity);

		
		add("#downloadCurrentContour", setThisOfFunction(
				myNamespace.mapViewer.downloadCurrentContourImage,
				myNamespace.mapViewer));
		add("#mapCurrentContour", setThisOfFunction(
				myNamespace.mapViewer.addContourLayerOfPreviousFilter,
				myNamespace.mapViewer));

		// on change events
		jQ("#exportFormats").change(function() {
			var s = document.getElementById('exportFormats');
			c.setSelectedFormat(s.options[s.selectedIndex].value);
			c.linkExportButton();
		});
		jQ("#exportTemperatureFormats").change(function() {
			var s = document.getElementById('exportTemperatureFormats');
			c.setSelectedTemperatureFormat(s.options[s.selectedIndex].value);
			c.linkTemperatureExportButton();
		});
		jQ("#exportChlorophyllFormats").change(function() {
			var s = document.getElementById('exportChlorophyllFormats');
			c.setSelectedChlorophyllFormat(s.options[s.selectedIndex].value);
			c.linkTemperatureExportButton();
		});
		jQ("#exportPlanktonFormats").change(function() {
			var s = document.getElementById('exportPlanktonFormats');
			c.setSelectedPlanktonFormat(s.options[s.selectedIndex].value);
			c.linkPlanktonExportButton();
		});
		jQ("#exportFlagellateFormats").change(function() {
			var s = document.getElementById('exportFlagellateFormats');
			c.setSelectedFlagellateFormat(s.options[s.selectedIndex].value);
			c.linkFlagellateExportButton();
		});
	}
	
	function linkExportButton(URL) {
		//alert("buttonEventHandlers.js: linkExportButton: URL="+URL);//TEST
		// remove previous
		jQ("#export").unbind("click");
		
		add("#export", function() {
			window.open(URL);
		});
	}

	function linkTemperatureExportButton(URL) {
		//alert("buttonEventHandlers.js: linkTemperatureExportButton: URL="+URL);//TEST
		// remove previous
		jQ("#exportTemperature").unbind("click");
		
		add("#exportTemperature", function() {
			window.open(URL);
		});
	}

	function linkChlorophyllExportButton(URL) {
		//alert("buttonEventHandlers.js: linkChlorophyllExportButton: URL="+URL);//TEST
		// remove previous
		jQ("#exportChlorophyll").unbind("click");
		
		add("#exportChlorophyll", function() {
			window.open(URL);
		});
	}

	function linkPlanktonExportButton(URL) {
		//alert("buttonEventHandlers.js: linkPlanktonExportButton: URL="+URL);//TEST
		// remove previous
		jQ("#exportPlankton").unbind("click");
		
		add("#exportPlankton", function() {
			window.open(URL);
		});
	}

	function linkFlagellateExportButton(URL) {
		//alert("buttonEventHandlers.js: linkFlagellateExportButton: URL="+URL);//TEST
		// remove previous
		jQ("#exportFlagellate").unbind("click");
		
		add("#exportFlagellate", function() {
			window.open(URL);
		});
	}
	
	// public interface
	return {
		initHandlers : initHandlers,
		linkExportButton : linkExportButton,
		linkTemperatureExportButton : linkTemperatureExportButton,
		linkChlorophyllExportButton : linkChlorophyllExportButton,
		linkPlanktonExportButton : linkPlanktonExportButton,
		linkFlagellateExportButton : linkFlagellateExportButton
	};

}(jQuery));
