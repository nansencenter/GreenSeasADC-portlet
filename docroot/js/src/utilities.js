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
	
	function findBrowser() {
		var ua = navigator.userAgent, N = navigator.appName, tem, M = ua
				.match(/(opera|chrome|safari|firefox|msie|trident)\/?\s*([\d\.]+)/i)
				|| [];
		M = M[2] ? [ M[1], M[2] ] : [ N, navigator.appVersion, '-?' ];
		if (M && (tem = ua.match(/version\/([\.\d]+)/i)) != null)
			M[2] = tem[1];
		return M[0];// M.join(' ');
	}

	// public interface
	return {
		rand : rand,
		findBrowser : findBrowser
	};

}(jQuery));

Array.prototype.compare = function (array) {
    // if the other array is a falsy value, return
    if (!array)
        return false;

    // compare lengths - can save a lot of time
    if (this.length != array.length)
        return false;

    for (var i = 0, l=this.length; i < l; i++) {
        // Check if we have nested arrays
        if (this[i] instanceof Array && array[i] instanceof Array) {
            // recurse into the nested arrays
            if (!this[i].compare(array[i]))
                return false;
        }
        else if (this[i] != array[i]) {
            // Warning - two different object instances will never be equal: {x:20} != {x:20}
            return false;
        }
    }
    return true;
};