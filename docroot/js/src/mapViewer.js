var myNamespace = myNamespace || {};

var debugmW = false;// debug flag

myNamespace.projectionCode = null;

myNamespace.mapViewer = (function(OL, $) {
	"use strict";
	// TODO fix bound
	var currentBounds = new OpenLayers.Bounds(-60, -72, 82, 88), maxExtent = new OpenLayers.Bounds(-180, -90, 180, 90);
	// from layer preview
	// -58.2311019897461,-71.0900039672852,80.9666748046875,86.3916702270508

	// map on which layers are drawn
	// TODO: var map;

	var mapPanel, printProvider;

	// Object that stores the layers for the parameters
	var parameterLayers = {};
	var customLayers = {};

	// This SLD is partly taken from
	// http://docs.geoserver.org/stable/en/user/styling/sld-cookbook/points.html#simple-point
	// TODO: replace with styles for better performance?
	function getSLD(title, layer, color, size) {
		var sld = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>"
				+ "<StyledLayerDescriptor version=\"1.0.0\" xsi:schemaLocation=\"http://www.opengis.net/sld StyledLayerDescriptor.xsd\" xmlns=\"http://www.opengis.net/sld\" xmlns:ogc=\"http://www.opengis.net/ogc\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\">"
				+ "<NamedLayer><Name>"
				+ layer
				+ "</Name><UserStyle><Title>"
				+ title
				+ "</Title><FeatureTypeStyle><Rule><PointSymbolizer><Graphic><Mark><WellKnownName>circle</WellKnownName><Fill><CssParameter name=\"fill\">"
				+ color
				+ "</CssParameter></Fill></Mark><Size>"
				+ size
				+ "</Size></Graphic></PointSymbolizer></Rule></FeatureTypeStyle></UserStyle></NamedLayer></StyledLayerDescriptor>";
		return sld;
	}
	// front layers drawn on the map widget, can be toggled on/off
	var mapLayers = {};
	function initMapLayers() {
		console.log(10);
		mapLayers = {
			datapoints : new OpenLayers.Layer.WMS("Data points",
					"http://localhost/cgi-bin/mapserv.exe?map=C:\\ms4w\\data\\greensad.map" /* window.WMSServer */, {
						version : "1.1.1",
						layers : window.metaDataTable,
						format : window.WMSformat,
						transparent : true
					}, {
						isBaseLayer : false,
					// yx:{"urn:ogc:def:crs:EPSG::4326":false},
					// projection : 'EPSG:4326',
					}),
		};
	}

	function getRandomColor() {
		var letters = '0123456789ABCDEF'.split('');
		var color = '#';
		for ( var i = 0; i < 6; i++) {
			color += letters[Math.round(Math.random() * 15)];
		}
		return color;
	}

	var polarMaxExtent = new OpenLayers.Bounds(-12400000, -12400000, 12400000, 12400000);
	var halfSideLength = (polarMaxExtent.top - polarMaxExtent.bottom) / (4 * 2);
	var centre = ((polarMaxExtent.top - polarMaxExtent.bottom) / 2) + polarMaxExtent.bottom;
	var low = centre - halfSideLength;
	var high = centre + halfSideLength;
	var polarMaxResolution = (high - low) / 128;
	var windowLow = centre - 2 * halfSideLength;
	var windowHigh = centre + 2 * halfSideLength;
	var polarWindow = new OpenLayers.Bounds(windowLow, windowLow, windowHigh, windowHigh);
	console.log(polarWindow);

	proj4.defs["EPSG:3413"] = "+proj=stere +lat_0=90 +lat_ts=70 +lon_0=-45 +k=1 +x_0=0 +y_0=0 +ellps=WGS84 +datum=WGS84 +units=m +no_defs ";
	proj4.defs["EPSG:3031"] = "+proj=stere +lat_0=-90 +lat_ts=-71 +lon_0=0 +k=1 +x_0=0 +y_0=0 +ellps=WGS84 +datum=WGS84 +units=m +no_defs ";
	proj4.defs["EPSG:3408"] = "+proj=laea +lat_0=90 +lon_0=0 +x_0=0 +y_0=0 +a=6371228 +b=6371228 +units=m +no_defs ";

	// some background layers, user may select one
	var backgroundLayers = {
		generic : new OpenLayers.Layer.WMS("Generic background",
				"http://localhost/cgi-bin/mapserv.exe?map=C:\\ms4w\\data\\world_map.map&", {
					layers : 'greensad:ne_50m_ocean',
					format : window.WMSformat
				}),
		demis : new OpenLayers.Layer.WMS(
				"Demis WMS",
				"http://www2.demis.nl/wms/wms.ashx?WMS=WorldMap",
				{
					layers : 'Countries,Bathymetry,Topography,Hillshading,Coastlines,Builtup+areas,Waterbodies,Rivers,Streams,Borders,Cities',
					format : 'image/png'
				}),

		ocean : new OpenLayers.Layer.WMS('GEBCO Bathymetry',
				'http://www.gebco.net/data_and_products/gebco_web_services/web_map_service/mapserv?', {
					layers : 'gebco_08_grid',
					format : window.WMSformat
				}),
		longhurst : new OpenLayers.Layer.WMS('Longhurst Regions',
				'http://tomcat.nersc.no:8080/geoserver/greensad/wms?', {
					layers : 'greensad:Longhurst_world_v4_2010',
					format : window.WMSformat
				}),
		northPoleBaseLayerNumberTwo : new OpenLayers.Layer.WMS("NSIDC EASE-Grid North",
				"http://localhost:8090/geoserver/greensad/wms?", {
					layers : 'greensad:ne_50m_ocean',
					format : window.WMSformat
				}, {
					projection : 'EPSG:3408',
					units : "Meter",
					maxExtent : new OpenLayers.Bounds(-9036842.762, -9036842.762, 9036842.762, 9036842.762),
					maxResolution : 24218.75,
				}),

		northPoleBaseLayerNumberFour : new OpenLayers.Layer.WMS("WGS 84 / NSIDC Polar Stereographic North",
				"http://localhost:8090/geoserver/greensad/wms?", {
					layers : 'greensad:ne_50m_ocean',
					format : window.WMSformat
				}, {
					projection : 'EPSG:3413',
					units : "Meter",
					maxExtent : new OpenLayers.Bounds(-12400000, -12400000, 12400000, 12400000),
					maxResolution : polarMaxResolution,
				}),
		poly0 : new OpenLayers.Layer.WMS("EPSG:5472",
				"http://localhost/cgi-bin/mapserv.exe?map=C:\\ms4w\\data\\world_map.map&", {
					layers : 'greensad:ne_50m_ocean',
					format : window.WMSformat
				}, {
					projection : 'EPSG:5472',
					units : "Meter",
					maxExtent : new OpenLayers.Bounds(-12400000, -12400000, 12400000, 12400000),
					maxResolution : polarMaxResolution,
				}),
		poly1 : new OpenLayers.Layer.WMS("EPSG:5939",
				"http://localhost/cgi-bin/mapserv.exe?map=C:\\ms4w\\data\\world_map.map&", {
					layers : 'greensad:ne_50m_ocean',
					format : window.WMSformat
				}, {
					projection : 'EPSG:5939',
					units : "Meter",
					maxExtent : new OpenLayers.Bounds(-12400000, -12400000, 12400000, 12400000),
					maxResolution : polarMaxResolution,
				}),
		poly2 : new OpenLayers.Layer.WMS("EPSG:29101",
				"http://localhost/cgi-bin/mapserv.exe?map=C:\\ms4w\\data\\world_map.map", {
					layers : 'greensad:ne_50m_ocean',
					format : window.WMSformat
				}, {
					projection : 'EPSG:29101',
					units : "Meter",
					maxExtent : new OpenLayers.Bounds(-4000000, 0, 13000000, 13000000),
					maxResolution : 24218.75,
				}),
		poly3 : new OpenLayers.Layer.WMS("EPSG:5880",
				"http://localhost/cgi-bin/mapserv.exe?map=C:\\ms4w\\data\\world_map.map&", {
					layers : 'greensad:ne_50m_ocean',
					format : window.WMSformat
				}, {
					projection : 'EPSG:5880',
					units : "Meter",
					maxExtent : new OpenLayers.Bounds(-12400000, -12400000, 12400000, 12400000),
					maxResolution : polarMaxResolution,
				}),
		northPoleBaseLayerNumberThree : new OpenLayers.Layer.WMS("UPS North",
				"http://localhost/cgi-bin/mapserv.exe?map=C:\\ms4w\\data\\world_map.map&", {
					layers : 'greensad:ne_50m_ocean',
					format : window.WMSformat
				}, {
					projection : 'EPSG:32661',
					units : "Meter",
					maxExtent : new OpenLayers.Bounds(-12400000, -12400000, 12400000, 12400000),
					maxResolution : polarMaxResolution,
				}),
		testing : new OpenLayers.Layer.WMS("ESRI:53018",
				"http://localhost/cgi-bin/mapserv.exe?map=C:\\ms4w\\data\\world_map.map&", {
					layers : 'greensad:ne_50m_ocean',
					format : window.WMSformat
				}, {
					projection : 'ESRI:53018',
					units : "Meter",
					maxExtent : new OpenLayers.Bounds(-12400000, -12400000, 12400000, 12400000),
					maxResolution : polarMaxResolution,
				}),
		southPoleBaseLayerNumberTwo : new OpenLayers.Layer.WMS("NSIDC EASE-Grid South",
				"http://localhost:8090/geoserver/greensad/wms?", {
					layers : 'greensad:ne_50m_ocean',
					format : window.WMSformat
				}, {
					projection : 'EPSG:3409',
					units : "Meter",
					maxExtent : new OpenLayers.Bounds(-9036842.762, -9036842.762, 9036842.762, 9036842.762),
					maxResolution : 24218.75,
				}),
		southPoleBaseLayerNumberThree : new OpenLayers.Layer.WMS("UPS South",
				"http://tomcat.nersc.no:8080/geoserver/greensad/wms?", {
					layers : 'greensad:ne_50m_ocean',
					format : window.WMSformat
				}, {
					projection : 'EPSG:32761',
					units : "Meter",
					maxExtent : new OpenLayers.Bounds(-12400000, -12400000, 12400000, 12400000),
					maxResolution : polarMaxResolution,
				}),

		southPoleBaseLayer : new OpenLayers.Layer.WMS("Antarctic Polar Stereographic",
				"http://localhost:8090/geoserver/greensad/wms?", {
					layers : 'greensad:ne_50m_ocean',
					format : window.WMSformat
				}, {
					projection : 'EPSG:3031',
					units : "Meter",
					maxExtent : new OpenLayers.Bounds(-12400000, -12400000, 12400000, 12400000),
					maxResolution : polarMaxResolution,
				/*
				 * yx : { "EPSG:32661" : true, "EPSG:32761" : true }
				 */
				}),

		southPoleBaseLayerFour : new OpenLayers.Layer.WMS("Hughes / NSIDC Polar Stereographic South",
				"http://localhost:8090/geoserver/greensad/wms?", {
					layers : 'greensad:ne_50m_ocean',
					format : window.WMSformat
				}, { //
					wrapDateLine : false,
					projection : 'EPSG:3412',
					units : "meters",
					maxExtent : new OpenLayers.Bounds(-12400000, -12400000, 12400000, 12400000),
					maxResolution : polarMaxResolution,
				}),
		test0 : new OpenLayers.Layer.WMS("EPSG:9835", "http://localhost:8090/geoserver/greensad/wms?", {
			layers : 'greensad:ne_50m_ocean',
			format : window.WMSformat
		}, { //
			wrapDateLine : false,
			projection : 'EPSG:9835',
			units : "meters",
			maxExtent : new OpenLayers.Bounds(-12400000, -12400000, 12400000, 12400000),
			maxResolution : polarMaxResolution,
		}),
		test1 : new OpenLayers.Layer.WMS("EPSG:9834", "http://localhost:8090/geoserver/greensad/wms?", {
			layers : 'greensad:ne_50m_ocean',
			format : window.WMSformat
		}, { //
			wrapDateLine : false,
			projection : 'EPSG:9834',
			units : "meters",
			maxExtent : new OpenLayers.Bounds(-12400000, -12400000, 12400000, 12400000),
			maxResolution : polarMaxResolution,
		}),
		test2 : new OpenLayers.Layer.WMS("ESRI:53018", "http://localhost:8090/geoserver/greensad/wms?", {
			layers : 'greensad:ne_50m_ocean',
			format : window.WMSformat
		}, { //
			wrapDateLine : false,
			projection : 'ESRI:53018',
			units : "meters",
			maxExtent : new OpenLayers.Bounds(-12400000, -12400000, 12400000, 12400000),
			maxResolution : polarMaxResolution,
		}),
		test3 : new OpenLayers.Layer.WMS("ESRI:53019", "http://localhost:8090/geoserver/greensad/wms?", {
			layers : 'greensad:ne_50m_ocean',
			format : window.WMSformat
		}, { //
			wrapDateLine : false,
			projection : 'ESRI:53019',
			units : "meters",
			maxExtent : new OpenLayers.Bounds(-12400000, -12400000, 12400000, 12400000),
			maxResolution : polarMaxResolution,
		}),

	};

	// Called when the user changes the base layer
	function baseLayerChanged(event) {
		// clearPopups();
		// Change the parameters of the map based on the new base layer
		map.setOptions({
			// projection: projCode,
			maxExtent : map.baseLayer.maxExtent,
			maxResolution : map.baseLayer.maxResolution,
			units : map.baseLayer.units
		});
		if (myNamespace.projectionCode != map.baseLayer.projection.getCode()) {
			$.each(mapLayers, function(i, val) {
				val.maxExtent = map.baseLayer.maxExtent;
				val.maxResolution = map.baseLayer.maxResolution;
				val.minExtent = map.baseLayer.minExtent;
				val.minResolution = map.baseLayer.minResolution;
				val.minScale = map.baseLayer.minScale;
				val.maxScale = map.baseLayer.maxScale;
			});
			var newProjection = map.baseLayer.projection.getCode();
			$.each(parameterLayers, function(i, val) {
				val.maxExtent = map.baseLayer.maxExtent;
				val.units = map.baseLayer.units;
				val.maxResolution = map.baseLayer.maxResolution;
				val.minExtent = map.baseLayer.minExtent;
				val.minResolution = map.baseLayer.minResolution;
				val.minScale = map.baseLayer.minScale;
				val.maxScale = map.baseLayer.maxScale;
				if (val instanceof OpenLayers.Layer.Vector) {
					console.log(val);
					var sourceProj = proj4.defs[myNamespace.projectionCode];// new
					// proj4.Proj(projectionCode);
					var targetProj = proj4.defs[newProjection];// new
					// proj4.Proj(newProjection);
					// Seems to be issues transforming between the two polar
					// stereographics, need to use "EPSG:4326" as intermediate
					var intermediateProj = null;
					if (myNamespace.projectionCode != "EPSG:4326" && newProjection != "EPSG:4326") {
						intermediateProj = proj4.defs["EPSG:4326"];
					}
					$.each(val.features, function(i, feature) {
						transformGeometry(feature.geometry, sourceProj, targetProj, intermediateProj);
					});
					val.projection = new OpenLayers.Projection(newProjection);
					val.redraw();
					console.log(val);
				}
			});
			// We've changed the projection of the base layer
			myNamespace.projectionCode = newProjection;
			myNamespace.control.changeProjection();
			map.zoomToMaxExtent();
			console.log(map);
		}
	}

	function transformGeometry(geometry, sourceProj, targetProj, intermediateProj) {
		var coords = [ geometry.x, geometry.y ];
		if (intermediateProj) {
			coords = proj4(sourceProj, intermediateProj, coords);
			coords = proj4(intermediateProj, targetProj, coords);
		} else
			coords = proj4(sourceProj, targetProj, coords);
		geometry.x = coords[0];
		geometry.y = coords[1];
	}

	function initMap() {
		if (debugmW)
			console.log("Starting initMap");
		initMapLayers();
		if (debugmW)
			console.log("Initiated mapLayers");
		// set some OpenLayers settings
		// The proxy comes from
		// nersc.greenseas.openlayersProxy.GwtOpenLayersProxyServlet
		OpenLayers.ProxyHost = "/delegate/OpenLayersProxy?targetURL=";
		OpenLayers.DOTS_PER_INCH = (25.4 / 0.28);
		OpenLayers.IMAGE_RELOAD_ATTEMPTS = 5;

		map = new OpenLayers.Map();
		// 'simple_map',
		map.setOptions({
			// scales : [ 150000000, 80000000, 50000000, 30000000, 10000000,
			// 5000000, 2500000, 1000000, 500000 ],
			maxExtent : maxExtent,
			maxResolution : 'auto',
			units : 'degrees',
		// actively excluding the standard zoom control, which is there by
		// default
		// map.addControls([ new OpenLayers.Control.Navigation(), new
		// OpenLayers.Control.ArgParser(),
		// new OpenLayers.Control.Attribution() ]);
		});
		map.events.register('changebaselayer', map, baseLayerChanged);

		mapPanel = new GeoExt.MapPanel({
			// region: "center",
			map : map,
		/*
		 * center: [0,0], zoom: 1,
		 */
		});
		var url = window.mapfishPrintServer;
		printProvider = new GeoExt.data.PrintProvider({
			method : "POST",
			url : url,
		});
		printProvider.loadCapabilities();

		new Ext.Panel({
			renderTo : "simple_map",
			layout : "fit",
			width : 800,
			height : 400,
			items : [ mapPanel ]
		});

		// Adding the controls to the map
		map.addControl(new OpenLayers.Control.LayerSwitcher());
		map.addControl(new OpenLayers.Control.MousePosition());
		map.addControl(new OpenLayers.Control.OverviewMap());
		// map.addControl(new OpenLayers.Control.PanZoomBar());
		var pdfButton = new OpenLayers.Control.Button({
			displayClass : "olPDFButton",
			title : "Create PDF",
			id : 'PDFButton',
			trigger : createPDF,
		});
		var panel = new OpenLayers.Control.Panel({
			defaultControl : pdfButton
		});
		panel.addControls([ pdfButton ]);
		map.addControl(panel);

		// remove popups
		var popupsButton = new OpenLayers.Control.Button({
			displayClass : "olPopupsButton",
			title : "Remove all popups",
			id : 'PopupsButton',
			trigger : removePopups,
		});
		var popupsPanel = new OpenLayers.Control.Panel({
			defaultControl : popupsButton,
			displayClass : "olPopupsPanel"
		});
		popupsPanel.addControls([ popupsButton ]);
		map.addControl(popupsPanel);

		// Adding the layers to the map
		var bg = backgroundLayers, fg = mapLayers;
		layers = [];
		$.each(backgroundLayers, function(i, val) {
			layers.push(val);
		});
		$.each(mapLayers, function(i, val) {
			layers.push(val);
		});
		map.addLayers(layers);

		if (debugmW)
			console.log("Added mapLayers");
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
				myNamespace.control.activateBbox();
			}
		});

		map.addControl(control);
		registerClickBehaviour();
		if (debugmW)
			console.log("Finished initMap");
	}

	function createPDF() {
		var comment = "Map printed from: " + document.URL;
		if (myNamespace.mainQueryArray)
			$.each(myNamespace.mainQueryArray, function(i, val) {
				comment += "\n" + val;
			});
		if (myNamespace.parametersQueryString)
			comment += "\n" + myNamespace.parametersQueryString;
		var activeLayers = "";
		var delimiter = "";
		$.each(mapLayers, function(i, val) {
			if (val.visibility) {
				activeLayers += delimiter + val.name;
				delimiter = ", ";
			}
		});
		if (parameterLayers)
			$.each(parameterLayers, function(i, val) {
				if (val.visibility) {
					activeLayers += delimiter + val.name;
					delimiter = ", ";
				}
			});
		if (customLayers)
			$.each(customLayers, function(i, val) {
				if (val.visibility) {
					activeLayers += delimiter + val.longName;
					delimiter = ", ";
				}
			});
		if (activeLayers.length > 0)
			comment += "\nActive layers:" + activeLayers;
		var scale = map.baseLayer.gridResolution * OpenLayers.INCHES_PER_UNIT[map.baseLayer.units]
				* OpenLayers.DOTS_PER_INCH;
		var closest = null;
		$.each(printProvider.scales.data.items, function(i, val) {
			if (closest == null || Math.abs(val.data.value - scale) < Math.abs(closest - scale))
				closest = val.data.value;
		});
		var printPage = new GeoExt.data.PrintPage({
			printProvider : printProvider,
			customParams : {
				mapTitle : "Greenseas Analytical Database Client",
				comment : comment,
				scale : closest
			}
		});
		printPage.fit(mapPanel);
		printProvider.print(mapPanel, printPage);
	}

	var popups = [];
	function registerClickBehaviour() {

		// clicking feature opens popup with basic info
		var info = new OpenLayers.Control.WMSGetFeatureInfo({
			url : myNamespace.WMSserver,
			title : 'Identify features by clicking',
			queryVisible : true,
			maxFeatures : 20,
			/* infoFormat : "text/xml", */
			eventListeners : {
				getfeatureinfo : function(event) {
					var popup = new OpenLayers.Popup.FramedCloud("chicken", map.getLonLatFromPixel(event.xy), null,
							event.text, null, true);
					map.addPopup(popup);
					popups.push(popup);
				}
			}
		});
		map.addControl(info);
		info.activate();
	}

	function removePopups() {
		$.each(popups, function(i, val) {
			map.removePopup(val);
		});
		popups = [];
	}

	function removeAllParameterLayers() {
		for (layer in parameterLayers)
			map.removeLayer(parameterLayers[layer]);
		parameterLayers = {};
	}

	function removeBasicSearchLayer() {
		if (window.basicSearchName in mapLayers) {
			map.removeLayer(mapLayers[window.basicSearchName]);
			delete mapLayers[window.basicSearchName];
		}
	}

	function addFeaturesFromData(data, name) {
		if (debugmW)
			console.log("addFeaturesFromData started");
		var pointLayer = new OL.Layer.Vector(name, {
			projection : "EPSG:4326"// myNamespace.projectionCode
		});
		var pointFeatures = [];
		for (id in data) {
			var lonLat = new OL.LonLat(data[id].geometry.coordinates[0], data[id].geometry.coordinates[1]);
			var pointGeometry = new OL.Geometry.Point(lonLat.lat, lonLat.lon);

			var pointFeature = new OL.Feature.Vector(pointGeometry);
			pointFeatures.push(pointFeature);
		}
		pointLayer.addFeatures(pointFeatures);
		if (myNamespace.projectionCode != "EPSG:4326") {
			pointLayer.maxExtent = map.baseLayer.maxExtent;
			pointLayer.units = map.baseLayer.units;
			pointLayer.maxResolution = map.baseLayer.maxResolution;
			pointLayer.minExtent = map.baseLayer.minExtent;
			pointLayer.minResolution = map.baseLayer.minResolution;
			pointLayer.minScale = map.baseLayer.minScale;
			pointLayer.maxScale = map.baseLayer.maxScale;
			var sourceProj = proj4.defs["EPSG:4326"];// new
			// proj4.Proj(projectionCode);
			var targetProj = proj4.defs[myNamespace.projectionCode];// new
			// proj4.Proj(newProjection);
			// Seems to be issues transforming between the two polar
			// stereographics, need to use "EPSG:4326" as intermediate
			$.each(pointLayer.features, function(i, feature) {
				transformGeometry(feature.geometry, sourceProj, targetProj);
			});
			pointLayer.projection = new OpenLayers.Projection(myNamespace.projectionCode);
		}
		map.addLayer(pointLayer);
		map.setLayerIndex(pointLayer, 10);
		parameterLayers[name] = pointLayer;
		if (debugmW)
			console.log("addFeaturesFromData ended");
	}

	// From
	// http://docs.geoserver.org/stable/en/user/services/wms/basics.html#axis-ordering
	// - The WMS 1.3 specification mandates that the axis ordering for
	// geographic coordinate systems defined in the EPSG database be
	// latitude/longitude, or y/x. This is contrary to the fact that most
	// spatial data is usually in longitude/latitude, or x/y. This only applies
	// for EPSG: 4326 which is "swapped" in openlayers
	function swapLonLatInFilteR(filter) {
		if (debugmW)
			console.log("swapLonLatInFilteR started with filter:" + filter);
		if (filter) {
			var newFilter = "";
			var startSub = filter.indexOf("<gml:lowerCorner>") + 17;
			// Check if there actually is a bbox
			if (startSub == 16)
				return filter;
			var endSub = filter.indexOf("</gml:lowerCorner>");
			newFilter += filter.substring(0, startSub);

			var oldCoordinates = filter.substring(startSub, endSub);
			var lonLat = oldCoordinates.split(" ");
			newFilter += lonLat[1] + " " + lonLat[0];
			var startSub = filter.indexOf("<gml:upperCorner>") + 17;
			// Check if there actually is a bbox again
			if (startSub == 16)
				return filter;
			newFilter += filter.substring(endSub, startSub);
			endSub = filter.indexOf("</gml:upperCorner>");

			oldCoordinates = filter.substring(startSub, endSub);
			lonLat = oldCoordinates.split(" ");
			newFilter += lonLat[1] + " " + lonLat[0];

			newFilter += filter.substring(endSub);
			if (debugmW)
				console.log("swapLonLatInFilteR ended with filter:" + newFilter);
			return newFilter;
		} else {
			return "";
		}
	}

	// Adding a layer with a filter and name to the map using a WMS. The
	// handling of the metadatatable is customized. name should not be "Data
	// points"
	function addLayerWMS(filter, layer, name) {
		if (debugmW)
			console.log("addLayerWMS started");
		var layers = parameterLayers;
		var index = 999;
		var color = window[layer + "Color"] || "#610B0B";
		var newLayer;
		if (layer == window.metaDataTable) {
			index = 998;
			layers = mapLayers;
		} else {
			color = window[layer + "Color"] || getRandomColor();
		}
		if (name in layers) {
			if (debugmW)
				console.log("name in parameterLayers: " + layers[name]);
			map.removeLayer(layers[name]);
		}

		var swapLonLatFilter = swapLonLatInFilteR(filter);
		// console.log("Filter in:");
		// console.log(filter);
		// console.log("Filter out:");
		// console.log(swapLonLatFilter);

		newLayer = new OpenLayers.Layer.WMS(name, window.WMSServer, {
			layers : layer,
			transparent : true,
			filter : swapLonLatFilter,
			sld_body : getSLD(name, database + ":" + layer, color, 4),
			format : window.WMSformat
		}, {
			isBaseLayer : false,
			tileOptions : {
				maxGetUrlLength : 2048
			},
		});
		if (debugmW)
			console.log("created the new layer");
		map.addLayer(newLayer);
		map.setLayerIndex(newLayer, index);
		layers[name] = newLayer;
		if (debugmW)
			console.log("Added the layer: " + name);
	}

	function updateIndices() {
		$.each(mapLayers, function(i, layer) {
			map.removeLayer(layer);
			map.addLayer(layer);
		});
		$.each(parameterLayers, function(i, layer) {
			map.removeLayer(layer);
			map.addLayer(layer);
		});
	}

	function addWMSLayer(url, id, shortName, layerID, colorscalerange, style, logscale, elevation, time, longName) {
		if (debugmW)
			console.log("Adding the WMS layer");
		if (debugmW)
			console.log("elevation:" + elevation + ", time:" + time);
		parameters = {
			layers : layerID,
			format : window.WMSformat,
			transparent : true,
			styles : style,
			colorscalerange : colorscalerange,
			logscale : logscale,
		};
		if (!(typeof elevation === 'undefined') && elevation != "") {
			parameters.elevation = elevation;
		}
		if (!(typeof time === 'undefined') && time != "") {
			parameters.time = time;
		}
		var layer = new OpenLayers.Layer.WMS(shortName, url, parameters, {
			isBaseLayer : false
		});
		layer.longName = longName;
		if (debugmW)
			console.log("Created the WMS layer");
		if (id in customLayers) {
			map.removeLayer(customLayers[id]);
			if (debugmW)
				console.log("Removed the existing WMS layer");
		}
		customLayers[id] = layer;
		map.addLayer(layer);
		map.setLayerIndex(layer, 500);
		updateIndices();
		if (debugmW)
			console.log("Added the WMS layer");
	}

	function getExtent() {
		return map.getExtent();
	}

	function zoomToExtent(bbox, bool) {
		map.zoomToExtent(bbox, bool);
	}

	// public interface
	return {
		addWMSLayer : addWMSLayer,
		getRandomColor : getRandomColor,
		addLayerWMS : addLayerWMS,
		addFeaturesFromData : addFeaturesFromData,
		removeAllParameterLayers : removeAllParameterLayers,
		removeBasicSearchLayer : removeBasicSearchLayer,
		initMap : initMap,
		getExtent : getExtent,
		zoomToExtent : zoomToExtent,
		removePopups : removePopups,
	};

}(OpenLayers, jQuery));
