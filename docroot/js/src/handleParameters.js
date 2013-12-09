var myNamespace = myNamespace || {};

var debughP = true;// debug flag

myNamespace.handleParameters = (function($) {
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
				if (val != window.geometryParameter)
					metaHeader.push(getHeader(val, window.metaDataTable));
			});
		if (debughP) {
			console.log("Returning headers:");
		}
		return mainParameters.basicHeader.concat(metaHeader.reverse());
	}

	function selectParameters(par) {
		chosenParameters.allSelected = [];
		chosenParameters.tablesSelected = [];
		chosenParameters.parametersByTable = {};
		chosenParameters.combined = [];
		$.each(par, function(i, val) {
			var parArr = val.getAttribute("id").split(":");
			if (debughP)
				console.log("Checking val: " + parArr[0] + ":" + parArr[1]);
			// if the parameter is an actual available parameter in that table
			// (minor check for error) TODO: remove?
			chosenParameters.allSelected.push(val.getAttribute("id"));
			if (parArr[0] == "combined") {
				chosenParameters.combined.push(val.getAttribute("id"));
			} else {
				// if its the first registered parameter from that table
				if (chosenParameters.tablesSelected.indexOf(parArr[0]) == -1) {
					chosenParameters.tablesSelected.push(parArr[0]);
					chosenParameters.parametersByTable[parArr[0]] = [ parArr[1] ];
				} else {
					chosenParameters.parametersByTable[parArr[0]].push(parArr[1]);
				}
			}
		});
		if (debughP)
			console.log("Adding extra parameters: ");
		if (debughP)
			console.log(chosenParameters.combined);
		// Adding the extra parameters from combine.
		$.each(chosenParameters.combined, function(i, val) {
			var combine = window.combinedParameters[val];
			if (chosenParameters.tablesSelected.indexOf(combine.layer) == -1) {
				chosenParameters.tablesSelected[combine.layer] = [];
				chosenParameters.tablesSelected.push(combine.layer);
				chosenParameters.parametersByTable[combine.layer] = [];
			}
			$.each(combine.parameters, function(j, par) {
				if (chosenParameters.parametersByTable[combine.layer].indexOf(par) == -1)
					chosenParameters.parametersByTable[combine.layer].push(par);
			});
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
			if (table == "combined")
				header = window.combinedParameters["combined:" + parameter].header;
			else
				header = allParametersHeader[table][parameter];
		} catch (e) {
			return parameter;
		}
		return header ? header : parameter;
	}

	function getTableHeader(table) {
		if (table.indexOf("combined") == 0) {
			return window.combinedParameters[table].header;
		}
		return allLayersHeader[table] ? allLayersHeader[table] : table;
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
				// test if it is a qf
				if (parameter.substring(parameter.length - window.qfPostFix.length) == window.qfPostFix)
					parameterHeaders.push(window.qfHeader);
				else
					parameterHeaders.push(getHeader(parameter, table));
			});
		return mainParameters.basicHeader.concat(parameterHeaders);
	}

	// public interface
	return {
		getHeadersFromFeatures : getHeadersFromFeatures,
		getHeaderFromRawData : getHeaderFromRawData,
		resetMetadataSelection : resetMetadataSelection,
		getMetadataHeaders : getMetadataHeaders,
		selectMetadata : selectMetadata,
		mainParameters : mainParameters,
		getTableHeader : getTableHeader,
		initiateParameters : initiateParameters,
		chosenParameters : chosenParameters,
		availableParameters : availableParameters,
		selectParameters : selectParameters,
		getHeader : getHeader
	};

}(jQuery));