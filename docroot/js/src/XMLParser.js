var myNamespace = myNamespace || {};

var debugXML = true;// debug flag

myNamespace.XMLParser = (function($) {

	function extractParameters(xmlSchema) {
		console.log("extractParameters");
		console.log(xmlSchema);
		var oParser = new DOMParser();
		var xmlDoc = xmlSchema.responseXML;
		console.log(xmlDoc);
		// var xmlDoc = oParser.parseFromString(xmlSchema.responseText,
		// "text/xml");

		if (debugXML) {
			console.log(xmlDoc.documentElement.childNodes[3].childNodes[1].childNodes[1].childNodes[1].childNodes[1]
					.getAttribute("name"));
		}

		var parameters = [];
		var sequence = xmlDoc.documentElement.childNodes[3].childNodes[1].childNodes[1].childNodes[1].childNodes;
		var numberOfParameters = sequence.length;
		for ( var i = 1; i < numberOfParameters; i += 2) {
			console.log("extractParameters FOUND PARAMETER: " + sequence.item(i).getAttribute("name"));
			parameters.push(sequence.item(i).getAttribute("name"));
		}
		if (debugXML)
			console.log("parameters: " + parameters);
		// getting the table name:
		parameters.push(xmlDoc.documentElement.childNodes[5].getAttribute("name"));
		return parameters;
	}
	// public interface
	return {
		extractParameters : extractParameters
	};

}(jQuery));