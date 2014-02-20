var myNamespace = myNamespace || {};

var debuga = false;// debug flag

myNamespace.ajax = (function($) {
	"use strict";

	function aui(data, success, failure) {
		if (typeof failure === 'undefined')
			failure = function() {
			};
		AUI().use('aui-io-request', function(A) {
			A.io.request(ajaxCallResourceURL, {
				// data to be sent to server
				data : data,
				dataType : 'json',

				on : {
					failure : failure,
					success : success
				}
			});
		});
	}
	var lastGetLayersFromNetCDFFileCall = null;
	function getLayersFromNetCDFFile(useOpendap, opendapDataURL) {
		var identifier = myNamespace.utilities.rand();
		lastGetLayersFromNetCDFFileCall = identifier;
		if (debuga) {
			console.log("Started getLayersFromNetCDFFile");
		}
		var data = {};
		data[portletNameSpace + 'requestType'] = "getLayersFromNetCDFFile";
		if (useOpendap)
			data[portletNameSpace + 'opendapDataURL'] = opendapDataURL;
		var success = function() {
			if (identifier == lastGetLayersFromNetCDFFileCall) {
				// JSON Data coming back from Server
				var responseData = this.get('responseData');
				myNamespace.control.viewParameterNames(responseData);
			}
		};
		var failure = function() {
			$("#compareRaster")
					.html(
							"An error occured when fetching the data. Please try again or contact the administrators on greenseas-adbc(at)nersc.no.");
		};
		aui(data, success, failure);
	}

	var lastGetDatavaluesFromRasterCall = null;
	function getDatavaluesFromRaster(dataRequest, data) {
		if (debuga) {
			console.log("Started getDatavaluesFromRaster");
			console.log(JSON.stringify(dataRequest));
		}
		var identifier = myNamespace.utilities.rand();
		lastGetDatavaluesFromRasterCall = identifier;
		var failure = function() {
			myNamespace.errorMessage
					.showErrorMessage("Something went wrong when fetching the datavalues from the raster");
		};

		var success = function() {
			if (identifier == lastGetDatavaluesFromRasterCall) {
				var instance = this;

				// JSON Data coming back from Server
				var responseData = instance.get('responseData');
				myNamespace.matchup.compareData(responseData, data);

			}
		};
		aui(dataRequest, success, failure);

	}

	var lastGetDimensionCall = null;
	function getDimension(rasterParameter) {
		var identifier = myNamespace.utilities.rand();
		lastGetDimensionCall = identifier;
		if (debuga) {
			console.log("Started getDimension");
		}
		var data = {};
		data[portletNameSpace + 'rasterParameter'] = rasterParameter;
		data[portletNameSpace + 'requestType'] = 'getMetaDimensions';

		var failure = function() {
			myNamespace.errorMessage
					.showErrorMessage("Something went wrong when fetching the dimensions from the raster!");
		};

		var success = function() {
			// JSON Data coming back from Server
			if (identifier == lastGetDimensionCall) {
				var responseData = this.get('responseData');
				myNamespace.matchup.setUpParameterMetaSelector(responseData);
			} else {
				if (debuga)
					console.log("DENIED");
			}
		};
		aui(data, success, failure);
	}

	var lastGetLonghurstPolygonCall = null;
	function getLonghurstPolygon(region) {
		var identifier = myNamespace.utilities.rand();
		lastGetLonghurstPolygonCall = identifier;
		if (!window.polygon)
			window.polygon = {};
		if (debuga) {
			console.log("Started getDimension");
		}
		var url = ajaxCallResourceURL;
		var data = {};
		data[portletNameSpace + 'longhurstRegion'] = region;
		data[portletNameSpace + 'requestType'] = 'getLonghurstPolygon';

		$.ajax({
			url : url,
			// data to be sent to server
			data : data,
			dataType : 'json',
			async : false,
			error : function() {
				myNamespace.errorMessage.showErrorMessage("Something went wrong when fetching the longhurst region");
			},
			success : function(result, status, xhr) {
				if (identifier == lastGetLonghurstPolygonCall) {
					window.polygon[region] = result[region];
				}
			}
		});
	}

	function createNetCDF(features,timeResolution) {
		// TODO: QF
		var url = ajaxCallResourceURL;
		var data = {};
		data[portletNameSpace + 'requestType'] = 'createNetCDF';

		var latArray = [];
		var lonArray = [];
		var depthArray = [];
		var allDepth = [];
		var timeArray = [];
		var variables = [];
		var allVariablesValues = {};
		var descriptions = {};

		var addVariables = myNamespace.handleParameters.chosenParameters.allSelected;

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
					time = Math.round(time/timeResolution)*timeResolution;
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
		for ( var i = minLat; i <= maxLat; i++) {
			allLat.push(i + ".5");
		}
		var allLon = [];
		for ( var i = minLon; i <= maxLon; i++) {
			allLon.push(i + ".5");
		}
		var jsonData = {};
		jsonData[ 'allDepth'] = allDepth;
		jsonData[  'allLat'] = allLat;
		jsonData[  'allLon'] = allLon;
		jsonData[  'allTimes'] = allTimes;
		jsonData[ 'latArray'] = latArray;
		jsonData[ 'lonArray'] = lonArray;
		jsonData[ 'depthArray'] = depthArray;
		jsonData[ 'timeArray'] = timeArray;
		jsonData[ 'variables'] = variables;
//		$.each(variables, function(i, val) {
		jsonData[ 'allVariables'] = allVariablesValues;
		jsonData[ 'allDescriptions'] = descriptions;
//		});

		data[portletNameSpace + 'jsonData']=JSON.stringify(jsonData);
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
	// public interface
	return {
		getLonghurstPolygon : getLonghurstPolygon,
		getDimension : getDimension,
		getLayersFromNetCDFFile : getLayersFromNetCDFFile,
		getDatavaluesFromRaster : getDatavaluesFromRaster,
		createNetCDF : createNetCDF,
	};

}(jQuery));
