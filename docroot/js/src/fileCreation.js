var myNamespace = myNamespace || {};

var debugfC = false;// debug flag

myNamespace.fileCreation = (function($) {

	function createCSV(dataIn){
		var csvContent = "ID; Lat(dec.deg); Long(dec.deg); Area; Depth of Sea (m); Depth of Sample (m); Date; Time";
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
			
			for (prop in properties) {
				csvContent += "; " + properties[prop];
			}
			
//			$.each(myNamespace.handleParameters.chosenParameters.tablesSelected, function(i, table) {
//				$.each(myNamespace.handleParameters.chosenParameters.parametersByTable[table], function(j, parameter) {
//					csvContent += "; "+ properties[table + ":" + parameter];
//				});
//			});
			
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