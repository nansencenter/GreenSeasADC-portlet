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
	function getLayersFromNetCDFFile(useOpendap, opendapDataURL) {
		if (debuga) {
			console.log("Started getLayersFromNetCDFFile");
		}
		var data = {};
		data[portletNameSpace + 'requestType'] = "getLayersFromNetCDFFile";
		if (useOpendap)
			data[portletNameSpace + 'opendapDataURL'] = opendapDataURL;
		var success = function() {
			// JSON Data coming back from Server
			var responseData = this.get('responseData');
			myNamespace.control.viewParameterNames(responseData);
		};
		var failure = function(){
			$("#compareRaster").html("An error occured when fetching the data. Please try again or contact the administrators on greenseas-adbc(at)nersc.no.");
		};
		aui(data, success, failure);
	}

	function getDatavaluesFromRaster(dataRequest, data) {
		if (debuga) {
			console.log("Started getDatavaluesFromRaster");
			console.log(JSON.stringify(dataRequest));
		}
		 var failure = function() {
			myNamespace.errorMessage.showErrorMessage("Something went wrong when fetching the datavalues from the raster");
		};

		success = function() {
			var instance = this;

			// JSON Data coming back from Server
			var responseData = instance.get('responseData');
			myNamespace.matchup.compareData(responseData, data);

		};
		aui(dataRequest, success, failure);

	}

	function getDimension(rasterParameter) {
		if (debuga) {
			console.log("Started getDimension");
		}
		var data = {};
		data[portletNameSpace + 'rasterParameter'] = rasterParameter;
		data[portletNameSpace + 'requestType'] = 'getMetaDimensions';

		var failure = function() {
			myNamespace.errorMessage.showErrorMessage("Something went wrong when fetching the dimensions from the raster!");
		};

		success = function() {
			// JSON Data coming back from Server
			var responseData = this.get('responseData');
			myNamespace.matchup.setUpParameterMetaSelector(responseData);
		};
		aui(data, success, failure);
	}

	function getLonghurstPolygon(region) {
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
				window.polygon[region] = result[region];
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
