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
		var success = function(event, id, obj) {
			// JSON Data coming back from Server
			var responseData = this.get('responseData');
			myNamespace.control.viewParameterNames(responseData);
		};
		aui(data, success);
	}

	function getDatavaluesFromRaster(dataRequest, data) {
		if (debuga) {
			console.log("Started getDatavaluesFromRaster");
			console.log(JSON.stringify(dataRequest));
		}
		failure = function() {
			alert("SOMETHING WENT WRONG!");
		};

		success = function(event, id, obj) {
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

		failure = function() {
			alert("SOMETHING WENT WRONG!");
		};

		success = function(event, id, obj) {
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
				alert("SOMETHING WENT WRONG!");
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
