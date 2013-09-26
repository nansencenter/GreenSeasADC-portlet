var myNamespace = myNamespace || {};

var debugwfs=false;//debug flag

myNamespace.WebFeatureService = (function(jQ, OL) {
	"use strict";

	var server = "http://localhost:8080/geoserver/cite/wfs", previousRequestParameters = null;
	server = "http://tomcat.nersc.no:8080/geoserver/greensad/wfs"; //NERSC 
	if (debugwfs) console.log("webFeatureService.js: server="+server);//TEST

	// fires an asyn. HTTP GET request to server
	function asyncGetRequest(parameters, callback) {
		
		previousRequestParameters = parameters;

		OL.Request.GET({
			url : server,
			params : parameters,
			callback : callback
		});
	}

	// fires a GetFeature WFS request to server
	function getFeature(extraParameters, callback) {
		if (debugwfs) console.log("webFeatureService.js: start of getFeature()");//TEST
		// some default parameters that will be set automatically if not
		// overridden in extraParams
		var parameters = {
			REQUEST : "GetFeature",
			SERVICE : "WFS",
			VERSION : "1.1.0",
			OUTPUTFORMAT : "json"
		};

		// extend provided parameters onto default parameters, make request
		if (debugwfs) console.log("webFeatureService.js: calling asyncGetRequest()");//TEST
		asyncGetRequest(jQ.extend(parameters, extraParameters), callback);
	}

	function getPreviousRequestParameters() {
		return previousRequestParameters;
	}

	// public interface
	return {
		getFeature : getFeature,
		getPreviousRequestParameters : getPreviousRequestParameters
	};

}(jQuery, OpenLayers));
