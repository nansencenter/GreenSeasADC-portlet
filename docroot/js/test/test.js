function runAllTests() {
	"use strict";

	testFilter();

	testTable();

	testDensity();
}

function testFilter() {
	"use strict";

	module("Filter");

	// reference to the module
	var filter = myNamespace.query;

	test("Null parameter input returns null filter", function() {
		var result = filter.constructFilter(null, null, null);
		equal(result, null, "Result object should be a null value");

		var result = filter.constructFilterString(null, null, null);
		equal(result, null, "Result string should also be a null value");
	});

	test("Bounding box filter test", function() {
		var bbox = new OpenLayers.Bounds(0, 0, 10, 10);
		var result = filter.constructFilter(bbox, null, null)
		var resultBbox = result.filters[0].value;

		equal(resultBbox, bbox,
				"Filter object's bbox is equal to the input bbox");
	});

	test(
			"Filter object to string conversion",
			function() {
				var expected = "<ogc:Filter xmlns:ogc=\"http://www.opengis.net/ogc\"><ogc:And><ogc:BBOX><ogc:PropertyName>point</ogc:PropertyName><gml:Box xmlns:gml=\"http://www.opengis.net/gml\"><gml:coordinates decimal=\".\" cs=\",\" ts=\" \">0,0 10,10</gml:coordinates></gml:Box></ogc:BBOX></ogc:And></ogc:Filter>";

				// construct and run some query
				var bbox = new OpenLayers.Bounds(0, 0, 10, 10);
				var resultString = filter.constructFilterString(bbox, null,
						null);

				equal(resultString, expected,
						"Produced string should be as expected");
			});

}

function testTable() {
	"use strict";

	module("TableConstructor");

	var tC = myNamespace.tableConstructor;

	test(
			"Parameter table construction",
			function() {

				// test data
				var featureA = {
					properties : {
						level : 1,
						value : 10,
						flag : 0
					}
				};
				var featureB = {
					properties : {
						level : 2,
						value : 20,
						flag : 0
					}
				};
				var featureC = {
					properties : {
						level : 3,
						value : 30,
						flag : 0
					}
				};
				var featureD = {
					properties : {
						level : 4,
						value : 40,
						flag : 0
					}
				};

				var features = [ featureA, featureB, featureC, featureD ];

				// generate table, split into lines
				var generatedTable = tC.parameterTable("testTable", features)
						.split(/\r\n|\r|\n/g);

				equal(generatedTable.length, features.length + 4,
						"Table should contain one row per feature, plus 4 for header/footer");

				equal(generatedTable[3],
						"<tr><td>1</td><td>10</td><td>0</td></tr>",
						"first data row should reflect first feature, correctly ordered");

				equal(generatedTable[3 + (features.length - 1)],
						"<tr><td>4</td><td>40</td><td>0</td></tr>",
						"last data row should reflect last feature, correctly ordered");
				
			});
}
function testDensity() {
	"use strict";

	module("Density");

	var density = myNamespace.densityCalculator.densityAtPressure;

	var within = QUnit.within;

	test(
			"Density calculation",
			function() {

				// epsilon is the max difference allowed between two floating
				// point numbers to be considered equal
				var expected = 0, salinity = 0, temperature = 0, pressure = 0, calulation = 0, epsilon = 0.5;

				console.log(1);
				salinity = 0;
				temperature = 5;
				pressure = 0;
				calulation = density(salinity, temperature, pressure);
				expected = 999.96675;
				within(calulation, expected, epsilon, "Article example 1");

				console.log(2);
				salinity = 0;
				temperature = 5;
				pressure = 1000;
				calulation = density(salinity, temperature, pressure);
				expected = 1044.12802;
				within(calulation, expected, epsilon, "Article example 2");

				console.log(3);
				salinity = 0;
				temperature = 25;
				pressure = 0;
				calulation = density(salinity, temperature, pressure);
				expected = 997.04796;
				within(calulation, expected, epsilon, "Article example 3");

				console.log(4);
				salinity = 0;
				temperature = 25;
				pressure = 1000;
				calulation = density(salinity, temperature, pressure);
				expected = 1037.90204;
				within(calulation, expected, epsilon, "Article example 4");

				console.log(5);
				salinity = 35;
				temperature = 5;
				pressure = 0;
				calulation = density(salinity, temperature, pressure);
				expected = 1027.67547;
				within(calulation, expected, epsilon, "Article example 5");

				console.log(6);
				salinity = 35;
				temperature = 5;
				pressure = 1000;
				calulation = density(salinity, temperature, pressure);
				expected = 1069.48914;
				within(calulation, expected, epsilon, "Article example 6");

				console.log(7);
				salinity = 35;
				temperature = 25;
				pressure = 0;
				calulation = density(salinity, temperature, pressure);
				expected = 1023.34306;
				within(calulation, expected, epsilon, "Article example 7");

				console.log(8);
				salinity = 35;
				temperature = 25;
				pressure = 1000;
				calulation = density(salinity, temperature, pressure);
				expected = 1062.53817;
				within(calulation, expected, epsilon, "Article example 8");
			});

	test("Pressure calculation", function() {
		ok(true);
	});
}
