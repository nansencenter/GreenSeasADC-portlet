var myNamespace = myNamespace || {};

var debugmW = false;// debug flag

myNamespace.mapViewer = (function(OL, $) {
	"use strict";
	// TODO fix bound
	var currentBounds = new OpenLayers.Bounds(-60, -72, 82, 88), maxExtent = new OpenLayers.Bounds(-120, -88, 120, 88);
	// from layer preview
	// -58.2311019897461,-71.0900039672852,80.9666748046875,86.3916702270508

	// map on which layers are drawn
	var map;

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
		mapLayers = {
			datapoints : new OpenLayers.Layer.WMS("Data points", window.WMSServer, {
				layers : window.metaDataTable,
				format : window.WMSformat,
				/*
				 * styles : "TestingStyle", env : "color:0BFF0B;size:5",
				 */
				transparent : true
			}, {
				isBaseLayer : false
			}),
		/*
		 * barnes : new OpenLayers.Layer.WMS( "Barnes tempcu01",
		 * window.WMSServer, { layers : "v7_temperature", format :
		 * window.WMSformat, filter : '<ogc:Filter
		 * xmlns:ogc="http://www.opengis.net/ogc"><ogc:And><ogc:PropertyIsBetween><ogc:PropertyName>depth_of_sample</ogc:PropertyName><ogc:LowerBoundary><ogc:Literal>0</ogc:Literal></ogc:LowerBoundary><ogc:UpperBoundary><ogc:Literal>10</ogc:Literal></ogc:UpperBoundary></ogc:PropertyIsBetween><ogc:Or><ogc:Not><ogc:PropertyIsNull><ogc:PropertyName>tempcu01</ogc:PropertyName></ogc:PropertyIsNull></ogc:Not></ogc:Or></ogc:And></ogc:Filter>',
		 * 
		 * styles : "BarnesTest",
		 * 
		 * transparent : true }, { isBaseLayer : false }) //
		 */
		};
	}

	function removeCustomLayer(name) {
		if (typeof customLayers[name] !== 'undefined') {
			map.removeLayer(customLayers[name]);
			delete customLayers[name];
		}
	}

	function addFeaturesFromDataWithColor(data, parameter, name, min, max) {
		if (typeof customLayers[name] !== 'undefined')
			map.removeLayer(customLayers[name]);
		var pointLayer = new OL.Layer.Vector(name, {
			projection : "EPSG:4326"
		});
		var pointFeatures = [];
		if (typeof min === 'undefined' || typeof max === 'undefined') {
			min = null, max = null;
			for (id in data) {
				if (data.hasOwnProperty(id)) {
					var value = data[id].properties[parameter];
					if (typeof value !== 'undefined' && value !== -999 && value !== '-999') {
						value = parseFloat(value);
						if (min === null || min > value)
							min = value;
						if (max === null || max < value)
							max = value;
					}
				}
			}
		}
		var range = max - min;
		console.log([ min, max, range ]);
		for (id in data) {
			if (data.hasOwnProperty(id)) {
				var value = data[id].properties[parameter];
				if (typeof value !== 'undefined' && value !== -999 && value !== '-999') {
					value = parseFloat(value);
					var lonLat = new OL.LonLat(data[id].geometry.coordinates[0], data[id].geometry.coordinates[1]);
					var pointGeometry = new OL.Geometry.Point(lonLat.lat, lonLat.lon);

					value = parseInt(((value - min) / range) * 62);
					var color = legendPallete[value];
					;
					var style = {
						'graphicName' : 'square',
						'pointRadius' : 2,
						'strokeColor' : color,
						'fillColor' : color,
						'fillOpacity' : 1
					};
					var pointFeature = new OL.Feature.Vector(pointGeometry, null, style);
					pointFeatures.push(pointFeature);
					// console.log("added:");
					// console.log(pointFeature);
				} else {
					// console.log("Not in:");
					// console.log(data[id]);
				}
			}
		}
		pointLayer.addFeatures(pointFeatures);
		map.addLayer(pointLayer);
		map.setLayerIndex(pointLayer, 9);
		customLayers[name] = pointLayer;
	}
	var legendPallete = [ "#00008f", "#00009f", "#0000af", "#0000bf", "#0000cf", "#0000df", "#0000ef", "#0000ff",
			"#000bff", "#001bff", "#002bff", "#003bff", "#004bff", "#005bff", "#006bff", "#007bff", "#008bff",
			"#009bff", "#00abff", "#00bbff", "#00cbff", "#00dbff", "#00ebff", "#00fbff", "#07fff7", "#17ffe7",
			"#27ffd7", "#37ffc7", "#47ffb7", "#57ffa7", "#67ff97", "#77ff87", "#87ff77", "#97ff67", "#a7ff57",
			"#b7ff47", "#c7ff37", "#d7ff27", "#e7ff17", "#f7ff07", "#fff700", "#ffe700", "#ffd700", "#ffc700",
			"#ffb700", "#ffa700", "#ff9700", "#ff8700", "#ff7700", "#ff6700", "#ff5700", "#ff4700", "#ff3700",
			"#ff2700", "#ff1700", "#ff0700", "#f60000", "#e40000", "#d30000", "#c10000", "#af0000", "#9e0000",
			"#8c0000" ];
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
		demis : new OpenLayers.Layer.WMS(
				"Demis WMS",
				"http://www2.demis.nl/wms/wms.ashx?WMS=WorldMap",
				{
					layers : 'Countries,Bathymetry,Topography,Hillshading,Coastlines,Builtup+areas,Waterbodies,Rivers,Streams,Borders,Cities',
					format : 'image/png'
				}),
		generic : new OpenLayers.Layer.WMS("Generic background", "http://vmap0.tiles.osgeo.org/wms/vmap0", {
			layers : 'basic',
			format : window.WMSformat
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
	};

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
			scales : [ 150000000, 80000000, 50000000, 30000000, 10000000, 5000000, 2500000, 1000000, 500000 ],
			maxExtent : maxExtent,
			maxResolution : 'auto',
			units : 'degrees',

		// actively excluding the standard zoom control, which is there by
		// default
		// map.addControls([ new OpenLayers.Control.Navigation(), new
		// OpenLayers.Control.ArgParser(),
		// new OpenLayers.Control.Attribution() ]);
		});

		mapPanel = new GeoExt.MapPanel({
			map : map,
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

		// createPDF
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
		// TODO: does not work with the Ext
		// var graticule = new OpenLayers.Control.Graticule();
		// graticule.displayInLayerSwitcher = true;
		// map.addControl(graticule);

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
		var printPage = new GeoExt.data.PrintPage({
			printProvider : printProvider,
			customParams : {
				mapTitle : "Greenseas Analytical Database Client",
				comment : comment
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
		for (layer in parameterLayers) {
			if (parameterLayers.hasOwnProperty(layer)) {
				map.removeLayer(parameterLayers[layer]);
			}
		}
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
			projection : "EPSG:4326"
		});
		var pointFeatures = [];
		for (id in data) {
			if (data.hasOwnProperty(id)) {
				var lonLat = new OL.LonLat(data[id].geometry.coordinates[0], data[id].geometry.coordinates[1]);
				var pointGeometry = new OL.Geometry.Point(lonLat.lat, lonLat.lon);
				var pointFeature = new OL.Feature.Vector(pointGeometry);
				pointFeatures.push(pointFeature);
			}
		}
		pointLayer.addFeatures(pointFeatures);
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
	// spatial data is usually in longitude/latitude, or x/y.
	function swapLonLatInFilteR(filter) {
		if (debugmW)
			console.log("swapLonLatInFilteR started with filter:" + filter);
		if (filter) {
			var newFilter = "";
			var startSub = filter.indexOf("<gml:lowerCorner>") + 17;
			// Check if there actually is a bbox
			if (startSub === 16)
				return filter;
			var endSub = filter.indexOf("</gml:lowerCorner>");
			newFilter += filter.substring(0, startSub);

			var oldCoordinates = filter.substring(startSub, endSub);
			var lonLat = oldCoordinates.split(" ");
			newFilter += lonLat[1] + " " + lonLat[0];
			var startSub = filter.indexOf("<gml:upperCorner>") + 17;
			// Check if there actually is a bbox again
			if (startSub === 16)
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
		if (layer === window.metaDataTable) {
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

	function addWMSLayer(url, shortName, layerID, colorscalerange, style, logscale, elevation, time, longName) {
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
		if (!(typeof elevation === 'undefined') && elevation !== "") {
			parameters.elevation = elevation;
		}
		if (!(typeof time === 'undefined') && time !== "") {
			parameters.time = time;
		}
		var layer = new OpenLayers.Layer.WMS(shortName, url, parameters, {
			isBaseLayer : false
		});
		layer.longName = longName;
		if (debugmW)
			console.log("Created the WMS layer");
		if (shortName in customLayers) {
			map.removeLayer(customLayers[shortName]);
			if (debugmW)
				console.log("Removed the existing WMS layer");
		}
		customLayers[shortName] = layer;
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
		addFeaturesFromDataWithColor : addFeaturesFromDataWithColor,
		removeCustomLayer : removeCustomLayer,
	};

}(OpenLayers, jQuery));
