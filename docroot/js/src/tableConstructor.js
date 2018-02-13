var myNamespace = myNamespace || {};

var debugtC = false;// debug flag

myNamespace.tableConstructor = (function($, ns) {
	"use strict";

	function generateStatistics(features) {
		var header = "<table id='generalStatisticsTable' class='table'>", footer = "</tbody></table>", rows = "";
		var headers = [ "Parameter", "Quantity", "Min", "Max", "Average", "Median", "Lower quartile", "Upper quartile",
				"Sample Standard Deviation", "Variance" ];
		var tableHeader = headerFrom(headers);

		var selectedParameters = ns.handleParameters.chosenParameters.allSelected.slice();

		$.each(ns.handleParameters.chosenParameters.additionalParameters, function(j, parameter) {
			if (parameter.indexOf("Model value for ") === 0) {
				selectedParameters.push(parameter);
			} else {
				console.log([ j, parameter, parameter.indexOf("Model value for ") ]);
			}
		});

		var statistics = {};
		$.each(selectedParameters, function(j, parameter) {
			statistics[parameter] = {
				"quantity" : 0,
				"sum" : 0.0,
				"sdSum" : 0.0,
				values : []
			};
		});
		$.each(features, function(i, feature) {
			var properties = feature.properties;
			$.each(selectedParameters, function(j, parameter) {
				var parVal = properties[parameter];
				if (parVal !== "" && parVal !== null && !isNaN(parVal) && parVal !== "-999") {
					parVal = parseFloat(parVal);
					statistics[parameter].quantity += 1;
					statistics[parameter].values.push(parVal);
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

		// calculate quartiles
		$
				.each(
						selectedParameters,
						function(j, parameter) {
							statistics[parameter].values.sort(function(a, b) {
								return a - b
							});
							var numbers = statistics[parameter].values.length;
							if (numbers % 2 === 0) {
								statistics[parameter].median = (statistics[parameter].values[numbers / 2] + statistics[parameter].values[(numbers / 2) - 1]) / 2;
								if (numbers % 4 === 0) {
									statistics[parameter].lowerq = (statistics[parameter].values[numbers / 4] + statistics[parameter].values[(numbers / 4) - 1]) / 2;
									statistics[parameter].upperq = (statistics[parameter].values[(numbers / 4) * 3] + statistics[parameter].values[((numbers / 4) * 3) - 1]) / 2;
								} else {
									statistics[parameter].lowerq = statistics[parameter].values[Math.floor(numbers / 4)];
									statistics[parameter].upperq = statistics[parameter].values[Math
											.floor(numbers * 3 / 4)];
								}
							} else {
								statistics[parameter].median = statistics[parameter].values[Math.floor(numbers / 2)];
								var n = Math.floor(numbers / 4);
								if (numbers % 4 === 1) {
									statistics[parameter].lowerq = (statistics[parameter].values[n] * 0.75 + statistics[parameter].values[n - 1] * 0.25);
									statistics[parameter].upperq = (statistics[parameter].values[3 * n] * 0.75 + statistics[parameter].values[3 * n + 1] * 0.25);

								} else {
									statistics[parameter].lowerq = (statistics[parameter].values[n] * 0.75 + statistics[parameter].values[n + 1] * 0.25);
									statistics[parameter].upperq = (statistics[parameter].values[3 * n + 1] * 0.25 + statistics[parameter].values[3 * n + 2] * 0.75);
								}
							}
						});

		$.each(selectedParameters, function(j, parameter) {
			var quantity = statistics[parameter].quantity;
			var sum = statistics[parameter].sum;
			statistics[parameter].average = sum / quantity;
		});
		$.each(features, function(i, feature) {
			var properties = feature.properties;
			$.each(selectedParameters, function(j, parameter) {
				var parVal = properties[parameter];
				if (parVal !== "" && parVal !== null && !isNaN(parVal)) {
					parVal = parseFloat(parVal);
					statistics[parameter].sdSum += Math.pow(statistics[parameter].average - parVal, 2);
				}
			});
		});
		$.each(selectedParameters, function(j, parameter) {
			var quantity = statistics[parameter].quantity;
			var sum = statistics[parameter].sum;
			var average = statistics[parameter].average;
			var median = statistics[parameter].median;
			var lowerq = statistics[parameter].lowerq;
			var upperq = statistics[parameter].upperq;
			var variance = statistics[parameter].sdSum / quantity;
			var sd = Math.sqrt(statistics[parameter].sdSum / (quantity - 1));
			var parTable = parameter.split(":");
			var min = statistics[parameter].min;
			var max = statistics[parameter].max;
			var row = "<tr>";
			if (parTable.length === 2)
				row += data(ns.handleParameters.getHeader(parTable[1], parTable[0]));
			else
				row += data(parameter);
			row += data(quantity);
			row += data(min);
			row += data(max);
			// row += data(sum);
			row += data(average.toFixed(3));
			row += data(median.toFixed(3));
			row += data(lowerq.toFixed(3));
			row += data(upperq.toFixed(3));
			row += data(sd.toFixed(3));
			row += data(variance.toFixed(3));
			rows += row + "</tr>\n";
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

	function generateTooltip(par, table) {
		return " title='<b>" + ns.handleParameters.getShortHeader(par, table) + "</b>:"
				+ ns.handleParameters.getTooltip(par, table) + "'";
	}

	function listItem(value, table, header) {
		displayed.push(table + ":" + value);
		if (typeof header === "undefined")
			header = ns.handleParameters.getHeader(value, table);
		return "<li id='" + table + ":" + value + "' data-baseheader='" + header + "' data-index='0'><a"
				+ generateTooltip(value, table) + ">" + header + "</a></li>";
	}

	function metadataList() {
		var str = "<ul><li id=\"" + window.metaDataTable + "\"><a>Available metadata</a>";
		str += "<ul>";
		$.each(ns.handleParameters.mainParameters.parameters, function(i, val) {
			if (val !== window.geometryParameter)
				str += listItem(val, window.metaDataTable);
		});
		str += "</ul></li>";
		str += "</ul>";
		return str;
	}

	var displayed = [];

	function parametersList(multi) {
		if (typeof multi === 'undefined')
			multi = [ 0, 2 ];
		if (debugtC)
			console.log("Making parameters");
		displayed = [];
		var str = "<ul>";
		var groupLayers = [];
		$.each(window.combinedParameters, function(i, val) {
			if (window.combinedParameters[i].method === "groupLayers") {
				groupLayers.push(i);
			}
		});
		var tablesDoneInGroup = [];
		$.each(groupLayers, function(i, groupLayer) {
			var group = window.combinedParameters[groupLayer];
			str += "<li id=\"" + groupLayer + "\" rel='noBox' data-baseheader='" + group.header + "' data-index='"
					+ window.combinedParameters[groupLayer].index + "'><a"
					+ generateTooltip(groupLayer.split(":")[1], "combined") + ">" + group.header + "</a>";
			str += "<ul>";
			$.each(group.parameters, function(j, table) {
				tablesDoneInGroup.push(table);
				str += generateListElementOfTable(table, multi);
			});
			str += "</ul></li>";
		});
		for ( var table in allLayers) {
			if (allLayers.hasOwnProperty(table)) {
				if (debugtC)
					console.log("tablesDone[table] where table= " + table);
				if (tablesDoneInGroup.indexOf(table) === -1)
					str += generateListElementOfTable(table, multi);
			}
		}
		str += "</ul>";
		if (debugtC)
			console.log(str);
		return str;
	}

	function generateListElementOfTable(table, multi) {
		var str = "";
		if (allLayers[table]) {
			// Find combinations:
			var combinations = [];
			var multiCombinations = [];
			$.each(window.combinedParameters, function(i, val) {
				if (window.combinedParameters[i].layer === table) {
					var found = false;
					for (var j = 0, l = multi.length; !found && j < l; j++) {
						if (window.combinedParameters[i].method === ("multi" + multi[j])) {
							found = true;
						}
					}
					if (found)
						multiCombinations.push(i);
					else
						combinations.push(i);
				}
			});
			combinations = multiCombinations.concat(combinations);
			var header = ns.handleParameters.getTableHeader(table);
			str += "<li id=\"" + table + "\" rel='noBox' data-baseheader='" + header + "' data-index='-100'><a>"
					+ header + "</a>";
			str += "<ul>";
			// Add combined parameters to the top:
			$.each(combinations, function(j, comb) {
				str += setupCombination(comb, multi);
			});
			$.each(ns.handleParameters.availableParameters[table], function(i, val) {
				// Check if the parameter is already written
				if (displayed.indexOf(table + ":" + val) === -1) {
					// Check if the parameter is not to be combined:
					var found = false;
					for (var j = 0, l = combinations.length; !found && j < l; j++) {
						var parArr = window.combinedParameters[combinations[j]].parameters;
						for (var k = 0, l2 = parArr.length; !found && k < l2; k++)
							if (val === parArr[k])
								found = true;
					}
					// Check if the parameter is not inherited from the
					// metadatatable
					if (!found && ns.handleParameters.mainParameters.parameters.indexOf(val) === -1) {
						if (val.substring(val.length - qfPostFix.length) !== qfPostFix)
							str += listItem(val, table);
					}
				}

			});
			str += "</ul></li>";
		}
		return str;
	}

	function setupCombination(comb, multiArr) {
		var str = "";
		if (displayed.indexOf(comb) === -1) {
			var table = window.combinedParameters[comb].layer;
			var rel = "";
			var group = false;
			var multi = false;
			var wrongmulti = false;
			if (window.combinedParameters[comb].method === "group") {
				rel = " rel='noBox'";
				group = true;
			} else {
				var method = window.combinedParameters[comb].method;
				if (method.indexOf("multi") === 0) {
					var multiInt = parseInt(method.substring(5));
					if (multiArr.indexOf(multiInt) > -1) {
						rel = " rel='noBox'";
						multi = true;
					} else {
						wrongmulti = true;
					}
				}
			}
			if (!wrongmulti) {
				displayed.push(comb);
				var combHeader = ns.handleParameters.getTableHeader(comb);
				str += "<li id='" + comb + "'" + rel + " data-baseheader='" + combHeader + "' data-index='"
						+ window.combinedParameters[comb].index + "'><a"
						+ generateTooltip(comb.split(":")[1], "combined") + ">" + combHeader + "</a>";
				str += "<ul>";
				$.each(window.combinedParameters[comb].parameters, function(i, val) {
					if (multi) {
						var splitString = val.split(":");
						if (splitString[0] === "combined") {
							str += setupCombination(val, multiArr);
						} else if (allLayers[splitString[0]]) {
							str += listItem(splitString[1], splitString[0]);
						}
					} else if (group) {
						var header = ns.handleParameters.getHeader(val, table).replace(combHeader + " - ", "");
						str += listItem(val, table, header);
					} else
						str += listItem(val, table);
				});
				str += "</ul></li>";
			}
		}
		return str;
	}

	function generateAoColumns(data) {
		var allHeaders = ns.handleParameters.getMetadataHeaders().concat(ns.handleParameters.getHeadersFromSelected());
		if (debugtC) {
			console.log("generateAoColumns");
			console.log(allHeaders);
		}
		var aoColumns = [];
		$.each(allHeaders, function(i, val) {
			aoColumns.push({
				"sTitle" : val
			});
		});
		return aoColumns;
	}

	function generateTableData(data) {
		var metaData = ns.handleParameters.getMetadata();
		var selected = metaData.concat(ns.handleParameters.chosenParameters.allSelected.slice().reverse()).concat(
				ns.handleParameters.chosenParameters.additionalParameters.slice().reverse());
		if (debugtC) {
			console.log("generateTableData");
			console.log(selected);
		}
		var tableData = [];
		var qf = ns.handleParameters.chosenParameters.qf;
		$.each(data, function(id, val) {
			var row = [];
			row.push(id);
			// lat
			row.push(val.geometry.coordinates[1]);
			// lon
			row.push(val.geometry.coordinates[0]);

			var properties = val.properties;
			for (var i = 0, l = selected.length; i < l; i++) {
				var prop = selected[i];
				if (properties.hasOwnProperty(prop)) {
					if (properties[prop] !== null){
						var value = properties[prop];
						if (prop == 'Date'){
							if (value.length == 11 && value.substr(value.length - 1) == 'Z')
								value = value.substr(0, value.length - 1);
						}
						row.push(value);
					}
					else
						row.push("");
				} else {
					row.push("");
				}
				// Add the quality flag
				if (qf) {
					// If its not metadata
					if (prop.indexOf(":") !== -1) {
						var value = properties[prop + window.qfPostFix];
						if (typeof value === 'undefined' || value === null)
							value = "";
						row.push(value);
					}
				}
			}
			// Add the row to the output
			tableData.push(row);
		});
		if (debugtC) {
			console.log(tableData);
		}
		return tableData;
	}

	return {
		metadataList : metadataList,
		generateStatistics : generateStatistics,
		parametersList : parametersList,
		generateAoColumns : generateAoColumns,
		generateTableData : generateTableData
	};

}(jQuery, myNamespace));