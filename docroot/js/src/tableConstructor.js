var myNamespace = myNamespace || {};

var debugtC = true;// debug flag

myNamespace.tableConstructor = (function($, hP) {
	"use strict";

	var basicHeader = [ "ID", "Lat (dec.deg)", "Long  (dec.deg)" ];

	function parameterTableTemperatures(tableId, features) {
		if (debugtC)
			console.log("tableConstructor.js: parameterTableTemperatures: tableId=" + tableId);// TEST
		if (debugtC)
			console.log("tableConstructor.js: parameterTableTemperatures: features=" + JSON.stringify(features));// TEST

		var header = "<table id='" + tableId + "'class='table'>", tableHeader, footer = "</tbody></table>", rows = "", row = "";
		tableHeader = headerFrom(basicHeader.concat(hP.getChosenHeader())), +"\n<tbody>";

		// iterate through all features, generate table row for each
		$.each(features, function(i, val) {
			var property = val.properties;
			if (debugtC)
				console.log("tableConstructor.js: parameterTable: val.properties=" + JSON.stringify(val.properties));// TEST
			if (debugtC)
				console.log("tableConstructor.js: parameterTable: val=" + JSON.stringify(val));// TEST

			row = "<tr>";
			row += data(property.id);
			var pos = val.geometry.coordinates;
			if (debugtC)
				console.log("tableConstructor.js: parameterTableTemperatures: pos=" + pos);// TEST
			row += data(pos[0]);
			row += data(pos[1]);
			$.each(hP.getChosenParameters(), function(i, val) {
				row += data(property[val]);
			});
			rows += row + "</tr>\n";
		});
		if (debugtC)
			console.log("tableConstrucktor: parameterTableTemperatures: tableHeader=" + tableHeader);// TEST
		if (debugtC)
			console.log("tableConstrucktor: parameterTableTemperatures: rows=" + rows);// TEST

		return concatTable(header, tableHeader, rows, footer);
	}

	function featureTable(tableId, features, headers) {

		var header = "<table id='" + tableId + "'class='table'>", tableHeader, footer = "</tbody></table>", rows = "", row = "";
		tableHeader = headerFrom(headers) + "<tbody>";

		var ids = [];
		$.each(features, function(i, val) {
			var id = val.id, idStr = id.substring(id.indexOf(".") + 1), prop = null;
			ids.push(idStr);

			row = "<tr onclick='myNamespace.control.viewParams()'>" + data(idStr);

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

		return {
			table : concatTable(header, tableHeader, rows, footer),
			ids : ids
		};
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

	function list(value, table) {
		if (debugtC)
			console.log("Retrieving list for " + table+ ":"+value);
		return "<li id=\"" + table + ":" + value + "\"><a href=\"#\">" + hP.getHeader(value, table) + "</a></li>";
	}

	function parametersList(tablesDone) {
		if (debugtC)
			console.log("Making parameters");
		str = "<ul>";
		for ( var table in tablesDone) {
			console.log("tablesDone[table] where table= " +table );
			if (tablesDone[table]) {
				str += "<li id=\"" + table + "\"><a href=\"#\">" + hP.getTableHeader(table) + "</a>";
				str += "<ul>";
				$.each(hP.availableParameters[table], function(i, val) {
					str += list(val, table);
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
		parameterTableTemperatures : parameterTableTemperatures,
		featureTable : featureTable,
		parametersList : parametersList
	};

}(jQuery, myNamespace.handleParameters));