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
		add("#toggleResults", toggleButton("#toggleResults", "results", "#featuresAndParams"));

		add("#bboxEnabledCheck", checkParameter("bboxEnabledCheck", "Bounding box", "#bboxHeaderText"));
		add("#dateEnabledCheck", checkParameter("dateEnabledCheck", "Date/Time", "#dateHeaderText"));
		add("#depthEnabledCheck", checkParameter("depthEnabledCheck", "Depth", "#depthHeaderText"));
		add("#parametersEnabledCheck", checkParameter("parametersEnabledCheck", "Parameters", "#parametersHeaderText"));

		// buttons that call methods of control - should have control as "this"
		var c = myNamespace.control;
		callFromControl("#filterParameters", c.filterParametersButton);
		callFromControl("#filter", c.mainQueryButton);
		callFromControl("#toCurrentExtent", c.setBboxInputToCurrentMapExtent);
		callFromControl("#anywhereButton", c.lonLatAnywhere);

		// on change events
		jQ("#exportParametersFormats").change(function() {
			var s = document.getElementById('exportParametersFormats');
			//should so something here when we get more formats
		});
	}

	function linkParametersExportButton(csvContent,type,name) {
		jQ("#exportParameter").unbind("click");
		add("#exportParameter", function() {
			saveAs(new Blob([ csvContent ], {
				type : type
			}), name);
		});
	}

	// public interface
	return {
		initHandlers : initHandlers,
		linkParametersExportButton : linkParametersExportButton,
	};

}(jQuery));
