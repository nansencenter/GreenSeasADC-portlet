var myNamespace = myNamespace || {};

var debughP = false;// debug flag

myNamespace.handleParameters = (function($) {
	// TODO: make this a hashtable of hashtable, it must store the type of the
	// variable: i.e. string, date, point, boolean, for comparison purposes
	var depthParameterName = "depth_of_sample";

	var availableParameters = {
		v4_temperature : [ "id", "location", "point", "date", "time", "depth_of_sample", "tempwbod", "tempwbqf",
				"tempsst", "tempsstqf", "temp5m", "temp5mqf", "temp10m", "temp10mqf", "tempcu01", "tempcu01qf",
				"tempcu02", "tempcu02qf", "tempst01", "tempst01qf", "tempst02", "tempst02qf", "tempmld", "tempmldqf",
				"mixedld", "mixedldqf" ]
	};
	var allParametersHeader = {
		v4_temperature : [ "Location", "Point", "Date", "time", "Depth of sample (m)", "Temp. water body (deg.C)",
				"tempwbqf", "SST water body (deg.C)", "tempsstqf", "Temp. 5m (deg.C)", "temp5mqf", "Temp. 10m (deg.C)",
				"temp10mqf", "Temp CU01 (deg.C)", "tempcu01qf", "Temp CU02 (deg.C)", "tempcu02qf", "Temp ST01 (deg.C)",
				"tempst01qf", "Temp ST02 (deg.C)", "tempst02qf", "Temp MLD (deg.C)", "tempmldqf", "Depth Temp MLD (m)",
				"mixedldqf" ]
	};
	mainParameters = {
		parameters : [ "location", "point", "depth_of_sea", "depth_of_sample", "date", "time" ],
		basicHeader : [ "ID", "Lat (dec.deg)", "Long (dec.deg)" ],
		customHeader : [ "Area", "Depth of Sea (m)", "Depth of Sample (m)", "Date", "Time" ]
	};
	mainTable = {
		name : "gsadb3"
	};
	var tableHeader = {
		v4_temperature : "Physical",
		v5_plankton : "Plankton",
		v4_flagellate : "Flagellate",
		v4_chlorophyll : "Light/Chlorophyll"
	};
	var chosenParameters = {
		parametersByTable : {},
		allSelected : [],
		tablesSelected : []
	};

	function selectParameters(par) {
		chosenParameters.allSelected = [];
		chosenParameters.tablesSelected = [];
		chosenParameters.parametersByTable = {};
		$.each(par, function(i, val) {
			var parArr = val.getAttribute("id").split(":");
			if (debughP)
				console.log("Checking val: " + parArr[0] + ":" + parArr[1]);
			// if the parameter is an actual available parameter in that table
			// (minor check for error)
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

	function getHeader(parameter, table) {
		var index = availableParameters[table].indexOf(parameter);
		if (index == -1) {
			return null;
		} else
			return allParametersHeader[table][index];
	}

	function getTableHeader(table) {
		return tableHeader[table];
	}

	function getChosenHeader() {
		chosenHeader = [];
		for ( var i = chosenParameters.allSelected.length - 1; i >= 0; i--) {
			var parArr = chosenParameters.allSelected[i].split(":");
			chosenHeader.push(getHeader(parArr[1], parArr[0]));
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
		if (table == mainTable.name) {
			mainParameters.parameters = parameters;
		} else {
			// Check if headers match (at least on the length)
			if (allParametersHeader[table] == null || allParametersHeader[table].length != parameters.length)
				allParametersHeader[table] = parameters;
			availableParameters[table] = parameters;
		}
		if (debughP)
			console.log("Initialized " + table + " to:" + parameters);
		return table;

	}
	// public interface
	return {
		depthParameterName : depthParameterName,
		mainTable : mainTable,
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