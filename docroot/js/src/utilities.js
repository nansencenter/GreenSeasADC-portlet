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

	// public interface
	return {
		rand : rand,
	};

}(jQuery));
