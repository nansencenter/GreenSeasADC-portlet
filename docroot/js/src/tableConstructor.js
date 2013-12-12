var myNamespace = myNamespace || {};

var debugtC = false;// debug flag

myNamespace.tableConstructor = (function($, hP) {
	"use strict";

	function parameterTable(features) {
		if (debugtC)
			console.log("tableConstructor.js: parameterTable: features=" + JSON.stringify(features));// TEST

		var header = "<table id='parametersResultTable' class='table'>", footer = "</tbody></table>", rows = "";

		var parameterHeaders = hP.getHeadersFromFeatures(features);
		var tableHeader = headerFrom(parameterHeaders) + "\n<tbody>";

		// iterate through all features, generate table row for each
		$.each(features, function(i, val) {
			var row = "<tr>";
			row += data(val.id);
			var pos = val.geometry.coordinates;
			row += data(pos[0]);
			row += data(pos[1]);

			// adding the data
			var properties = val.properties;
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
		tableHeader = headerFrom(hP.getHeadersFromFeatures(features)) + "<tbody>";

		$.each(features, function(i, val) {
			var id = i;

			row = data(id);

			// extract position of data point (lat,long)
			var pos = val.geometry.coordinates[0];
			row += data(pos);
			pos = val.geometry.coordinates[1];
			row += data(pos);

			// add all properties to row
			for (prop in val.properties) {
				if (val.properties[prop] != null)
					row += data(val.properties[prop]);
				else
					row += data("");
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

	function listItem(value, table, header) {
		if (typeof header == "undefined")
			header = hP.getHeader(value, table);
		return "<li id=\"" + table + ":" + value + "\"><a>" + header + "</a></li>";
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
				// Find combinations:
				var combinations = [];
				$.each(window.combinedParameters, function(i, val) {
					if (window.combinedParameters[i].layer == table) {
						combinations.push(i);
					}
				});
				str += "<li id=\"" + table + "\" rel='noBox'><a>" + hP.getTableHeader(table) + "</a>";
				str += "<ul>";
				// Add combined parameters to the top:
				$.each(combinations, function(j, comb) {
					var rel = "";
					var group = false;
					if (window.combinedParameters[comb].method == "group") {
						rel = " rel='noBox'";
						group = true;
					}
					var combHeader = hP.getTableHeader(comb);
					str += "<li id='" + comb + "'" + rel + "><a>" + combHeader + "</a>";
					str += "<ul>";
					$.each(window.combinedParameters[comb].parameters, function(i, val) {
						if (group) {
							var header = hP.getHeader(val, table).replace(combHeader, "");
							str += listItem(val, table, header);
						} else
							str += listItem(val, table);
					});
					str += "</ul></li>";
				});
				$.each(hP.availableParameters[table], function(i, val) {
					// Check if the parameter is not to be combined:
					var found = false;
					for ( var j = 0; !found && j < combinations.length; j++) {
						var parArr = window.combinedParameters[combinations[j]].parameters;
						for ( var k = 0; !found && k < parArr.length; k++)
							if (val == parArr[k])
								found = true;
					}
					// Check if the parameter is not inherited from the
					// metadatatable
					if (!found && hP.mainParameters.parameters.indexOf(val) == -1) {
						if (val.substring(val.length - qfPostFix.length) != qfPostFix)
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