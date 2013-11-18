var myNamespace = myNamespace || {};

var debugwms = false;// debug flag

myNamespace.WebMapService = (function(jQ, OL) {
	"use strict";

	// fires an asyn. HTTP GET request to server
	function asyncGetRequest(parameters, callback, url) {
		OL.Request.GET({
			url : url,
			params : parameters,
			callback : callback
		});
	}

	function getCapabilities(callback, url) {
		// some default parameters that will be set automatically if not
		// overridden in extraParams
		var parameters = {
			REQUEST : "GetCapabilities",
			SERVICE : "WMS",
			VERSION : "1.3.0",
		};

		// extend provided parameters onto default parameters, make request
		asyncGetRequest(parameters, callback, url);
	}

	function getMetadata(callback, url, layer) {
		var parameters = {
			REQUEST : "GetMetadata",
			SERVICE : "WMS",
			VERSION : "1.3.0",
			layerName : layer,
			item : "layerDetails"
		};
		asyncGetRequest(parameters, callback, url);
	}

	function getMinMax(callback, url, layer,elevation,time,bbox,srs) {
		var parameters = {
				REQUEST : "GetMetadata",
				SERVICE : "WMS",
				VERSION : "1.3.0",
				layers : layer,
				item : "minmax",
				srs:"EPSG:4326",
				bbox:"-180,-90,180,90",
				width: 50, // Request only a small box to save extracting lots of data
	            height: 50,
			};
		if (!(typeof bbox === 'undefined') && bbox != "") {
			parameters.bbox = bbox;
		}
		if (!(typeof srs === 'undefined') && srs != "") {
			parameters.srs = srs;
		}
		if (!(typeof elevation === 'undefined') && elevation != "") {
			parameters.elevation = elevation;
		}
		if (!(typeof time === 'undefined') && time != "") {
			parameters.time = time;
		}
			asyncGetRequest(parameters, callback, url);
	}

	function getTimesteps(callback, url, layer, day) {
		var parameters = {
			REQUEST : "GetMetadata",
			SERVICE : "WMS",
			VERSION : "1.3.0",
			layerName : layer,
			item : "timesteps",
			day : day + 'T00:00:00Z'
		};
		asyncGetRequest(parameters, callback, url);
	}

	// public interface
	return {
		getMetadata : getMetadata,
		getCapabilities : getCapabilities,
		getTimesteps : getTimesteps,
		getMinMax : getMinMax,
	};

}(jQuery, OpenLayers));
