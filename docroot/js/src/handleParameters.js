var myNamespace = myNamespace || {};

var debughP = false;// debug flag

myNamespace.handleParameters = (function($, ns) {
	// TODO: make this a hashtable of hashtable, it must store the type of the
	// variable: i.e. string, date, point, boolean, for comparison purposes
	var availableParameters = {};
	mainParameters = {
		basicHeader : [ "GS-ID", "Latitude", "Longitude" ],
		basicUnits : [ "int", "degrees_north", "degrees_east" ]
	};
	var chosenParameters = {
		parametersByTable : {},
		allSelected : [],
		tablesSelected : [],
		// TODO: additionalParameters needs to be updated when the matchup is
		// added
		additionalParameters : []
	};

	function addNewParameters(parameters) {
		chosenParameters.additionalParameters = chosenParameters.additionalParameters.concat(parameters);
	}
	/**
	 * To reset metadata selection when a new main-query is run (does not reset
	 * the jstree, only internal selection)
	 */
	function resetMetadataSelection() {
		chosenParameters.additionalParameters = [];
		delete mainParameters.chosenMetadata;
	}

	/**
	 * To reset parameters selection when a new main-query is run (does not
	 * reset the jstree, only internal selection)
	 */
	function resetParametersSelection() {
		chosenParameters.allSelected = [];
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
		} else {
			$.each(mainParameters.parameters, function(i, val) {
				if (val !== window.geometryParameter)
					metaHeader.push(getHeader(val, window.metaDataTable));
			});
			metaHeader.reverse();
		}
		if (debughP) {
			console.log("Returning headers:");
		}
		return mainParameters.basicHeader.concat(metaHeader);
	}

	function selectParameters(par, qf) {
		chosenParameters.qf = qf;
		chosenParameters.allSelected = [];
		chosenParameters.tablesSelected = [];
		chosenParameters.parametersByTable = {};
		chosenParameters.combined = [];
		$.each(par, function(i, val) {
			var id = val;
			if ((typeof window.combinedParameters[id] === "undefined")
					|| (window.combinedParameters[id].method !== "groupLayers")) {
				var parArr = id.split(":");
				if (debughP)
					console.log("Checking val: " + parArr[0] + ":" + parArr[1]);
				// if the parameter is an actual available parameter in that
				// table
				// (minor check for error) TODO: remove?
				chosenParameters.allSelected.push(id);
				if (parArr[0] === "combined") {
					chosenParameters.combined.push(id);
				} else {
					// if its the first registered parameter from that table
					if (chosenParameters.tablesSelected.indexOf(parArr[0]) === -1) {
						chosenParameters.tablesSelected.push(parArr[0]);
						chosenParameters.parametersByTable[parArr[0]] = [ parArr[1] ];
					} else {
						chosenParameters.parametersByTable[parArr[0]].push(parArr[1]);
					}
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
			if (chosenParameters.tablesSelected.indexOf(combine.layer) === -1) {
				chosenParameters.tablesSelected[combine.layer] = [];
				chosenParameters.tablesSelected.push(combine.layer);
				chosenParameters.parametersByTable[combine.layer] = [];
			}
			$.each(combine.parameters, function(j, par) {
				if (chosenParameters.parametersByTable[combine.layer].indexOf(par) === -1)
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
	

	function getUnitsFromRawData(parameterTable) {
		var split = parameterTable.split(":");
		return getUnits(split[1], split[0]);
	}

	function getDataTypeFromRawData(parameterTable) {
		var split = parameterTable.split(":");
		return getDataType(split[1], split[0]);
	}

	function getShortHeaderFromRawData(parameterTable) {
		var split = parameterTable.split(":");
		return getShortHeader(split[1], split[0]);
	}

	function getTooltip(parameter, table) {
		var tooltip;
		try {
			tooltip = allParametersTooltips[table][parameter];
			if (typeof tooltip === 'undefined')
				tooltip = getHeader(parameter, table)
		} catch (e) {
			return parameter;
		}
		return tooltip ? tooltip : parameter;
	}

	function getHeader(parameter, table) {
		var header;
		try {
			if (table === "combined")
				header = window.combinedParameters["combined:" + parameter].header;
			else
				header = allParametersHeader[table][parameter];
		} catch (e) {
			return parameter;
		}
		return header ? header : parameter;
	}

	function getDataType(parameter, table) {
		var dataType;
		try {
			dataType = allParametersDataType[table][parameter];
		} catch (e) {
			return "String";
		}
		return dataType ? dataType : "String";
	}

	function getTableHeader(table) {
		if (table.indexOf("combined") === 0) {
			return window.combinedParameters[table].header;
		}
		return allLayersHeader[table] ? allLayersHeader[table] : table;
	}

	function initiateParameters(input) {
		if (debughP)
			console.log("Initiating Parameters");
		var parameters = ns.XMLParser.extractParameters(input);
		var table = parameters.pop();
		if (table === window.metaDataTable) {
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
		if (debughP)
			console.log(feature);
		if (!(typeof feature === 'undefined'))
			$.each(feature.properties, function(key) {
				var split = key.split(":");
				var table = "";
				var parameter = "";
				if (split.length === 2) {
					table = split[0];
					parameter = split[1];
				} else {
					table = window.metaDataTable;
					parameter = split[0];
				}
				if (debughP)
					console.log("Parameter:" + parameter);
				// test if it is a qf
				if (parameter.substring(parameter.length - window.qfPostFix.length) === window.qfPostFix) {
					parameterHeaders.push(window.qfHeader);
					if (debughP)
						console.log("Found QF");
				} else {
					if (debughP)
						console.log("NO QF");
					parameterHeaders.push(getHeader(parameter, table));
				}
			});
		return mainParameters.basicHeader.concat(parameterHeaders);
	}
	function getShortHeadersFromSelected() {
		var parameterHeaders = [];
		$.each(chosenParameters.additionalParameters, function(i, key) {
			parameterHeaders.push(key);
		});
		$.each(chosenParameters.allSelected, function(i, key) {
			var split = key.split(":");
			var table = "";
			var parameter = "";
			if (split.length === 2) {
				table = split[0];
				parameter = split[1];
			} else {
				table = window.metaDataTable;
				parameter = split[0];
			}
			if (chosenParameters.qf)
				parameterHeaders.push(qfHeader);
			parameterHeaders.push(getShortHeader(parameter, table));
		});
		return parameterHeaders.reverse();
	}
	function getHeadersFromSelected() {
		var parameterHeaders = [];
		$.each(chosenParameters.additionalParameters, function(i, key) {
			parameterHeaders.push(key);
		});
		$.each(chosenParameters.allSelected, function(i, key) {
			var split = key.split(":");
			var table = "";
			var parameter = "";
			if (split.length === 2) {
				table = split[0];
				parameter = split[1];
			} else {
				table = window.metaDataTable;
				parameter = split[0];
			}
			if (chosenParameters.qf)
				parameterHeaders.push(qfHeader);
			parameterHeaders.push(getHeader(parameter, table));
		});
		return parameterHeaders.reverse();
	}
	function getShortUnitsFromSelected() {
		var parameterUnits = [];
		$.each(chosenParameters.additionalParameters, function(i, key) {
			var split = key.split("(");
			var unit = "N/A";
			if (split.length > 1) {
				unit = split[split.length - 1];
				unit = unit.substring(0, unit.length - 1);
			}
			parameterUnits.push(unit);
		});
		$.each(chosenParameters.allSelected, function(i, key) {
			var split = key.split(":");
			var table = "";
			var parameter = "";
			if (split.length === 2) {
				table = split[0];
				parameter = split[1];
			} else {
				table = window.metaDataTable;
				parameter = split[0];
			}
			if (chosenParameters.qf)
				parameterUnits.push(qfHeader);
			parameterUnits.push(getUnits(parameter, table));
		});
		return parameterUnits.reverse();
	}

	function getShortHeader(parameter, table) {
		var header;
		try {
			header = allParametersShortHeader[table][parameter];
		} catch (e) {
			return parameter;
		}
		return header ? header : parameter;
	}

	function getUnits(parameter, table) {
		var units;
		try {
			units = allParametersUnit[table][parameter];
		} catch (e) {
			return "N/A";
		}
		if (!units && parameter.slice(-2) === "qf")
			units = "QF";
		return units ? units : "N/A";
	}

	function getShortMetadataHeaders() {
		var metaHeader = [];
		var metaTemp = mainParameters.parameters;
		if (mainParameters.chosenMetadata) {
			metaTemp = mainParameters.chosenMetadata;
		} else {
			metaTemp = metaTemp.slice().reverse();
		}
		$.each(metaTemp, function(i, val) {

			if (val === "date") {
				metaHeader.push("year");
				metaHeader.push("month");
				metaHeader.push("day");
			} else {
				if (val !== window.geometryParameter)
					metaHeader.push(getShortHeader(val, window.metaDataTable));
			}
		});
		return mainParameters.basicHeader.concat(metaHeader);
	}
	function getShortMetadataUnits() {
		var metaUnits = [];
		var metaTemp = mainParameters.parameters;
		if (mainParameters.chosenMetadata) {
			metaTemp = mainParameters.chosenMetadata;
		} else {
			metaTemp = metaTemp.slice().reverse();
		}
		$.each(metaTemp, function(i, val) {
			if (val === "date") {
				metaUnits.push("year");
				metaUnits.push("month");
				metaUnits.push("day_of_month");
			} else {
				if (val !== window.geometryParameter)
					metaUnits.push(getUnits(val, window.metaDataTable));
			}
		});
		return mainParameters.basicUnits.concat(metaUnits);
	}
	function getMetadata() {
		var meta = [];
		var metaTemp = mainParameters.parameters;
		if (mainParameters.chosenMetadata) {
			metaTemp = mainParameters.chosenMetadata;
		} else {
			metaTemp = metaTemp.slice().reverse();
		}
		$.each(metaTemp, function(i, val) {
			if (val !== window.geometryParameter)
				meta.push(val);
		});
		return meta;
	}

	function getShortHeadersFromFeatures(features) {
		if (debughP)
			console.log("getShortHeadersFromFeatures");
		var parameterHeaders = [];
		var feature = features[Object.keys(features)[0]];
		if (debughP)
			console.log(feature);
		if (!(typeof feature === 'undefined'))
			$.each(feature.properties, function(key) {
				var split = key.split(":");
				var table = "";
				var parameter = "";
				if (split.length === 2) {
					table = split[0];
					parameter = split[1];
				} else {
					table = window.metaDataTable;
					parameter = split[0];
				}
				if (debughP)
					console.log("Parameter:" + parameter);
				parameterHeaders.push(getShortHeader(parameter, table));
				/*
				 * // test if it is a qf if
				 * (parameter.substring(parameter.length -
				 * window.qfPostFix.length) === window.qfPostFix) {
				 * parameterHeaders.push(window.qfHeader); if (debughP)
				 * console.log("Found QF"); } else { if (debughP)
				 * console.log("NO QF");
				 * parameterHeaders.push(getHeader(parameter, table)); }
				 */
			});
		return mainParameters.basicHeader.concat(parameterHeaders);
	}

	// public interface
	return {
		// getters
		getShortHeadersFromFeatures : getShortHeadersFromFeatures,
		getHeadersFromFeatures : getHeadersFromFeatures,
		getHeaderFromRawData : getHeaderFromRawData,
		getMetadataHeaders : getMetadataHeaders,
		mainParameters : mainParameters,
		getTableHeader : getTableHeader,
		getHeader : getHeader,
		getShortMetadataHeaders : getShortMetadataHeaders,
		getShortHeadersFromSelected : getShortHeadersFromSelected,
		getMetadata : getMetadata,
		getShortMetadataUnits : getShortMetadataUnits,
		getShortUnitsFromSelected : getShortUnitsFromSelected,
		getTooltip : getTooltip,
		getShortHeader : getShortHeader,
		getHeadersFromSelected : getHeadersFromSelected,
		getShortHeaderFromRawData : getShortHeaderFromRawData,
		getDataTypeFromRawData:getDataTypeFromRawData,
		getUnitsFromRawData:getUnitsFromRawData,

		resetParametersSelection : resetParametersSelection,
		resetMetadataSelection : resetMetadataSelection,
		selectMetadata : selectMetadata,
		initiateParameters : initiateParameters,
		chosenParameters : chosenParameters,
		availableParameters : availableParameters,
		selectParameters : selectParameters,
		addNewParameters : addNewParameters,
	};

}(jQuery, myNamespace));