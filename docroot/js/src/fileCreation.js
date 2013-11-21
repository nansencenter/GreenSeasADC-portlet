var myNamespace = myNamespace || {};

var debugfC = false;// debug flag

myNamespace.fileCreation = (function($) {

	function createCSVHeader(headers) {
		var headerString = "";
		var delimiter = "";
		$.each(headers, function(i, val) {
			headerString += delimiter;
			delimiter = csvDelimiter;
			headerString += val;
		});

		return headerString;
	}
	function createCSV(dataIn) {
		var csvContent = createCSVHeader(myNamespace.handleParameters.getHeadersFromFeatures(dataIn));

		csvContent += "\n";
		if (debugfC)
			console.log("Added headers: " + csvContent);
		$.each(dataIn, function(i, val) {
			var properties = val.properties;
			csvContent += val.id + csvDelimiter;
			var pos = val.geometry.coordinates;
			csvContent += pos[0] + csvDelimiter;
			csvContent += pos[1] + "";

			for (prop in properties) {

				var value = properties[prop];
				if (value == null)
					value = "";
				csvContent += csvDelimiter + value;
			}

			csvContent += "\n";
		});
		return csvContent;
	}
	return {
		createCSV : createCSV
	};
}(jQuery));