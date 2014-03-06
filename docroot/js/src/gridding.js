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
	var legendPallete = [ [ 0, 0, 143 ], [ 0, 0, 159 ], [ 0, 0, 175 ], [ 0, 0, 191 ], [ 0, 0, 207 ], [ 0, 0, 223 ],
			[ 0, 0, 239 ], [ 0, 0, 255 ], [ 0, 11, 255 ], [ 0, 27, 255 ], [ 0, 43, 255 ], [ 0, 59, 255 ],
			[ 0, 75, 255 ], [ 0, 91, 255 ], [ 0, 107, 255 ], [ 0, 123, 255 ], [ 0, 139, 255 ], [ 0, 155, 255 ],
			[ 0, 171, 255 ], [ 0, 187, 255 ], [ 0, 203, 255 ], [ 0, 219, 255 ], [ 0, 235, 255 ], [ 0, 251, 255 ],
			[ 7, 255, 247 ], [ 23, 255, 231 ], [ 39, 255, 215 ], [ 55, 255, 199 ], [ 71, 255, 183 ], [ 87, 255, 167 ],
			[ 103, 255, 151 ], [ 119, 255, 135 ], [ 135, 255, 119 ], [ 151, 255, 103 ], [ 167, 255, 87 ],
			[ 183, 255, 71 ], [ 199, 255, 55 ], [ 215, 255, 39 ], [ 231, 255, 23 ], [ 247, 255, 7 ], [ 255, 247, 0 ],
			[ 255, 231, 0 ], [ 255, 215, 0 ], [ 255, 199, 0 ], [ 255, 183, 0 ], [ 255, 167, 0 ], [ 255, 151, 0 ],
			[ 255, 135, 0 ], [ 255, 119, 0 ], [ 255, 103, 0 ], [ 255, 87, 0 ], [ 255, 71, 0 ], [ 255, 55, 0 ],
			[ 255, 39, 0 ], [ 255, 23, 0 ], [ 255, 7, 0 ], [ 246, 0, 0 ], [ 228, 0, 0 ], [ 211, 0, 0 ], [ 193, 0, 0 ],
			[ 175, 0, 0 ], [ 158, 0, 0 ], [ 140, 0, 0 ] ];

	function setUpGriddingVariables() {
		var selectElement = "<select id=\"griddingParameter\">";
		var selectedParameters = myNamespace.handleParameters.chosenParameters.allSelected;
		var options = myNamespace.matchup.generateOptionsFromAllSelectedParameters();
		selectElement += options + "</select>";
		$("#griddingVariableDiv").html(selectElement);
	}

	function krigingImage(features, parameter, model, sigma2, alpha) {
		// parameter = "v7_chlorophyll:cphlflp1";
		console.log(parameter);
		var values = [];
		var lon = [];
		var lat = [];
		$.each(features, function(i, val) {
			var pos = val.geometry.coordinates;
			lat.push(parseFloat(pos[0]));
			lon.push(parseFloat(pos[1]));
			var value = parseFloat(val.properties[parameter]);
			values.push(value);
		});
		console.log(lat);
		console.log(lon);
		console.log(values);

		// var model = "exponential";
		// var sigma2 = 0, alpha = 100;
		var variogram = kriging.train(values, lon, lat, model, parseFloat(sigma2), parseFloat(alpha));

		var scale = 10;
		var minx = lon.min(), miny = lat.min(), maxx = lon.max(), maxy = lat.max();
		var height = parseInt(maxy - miny);
		var width = parseInt(maxx - minx);
		var row_padding = (4 - (width * scale * 3) % 4) % 4, num_data_bytes = (width * scale * 3 + row_padding)
				* height * scale, num_file_bytes = 54 + num_data_bytes;

		/*
		 * ! Generate Bitmap Data URL http://mrcoles.com/low-res-paint/
		 * 
		 * Copyright 2010, Peter Coles Licensed under the MIT licenses.
		 * http://mrcoles.com/media/mit-license.txt
		 * 
		 * Date: Tue Oct 26 00:00:00 2010 -0500
		 */
		var image = 'data:image/bmp;base64,', file = 'BM' + // "Magic Number"
		_asLittleEndianHex(num_file_bytes, 4) + // size of the file (bytes)*
		'\x00\x00' + // reserved
		'\x00\x00' + // reserved
		'\x36\x00\x00\x00' + // offset of where BMP data lives (54 bytes)
		'\x28\x00\x00\x00' + // number of remaining bytes in header from here
		// (40 bytes)
		_asLittleEndianHex(width * scale, 4) + // the width of the bitmap in
												// pixels*
		_asLittleEndianHex(height * scale, 4) + // the height of the bitmap in
												// pixels*
		'\x01\x00' + // the number of color planes (1)
		'\x18\x00' + // 24 bits / pixel
		'\x00\x00\x00\x00' + // No compression (0)
		_asLittleEndianHex(num_data_bytes, 4) + // size of the BMP data (bytes)*
		'\x13\x0B\x00\x00' + // 2835 pixels/meter - horizontal resolution
		'\x13\x0B\x00\x00' + // 2835 pixels/meter - the vertical resolution
		'\x00\x00\x00\x00' + // Number of colors in the palette (keep 0 for
		// 24-bit)
		'\x00\x00\x00\x00' + // 0 important colors (means all colors are
		// important)
		createImage(height, width, variogram, scale, row_padding, minx, miny);
		var img = document.createElement('img');
		img.src = image + btoa(file);
		img.alt = 'If you can read this, your browser probably doesn\'t support the data URL scheme format! Oh no!';
		img.title = 'You generated an image, great job! To save it, drag it to your Desktop or right click and select save as.';
		img_parent = document.getElementById('krigingImg');
		if (img_parent === null) {
			img_parent = document.createElement('div');
			img_parent.id = 'krigingImg';
			document.getElementById('krigingDiv').appendChild(img_parent);
		}
		// img_parent.innerHTML = '<div class="img-header">Generated Image
		// &nbsp;<a title="hide image" href="#">x</a></div>';
		img_parent.appendChild(img);

		return;
	}

	function _asLittleEndianHex(value, bytes) {
		// Convert value into little endian hex bytes
		// value - the number as a decimal integer (representing bytes)
		// bytes - the number of bytes that this value takes up in a string

		// Example:
		// _asLittleEndianHex(2835, 4)
		// > '\x13\x0b\x00\x00'

		var result = [];

		for (; bytes > 0; bytes--) {
			result.push(String.fromCharCode(value & 255));
			value >>= 8;
		}

		return result.join('');
	}

	function createImage(height, width, variogram, scale, row_padding, minx, miny) {
		// [13, 10, Object, 2, 0.05, 1.82, -20.9734, 34.2282]
		console.log([ height, width, variogram, scale, row_padding, minv, maxv, minx, miny ]);
		var result = [];
		var padding = '';
		for (; row_padding > 0; row_padding--) {
			padding += '\x00';
		}
		var image = [];
		var maxv = null, minv = null;
		for ( var i = 0; i < height; i++) {

			image.push(newrow = []);
			for ( var j = 0; j < width; j++) {
				var value = kriging.predict(minx + j, miny + i, variogram);
				image[i][j] = value;
				if (minv == null || minv > value)
					minv = value;
				if (maxv == null || maxv < value)
					maxv = value;
			}
		}

		var range = maxv - minv;
		for ( var i = 0; i < height; i++) {
			for ( var k = 0; k < scale; k++) {
				for ( var j = 0; j < width; j++) {
					for ( var l = 0; l < scale; l++) {
						var value = image[i][j];
						value = parseInt(((value - minv) / range) * 62);
						result.push(String.fromCharCode(legendPallete[62-value][0])
								+ String.fromCharCode(legendPallete[62-value][1])
								+ String.fromCharCode(legendPallete[62-value][2]));
						/*
						 * console.log("Added value at "+(minx + j)+","+(miny +
						 * i)+ " as " + value +"|"+Math.floor(((value - minv) /
						 * range) * 255));
						 */
					}
				}
				result.push(padding);
			}
		}
		/*
		 * $.each(result,function(i,val){ console.log(val);
		 * 
		 * console.log(val.length); });
		 */
		return result.join('');
	}

	function createGrid(features, parameter, timeResolution, latLonResolution) {
		latLonResolution = parseInt(latLonResolution);
		// TODO: check valid value
		$.each(features, function(i, val) {
			console.log(val);
			var pos = val.geometry.coordinates;
			if (typeof val.properties["original_lat"] === 'undefined')
				val.properties["original_lat"] = pos[0];
			if (typeof val.properties["original_lon"] === 'undefined')
				val.properties["original_lon"] = pos[1];
			pos[0] = (Math.floor(val.properties["original_lat"] / latLonResolution) + 0.5) * latLonResolution;
			pos[1] = (Math.floor(val.properties["original_lon"] / latLonResolution) + 0.5) * latLonResolution;
		});
	}

	function createNetCDF(features, parameter, timeResolution, latLonResolution) {
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
		createGrid : createGrid,
		kriging : krigingImage,
		setUpGriddingVariables : setUpGriddingVariables
	};

}(jQuery));
var polygons = [ [ [ -24, -10, -10, -24, -24, ], [ 50, 50, 40, 40, 50, ] ], ];
