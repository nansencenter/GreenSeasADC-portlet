var myNamespace = myNamespace || {};

var debugGr = false;// debug flag

myNamespace.gridding = (function($) {
	"use strict";

	function setUpGridSelector() {
		var array = [ {
			name : "Day",
			value : 1440
		}, {
			name : "Week",
			value : 10080
		}, {
			name : "Month",
			value : 43830
		}, {
			name : "Year",
			value : 525960
		}, {
			name : "Decade",
			value : 5259600
		}, {
			name : "Century",
			value : 52596000
		} ];
		var timeResSelector = "Time resolution: "
				+ myNamespace.utilities.setUpSelectorArray(array, "timeResolution", "timeResolution");
		// TODO: set min/max
		var latLonResSelector = " Resolution in degrees:<input type='number' id='latLonResolution' value='1' min='1' max='90' style='width:50px'/>";
		$("#gridSelectorDiv").html(timeResSelector + latLonResSelector);
	}

	function createGrid(features, parameter, timeResolution, latLonResolution) {
		console.log(parameter);
		var values = [];
		var lon = [];
		var lat = [];
		$.each(features, function(i, val) {
			var pos = val.geometry.coordinates;
			lat.push(parseFloat(pos[0]));
			lon.push(parseFloat(pos[1]));
			values.push(parseFloat(val.properties[parameter]));
		});
		console.log(lat);
		console.log(lon);
		console.log(values);
		var longrange = [ lon.min(), lon.max() ];
		var latrange = [ lat.min(), lat.max() ];
		var model = "exponential";
		var sigma2 = 0, alpha = 100;
		console.log(0);
		var x = new kriging("mycanvas", 1);
		console.log(1);
		x.krig(lon, lat, values, polygons);
		console.log(2);
		x.map([ longrange.mean(), latrange.mean() ], 3);
		console.log(3);

		// variogram = kriging.train(values, lon, lat, model, sigma2, alpha);

		return;
		// TODO: QF
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
		for ( var i = minLat; i <= maxLat; i++) {
			allLat.push(i + ".5");
		}
		var allLon = [];
		for ( var i = minLon; i <= maxLon; i++) {
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

	// public interface
	return {
		setUpGridSelector : setUpGridSelector,
		createGrid : createGrid
	};

}(jQuery));
var polygons = [ [ [ -24, -10, -10, -24, -24, ], [ 50, 50, 40, 40, 50, ] ], ];
