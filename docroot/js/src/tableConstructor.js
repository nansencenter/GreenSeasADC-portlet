var myNamespace = myNamespace || {};

var debugtC = false;// debug flag

myNamespace.tableConstructor = (function($, hP) {
	"use strict";

	function parameterTable(features) {
		if (debugtC)
			console.log("tableConstructor.js: parameterTable: features=" + JSON.stringify(features));// TEST

		var header = "<table id='parametersResultTable' class='table'>", footer = "</tbody></table>", rows = "";
		var tableHeader = headerFrom(hP.mainParameters.basicHeader.concat(hP.mainParameters.customHeader).concat(
				hP.getChosenHeader())) +"\n<tbody>";

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

	function featureTable(tableId, features) {

		var header = "<table id='" + tableId + "'class='table'>", tableHeader, footer = "</tbody></table>", rows = "", row = "";
		tableHeader = headerFrom(hP.mainParameters.basicHeader.concat(hP.mainParameters.customHeader)) + "<tbody>";

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
					row += data(val.properties[prop]);
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

	function parametersList() {
		if (debugtC)
			console.log("Making parameters");
		str = "<ul>";
		for ( var table in allLayers) {
			if (debugtC)
				console.log("tablesDone[table] where table= " + table);
			if (allLayers[table]) {
				str += "<li id=\"" + table + "\"><a>" + hP.getTableHeader(table) + "</a>";
				str += "<ul>";
				$.each(hP.availableParameters[table], function(i, val) {
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
		parameterTable : parameterTable,
		featureTable : featureTable,
		parametersList : parametersList
	};

}(jQuery, myNamespace.handleParameters));