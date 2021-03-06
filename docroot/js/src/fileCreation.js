var myNamespace = myNamespace || {};

var debugfC = false;// debug flag

myNamespace.fileCreation = (function($, ns) {

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
	function createCSV(dataIn, headersIn) {
		var allHeaders = ns.handleParameters.getShortMetadataHeaders().concat(
				ns.handleParameters.getShortHeadersFromSelected());
		var allUnits = ns.handleParameters.getShortMetadataUnits().concat(
				ns.handleParameters.getShortUnitsFromSelected());
		var metaData = ns.handleParameters.getMetadata();
		var selected = metaData.concat(ns.handleParameters.chosenParameters.allSelected.slice().reverse()).concat(
				ns.handleParameters.chosenParameters.additionalParameters.slice().reverse());
		var csvContent = "sep=;\n" + createCSVHeader(allHeaders);
		csvContent += csvDelimiter + "Query:" + ns.mainQueryArray + "\n" + createCSVHeader(allUnits) + "\n";
		if (debugfC)
			console.log("Added headers: " + csvContent);
		var qf = ns.handleParameters.chosenParameters.qf;
		$.each(dataIn, function(i, val) {
			var properties = val.properties;
			csvContent += val.id + csvDelimiter;
			var pos = val.geometry.coordinates;
			csvContent += pos[0] + csvDelimiter;
			csvContent += pos[1] + "";

			for (var i = 0, l = selected.length; i < l; i++) {
				var prop = selected[i];
				if (properties.hasOwnProperty(prop)) {
					if (prop === "date") {
						if (properties[prop] === null) {
							csvContent += csvDelimiter + "N/A";
							csvContent += csvDelimiter + "N/A";
							csvContent += csvDelimiter + "N/A";
						} else {
							var date = new Date(properties[prop].replace("Z", ""));
							csvContent += csvDelimiter + date.getUTCFullYear();
							csvContent += csvDelimiter + (date.getUTCMonth() + 1);
							csvContent += csvDelimiter + date.getUTCDate();
						}
					} else {
						var value = properties[prop];
						if (value === null)
							value = "";
						csvContent += csvDelimiter + value;
						if (qf)
							if (prop.indexOf(":") !== -1) {
								value = properties[prop + window.qfPostFix];
								if (value === null)
									value = "";
								csvContent += csvDelimiter + value;
							}

					}
				} else {
					var value = "";
					csvContent += csvDelimiter + value;
					if (qf)
						if (prop.indexOf(":") !== -1) {
							value = properties[prop + window.qfPostFix];
							if (value === null)
								value = "";
							csvContent += csvDelimiter + value;
						}

				}
			}

			csvContent += "\n";
		});
		return csvContent;
	}

	function createNetCDFUsingHOne(features, fileName, callbackWhenDone) {

		var dataArray = [];
		var variables = null;
		var counter = 0;
		var metaData = ns.handleParameters.getMetadata();
		var selected = metaData.concat(ns.handleParameters.chosenParameters.allSelected.slice().reverse()).concat(
				ns.handleParameters.chosenParameters.additionalParameters.slice().reverse());
		// console.log([ "Selected:", selected ]);
		for (feature in features) {
			if (features.hasOwnProperty(feature)) {
				var properties = features[feature].properties;
				if (variables === null) {
					variables = {};
					// set standard name, long name, units, positive, etc
					variables.lat = {
						standard_name : "latitude",
						long_name : "Latitude of the observation",
						units : "degrees_north",
						dataType : "double"
					};
					variables.lon = {
						standard_name : "longitude",
						long_name : "Longitude of the observation",
						units : "degrees_east",
						dataType : "double"
					};
					variables.depth = {
						standard_name : "depth",
						long_name : "Depth below the surface",
						units : "m",
						axis : "Z",
						positive : "down",
						dataType : "double"
					};
					variables.time = {
						standard_name : "time",
						long_name : "Time of measurement",
						units : "minutes since 1970-01-01",
						dataType : "int"
					};
					for (var i = 0, l = selected.length; i < l; i++) {
						var prop = selected[i];
						// console.log("Checking: " + prop);
						if (prop !== depthParameterName && prop !== "time" && prop !== "depth" && prop !== "date"
								&& prop !== "lat" && prop != "lon") {
							var name = ns.utilities.convertAllIllegalCharactersToUnderscore(prop);
							var standardName = null, dataType = null, units = null;
							if (prop.indexOf(":") == -1) {
								standardName = ns.handleParameters
										.getShortHeaderFromRawData(metaDataTable + ":" + prop);
								dataType = ns.handleParameters.getDataTypeFromRawData(metaDataTable + ":" + prop);
								units = ns.handleParameters.getUnitsFromRawData(metaDataTable + ":" + prop);
							} else {
								standardName = ns.handleParameters.getShortHeaderFromRawData(prop);
								dataType = ns.handleParameters.getDataTypeFromRawData(prop);
								units = ns.handleParameters.getUnitsFromRawData(prop);
							}
							if (units === "°C")
								units = "Celsius";
							// This will only convert to string if the first
							// datapoint, if it does not have this property,
							// then it will not work!
							variables[name] = {
								standard_name : standardName,
								coordinates : "time lat lon depth",
								units : units,
								dataType : dataType
							};
						}
					}
				}
				var featureO = {};
				featureO.lat = features[feature].geometry.coordinates[0];
				featureO.lon = features[feature].geometry.coordinates[1];
				// convert time to correct unit
				var time = properties.date + ' ';
				// comment out this = daily data.. Hopefully no lon/lat
				// clashes
				// O.o

				if (!(typeof properties.time === 'undefined')) {
					// console.log("ADDIND TIME:" + properties.time);
					time += properties.time;
				} else {
					time += '12:00:00Z';
				}

				// 1900-1-1 is eariliest date!
				// This unit is "minutes since 1970-01-01"
				time = Math.round((Date.parse(time) / 60000) + 36816480);
				featureO.time = time;
				featureO.depth = properties[depthParameterName];
				for (var i = 0, l = selected.length; i < l; i++) {
					var prop = selected[i];
					if (properties.hasOwnProperty(prop)) {
						if (prop !== depthParameterName && prop !== "time" && prop !== "date" && prop !== "lat"
								&& prop != "lon") {
							var validProp = ns.utilities.convertAllIllegalCharactersToUnderscore(prop);
							var value = null;
							switch (variables[validProp].dataType) {
							case 'Double':
								value = parseFloat(properties[prop]);
								if (isNaN(value))
									value = null;
								break;
							case 'Int':
								value = parseInt(properties[prop]);
								if (value === -999)
									value = null;
								break;
							default:
								// String
								value = String(properties[prop]);
								if (value === "" || value === "null")
									value = null;
								break;
							}
							// console.log(["DATATYPE:",validProp,value,variables[validProp].dataType]);
							// console.log("TEST");
							// console.log(ns.utilities.convertAllIllegalCharactersToUnderscore(prop));
							// console.log(variables);
							if (value !== null) {
								featureO[ns.utilities
										.convertAllIllegalCharactersToUnderscore(variables[validProp].standard_name)] = value;
							}
						}
					}
				}
				counter++;
				dataArray.push(featureO);
			}
		}
		// converting to standard names
		var newVariables = {};
		$.each(variables, function(prop, val) {

			if (prop !== depthParameterName && prop !== "time" && prop !== "date" && prop !== "lat" && prop != "lon") {
				newVariables[ns.utilities.convertAllIllegalCharactersToUnderscore(val.standard_name)] = val;
			} else {
				newVariables[prop] = val;
			}
		});

		var data = {};
		data[portletNameSpace + 'data'] = JSON.stringify(dataArray);
		data[portletNameSpace + 'variables'] = JSON.stringify(newVariables);
		data[portletNameSpace + 'numberOfFeatures'] = counter;
		console.log("DATA dataArray:");
		console.log(dataArray);
		console.log(newVariables);
		data[portletNameSpace + 'requestType'] = 'createNetCDFUsingH.1';

		var failure = function() {
			console.log("SOMETHING WENT WRONG!");
			ns.errorMessage.showErrorMessage("There was an error in the response from the server.");
			callbackWhenDone();
		};

		var success = function(event, id, obj) {
			try {
				obj = JSON.parse(obj.response);
				url = window.ajaxCallResourceURL + '&requestType=serveNetCDFFile&fileID='
						+ encodeURIComponent(obj.fileID);
				downloadFile(url);
			} catch (e) {
				console.log("The query seems to be too long?");
				ns.errorMessage.showErrorMessage("There was an error in the response from the server.");
			}
			callbackWhenDone();
		};
		ns.ajax.aui(data, success, failure);
	}
	
	function downloadFile(sUrl) {
		isChrome = navigator.userAgent.toLowerCase().indexOf('chrome') > -1;
		isSafari = navigator.userAgent.toLowerCase().indexOf('safari') > -1;
		// If in Chrome or Safari - download via virtual link click
		if (isChrome || isSafari) {
			// Creating new link node.
			var link = document.createElement('a');
			link.href = sUrl;

			if (link.download !== undefined) {
				// Set HTML5 download attribute. This will prevent file from
				// opening if supported.
				var fileName = sUrl.substring(sUrl.lastIndexOf('/') + 1, sUrl.length);
				link.download = fileName;
			}

			// Dispatching click event.
			if (document.createEvent) {
				var e = document.createEvent('MouseEvents');
				e.initEvent('click', true, true);
				link.dispatchEvent(e);
				return true;
			}
		}
		window.open(sUrl);
	}

	function createNetCDFGrid(features, parameter, timeResolution, latLonResolution) {
		// TODO: QF
		var latArray = [];
		var lonArray = [];
		var depthArray = [];
		var allDepth = [];
		var timeArray = [];
		var variables = [];
		var allVariablesValues = {};
		var descriptions = {};

		// todo:additionalparamteres
		var addVariables = ns.handleParameters.chosenParameters.allSelected;

		// TODO: sort by el timeo!
		$.each(addVariables, function(i, val) {
			allVariablesValues[val] = [];
			variables.push(val);
			var header = (myNamespace.handleParameters.getHeaderFromRawData(val)).split("(");
			var unit = "NO_UNIT";
			var long_name = header[0];
			if (header.length == 2)
				unit = header[1].substring(0, header[1].length - 1);
			var descr = [ val, long_name, unit ];
			descriptions[val] = descr;
		});

		// data
		var depthInterpolation = [];
		// from: inclusive, to: exclusive
		depthInterpolation.push({
			from : -10,
			to : 10,
			value : 5
		});
		depthInterpolation.push({
			from : 10,
			to : 50,
			value : 30
		});
		depthInterpolation.push({
			from : 50,
			to : 200,
			value : 125
		});
		depthInterpolation.push({
			from : 200,
			to : 1000,
			value : 600
		});
		depthInterpolation.push({
			from : 1000,
			to : 100000,
			value : 1500
		});
		var minLat = 90, maxLat = -90;
		var minLon = 180, maxLon = -180;
		var allTimesObject = {};
		$.each(features, function(i, val) {
			var properties = val.properties;
			if (typeof properties.date === 'undefined') {
				alert("Date is needed in the metadata");
				return false;
			}
			// Need depth atm
			if (properties[depthParameterName] != null) {

				var depth = parseFloat(properties[depthParameterName]);
				var found = false;
				for (i in depthInterpolation) {
					var interpolation = depthInterpolation[i];
					// console.log(interpolation);
					if (depth >= interpolation.from && depth < interpolation.to) {
						depth = interpolation.value;
						found = true;
						if (allDepth.indexOf(depth) < 0)
							allDepth.push(depth);
						break;
					}
					// console.log("NOT:"+depth);
					// console.log(depth >= interpolation.from);
					// console.log(depth < interpolation.to);
				}
				if (found) {
					depthArray.push(depth);
					// 1 hour off?
					var time = properties.date + ' ';
					// comment out this = daily data.. Hopefully no lon/lat
					// clashes
					// O.o
					/*
					 * if (!(typeof properties.time === 'undefined')) { time+=
					 * properties.time; }
					 */
					// 1900-1-1 is eariliest date! This unit is "minutes since
					// 1900-01-01"
					time = Math.round((Date.parse(time) / 60000) + 36816480);
					time = Math.round(time / timeResolution) * timeResolution;
					timeArray.push(time);
					if (typeof allTimesObject[time] === 'undefined')
						allTimesObject[time] = time;
					var pos = val.geometry.coordinates;
					var latInt = Math.round(parseFloat(pos[0]) - 0.5);
					var lonInt = Math.round(parseFloat(pos[1]) - 0.5);
					latArray.push(latInt + ".5");
					lonArray.push(lonInt + ".5");
					if (minLat > latInt)
						minLat = latInt;
					if (maxLat < latInt)
						maxLat = latInt;
					if (minLon > lonInt)
						minLon = lonInt;
					if (maxLon < lonInt)
						maxLon = lonInt;

					for (prop in allVariablesValues) {
						var value = properties[prop];
						if (value == null || typeof value === 'undefined' || value == -999)
							value = "";
						allVariablesValues[prop].push(value);
					}
				} else
					console.log("Depth not found:" + depth);
			}
		});

		var allTimes = [];
		for ( var key in allTimesObject)
			allTimes.push(allTimesObject[key]);
		allTimes.sort();

		// TODO: special case with only 1 coordinate (like polarfront)
		if (minLat == maxLat)
			if (minLat > -85) {
				minLat -= 3;
				if (maxLat < 85)
					maxLat += 3;
			} else
				maxLat += 3;
		if (minLon == maxLon)
			if (minLon > -175) {
				minLon -= 3;
				if (maxLon < 175)
					maxLon += 3;
			} else
				maxLon += 3;
		var allLat = [];
		for (var i = minLat; i <= maxLat; i++) {
			allLat.push(i + ".5");
		}
		var allLon = [];
		for (var i = minLon; i <= maxLon; i++) {
			allLon.push(i + ".5");
		}
		var jsonData = {};
		jsonData['allDepth'] = allDepth;
		jsonData['allLat'] = allLat;
		jsonData['allLon'] = allLon;
		jsonData['allTimes'] = allTimes;
		jsonData['latArray'] = latArray;
		jsonData['lonArray'] = lonArray;
		jsonData['depthArray'] = depthArray;
		jsonData['timeArray'] = timeArray;
		jsonData['variables'] = variables;
		// $.each(variables, function(i, val) {
		jsonData['allVariables'] = allVariablesValues;
		jsonData['allDescriptions'] = descriptions;
		// });

		data[portletNameSpace + 'jsonData'] = JSON.stringify(jsonData);
		console.log("DATA REQUEST:");
		console.log(jsonData);

		AUI().use('aui-io-request', function(A) {
			// data to be sent to server

			A.io.request(url, {
				data : data,
				dataType : 'json',

				on : {
					failure : function() {
						alert("SOMETHING WENT WRONG!");
					},

					success : function(event, id, obj) {
						console.log("Great success!");
					}
				}

			});
		});
	}
	return {
		createNetCDFUsingHOne : createNetCDFUsingHOne,
		createCSV : createCSV
	};
}(jQuery, myNamespace));