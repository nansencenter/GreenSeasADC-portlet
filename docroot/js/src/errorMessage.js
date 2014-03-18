var myNamespace = myNamespace || {};

myNamespace.errorMessage = (function($) {
	"use strict";

	var dialogDiv = "#errorMessageDialog";

	function showErrorMessage(message) {

		$(dialogDiv).dialog({
			modal : true,
			buttons : {
				Ok : function() {
					$(this).dialog("close");
				}
			},
			position : {
				my : "center top",
				at : "center top",
				of : $("#tabs")
			}
		});

		$(dialogDiv).html("<p>" + message + "<p>");
		$(dialogDiv).dialog('open');
	}

	return {
		showErrorMessage : showErrorMessage
	};

}(jQuery));