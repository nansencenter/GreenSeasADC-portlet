var myNamespace = myNamespace || {};

var debuga = true;// debug flag

myNamespace.ajax = (function($) {
	"use strict";

	function doAjax() {
		AUI().use('aui-io-request', function(A) {
			if (debuga) {
				console.log("Started doAjax");
			}
			var url = ajaxCallResourceURL;
			// var data = {};
			// data[portletNameSpace + 'param1'] = 'hello1';
			// data[portletNameSpace + 'param2'] = 'hello2';

			A.io.request(url, {
				// data to be sent to server
				// data : data,
				dataType : 'json',

				on : {
					failure : function() {
					},

					success : function(event, id, obj) {
						var instance = this;

						// JSON Data coming back from Server
						var message = instance.get('responseData');

//						if (debuga) {
//							if (message) {
//								console.log(message.retVal1);
//								console.log(event);
//								console.log(id);
//								console.log(obj);
//							} else {
//								alert('no data back from server');
//							}
//						}
					}

				}
			});
		});
	}
	// public interface
	return {
		doAjax : doAjax
	};

}(jQuery));
