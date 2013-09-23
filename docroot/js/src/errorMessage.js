var myNamespace = myNamespace || {};

myNamespace.errorMessage = (function(jQ) {
	"use strict";

	var dialogDiv = "#errorMessageDialog";

	function showErrorMessage(message) {

		jQ(dialogDiv).dialog({
			modal : true,
			buttons : {
				Ok : function() {
					jQ(this).dialog("close");
				}
			}
		});

		jQ(dialogDiv).html("<p>" + message + "<p>");
		jQ(dialogDiv).dialog('open');
	}

	return {
		showErrorMessage : showErrorMessage
	};

}(jQuery));