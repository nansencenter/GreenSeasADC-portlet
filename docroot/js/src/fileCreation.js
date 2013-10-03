var myNamespace = myNamespace || {};

var debugfC = false;// debug flag

myNamespace.fileCreation = (function($) {

	function createCSV(dataIn){
		var csvContent = "ID; Lat(dec.deg); Long(dec.deg)";
		$.each(myNamespace.handleParameters.chosenParameters.tablesSelected, function(k, table) {
			$.each(myNamespace.handleParameters.chosenParameters.parametersByTable[table], function(j, parameter) {
				if (debugfC)
					console.log(parameter);
				csvContent += "; "+ myNamespace.handleParameters.getHeader(parameter, table);
			});
		});
		csvContent += "\n";
		if (debugfC)
			console.log("Added headers: " + csvContent);
		$.each(dataIn, function(i, val) {
			var properties = val.properties;
			csvContent += val.id + "; ";
			var pos = val.geometry.coordinates;
			csvContent += pos[0] + "; ";
			csvContent += pos[1] + "";
			$.each(myNamespace.handleParameters.chosenParameters.tablesSelected, function(i, table) {
				$.each(myNamespace.handleParameters.chosenParameters.parametersByTable[table], function(j, parameter) {
					if (debugfC)
						console.log(parameter);
					csvContent += "; "+ properties[table + ":" + parameter];
				});
			});
			
			csvContent += "\n";
		});
		/* data.forEach(function(infoArray, index){

		   dataString = infoArray.join(",");
		   csvContent += index < infoArray.length ? dataString+ "\n" : dataString;

		}); */
		return csvContent;
	}
	return {
		createCSV:createCSV
	};
}(jQuery));