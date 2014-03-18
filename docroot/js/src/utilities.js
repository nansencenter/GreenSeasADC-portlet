var myNamespace = myNamespace || {};

var debugUt = false;// debug flag

myNamespace.utilities = (function($) {
	"use strict";
	/*
	 * Small function to create a short random string to identify a request -
	 * from
	 * http://stackoverflow.com/questions/8532406/create-a-random-token-in-javascript-based-on-user-details
	 */
	function rand() {
		return Math.random().toString(36).substr(2); // remove `0.`
	}

	function setUpSelectorArray(array, id, name) {
		name = "name='" + name + "'";
		var selectElement = "<select id='" + id + "' " + name + ">";
		var options = "";
		$.each(array, function(i, val) {
			options += "<option value=\"" + val.value + "\">" + val.name + "</option>";
		});
		selectElement += options + "</select>";
		return selectElement;
	}

	function setUpSelector(hashMap, id, name) {
		name = "name='" + name + "'";
		var selectElement = "<select id='" + id + "' " + name + ">";
		var options = "";
		$.each(hashMap, function(i, val) {
			options += "<option value=\"" + i + "\">" + val + "</option>";
		});
		selectElement += options + "</select>";
		return selectElement;
	}

	function findBrowser() {
		var ua = navigator.userAgent, N = navigator.appName, tem, M = ua
				.match(/(opera|chrome|safari|firefox|msie|trident)\/?\s*([\d\.]+)/i)
				|| [];
		M = M[2] ? [ M[1], M[2] ] : [ N, navigator.appVersion, '-?' ];
		return M[0];
	}

	// public interface
	return {
		rand : rand,
		setUpSelectorArray : setUpSelectorArray,
		setUpSelector : setUpSelector,
		findBrowser : findBrowser
	};

}(jQuery));

Array.prototype.compare = function(array) {
	// if the other array is a falsy value, return
	if (!array) {
		return false;
	}
	// compare lengths - can save a lot of time
	if (this.length !== array.length) {
		return false;
	}

	for (var i = 0, l = this.length; i < l; i++) {
		// Check if we have nested arrays
		if (this[i] instanceof Array && array[i] instanceof Array) {
			// recurse into the nested arrays
			if (!this[i].compare(array[i])) {
				return false;
			}
		} else if (this[i] !== array[i]) {
			// Warning - two different object instances will never be equal:
			// {x:20} !== {x:20}
			return false;
		}
	}
	return true;
};