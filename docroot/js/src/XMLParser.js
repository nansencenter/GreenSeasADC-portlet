var myNamespace = myNamespace || {};

var debugXML = false;// debug flag

myNamespace.XMLParser = (function($) {

	function extractParameters(xmlSchema) {
		xmlDoc = xmlSchema.responseXML;
		if (debugXML)
			console.log("xmlDoc: " +xmlDoc);

		$xml = $(xmlDoc);
		parameters = [];
		$xml.find("element").each(function(i, val) {
			parameters.push(val.getAttribute("name"));
		});
		if (debugXML)
			console.log("parameters: " + parameters);
		return parameters;
	}
	// public interface
	return {
		extractParameters : extractParameters
	};

}(jQuery));