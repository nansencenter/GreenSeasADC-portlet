var myNamespace = myNamespace || {};

var debugwfs = false;// debug flag

myNamespace.WebFeatureService = (function($, OL) {
	"use strict";

	// fires an asyn. HTTP GET request to server
	function asyncGetRequest(parameters, callback) {
		OL.Request.GET({
			url : window.WFSServer,
			params : parameters,
			callback : callback
		});
	}

	// fires an asyn. HTTP POST request to window.WFSServer with "Content-Type"
	// : "text/xml;charset=utf-8"
	function asyncPostRequest(parametersXML, callback) {
		if (debugwfs)
			console.log("asyncRequest data: " + parametersXML);// TEST
		OL.Request.POST({
			url : window.WFSServer,
			data : parametersXML,
			headers : {
				"Content-Type" : "text/xml;charset=utf-8"
			},
			callback : callback
		});

	}

	function swapPosList(filter) {
		var newFilter = "";
		var xmlDoc;
		try {
			if (window.DOMParser) {
				parser = new DOMParser();
				xmlDoc = parser.parseFromString(filter, "text/xml");
			} else // Internet Explorer
			{
				xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
				xmlDoc.async = false;
				xmlDoc.loadXML(filter);
			}
			console.log(xmlDoc);
			var elements = $(xmlDoc).find("posList");
			console.log("BEFORE:");
			console.log(elements);
			$.each(elements,function(i,val){
				var stringArray = val.childNodes[0].nodeValue.split(" ");
				var output = "";
				for(var i = 0; i < stringArray.length;i = i+2){
					output += stringArray[i+1]+" "+stringArray[i]+" ";
				}
				val.childNodes[0].nodeValue = output;
			});
			console.log("AFTER:");
			console.log(elements);
		} catch (err) {
			return filter;
		}
		return new XMLSerializer().serializeToString(xmlDoc);
	}

	function convertParametersToGetFeatureXML(parameters) {
		var propertyName = "";
		if (parameters.PROPERTYNAME) {
			propertyName = "propertyName=\"" + window.database + ":" + parameters.PROPERTYNAME + "\" ";
		}
		var propertyNames = "";
		if (parameters.PROPERTYNAMES) {
			$.each(parameters.PROPERTYNAMES, function(i, val) {
				propertyNames += "<PropertyName>" + window.database + ":" + val + "</PropertyName>";
			});
		}
		var resultType = "";
		var outputFormat = "json";
		if (parameters.RESULTTYPE) {
			resultType = "resultType=\"" + parameters.RESULTTYPE + "\" ";
			outputFormat = "text/xml";
		}
		var filter = parameters.FILTER || "";
		console.log("-------------------filter-------------------");
		filter = swapPosList(filter);
		//console.log(filter);
		console.log("-------------------filter-------------------");
		var xml = "<GetFeature service=\"WFS\" version=\"1.1.0\" outputFormat=\"" + outputFormat + "\" " + propertyName
				+ resultType + "xmlns=\"http://www.opengis.net/wfs\" "
				+ "xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" "
				+ "xsi:schemaLocation=\"http://www.opengis.net/wfs http://schemas.opengis.net/wfs/1.1.0/wfs.xsd\">"
				+ "<Query typeName=\"" + window.database + ":" + parameters.TYPENAME
				+ "\" srsName=\"urn:ogc:def:crs:EPSG::4326\">" + propertyNames + filter + "</Query>" + "</GetFeature>";

		return xml;
	}

	// fires a GetFeature WFS request to server
	function getFeature(extraParameters, callback) {
		if (debugwfs)
			console.log("getFeature: calling asyncGetRequest()");// TEST
		// asyncGetRequest($.extend(parameters, extraParameters), callback);
		var parametersXML = convertParametersToGetFeatureXML(extraParameters);
		asyncPostRequest(parametersXML, callback);
	}

	function describeFeatureType(extraParameters, callback) {
		if (debugwfs)
			console.log("webFeatureService.js: start of describeFeatureType()");// TEST
		// some default parameters that will be set automatically if not
		// overridden in extraParams
		var parameters = {
			REQUEST : "DescribeFeatureType",
			SERVICE : "WFS",
			VERSION : "1.1.0",
			OUTPUTFORMAT : "XMLSCHEMA"
		};

		// extend provided parameters onto default parameters, make request
		if (debugwfs)
			console.log("webFeatureService.js: calling asyncGetRequest()");// TEST
		asyncGetRequest($.extend(parameters, extraParameters), callback);
	}

	// public interface
	return {
		getFeature : getFeature,
		describeFeatureType : describeFeatureType,
	};

}(jQuery, OpenLayers));
