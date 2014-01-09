var myNamespace = myNamespace || {};

var debuga = false;// debug flag

myNamespace.ajax = (function($) {
	"use strict";

	function getLayersFromNetCDFFile(useOpendap, opendapDataURL) {
		AUI().use('aui-io-request', function(A) {
			if (debuga) {
				console.log("Started getLayersFromNetCDFFile");
			}
			var url = ajaxCallResourceURL;
			var data = {};
			data[portletNameSpace + 'requestType'] = "getLayersFromNetCDFFile";
			if (useOpendap)
				data[portletNameSpace + 'opendapDataURL'] = opendapDataURL;

			A.io.request(url, {
				// data to be sent to server
				data : data,
				dataType : 'json',

				on : {
					failure : function() {
					},

					success : function(event, id, obj) {
						var instance = this;

						// JSON Data coming back from Server
						var responseData = instance.get('responseData');
						myNamespace.control.viewParameterNames(responseData);
					}
				}
			});
		});
	}

	function getDatavaluesFromRaster(dataRequest, data) {
		AUI().use('aui-io-request', function(A) {
			if (debuga) {
				console.log("Started getDatavaluesFromRaster");
				console.log(JSON.stringify(dataRequest));
			}
			var url = ajaxCallResourceURL;
			// var data = {};
			// data[portletNameSpace + 'param1'] = 'hello1';
			// dataRequest[portletNameSpace + 'requestType'] =
			// 'getDatavaluesFromRaster';

			A.io.request(url, {
				// data to be sent to server
				data : dataRequest,
				dataType : 'json',

				on : {
					failure : function() {
						alert("SOMETHING WENT WRONG!");
					},

					success : function(event, id, obj) {
						var instance = this;

						// JSON Data coming back from Server
						var responseData = instance.get('responseData');
						myNamespace.matchup.compareData(responseData, data);

					}

				}
			});
		});
	}

	function getDimension(rasterParameter) {
		AUI().use('aui-io-request', function(A) {
			if (debuga) {
				console.log("Started getDimension");
			}
			var url = ajaxCallResourceURL;
			var data = {};
			data[portletNameSpace + 'rasterParameter'] = rasterParameter;
			data[portletNameSpace + 'requestType'] = 'getMetaDimensions';

			A.io.request(url, {
				// data to be sent to server
				data : data,
				dataType : 'json',

				on : {
					failure : function() {
						alert("SOMETHING WENT WRONG!");
					},

					success : function(event, id, obj) {
						var instance = this;

						// JSON Data coming back from Server
						var responseData = instance.get('responseData');
						myNamespace.matchup.setUpParameterMetaSelector(responseData);

					}

				}
			});
		});
	}

	function getLonghurstPolygon(region) {
		if (!window.polygon)
			window.polygon = {};
		// AUI().use('aui-io-request', function(A) {
		if (debuga) {
			console.log("Started getDimension");
		}
		var url = ajaxCallResourceURL;
		var data = {};
		data[portletNameSpace + 'longhurstRegion'] = region;
		data[portletNameSpace + 'requestType'] = 'getLonghurstPolygon';

		// A.io.request(url, {
		$.ajax({
			url : url,
			// data to be sent to server
			data : data,
			dataType : 'json',
			async : false,

			// on : {
			error : function() {
				alert("SOMETHING WENT WRONG!");
			},

			success : function(result, status, xhr) {
				// var instance = this;

				// JSON Data coming back from Server
				// var responseData = instance.get('responseData');
				// console.log("result:");
				// console.log(result[region]);
				window.polygon[region] = result[region];// .slice(1,result[region].length-1);
			}

		// }
		});
		// });
	}
	// public interface
	return {
		getLonghurstPolygon : getLonghurstPolygon,
		getDimension : getDimension,
		getLayersFromNetCDFFile : getLayersFromNetCDFFile,
		getDatavaluesFromRaster : getDatavaluesFromRaster
	};

}(jQuery));
