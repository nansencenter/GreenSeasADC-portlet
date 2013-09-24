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

	function parameterTableChlorophyll(tableId, features) {
		var header = "<table id='" + tableId + "'class='table'>", tableHeader, footer = "</tbody></table>", rows = "", row = "";
		tableHeader = headerFrom([ "ID", "Lat (dec.deg)", "Long (dec.deg)", "Date", "Depth of sample (m)",
		                           "1% light level(m)", "Total Chl-a (mg m-3)",
		                           "Total Phaeopigm. concent. (mg m-3)", "Total Chl-a <20 micro-m (mg m-3)",
		                           "Total Chl-a <5 micro-m (mg m-3)", "Total Chl-a <2 micro-m (mg m-3)",
		                           "Total Chl-a FLU 1 (mg m-3)", "Total Chl-a FLU 2 ()N mol/L", 
		                           "Water Optical Measure 1 (other)", "Water Optical Measure 2 (other)", 
		                           "Conv. factor TOKGPR0 (l/kg)"]) + "\n<tbody>";

		// iterate through all features, generate table row for each
		$.each(features, function(i, val) {
			var property = val.properties;
			row = "<tr>";

			row += data(property.id);
			var pos = val.geometry.coordinates;
			row += data(pos[0]);
			row += data(pos[1]);
			row += data(property.date);
			row += data(property.depth_of_sample);
			row += data(property.aperll);
			row += data(property.totchla);
			row += data(property.totphapig);
			row += data(property.totchlalt20mim);
			row += data(property.totchlalt5mim);
			row += data(property.totchlalt2mim);
			row += data(property.totchlflu1);
			row += data(property.totchlflu2);
			row += data(property.watoptmeas1);
			row += data(property.watoptmeas2);
			row += data(property.tokgpr01);

			rows += row + "</tr>\n";
		});

		return concatTable(header, tableHeader, rows, footer);
	}
	
	function parameterTablePlankton(tableId, features) {
		var header = "<table id='" + tableId + "'class='table'>", tableHeader, footer = "</tbody></table>", rows = "", row = "";
		tableHeader = headerFrom([ "ID", "Lat (dec.deg)", "Long (dec.deg)", "Date", "Depth of sample (m)", 
		                           "Pico plankton (# per ml)", "Nano plankton (# per ml)",
		                           "Nano plankton flow cyt. (# per ml)",
		                           "Nano plankton 10-15 micro-m  (# per ml)",
		                           "Nano plankton 15-20 micro-m (# per ml)",
		                           "Nano plankton 20-30 micro-m (# per ml)",
		                           "Nano plankton 30-50 micro-m (# per ml)",
		                           "Nano plankton 50-100 micro-m (# per ml)"]) + "\n<tbody>";

		// iterate through all features, generate table row for each
		$.each(features, function(i, val) {
			var property = val.properties;
			row = "<tr>";

			row += data(property.id);
			var pos = val.geometry.coordinates;
			row += data(pos[0]);
			row += data(pos[1]);
			row += data(property.date);
			row += data(property.depth_of_sample);
			row += data(property.picoplanmic);
			row += data(property.nanoplamic);
			row += data(property.nanoplaflow);
			row += data(property.nanopla10t15mim);
			row += data(property.nanopla15t20mim);
			row += data(property.nanopla20t30mim);
			row += data(property.nanopla30t50mim);
			row += data(property.nanopla50t100mim);

			rows += row + "</tr>\n";
		});

		return concatTable(header, tableHeader, rows, footer);
	}
	
	function selectedParameterTable(tableId, features) {
		var header = "<table id='" + tableId + "'class='table'>", tableHeader, footer = "</tbody></table>", rows = "", row = "";
		tableHeader = headerFrom([ "ID", "Lat (dec.deg)", "Long (dec.deg)", "Date", "Depth of sample (m)", 
		                           "Flagellate 2-20 micro-m (# per ml)", "Flagellate 2 micro-m (# per ml)",
		                           "Silico flag. (# per ml)",
		                           "Choano- flagellida (# per ml)", "Flagellate 5 micro-m (# per ml)",
		                           "Flagellate 15 micro-m (# per ml)", "Dinophyceae >20 m-m (# per ml)",
		                           "Dinophyceae >20 m-m hetero. (# per ml)", "Strom- bidium spp. (# per ml)",
		                           "Stro- bilidium spp. (# per ml)",
		                           "Ciliatea (# per ml)"]) + "\n<tbody>";

		// iterate through all features, generate table row for each
		$.each(features, function(i, val) {
			var property = val.properties;
			row = "<tr>";

			row += data(property.id);
			var pos = val.geometry.coordinates;
			row += data(pos[0]);
			row += data(pos[1]);
			row += data(property.date);
			row += data(property.depth_of_sample);
			row += data(property.p400e00b);
			row += data(property.p400m00a);
			row += data(property.p400m00e);
			row += data(property.p400m00f);
			row += data(property.p400m00k);
			row += data(property.p400m00r);
			row += data(property.c1a61382);
			row += data(property.b4116767);
			row += data(property.p985m00z);
			row += data(property.p861m00z);
			row += data(property.p500m17z);

			rows += row + "</tr>\n";
		});

		return concatTable(header, tableHeader, rows, footer);
	}
	
	function parameterTableFlagellate(tableId, features) {
		var header = "<table id='" + tableId + "'class='table'>", tableHeader, footer = "</tbody></table>", rows = "", row = "";
		tableHeader = headerFrom([ "ID", "Lat (dec.deg)", "Long (dec.deg)", "Date", "Depth of sample (m)", 
		                           "Flagellate 2-20 micro-m (# per ml)", "Flagellate 2 micro-m (# per ml)",
		                           "Silico flag. (# per ml)",
		                           "Choano- flagellida (# per ml)", "Flagellate 5 micro-m (# per ml)",
		                           "Flagellate 15 micro-m (# per ml)", "Dinophyceae >20 m-m (# per ml)",
		                           "Dinophyceae >20 m-m hetero. (# per ml)", "Strom- bidium spp. (# per ml)",
		                           "Stro- bilidium spp. (# per ml)",
		                           "Ciliatea (# per ml)"]) + "\n<tbody>";

		// iterate through all features, generate table row for each
		$.each(features, function(i, val) {
			var property = val.properties;
			row = "<tr>";

			row += data(property.id);
			var pos = val.geometry.coordinates;
			row += data(pos[0]);
			row += data(pos[1]);
			row += data(property.date);
			row += data(property.depth_of_sample);
			row += data(property.p400e00b);
			row += data(property.p400m00a);
			row += data(property.p400m00e);
			row += data(property.p400m00f);
			row += data(property.p400m00k);
			row += data(property.p400m00r);
			row += data(property.c1a61382);
			row += data(property.b4116767);
			row += data(property.p985m00z);
			row += data(property.p861m00z);
			row += data(property.p500m17z);

			rows += row + "</tr>\n";
		});

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
		parameterTableChlorophyll: parameterTableChlorophyll,
		parameterTablePlankton : parameterTablePlankton,
		parameterTableFlagellate: parameterTableFlagellate,
		selectedParameterTable: selectedParameterTable,
		parameterTable : parameterTable,
		featureTable : featureTable
	};

}(jQuery));