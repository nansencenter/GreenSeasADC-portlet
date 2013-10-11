var myNamespace = myNamespace || {};

var debugfC = false;// debug flag

myNamespace.fileCreation = (function($) {

	function createCSVHeader(headers) {
		var headerString = "";
		var delimiter = "";
		$.each(headers, function(i, val) {
			headerString += delimiter;
			delimiter = ";";
			headerString += val;
		});

		return headerString;
	}
	function createCSV(dataIn) {
		var csvContent = createCSVHeader(myNamespace.handleParameters.mainParameters.basicHeader.concat(
				myNamespace.handleParameters.mainParameters.customHeader).concat(
				myNamespace.handleParameters.getChosenHeader()));

		csvContent += "\n";
		if (debugfC)
			console.log("Added headers: " + csvContent);
		$.each(dataIn, function(i, val) {
			var properties = val.properties;
			csvContent += val.id + ";";
			var pos = val.geometry.coordinates;
			csvContent += pos[0] + ";";
			csvContent += pos[1] + "";

			for (prop in properties) {

				var value = properties[prop];
				if (value == null)
					value = "";
				csvContent += ";" + value;
			}

			csvContent += "\n";
		});
		return csvContent;
	}
	return {
		createCSV : createCSV
	};
}(jQuery));