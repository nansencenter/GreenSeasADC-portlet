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

	function resetParameterDataSearch() {
		getUpdateParametersDataFromServerCall = null;
		$("#loadTreeNumbersDiv").html("");
	}
	// TODO: add identifier to check for uniqeness
	var getUpdateParametersDataFromServerCall = null;
	function getUpdateParametersDataFromServer(dataRequests, length,region, identifier) {
		if (dataRequests.length !== 0) {
			var splittingRequests = false;
			if (typeof identifier === 'undefined') {
				identifier = myNamespace.utilities.rand();
				var requestsEach = 6;
				if (length > requestsEach) {
					splittingRequests = true;
					var simultaneousRequests = Math.round(length / requestsEach);
					if (simultaneousRequests > 3) {
						simultaneousRequests = 3;
					}
					var newDataRequests = [];
					for (var i = 0; i < simultaneousRequests; i++) {
						newDataRequests.push([]);
					}
					while (dataRequests.length !== 0) {
						for (var i = 0; i < simultaneousRequests && dataRequests.length !== 0; i++) {
							newDataRequests[i].push(dataRequests.pop());
						}
					}

					for (var i = 0; i < simultaneousRequests; i++) {
						getUpdateParametersDataFromServer(newDataRequests[i].reverse(), length,region, identifier);
					}
				}
			}
			if (!splittingRequests) {
				var dataRequest = dataRequests.pop();
				getUpdateParametersDataFromServerCall = identifier;
				var data = {};
				data[portletNameSpace + 'requestType'] = "updateTreeWithInventoryNumbers";
				data[portletNameSpace + 'data'] = JSON.stringify(dataRequest);
				data[portletNameSpace + 'url'] = window.WFSServer;
				if (typeof region === 'string')
					data[portletNameSpace + 'gsadbcRegionFilterPlaceHolder'] = region;
				var success = function() {
					if (identifier === getUpdateParametersDataFromServerCall) {
						// Call next request
						getUpdateParametersDataFromServer(dataRequests, length,region, identifier);
						// JSON Data coming back from Server
						var responseData = this.get('responseData');
						myNamespace.control.updateTreeWithInventoryNumbers(responseData, length);
					}
				};
				var failure = function() {
					$("#loadTreeNumbersDiv").html(
							"<b><i>An error occured while updating the inventory numbers.</i></b>");
				};
				aui(data, success, failure);
			}
		}
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
		getDatavaluesFromRaster : getDatavaluesFromRaster,
		getUpdateParametersDataFromServer : getUpdateParametersDataFromServer,
		resetParameterDataSearch : resetParameterDataSearch
	};

}(jQuery));
