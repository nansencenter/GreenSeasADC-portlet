var myNamespace = myNamespace || {};

var debuga = false;// debug flag

myNamespace.ajax = (function($) {
	"use strict";

	function aui(data, success, failure) {
		if (typeof failure === 'undefined')
			failure = function() {
			};
		AUI().use('aui-io-request', function(A) {
			A.io.request(ajaxCallResourceURL, {
				// data to be sent to server
				data : data,
				dataType : 'json',

				on : {
					failure : failure,
					success : success
				}
			});
		});
	}
	var lastGetLayersFromNetCDFFileCall = null;
	function getLayersFromNetCDFFile(useOpendap, opendapDataURL) {
		var identifier = myNamespace.utilities.rand();
		lastGetLayersFromNetCDFFileCall = identifier;
		if (debuga) {
			console.log("Started getLayersFromNetCDFFile");
		}
		var data = {};
		data[portletNameSpace + 'requestType'] = "getLayersFromNetCDFFile";
		if (useOpendap)
			data[portletNameSpace + 'opendapDataURL'] = opendapDataURL;
		var success = function() {
			if (identifier === lastGetLayersFromNetCDFFileCall) {
				// JSON Data coming back from Server
				var responseData = this.get('responseData');
				myNamespace.control.viewParameterNames(responseData);
			}
		};
		var failure = function() {
			$("#compareRaster")
					.html(
							"An error occured when fetching the data. Please try again or contact the administrators on greenseas-adbc(at)nersc.no.");
		};
		aui(data, success, failure);
	}

	var lastGetDatavaluesFromRasterCall = null;
	function getDatavaluesFromRaster(dataRequest, data) {
		if (debuga) {
			console.log("Started getDatavaluesFromRaster");
			console.log(JSON.stringify(dataRequest));
		}
		var identifier = myNamespace.utilities.rand();
		lastGetDatavaluesFromRasterCall = identifier;
		var failure = function() {
			myNamespace.errorMessage
					.showErrorMessage("Something went wrong when fetching the datavalues from the raster");
		};

		var success = function() {
			if (identifier === lastGetDatavaluesFromRasterCall) {
				var instance = this;

				// JSON Data coming back from Server
				var responseData = instance.get('responseData');
				myNamespace.matchup.compareData(responseData, data);

			}
		};
		aui(dataRequest, success, failure);

	}

	var lastGetDimensionCall = null;
	function getDimension(rasterParameter) {
		var identifier = myNamespace.utilities.rand();
		lastGetDimensionCall = identifier;
		if (debuga) {
			console.log("Started getDimension");
		}
		var data = {};
		data[portletNameSpace + 'rasterParameter'] = rasterParameter;
		data[portletNameSpace + 'requestType'] = 'getMetaDimensions';

		var failure = function() {
			myNamespace.errorMessage
					.showErrorMessage("Something went wrong when fetching the dimensions from the raster!");
		};

		var success = function() {
			// JSON Data coming back from Server
			if (identifier === lastGetDimensionCall) {
				var responseData = this.get('responseData');
				myNamespace.matchup.setUpParameterMetaSelector(responseData);
			} else {
				if (debuga)
					console.log("DENIED");
			}
		};
		aui(data, success, failure);
	}

	var lastGetLonghurstPolygonCall = null;
	function getLonghurstPolygon(region) {
		var identifier = myNamespace.utilities.rand();
		lastGetLonghurstPolygonCall = identifier;
		if (!window.polygon)
			window.polygon = {};
		if (debuga) {
			console.log("Started getDimension");
		}
		var url = ajaxCallResourceURL;
		var data = {};
		data[portletNameSpace + 'longhurstRegion'] = region;
		data[portletNameSpace + 'requestType'] = 'getLonghurstPolygon';

		$.ajax({
			url : url,
			// data to be sent to server
			data : data,
			dataType : 'json',
			async : false,
			error : function() {
				myNamespace.errorMessage.showErrorMessage("Something went wrong when fetching the longhurst region");
			},
			success : function(result, status, xhr) {
				if (identifier === lastGetLonghurstPolygonCall) {
					window.polygon[region] = result[region];
				}
			}
		});
	}
	// public interface
	return {
		getLonghurstPolygon : getLonghurstPolygon,
		getDimension : getDimension,
		getLayersFromNetCDFFile : getLayersFromNetCDFFile,
		getDatavaluesFromRaster : getDatavaluesFromRaster
	};

}(jQuery));
