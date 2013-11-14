var myNamespace = myNamespace || {};

var debugtC = false;// debug flag

myNamespace.tableConstructor = (function($, hP) {
	"use strict";

	function parameterTable(features) {
		if (debugtC)
			console.log("tableConstructor.js: parameterTable: features=" + JSON.stringify(features));// TEST

		var header = "<table id='parametersResultTable' class='table'>", footer = "</tbody></table>", rows = "";
		var tableHeader = headerFrom(hP.getMetadataHeaders().concat(hP.getChosenHeader())) + "\n<tbody>";

		// iterate through all features, generate table row for each
		$.each(features, function(i, val) {
			var properties = val.properties;
			if (debugtC) {
				console.log("properties:");
				console.log(properties);
				console.log("property VALUES:");
				$.each(properties, function(i, property) {
					console.log(property);
				});
				console.log("property VALUES done");
			}
			if (debugtC)
				console.log("tableConstructor.js: parameterTable: val.properties=" + JSON.stringify(val.properties));// TEST
			if (debugtC)
				console.log("tableConstructor.js: parameterTable: val=" + JSON.stringify(val));// TEST

			var row = "<tr>";
			row += data(val.id);
			var pos = val.geometry.coordinates;
			if (debugtC)
				console.log("tableConstructor.js: parameterTable: pos=" + pos);// TEST
			row += data(pos[0]);
			row += data(pos[1]);

			// adding the data
			for (prop in properties) {
				var value = properties[prop];
				if (value == null)
					value = "";
				row += data(value);
			}

			rows += row + "</tr>\n";
		});
		return concatTable(header, tableHeader, rows, footer);
	}

	function generateStatistics(features) {
		var header = "<table id='generalStatisticsTable' class='table'>", footer = "</tbody></table>", rows = "";
		var headers = [ "Parameter", "Quantity", "Min", "Max", "Sum", "Average", "Sample Standard Deviation",
				"Variance" ];
		var tableHeader = headerFrom(headers);

		var selectedParameters = hP.chosenParameters.allSelected;
		var statistics = {};
		if (debugtC)
			console.log("generateStatistics1");
		$.each(selectedParameters, function(j, parameter) {
			statistics[parameter] = {
				"quantity" : 0,
				"sum" : 0.0,
				"sdSum" : 0.0
			};
		});
		if (debugtC)
			console.log("generateStatistics2");
		$.each(features, function(i, feature) {
			var properties = feature.properties;
			$.each(selectedParameters, function(j, parameter) {
				var parVal = properties[parameter];
				if (parVal != "" && parVal != null && !isNaN(parVal) && parVal != "-999") {
					parVal = parseFloat(parVal);
					statistics[parameter].quantity += 1;
					statistics[parameter].sum += parVal;
					if (typeof statistics[parameter].min === 'undefined') {
						statistics[parameter].min = parVal;
						statistics[parameter].max = parVal;
					} else {
						if (parVal < statistics[parameter].min) {
							statistics[parameter].min = parVal;
						} else if (parVal > statistics[parameter].max) {
							statistics[parameter].max = parVal;
						}
					}
				}
			});
		});

		$.each(selectedParameters, function(j, parameter) {
			var quantity = statistics[parameter].quantity;
			var sum = statistics[parameter].sum;
			statistics[parameter].average = sum / quantity;
		});
		if (debugtC)
			console.log("generateStatistics5");
		$.each(features, function(i, feature) {
			var properties = feature.properties;
			$.each(selectedParameters, function(j, parameter) {
				var parVal = properties[parameter];
				if (parVal != "" && parVal != null && !isNaN(parVal)) {
					parVal = parseFloat(parVal);
					statistics[parameter].sdSum += Math.pow(statistics[parameter].average - parVal, 2);
				}
			});
		});
		if (debugtC)
			console.log("generateStatistics3");
		// var output = "";
		$.each(selectedParameters, function(j, parameter) {
			var quantity = statistics[parameter].quantity;
			var sum = statistics[parameter].sum;
			var average = statistics[parameter].average;
			var variance = statistics[parameter].sdSum / quantity;
			var sd = Math.sqrt(statistics[parameter].sdSum / (quantity - 1));
			var parTable = parameter.split(":");
			var min = statistics[parameter].min;
			var max = statistics[parameter].max;
			var row = "<tr>";
			/*
			 * output += hP.getHeader(parTable[1], parTable[0]) + ": quantity:" +
			 * quantity + ", min:" + min + ", max:" + max + ", sum:" + sum + ",
			 * average:" + average + ", sample standard deviation:" + sd + ",
			 * variance:" + variance + "<br>";
			 */
			row += data(hP.getHeader(parTable[1], parTable[0]));
			row += data(quantity);
			row += data(min);
			row += data(max);
			row += data(sum);
			row += data(average);
			row += data(sd);
			row += data(variance);
			rows += row + "</tr>\n";
		});
		// output += "<br>";
		if (debugtC)
			console.log("generateStatistics4");
		return concatTable(header, tableHeader, rows, footer);
		// return output;
	}

	function featureTable(tableId, features) {

		var header = "<table id='" + tableId + "'class='table'>", tableHeader, footer = "</tbody></table>", rows = "", row = "";
		tableHeader = headerFrom(hP.getMetadataHeaders()) + "<tbody>";

		$.each(features, function(i, val) {
			var id = val.id, idStr = id.substring(id.indexOf(".") + 1), prop = null;

			row = data(idStr);

			// extract position of data point (lat,long)
			var pos = val.geometry.coordinates[0];
			row += data(pos);
			pos = val.geometry.coordinates[1];
			row += data(pos);

			// add all own (not inherited) properties to row
			for (prop in val.properties) {
				if (val.properties.hasOwnProperty(prop)) {
					if (val.properties[prop] != null)
						row += data(val.properties[prop]);
					else
						row += data("");
				}
			}
			rows += row + "</tr>";
		});

		return concatTable(header, tableHeader, rows, footer);
	}

	function concatTable(header, tableHeader, rows, footer) {
		return header + "\n" + tableHeader + "\n" + rows + footer;
	}

	// make a table data element string from a string element
	function data(element) {
		return "<td>" + element + "</td>";
	}

	// make a table header string from a list of header values
	function headerFrom(headers) {
		var headerString = "<thead>";
		$.each(headers, function(i, val) {
			headerString += "<th>" + val + "</th>";
		});

		return headerString + "</thead>";
	}

	function listItem(value, table) {
		return "<li id=\"" + table + ":" + value + "\"><a>" + hP.getHeader(value, table) + "</a></li>";
	}

	function metadataList() {
		var str = "<ul><li id=\"" + window.metaDataTable + "\"><a>Available metadata</a>";
		str += "<ul>";
		$.each(hP.mainParameters.parameters, function(i, val) {
			if (val != window.geometryParameter)
				str += listItem(val, window.metaDataTable);
		});
		str += "</ul></li>";
		str += "</ul>";
		return str;
	}

	function parametersList() {
		if (debugtC)
			console.log("Making parameters");
		var str = "<ul>";
		for ( var table in allLayers) {
			if (debugtC)
				console.log("tablesDone[table] where table= " + table);
			// If the paramters from the table has been initiated (through
			// ns.hP.initiateParameters())
			if (allLayers[table]) {
				str += "<li id=\"" + table + "\"><a>" + hP.getTableHeader(table) + "</a>";
				str += "<ul>";
				$.each(hP.availableParameters[table], function(i, val) {
					// Check if the parameter is not inherited from the
					// metadatatable
					if (hP.mainParameters.parameters.indexOf(val) == -1) {
						if (val.substring(val.length - 2) != qfPostFix)
							str += listItem(val, table);
					}
				});
				str += "</ul></li>";
			}
		}
		str += "</ul>";
		if (debugtC)
			console.log(str);
		return str;
	}

	return {
		metadataList : metadataList,
		generateStatistics : generateStatistics,
		parameterTable : parameterTable,
		featureTable : featureTable,
		parametersList : parametersList
	};

}(jQuery, myNamespace.handleParameters));