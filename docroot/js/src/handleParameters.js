var myNamespace = myNamespace || {};

var debughP = false;// debug flag

myNamespace.handleParameters = (function($) {
	var qf = false;

	// TODO: make this a hashtable of hashtable, it must store the type of the
	// variable: i.e. string, date, point, boolean, for comparison purposes
	var availableParameters = {};
	mainParameters = {
		basicHeader : [ "ID", "Lat (dec.deg)", "Long (dec.deg)" ],
	};
	var chosenParameters = {
		parametersByTable : {},
		allSelected : [],
		tablesSelected : []
	};

	function resetMetadataSelection() {
		delete mainParameters.chosenMetadata;
	}

	function getMetadataHeaders() {
		var metaHeader = [];
		if (mainParameters.chosenMetadata) {
			if (debughP) {
				console.log("mainParameters.chosenMetadata:");
				console.log(mainParameters.chosenMetadata);
			}
			$.each(mainParameters.chosenMetadata, function(i, val) {
				metaHeader.push(getHeader(val, window.metaDataTable));
			});
		} else
			$.each(mainParameters.parameters, function(i, val) {
				if (val != "point")
					metaHeader.push(getHeader(val, window.metaDataTable));
			});
		if (debughP) {
			console.log("Returning headers:");
		}
		return mainParameters.basicHeader.concat(metaHeader.reverse());
	}

	function selectParameters(par, flags) {
		if (debughP)
			console.log("Setting qf to:" + flags);
		qf = flags;
		chosenParameters.allSelected = [];
		chosenParameters.tablesSelected = [];
		chosenParameters.parametersByTable = {};
		$.each(par, function(i, val) {
			var parArr = val.getAttribute("id").split(":");
			if (debughP)
				console.log("Checking val: " + parArr[0] + ":" + parArr[1]);
			// if the parameter is an actual available parameter in that table
			// (minor check for error) TODO: remove?
			if (availableParameters[parArr[0]].indexOf(parArr[1]) != -1) {
				chosenParameters.allSelected.push(val.getAttribute("id"));
				// if its the first registered parameter from that table
				if (chosenParameters.tablesSelected.indexOf(parArr[0]) == -1) {
					chosenParameters.tablesSelected.push(parArr[0]);
					chosenParameters.parametersByTable[parArr[0]] = [ parArr[1] ];
				} else {
					chosenParameters.parametersByTable[parArr[0]].push(parArr[1]);
				}
			}
		});
		if (debughP) {
			console.log("Setting allSelected to: " + chosenParameters.allSelected.toString());
			console.log("Setting tablesSelected to: " + chosenParameters.tablesSelected.toString());
		}
	}

	function selectMetadata(par) {
		mainParameters.chosenMetadata = [];

		$.each(par, function(i, val) {
			var parArr = val.getAttribute("id").split(":");
			if (debughP)
				console.log("selectMetadata Checking val: " + parArr[0] + ":" + parArr[1]);
			if (parArr[1])
				mainParameters.chosenMetadata.push(parArr[1]);
		});
		mainParameters.chosenMetadata.reverse();
	}

	function getHeaderFromRawData(parameterTable) {
		var split = parameterTable.split(":");
		return getHeader(split[1], split[0]);
	}

	function getHeader(parameter, table) {
		var header;
		try {
			header = allParametersHeader[table][parameter];
		} catch (e) {
			return parameter;
		}
		return header ? header : parameter;
	}

	function getTableHeader(table) {
		return allLayersHeader[table] ? allLayersHeader[table] : table;
	}

	function getChosenHeader() {
		chosenHeader = [];
		for ( var i = chosenParameters.allSelected.length - 1; i >= 0; i--) {
			var parArr = chosenParameters.allSelected[i].split(":");
			chosenHeader.push(getHeader(parArr[1], parArr[0]));
			if (qf) {
				chosenHeader.push(qfHeader);
			}
		}
		if (debughP)
			console.log(chosenHeader);
		return chosenHeader;
	}

	function initiateParameters(input) {
		if (debughP)
			console.log("Initiating Parameters");
		var parameters = myNamespace.XMLParser.extractParameters(input);
		var table = parameters.pop();
		if (table == window.metaDataTable) {
			mainParameters.parameters = parameters;
			if (debughP)
				console.log("Initialized metadata:" + table + " to:" + parameters);
		} else {
			availableParameters[table] = parameters;
			if (debughP)
				console.log("Initialized " + table + " to:" + parameters);
		}
		return table;

	}

	function getHeadersFromFeatures(features) {
		if (debughP)
			console.log("getHeadersFromFeatures");
		var parameterHeaders = [];
		var feature = features[Object.keys(features)[0]];
		if (!(typeof feature === 'undefined'))
			$.each(feature.properties, function(key) {
				var split = key.split(":");
				var table = "";
				var parameter = "";
				if (split.length == 2) {
					table = split[0];
					parameter = split[1];
				} else {
					table = window.metaDataTable;
					parameter = split[0];
				}
				parameterHeaders.push(getHeader(parameter, table));
			});
		return mainParameters.basicHeader.concat(parameterHeaders);
	}

	function getQF() {
		return qf.valueOf();
	}
	// public interface
	return {
		getHeadersFromFeatures : getHeadersFromFeatures,
		getHeaderFromRawData : getHeaderFromRawData,
		resetMetadataSelection : resetMetadataSelection,
		getMetadataHeaders : getMetadataHeaders,
		selectMetadata : selectMetadata,
		qf : getQF,
		mainParameters : mainParameters,
		getTableHeader : getTableHeader,
		initiateParameters : initiateParameters,
		getChosenHeader : getChosenHeader,
		chosenParameters : chosenParameters,
		availableParameters : availableParameters,
		selectParameters : selectParameters,
		getHeader : getHeader
	};

}(jQuery));