var myNamespace = myNamespace || {};

myNamespace.densityCalculator = (function() {
	"use strict";

	// density calculated from temperature and salinity at a given depth
	// calculates pressure from depth, then uses (7) to calculate density
	function densityOfSeawaterAtHeight(salinity, temperature, height) {
		return densityOfSeawater(salinity, temperature,
				gaugePressureInSeaAtDepth(height));
	}

	// (7) of article
	function densityOfSeawater(salinity, temperature, pressure) {
		var densityAtOneAtmosphereVal = densityAtOneAtmosphere(salinity,
				temperature);
		var secantBulkModulusVal = secantBulkModulus(salinity, temperature,
				pressure);

		// console.log("Pressure: " + pressure);
		// console.log("Density at one atmosphere: " +
		// densityAtOneAtmosphereVal);
		console.log("Density: " + densityAtOneAtmosphereVal
				/ (1.0 - pressure / secantBulkModulusVal))
		console.log("Secant bulk modulus: " + secantBulkModulusVal);
		
		return densityAtOneAtmosphereVal
				/ (1.0 - pressure / secantBulkModulusVal);
	}

	// (9) of article
	function densityAtOneAtmosphere(salinity, temp) {

		var pW = pureWaterDensity(temp), bSum = 0, cSum = 0, dSum = 0, b = [], c = [], d = [], t = [];

		// console.log("Pure water density: " + pW);

		// t to the power of n
		t[1] = temp;
		t[2] = Math.pow(temp, 2);
		t[3] = Math.pow(temp, 3);
		t[4] = Math.pow(temp, 4);

		// b
		b[0] = 8.24493 * Math.pow(10, -1);
		b[1] = -4.0899 * Math.pow(10, -3);
		b[2] = 7.6438 * Math.pow(10, -5);
		b[3] = -8.2467 * Math.pow(10, -7);
		b[4] = 5.3875 * Math.pow(10, -9);

		bSum = b[0] + (b[1] * t[1]) + (b[2] * t[2]) + (b[3] * t[3])
				+ (b[4] * t[4]);

		// c
		c[0] = -5.72466 * Math.pow(10, -3);
		c[1] = 1.0227 * Math.pow(10, -4);
		c[2] = -1.6546 * Math.pow(10, -6);

		cSum = c[0] + (c[1] * t[1]) + (c[2] * t[2]);

		// d
		d[0] = 4.8314 * Math.pow(10, -4);

		dSum = d[0];

		// summing up
		return pW + (bSum * salinity)
				+ (cSum * Math.pow(salinity, (3.0 / 2.0)))
				+ (dSum * Math.pow(salinity, 2));

	}

	// (10) of article
	function pureWaterDensity(temp) {

		var t = [], a = [];

		// t to the power of n
		t[1] = temp;
		t[2] = Math.pow(temp, 2);
		t[3] = Math.pow(temp, 3);
		t[4] = Math.pow(temp, 4);
		t[5] = Math.pow(temp, 5);

		// a
		a[0] = 999.842594;
		a[1] = 6.793952 * Math.pow(10, -2);
		a[2] = -9.095290 * Math.pow(10, -3);
		a[3] = 1.001685 * Math.pow(10, -4);
		a[4] = -1.120083 * Math.pow(10, -6);
		a[5] = 6.536332 * Math.pow(10, -9);

		return a[0] + (a[1] * t[1]) + (a[2] * t[2]) + (a[3] * t[3])
				+ (a[4] * t[4]) + (a[5] * t[5]);

	}

	// (11) of article
	function secantBulkModulus(salinity, temperature, pressure) {
		var secantBulkModulus0Val = secantBulkModulusAt0(salinity, temperature), A = SBM_a(
				salinity, temperature), B = SBM_b(salinity, temperature);

		return secantBulkModulus0Val + (A * pressure)
				+ (B * (Math.pow(pressure, 2)));
	}

	// (12) of article
	function secantBulkModulusAt0(salinity, temperature) {

		var kWval = kW(temperature), t = [], f = [], g = [], fSum = 0, gSum = 0;

		// t to the power of n
		t[1] = temperature;
		t[2] = Math.pow(temperature, 2);
		t[3] = Math.pow(temperature, 3);

		// f
		f[0] = 54.6746;
		f[1] = -0.603459;
		f[2] = 1.09987 * Math.pow(10, -2);
		f[3] = -6.1670 * Math.pow(10, -5);

		fSum = f[0] + (f[1] * t[1]) + (f[2] * t[2]) + (f[3] * t[3]);

		// g
		g[0] = 7.944 * Math.pow(10, -2);
		g[1] = 1.6483 * Math.pow(10, -2);
		g[2] = -5.3009 * Math.pow(10, -4);

		gSum = g[0] + (g[1] * t[1]) + (g[2] * t[2]);

		return kWval + (fSum * salinity)
				+ (gSum * Math.pow(salinity, (3.0 / 2.0)));
	}

	// (15) of article
	function kW(temp) {
		var t = [], e = [];

		t[1] = temp;
		t[2] = Math.pow(temp, 2);
		t[3] = Math.pow(temp, 3);
		t[4] = Math.pow(temp, 4);

		e[0] = 19652.21;
		e[1] = 148.4206;
		e[2] = -2.327105;
		e[3] = 1.360477 * Math.pow(10, -2);
		e[4] = -5.155288 * Math.pow(10, -5);

		return e[0] + (e[1] * t[1]) + (e[2] * t[2]) + (e[3] * t[3])
				+ (e[4] * t[4]);

	}

	// (13) of article
	function SBM_a(salinity, temp) {
		var aWval = aW(salinity, temp), i = [], t = [], j = [], iSum = 0, jSum = 0;

		t[1] = temp;
		t[2] = Math.pow(temp, 2);

		// i
		i[0] = 2.2838 * Math.pow(10, -3);
		i[1] = -1.0981 * Math.pow(10, -5);
		i[2] = -1.6078 * Math.pow(10, -6);

		iSum = i[0] + (i[1] * t[1]) + (i[2] * t[2]);

		// j
		j[0] = 1.91075 * Math.pow(10, -4);

		jSum = j[0];

		return aWval + (iSum * salinity)
				+ (jSum * Math.pow(salinity, (3.0 / 2.0)));
	}

	// (16) of article
	function aW(temp) {
		var t = [], h = [];

		t[1] = temp;
		t[2] = Math.pow(temp, 2);
		t[3] = Math.pow(temp, 3);

		h[0] = 3.239908;
		h[1] = 1.43713 * Math.pow(10, -3);
		h[2] = 1.16092 * Math.pow(10, -4);
		h[3] = -5.77905 * Math.pow(10, -7);

		return h[0] + (h[1] * t[1]) + (h[2] * t[2]) + (h[3] * t[3]);
	}

	// (14) of article
	function SBM_b(salinity, temp) {
		var bWval = bW(temp), t = [], m = [], mSum = 0;

		t[1] = temp;
		t[2] = Math.pow(temp, 2);

		m[0] = -9.9348 * Math.pow(10, -7);
		m[1] = 2.0816 * Math.pow(10, -8);
		m[2] = 9.1697 * Math.pow(10, -10);

		mSum = m[0] + (m[1] * t[1]) + (m[2] * t[2]);

		return bWval + (mSum * salinity);
	}

	// (17) of article
	function bW(temp) {
		var t = [], k = [];

		t[1] = temp;
		t[2] = Math.pow(temp, 2);

		k[0] = 8.50935 * Math.pow(10, -5);
		k[1] = -6.12293 * Math.pow(10, -6);
		k[2] = 5.2787 * Math.pow(10, -8);

		return k[0] + (k[1] * t[1]) + (k[2] * t[2]);
	}

	// pressure calculations
	var gravityAcceleration = 9.8, seawaterDensity = 1030, standardAtmosphericPressure = 101000;

	function gaugePressureInSeaAtDepth(depth) {
		return depth / 10;
	}

	function totalPressureInSeaAtDepth(depth) {
		return standardAtmosphericPressure + gaugePressureInSeaAtDepth(depth);
	}

	// public interface
	return {
		density : densityOfSeawaterAtHeight,
		densityAtPressure : densityOfSeawater
	};

}());