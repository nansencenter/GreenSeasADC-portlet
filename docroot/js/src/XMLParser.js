var myNamespace = myNamespace || {};

var debugXML = true;// debug flag

myNamespace.XMLParser = (function($) {

	function findBrowser() {
		var ua = navigator.userAgent, N = navigator.appName, tem, M = ua
				.match(/(opera|chrome|safari|firefox|msie|trident)\/?\s*([\d\.]+)/i)
				|| [];
		M = M[2] ? [ M[1], M[2] ] : [ N, navigator.appVersion, '-?' ];
		if (M && (tem = ua.match(/version\/([\.\d]+)/i)) != null)
			M[2] = tem[1];
		return M[0];// M.join(' ');
	}

	function extractParameters(xmlSchema) {
		console.log("extractParameters");
		var browser = findBrowser();
		console.log("browser: " + browser);
		console.log(xmlSchema);
		var parameters = [];
		var xmlDoc
		if (browser == "Chrome" || browser == "Firefox") {
			xmlDoc = xmlSchema.responseXML;
		} else {
			xmlDoc = xmlSchema._object.responseXML;
		}
		console.log(xmlDoc);

		if (debugXML) {
			console.log(xmlDoc.documentElement.childNodes[3].childNodes[1].childNodes[1].childNodes[1].childNodes[1]
					.getAttribute("name"));
		}

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