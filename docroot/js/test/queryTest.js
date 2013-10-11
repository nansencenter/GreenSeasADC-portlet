queryTest = TestCase("queryTest");

var myNamespace = myNamespace || {};

queryTest.prototype.testSucceed = function() {
	assertEquals(1, 1);
};

queryTest.prototype.testConstructFilterStringNull = function() {
	var constructFilterString = myNamespace.query.constructFilterString(null,null,null,null);
	assertNull("Constructing a filter string with only null values should return null",constructFilterString);
};