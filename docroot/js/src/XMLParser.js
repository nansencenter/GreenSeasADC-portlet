var myNamespace = myNamespace || {};

var debugXML = false;// debug flag

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

	function getNumberOfFeatures(response) {
		var xmlDoc = getXmlDoc(response);
		if (debugXML) {
			console.log("xmlDoc");
			console.log(xmlDoc);
			console.log("xmlDoc.documentElement:");
			console.log(xmlDoc.documentElement);
		}
		return xmlDoc.documentElement.getAttribute("numberOfFeatures");
	}

	function getXmlDoc(xmlSchema) {
		var xmlDoc;
		var browser = findBrowser();
		/*
		 * if (browser == "Chrome" || browser == "Firefox") { xmlDoc =
		 * xmlSchema.responseXML; } else {
		 */
		// if (xmlSchema._object) {
		xmlDoc = xmlSchema._object.responseXML;
		/*
		 * } else { xmlDoc = xmlSchema.responseXML; }
		 */
		return xmlDoc;
	}

	function extractWMSParameters(xmlSchema) {
		if (debugXML)
			console.log("extractWMSParameters:");
		if (debugXML)
			console.log(xmlSchema);
		var parameters = {};
		var xmlDoc = getXmlDoc(xmlSchema);
		// if (debugXML)
		if (debugXML)
			console.log(xmlDoc);
		var layers = $(xmlDoc.documentElement).find("Layer[queryable=1]");
		if (debugXML)
			console.log(layers);
		$.each(layers, function(i, val) {
			var parameter = val.getElementsByTagName("Name")[0].childNodes[0].nodeValue;
			var description = val.getElementsByTagName("Title")[0].childNodes[0].nodeValue;
			parameters[parameter] = description;
		});
		return parameters;
	}

	function extractParameters(xmlSchema) {
		if (debugXML)
			console.log("extractParameters");
		if (debugXML)
			console.log(xmlSchema);
		var parameters = [];
		var xmlDoc = getXmlDoc(xmlSchema);
		if (debugXML)
			console.log(xmlDoc);

		if (debugXML) {
			console.log(xmlDoc.documentElement.childNodes[3].childNodes[1].childNodes[1].childNodes[1].childNodes[1]
					.getAttribute("name"));
			console.log(xmlDoc.documentElement.childNodes[3].childNodes[1].childNodes[1].childNodes[1].childNodes);
		}

		var sequence = xmlDoc.documentElement.childNodes[3].childNodes[1].childNodes[1].childNodes[1].childNodes;
		var numberOfParameters = sequence.length;
		for ( var i = numberOfParameters - 2; i >= 1; i -= 2) {
			if (debugXML) {
				console.log(sequence.item(i));
				console.log("extractParameters FOUND PARAMETER: " + sequence.item(i).getAttribute("name"));
			}
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
		extractWMSParameters : extractWMSParameters,
		getNumberOfFeatures : getNumberOfFeatures,
		extractParameters : extractParameters,
		findBrowser : findBrowser
	};

}(jQuery));