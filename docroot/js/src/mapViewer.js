var myNamespace = myNamespace || {};

var debugmW = false;// debug flag

// local service URLs
// myNamespace.WMSserver = "http://localhost:8080/geoserver/cite/wms";//MOD
// myNamespace.WFSserver = "http://localhost:8080/geoserver/cite/wfs";//MOD
myNamespace.WFSformat = "image/png";

// NERSC services
myNamespace.WMSserver = "http://tomcat.nersc.no:8080/geoserver/greensad/wms";
myNamespace.WFSserver = "http://tomcat.nersc.no:8080/geoserver/greensad/wfs";

myNamespace.mapViewer = (function(OL) {
	// if (debugm) alert("mapViewer.js:
	// WFSserver="+myNamespace.WFSserver);//TEST
	"use strict";
	// TODO fix bound
	var currentBounds = new OpenLayers.Bounds(-60, -72, 82, 88), maxExtent = new OpenLayers.Bounds(-120, -88, 120, 88);
	// from layer preview
	// -58.2311019897461,-71.0900039672852,80.9666748046875,86.3916702270508

	// map on which layers are drawn
	var map;

	// front layers drawn on the map widget, can be toggled on/off
	var mapLayers = {
		contour : undefined,
		datapoints : new OpenLayers.Layer.WMS("Data points", myNamespace.WMSserver, {
			layers : 'greensad:gsadb3',
			format : myNamespace.WMSformat,
			transparent : true
		}, {
			isBaseLayer : false
		}),
		highlights : new OpenLayers.Layer.Vector("Basic search results", {
			// highlight style: golden circles
			styleMap : new OpenLayers.StyleMap({
				"default" : new OpenLayers.Style({
					pointRadius : 2,
					fillColor : "#610B0B",
					strokeColor : "#610B0B",
					strokeWidth : 1,
					graphicZIndex : 1
				})
			}),
			rendererOptions : {
				// for guaranteeing highlights are drawn on top of WMS
				// representation
				zIndexing : true
			},
			projection : new OpenLayers.Projection("EPSG:4326")
		// MOD (Was: EPSG:4269)
		})
	};

	function getRandomColor() {
		var letters = '0123456789ABCDEF'.split('');
		var color = '#';
		for ( var i = 0; i < 6; i++) {
			color += letters[Math.round(Math.random() * 15)];
		}
		return color;
	}

	// some background layers, user may select one
	var backgroundLayers = {

		generic : new OpenLayers.Layer.WMS("Generic background", "http://vmap0.tiles.osgeo.org/wms/vmap0", {
			layers : 'basic',
			format : myNamespace.WMSformat
		}),

		marble : new OpenLayers.Layer.WMS('Blue Marble', 'http://disc1.gsfc.nasa.gov/daac-bin/wms_ogc', {
			layers : 'bluemarble',
			format : myNamespace.WMSformat
		}),

		ocean : new OpenLayers.Layer.WMS('GEBCO Bathymetry',
				'http://www.gebco.net/data_and_products/gebco_web_services/web_map_service/mapserv?', {
					layers : 'gebco_08_grid',
					format : myNamespace.WMSformat
				})
	};

	function initMap() {
		// if (debugm) alert("mapViewer.js: starting initMap()...");
		// set some OpenLayers settings
		// This one is currently used on production since the portlet is hosted
		// with a cgi already there
		// OpenLayers.ProxyHost = "/greenseas-portlet/cgi-bin/proxy.cgi?url=";
//		OpenLayers.ProxyHost = "/GreenseasV.1-portlet/openLayersProxy?targetURL=";
		OpenLayers.ProxyHost = "/delegate/OpenLayersProxy?targetURL=";
		OpenLayers.DOTS_PER_INCH = (25.4 / 0.28);
		OpenLayers.IMAGE_RELOAD_ATTEMPTS = 5;

		map = new OpenLayers.Map('simple_map', {
			maxExtent : maxExtent,
			maxResolution : 'auto',
			units : 'degrees',
			// actively excluding the standard zoom control, which is there by
			// default
			controls : [ new OpenLayers.Control.Navigation(), new OpenLayers.Control.ArgParser(),
					new OpenLayers.Control.Attribution() ]
		});

		map.addControl(new OpenLayers.Control.LayerSwitcher());
		map.addControl(new OpenLayers.Control.MousePosition());
		map.addControl(new OpenLayers.Control.OverviewMap());
		map.addControl(new OpenLayers.Control.PanZoomBar());

		var graticule = new OpenLayers.Control.Graticule();
		graticule.displayInLayerSwitcher = true;
		map.addControl(graticule);

		var bg = backgroundLayers, fg = mapLayers;

		// testing at work
		// map.addLayers([bg.generic, bg.marble, bg.ocean, fg.stations,
		// fg.highlights]);

		// TODO: rewrite to avoid hardcoding!!!
		map.addLayers([ bg.generic, bg.ocean, bg.marble, fg.datapoints, fg.highlights ]);

		map.zoomToExtent(currentBounds, true);

		// add drag-box mouse control to map
		var control = new OpenLayers.Control();
		OpenLayers.Util.extend(control, {
			draw : function() {
				// this Handler.Box will intercept the shift-mousedown
				// before Control.MouseDefault gets to see it
				this.box = new OpenLayers.Handler.Box(control, {
					"done" : this.notice
				}, {
					keyMask : OpenLayers.Handler.MOD_SHIFT
				});
				this.box.activate();
			},

			notice : function(genbounds) {
				var ll = map.getLonLatFromPixel(new OpenLayers.Pixel(genbounds.left, genbounds.bottom)), ur = map
						.getLonLatFromPixel(new OpenLayers.Pixel(genbounds.right, genbounds.top));

				// left bottom top right
				myNamespace.control.setLonLatInput(ll.lon.toFixed(4), ll.lat.toFixed(4), ur.lat.toFixed(4), ur.lon
						.toFixed(4));
			}
		});

		map.addControl(control);
		registerClickBehaviour(fg.floats);
	}

	function registerClickBehaviour(layer) {

		// clicking feature opens popup with basic info
		var info = new OpenLayers.Control.WMSGetFeatureInfo({
			url : myNamespace.WMSserver,
			title : 'Identify features by clicking',
			queryVisible : true,
			maxFeatures : 1,
			eventListeners : {
				getfeatureinfo : function(event) {
					map.addPopup(new OpenLayers.Popup.FramedCloud("chicken", map.getLonLatFromPixel(event.xy), null,
							event.text, null, true));
				}
			}
		});
		map.addControl(info);
		info.activate();
	}

	function removeAllParameterLayers() {
		for (layer in parameterLayers)
			map.removeLayer(parameterLayers[layer]);
		parameterLayers = {};
	}

	function highlightFeatures(features) {
		// remove old highlights, add the new ones
		mapLayers.highlights.removeAllFeatures();
		removeAllParameterLayers();
		mapLayers.highlights.addFeatures(features);
		if (debugmW)
			console.log("Layer index for highlights: " + map.getLayerIndex(mapLayers.highlights));
	}

	var parameterLayers = {};
	function addLayer(features, name) {
		if (debugmW)
			console.log("Adding a layer: " + name);
		var color = getRandomColor();
		var layer = new OpenLayers.Layer.Vector(name, {
			// highlight style: golden circles
			styleMap : new OpenLayers.StyleMap({
				"default" : new OpenLayers.Style({
					pointRadius : 2,
					fillColor : color,
					strokeColor : color,
					strokeWidth : 1,
					graphicZIndex : 1
				})
			}),
			rendererOptions : {
				// for guaranteeing highlights are drawn on top of WMS
				// representation
				zIndexing : true
			},
			projection : new OpenLayers.Projection("EPSG:4326")
		// MOD (Was: EPSG:4269)
		});
		layer.addFeatures(features);
		if (debugmW)
			console.log(parameterLayers);
		if (name in parameterLayers) {
			if (debugmW)
				console.log("name in parameterLayers: " + parameterLayers[name]);
			map.removeLayer(parameterLayers[name]);
		}
		if (debugmW)
			console.log("Came here also");
		map.addLayer(layer);
		map.setLayerIndex(layer, 9999);
		parameterLayers[name] = layer;
		if (debugmW)
			console.log("Added the layer: " + name);
	}

	function downloadCurrentContourImage() {

		// width should be given by user, then height is set automatically from
		// the ratio of width/height in the bounding box. This way we avoid
		// stretching the image
		var additionalParams = {
			WIDTH : 1020,
			HEIGHT : 750
		};

		var request = mapLayers.contour.getFullRequestString(additionalParams);

		// add bbox manually
		request += "&BBOX=" + myNamespace.control.currentBbox;

		window.open(request);
	}

	function getExtent() {
		return map.getExtent();
	}

	function zoomToExtent(bbox, bool) {
		map.zoomToExtent(bbox, bool);
	}

	// public interface
	return {
		removeAllParameterLayers : removeAllParameterLayers,
		addLayer : addLayer,
		initMap : initMap,
		highlightFeatures : highlightFeatures,
		getExtent : getExtent,
		zoomToExtent : zoomToExtent,
	};

}(OpenLayers));
