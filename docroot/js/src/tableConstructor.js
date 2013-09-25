var myNamespace = myNamespace || {};

myNamespace.tableConstructor = (function($) {
	"use strict";

	function parameterTableTemperatures(tableId, features) {
		//alert("tableConstructor.js: parameterTableTemperatures: tableId="+tableId);//TEST
		//alert("tableConstructor.js: parameterTableTemperatures: features="+JSON.stringify(features));//TEST

		var header = "<table id='" + tableId + "'class='table'>", tableHeader, footer = "</tbody></table>", rows = "", row = "";
		tableHeader = headerFrom([ "ID", "Lat (dec.deg)", "Long  (dec.deg)", "Date",
		                           "Depth of sample (m)", "Temp. water body (deg.C)", "SST water body (deg.C)",
		                           "Temp. 5m (deg.C)", "Temp. 10m (deg.C)", "Temp CU01 (deg.C)",
		                           "Temp CU02 (deg.C)", "Temp ST01 (deg.C)", "Temp ST02 (deg.C)",
		                           "Temp MLD (deg.C)", "Depth Temp MLD (m)"]) + "\n<tbody>";

		// iterate through all features, generate table row for each
		$.each(features, function(i, val) {
			var property = val.properties;
			//alert("tableConstructor.js: parameterTable: val.properties="+JSON.stringify(val.properties));//TEST
			row = "<tr>";

			row += data(property.id);
			var pos = val.geometry.coordinates;
			//alert("tableConstructor.js: parameterTableTemperatures: pos="+pos);//TEST
			row += data(pos[0]);
			row += data(pos[1]);
			row += data(property.date);
			row += data(property.depth_of_sample);
			row += data(property.tempwbod);
			row += data(property.tempsst);
			row += data(property.temp5m);
			row += data(property.temp10m);
			row += data(property.tempcu01);
			row += data(property.tempcu02);
			row += data(property.tempst01);
			row += data(property.tempst02);
			row += data(property.tempmld);
			row += data(property.mixedld);

			rows += row + "</tr>\n";
		});
		//alert("tableConstrucktor: parameterTableTemperatures: tableHeader="+tableHeader);//TEST
		//alert("tableConstrucktor: parameterTableTemperatures: rows="+rows);//TEST

		return concatTable(header, tableHeader, rows, footer);
	}

	function parameterTable(tableId, features) {
		//alert("tableConstructor.js: parameterTable: tableId="+tableId);//TEST
		//alert("tableConstructor.js: parameterTable: features="+JSON.stringify(features));//TEST

		var header = "<table id='" + tableId + "'class='table'>", tableHeader, footer = "</tbody></table>", rows = "", row = "";
		tableHeader = headerFrom([ "ID", "Lat", "Long", "Date", "Temp. swater body", "SST water body",
		                           "Temp. 5m", "Temp. 10m", "Temp CU01", "Temp CU02", "Temp ST01", "Temp ST02",
		                           "Temp MLD", "Depth Temp MLD"]) + "\n<tbody>";

		// iterate through all features, generate table row for each
		$.each(features, function(i, val) {
			var property = val.properties;
			//alert("tableConstructor.js: parameterTable: val.properties="+JSON.stringify(val.properties));//TEST
			row = "<tr>";

			row += data(property.id);
			var pos = val.geometry.coordinates;
			//alert("tableConstructor.js: parameterTable: pos="+pos);//TEST
			row += data(pos[0]);
			row += data(pos[1]);
			row += data(property.date);
			row += data(property.tempwbod);
			row += data(property.tempsst);
			row += data(property.temp5m);
			row += data(property.temp10m);
			row += data(property.tempcu01);
			row += data(property.tempcu02);
			row += data(property.tempst01);
			row += data(property.tempst02);
			row += data(property.tempmld);
			row += data(property.mixedld);

			rows += row + "</tr>\n";
		});
		//alert("tableConstrucktor: parameterTable: tableHeader="+tableHeader);//TEST
		//alert("tableConstrucktor: parameterTable: rows="+rows);//TEST

		return concatTable(header, tableHeader, rows, footer);
	}
	
	function featureTable(tableId, features, headers) {

		var header = "<table id='" + tableId + "'class='table'>", tableHeader, footer = "</tbody></table>", rows = "", row = "";
		tableHeader = headerFrom(headers) + "<tbody>";

		var ids = [];
		$.each(features,
				function(i, val) {
					var id = val.id, idStr = id.substring(id
							.indexOf(".") + 1), prop = null;
					ids.push(idStr);

					row = "<tr onclick='myNamespace.control.viewParams("
							+ idStr + ")'>" + data(idStr);
					
					//extract position of data point (lat,long)
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

	return {
		parameterTableTemperatures : parameterTableTemperatures,
		parameterTable : parameterTable,
		featureTable : featureTable
	};

}(jQuery));