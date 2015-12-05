var myNamespace = myNamespace || {};

var debugmW = false;// debug flag
myNamespace.gsadbcLoadingLayersInterval = null;

myNamespace.mapViewer = (function(OL, $, ns) {
	"use strict";
	var currentBounds = new OpenLayers.Bounds(-60, -75, 85, 90), maxExtent = new OpenLayers.Bounds(-180, -90, 180, 90);

	// map on which layers are drawn
	// var map;

	var mapPanel, printProvider;

	function updateIndex(name, delta) {
		var layers = map.getLayersByName(name);
		for (var i = 0, l = layers.length; i < l; i++) {
			map.raiseLayer(layers[i], delta);
		}
	}
	function getListOfLayers() {
		var list = [];
		for (var i = 0, l = map.layers.length; i < l; i++) {
			var layer = map.layers[i];
			if (!layer.isBaseLayer) {
				list.push({
					name : layer.name,
					id : layer.id,
					index : map.getLayerIndex(layer)
				});
			}
		}
		return list;
	}
	// Objects that store the different layers
	var parameterLayers = {};
	var customLayers = {};
	var mapLayers = {};
	// some background layers, user may select one
	var numberOfBackgroundLayers = 4;
	var backgroundLayers = {
		demis : new OpenLayers.Layer.WMS(
				"Demis WMS",
				"http://www2.demis.nl/wms/wms.ashx?WMS=WorldMap",
				{
					layers : 'Countries,Bathymetry,Topography,Hillshading,Coastlines,Waterbodies,Rivers,Streams,Borders',
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

	function getBarnesSLD(layer, valueAttr, scale, convergence, passes, minObservations, maxObservationDistance,
			pixelsPerCell, queryBuffer, opacity,min,max) {
		var colors = [ "000090", "0008FF", "0083FF", "01FBFD", "74FF88", "F3FF0A", "FF9000",
				"FF1300", "8C0000" ];
		var noDataColur = "#FFFFFF";
		var noDataQuantity = -999;
//	    +"              <ColorMapEntry color=\"#FFFFFF\" quantity=\"-990\" label=\"nodata\" opacity=\"0\"/>"
//	    +"              <ColorMapEntry color=\"#000090\" quantity=\"-2\" label=\"-2\"/>"
	    var colorMap = "<ColorMapEntry color=\""+noDataColur+"\" quantity=\""+noDataQuantity+"\" label=\"nodata\" opacity=\"0\"/>"
	    var range = max-min;
	    var interval = range/(colors.length-1);
	    
		$.each(colors,function(i,val){
			var quantity = interval;
			quantity *= i;
			quantity += min;
			colorMap += "<ColorMapEntry color=\"#"+val+"\" quantity=\""+(min+(i*interval))+"\" label=\""+(min+(i*interval))+"\"/>";
		});
		
		//console.log(colorMap);
	    
		var sld = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>"
		    +"<StyledLayerDescriptor version=\"1.0.0\" xsi:schemaLocation=\"http://www.opengis.net/sld StyledLayerDescriptor.xsd\" xmlns=\"http://www.opengis.net/sld\" xmlns:ogc=\"http://www.opengis.net/ogc\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\">"
		    +"	<NamedLayer>"
		    +"		<Name>"+layer+"</Name>"
		    +"		<UserStyle>"
		    +"			<FeatureTypeStyle>"
		    +"				<Transformation>"
		    +"					<ogc:Function name=\"gs:BarnesSurface\">"
		    +"						<ogc:Function name=\"parameter\">"
		    +"							<ogc:Literal>data</ogc:Literal>"
		    +"						</ogc:Function>"
		    +"						<ogc:Function name=\"parameter\">"
		    +"							<ogc:Literal>valueAttr</ogc:Literal>"
		    +"							<ogc:Literal>"+valueAttr+"</ogc:Literal>"
		    +"						</ogc:Function>"
		    +"						<ogc:Function name=\"parameter\">"
		    +"							<ogc:Literal>scale</ogc:Literal>"
		    +"							<ogc:Literal>"+scale+"</ogc:Literal>"
		    +"						</ogc:Function>"
		    +"						<ogc:Function name=\"parameter\">"
		    +"							<ogc:Literal>convergence</ogc:Literal>"
		    +"							<ogc:Literal>"+convergence+"</ogc:Literal>"
		    +"						</ogc:Function>"
		    +"						<ogc:Function name=\"parameter\">"
		    +"							<ogc:Literal>passes</ogc:Literal>"
		    +"							<ogc:Literal>"+passes+"</ogc:Literal>"
		    +"						</ogc:Function>"
		    +"						<ogc:Function name=\"parameter\">"
		    +"							<ogc:Literal>minObservations</ogc:Literal>"
		    +"							<ogc:Literal>"+minObservations+"</ogc:Literal>"
		    +"						</ogc:Function>"
		    +"						<ogc:Function name=\"parameter\">"
		    +"							<ogc:Literal>maxObservationDistance</ogc:Literal>"
		    +"							<ogc:Literal>"+maxObservationDistance+"</ogc:Literal>"
		    +"						</ogc:Function>"
		    +"						<ogc:Function name=\"parameter\">"
		    +"							<ogc:Literal>pixelsPerCell</ogc:Literal>"
		    +"							<ogc:Literal>"+pixelsPerCell+"</ogc:Literal>"
		    +"						</ogc:Function>"
		    +"						<ogc:Function name=\"parameter\">"
		    +"							<ogc:Literal>queryBuffer</ogc:Literal>"
		    +"							<ogc:Literal>"+queryBuffer+"</ogc:Literal>"
		    +"						</ogc:Function>"
		    +"						<ogc:Function name=\"parameter\">"
		    +"							<ogc:Literal>outputBBOX</ogc:Literal>"
		    +"							<ogc:Function name=\"env\">"
		    +"								<ogc:Literal>wms_bbox</ogc:Literal>"
		    +"							</ogc:Function>"
		    +"						</ogc:Function>"
		    +"						<ogc:Function name=\"parameter\">"
		    +"							<ogc:Literal>outputWidth</ogc:Literal>"
		    +"							<ogc:Function name=\"env\">"
		    +"								<ogc:Literal>wms_width</ogc:Literal>"
		    +"							</ogc:Function>"
		    +"						</ogc:Function>"
		    +"						<ogc:Function name=\"parameter\">"
		    +"							<ogc:Literal>outputHeight</ogc:Literal>"
		    +"							<ogc:Function name=\"env\">"
		    +"								<ogc:Literal>wms_height</ogc:Literal>"
		    +"							</ogc:Function>"
		    +"						</ogc:Function>"
		    +"					</ogc:Function>"
		    +"				</Transformation>"
		    +"				<Rule>"
		    +"					<RasterSymbolizer>"
		    +"						<!-- specify geometry attribute of input to pass validation -->"
		    +"						<Geometry>"
		    +"							<ogc:PropertyName>stpoint</ogc:PropertyName>"
		    +"						</Geometry>"
		    +"						<Opacity>"+opacity+"</Opacity>"
		    +"						<ColorMap type=\"ramp\" >"
		    +colorMap
//		    +"							<ColorMapEntry color=\"#FFFFFF\" quantity=\"-990\" label=\"nodata\" opacity=\"0\"/>"
//		    +"							<ColorMapEntry color=\"#2E4AC9\" quantity=\"-2\" label=\"-2\"/>"
//		    +"							<ColorMapEntry color=\"#41A0FC\" quantity=\"0\" label=\"0\" />"
//		    +"							<ColorMapEntry color=\"#58CCFB\" quantity=\"2\" label=\"2\" />"
//		    +"							<ColorMapEntry color=\"#76F9FC\" quantity=\"3\" label=\"3\" />"
//		    +"							<ColorMapEntry color=\"#6AC597\" quantity=\"4\" label=\"4\" />"
//		    +"							<ColorMapEntry color=\"#479364\" quantity=\"4.25\" label=\"4.25\" />"
//		    +"							<ColorMapEntry color=\"#2E6000\" quantity=\"4.5\" label=\"4.5\" />"
//		    +"							<ColorMapEntry color=\"#579102\" quantity=\"4.75\" label=\"4.75\" />"
//		    +"							<ColorMapEntry color=\"#9AF20C\" quantity=\"5\" label=\"5\" />"
//		    +"							<ColorMapEntry color=\"#B7F318\" quantity=\"5.25\" label=\"5.25\" />"
//		    +"							<ColorMapEntry color=\"#DBF525\" quantity=\"5.5\" label=\"5.5\" />"
//		    +"							<ColorMapEntry color=\"#FAF833\" quantity=\"5.75\" label=\"5.75\" />"
//		    +"							<ColorMapEntry color=\"#F9C933\" quantity=\"6\" label=\"6\" />"
//		    +"							<ColorMapEntry color=\"#F19C33\" quantity=\"8\" label=\"8\" />"
//		    +"							<ColorMapEntry color=\"#ED7233\" quantity=\"10\" label=\"10\" />"
//		    +"							<ColorMapEntry color=\"#EA3F33\" quantity=\"14\" label=\"14\" />"
//		    +"							<ColorMapEntry color=\"#BB3026\" quantity=\"999\" label=\"above 14\" />"
//		    +"              <ColorMapEntry color=\"#FFFFFF\" quantity=\"-990\" label=\"nodata\" opacity=\"0\"/>"
//		    +"              <ColorMapEntry color=\"#000090\" quantity=\"-2\" label=\"-2\"/>"
//		    +"              <ColorMapEntry color=\"#0008FF\" quantity=\"-0.25\" label=\"-0.25\"/>"
//		    +"              <ColorMapEntry color=\"#0083FF\" quantity=\"1.5\" label=\"1.5\"/>"
//		    +"              <ColorMapEntry color=\"#01FBFD\" quantity=\"3.25\" label=\"3.25\"/>"
//		    +"              <ColorMapEntry color=\"#74FF88\" quantity=\"5\" label=\"5\"/>"
//		    +"              <ColorMapEntry color=\"#F3FF0A\" quantity=\"6.75\" label=\"6.75\"/>"
//		    +"              <ColorMapEntry color=\"#FF9000\" quantity=\"8.5\" label=\"8.5\"/>"
//		    +"              <ColorMapEntry color=\"#FF1300\" quantity=\"10.25\" label=\"10.25\"/>"
//		    +"              <ColorMapEntry color=\"#8C0000\" quantity=\"12\" label=\"12\"/>"
		    +"						</ColorMap>"
		    +"					</RasterSymbolizer>"
		    +"				</Rule>"
		    +"			</FeatureTypeStyle>"
		    +"		</UserStyle>"
		    +"	</NamedLayer>"
		    +"</StyledLayerDescriptor>"
		    return sld;
	}
	// front layers drawn on the map widget, can be toggled on/off
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
			DemisLand: new OpenLayers.Layer.WMS(
					"Land - Demis WMS",
					"http://www2.demis.nl/wms/wms.ashx?WMS=WorldMap",
					{
						layers : 'Countries,Topography,Hillshading,Coastlines,Waterbodies,Rivers,Streams,Borders,Topography,Coastlines',
						format : 'image/png',
						transparent : true
					}, {
						isBaseLayer : false
					})

		// barnes : new OpenLayers.Layer.WMS( "Barnes tempcu01",
		// window.WMSServer, { layers : "v7_temperature", format :
		// window.WMSformat, filter : '<ogc:Filter
		// xmlns:ogc="http://www.opengis.net/ogc"><ogc:And><ogc:PropertyIsBetween><ogc:PropertyName>depth_of_sample</ogc:PropertyName><ogc:LowerBoundary><ogc:Literal>0</ogc:Literal></ogc:LowerBoundary><ogc:UpperBoundary><ogc:Literal>10</ogc:Literal></ogc:UpperBoundary></ogc:PropertyIsBetween><ogc:Or><ogc:Not><ogc:PropertyIsNull><ogc:PropertyName>tempcu01</ogc:PropertyName></ogc:PropertyIsNull></ogc:Not></ogc:Or></ogc:And></ogc:Filter>',
		//		  
		// styles : "BarnesTest",
		//		  
		// transparent : true }, { isBaseLayer : false }) //

		};
	}

	function removeCustomLayer(name) {
		if (typeof customLayers[name] !== 'undefined') {
			map.removeLayer(customLayers[name]);
			delete customLayers[name];
		}
	}

	function addFeaturesFromDataWithColor(data, parameter, name, min, max, filter) {
		var index = 1000;
		if (typeof customLayers[name] !== 'undefined') {
			index = map.getLayerIndex(customLayers[name])
			map.removeLayer(customLayers[name]);
		}
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
		var hasFilter = filter.hasOwnProperty("parameter");
		for (id in data) {
			if (data.hasOwnProperty(id)) {
				var value = data[id].properties[parameter];
				// TODO: make hasFilter test robust
				if (!(hasFilter && (data[id].properties[filter.parameter] < filter.min || data[id].properties[filter.parameter] > filter.max))
						&& (typeof value !== 'undefined' && value !== -999 && value !== '-999' && value !== null)) {
					value = parseFloat(value);
					var lonLat = new OL.LonLat(data[id].geometry.coordinates[1], data[id].geometry.coordinates[0]);
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
				}
			}
		}
		pointLayer.addFeatures(pointFeatures);
		map.addLayer(pointLayer);
		while (map.getLayerIndex(pointLayer) > index) {
			map.raiseLayer(pointLayer, -1);
		}
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
		OpenLayers.Util.onImageLoadErrorColor = "transparent";

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
			width : 1600,
			height : 800,
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

		var disableNavButton = new OpenLayers.Control.Button({
			displayClass : "olDisableNavButton",
			title : "Disable/Enable mouse-navigation",
			id : 'DisableNavButton',
			trigger : disableNav,
		});
		var disableNavPanel = new OpenLayers.Control.Panel({
			defaultControl : disableNavButton,
			displayClass : "olDisableNavPanel"
		});
		disableNavPanel.addControls([ disableNavButton ]);
		map.addControl(disableNavPanel);

		var toggleHelpButton = new OpenLayers.Control.Button({
			displayClass : "olToggleHelpButton",
			title : "Toggle helptext on/off",
			id : 'ToggleHelpButton',
			trigger : toggleHelp,
		});
		var toggleHelpPanel = new OpenLayers.Control.Panel({
			defaultControl : toggleHelpButton,
			displayClass : "olToggleHelpPanel"
		});
		toggleHelpPanel.addControls([ toggleHelpButton ]);
		map.addControl(toggleHelpPanel);

		// Adding the layers to the map
		var bg = backgroundLayers, fg = mapLayers;
		var layers = [];
		$.each(backgroundLayers, function(i, val) {
			layers.push(val);
		});
		map.addLayers(layers);

		if (debugmW)
			console.log("Added mapLayers");
		map.zoomToExtent(currentBounds, false);

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
				ns.control.setLonLatInput(ll.lon.toFixed(4), ll.lat.toFixed(4), ur.lat.toFixed(4), ur.lon.toFixed(4));
				ns.control.activateBbox();
			}
		});

		map.addControl(control);

		addMapLayers();
		// TODO:
		registerClickBehaviour();
		if (debugmW)
			console.log("Finished initMap");
		triggerQTip2DoNotShowLoad();
		createQtip2('.olDisableNavButtonItemActive', 'top left', 'top right', 'leftTop');
		createQtip2('.olToggleHelpButtonItemActive', 'top left', 'top right', 'leftTop');
		createQtip2('.olPopupsButtonItemActive', 'top left', 'top right', 'leftTop');
		createQtip2('.olPDFButtonItemActive', 'top left', 'top right', 'leftTop');
		$('.olControlZoom').prop("title", "Zoom in/out on the map");
		createQtip2('.olControlZoom');
		$('.olControlLayerSwitcher').children().each(function() {
			if (!this.style || !this.style.display || this.style.display !== "none") {
				$(this).prop("title", "Choose layers on the map");
				createQtip2(this, 'bottom right', 'top right', 'bottomRight');
				return false;
			}
		});
		$('.olControlOverviewMap').children().each(function() {
			if (!this.style || !this.style.display || this.style.display !== "none") {
				$(this).prop("title", "View minimap");
				createQtip2(this, 'bottom right', 'top right', 'bottomRight');
				return false;
			}
		});
		$('.olControlMousePosition').prop("title", "Displays the coordinates of your mouse position");
		createQtip2('.olControlMousePosition');

	}

	var navEnabled = true;
	function disableNav() {
		var i = 0, len = map.controls.length;
		for (; i < len; i++) {
			if (map.controls[i].displayClass === "olControlNavigation")
				break;
		}
		if (i < len) {
			if (navEnabled) {
				map.controls[i].deactivate();
			} else {
				map.controls[i].activate();
			}
			navEnabled = !navEnabled;
		} else {
			if (debugmW)
				console.log("Navigation not found");
		}
	}

	function triggerQTip2DoNotShowLoad() {
		if ($("#qTip2DoNotShowLoad").prop('checked')) {
			$('#simple_map').qtip('hide');
			$('#simple_map').qtip('disable');
			clearInterval(myNamespace.gsadbcLoadingLayersInterval);
		} else {
			$('#simple_map').qtip('enable');
			$('#simple_map').qtip('show');
			clearInterval(myNamespace.gsadbcLoadingLayersInterval);
			myNamespace.gsadbcLoadingLayersInterval = setInterval(function() {
				checkLoadingOfLayers()
			}, 1000);
		}
	}

	function createQtip2(element, my, at, tip) {
		if (!my)
			my = "top left";
		if (!at)
			at = "bottom right";
		if (!tip)
			tip = "leftTop";
		qTipList.push({
			element : element,
			my : my,
			at : at,
			tip : tip
		});
	}
	var helpEnabled = false;
	var qTipList = [];

	function toggleHelp() {
		hideTooltips();
		if (helpEnabled) {
			setDefaultTooltips();
		} else {
			showHelp();
		}
		helpEnabled = !helpEnabled;
		ns.control.toggleHelp(helpEnabled);
	}

	function hideTooltips() {
		for (var i = 0, l = qTipList.length; i < l; i++) {
			$(qTipList[i].element).qtip().hide();
		}
	}

	function showHelp() {
		for (var i = 0, l = qTipList.length; i < l; i++) {
			$(qTipList[i].element).qtip({
				show : true,
				hide : false,
				events : {
					focus : function(event, api) {
						api.set('position.adjust.y', -5);
					},
					blur : function(event, api) {
						api.set('position.adjust.y', 0);
					},
				},
				style : {
					tip : qTipList[i].tip
				},
				position : {
					my : qTipList[i].my,
					at : qTipList[i].at,
				}
			});
		}
	}

	function setDefaultTooltips() {
		for (var i = 0, l = qTipList.length; i < l; i++) {
			$(qTipList[i].element).qtip({
				show : 'mouseover',
				hide : {
					event : 'mouseleave',
					delay : 1000
				},
				style : {
					tip : qTipList[i].tip
				},
				position : {
					my : qTipList[i].my,
					at : qTipList[i].at,
				}
			});
		}
	}

	function checkLoadingOfLayers() {
		var mainDivID = "qTip2mapLoading"
		var mainDiv = $("#" + mainDivID);
		if (mainDiv.length === 0) {
			var checkbox = "<input type='checkbox' id='qTip2DoNotShowLoad' title='Check to disable this information. Can be displayed again by clicking the loading icon in the map'/>Disable this information";
			$('#simple_map').attr("title", "<div id='" + mainDivID + "'>" + checkbox + "</div>");
			$('#simple_map').qtip({
				hide : false,
				show : true,
				position : {
					my : 'top left',
					at : 'top right',
					target : $('#simple_map')
				}
			});
			mainDiv = $("#" + mainDivID);
			var qTip2Button = new OpenLayers.Control.Button({
				displayClass : "olqTip2Button",
				title : "Trigger information on loading of layers",
				id : 'qTip2Button',
				trigger : function() {
					$("#qTip2DoNotShowLoad").trigger('click');
				},
			});
			var panel = new OpenLayers.Control.Panel({
				defaultControl : qTip2Button,
				displayClass : "olqTip2Panel"
			});
			panel.addControls([ qTip2Button ]);
			map.addControl(panel);
			setTimeout(function() {
				ns.buttonEventHandlers.change("#qTip2DoNotShowLoad", triggerQTip2DoNotShowLoad);
				triggerQTip2DoNotShowLoad();
				$('#qTip2DoNotShowLoad').qtip();
				createQtip2('.olqTip2ButtonItemActive', 'top left', 'top right', 'leftTop');
				setDefaultTooltips();
			}, 1000);
		}
		var divs = mainDiv.children("div");
		for (var i = 0, l = divs.length; i < l; i++) {
			$(divs[i]).hide();
		}
		if (!$("#qTip2DoNotShowLoad").prop('checked')) {
			$.each(map.layers, function(i, layer) {
				if (typeof layer.visibility === 'undefined' || layer.visibility) {
					var name = ns.utilities.convertAllIllegalCharactersToUnderscore(layer.name);// 
					var div = $("#qTip2" + name);
					if (div.length === 0) {
						$(mainDiv).append("<div id='qTip2" + name + "'></div>");
						div = $("#qTip2" + name);
					}
					if (layer.numLoadingTiles > 0) {
						div.html("Loading " + layer.name + ":" + layer.numLoadingTiles + " tiles left");
					} else {
						div.html("Loaded " + layer.name);
					}
					$(div).show();
				}
			});
		}
	}

	function addMapLayers() {
		$.each(mapLayers, function(i, val) {
			map.addLayer(val);
		});
	}

	function checkIfLayerHasLoaded(layer) {
		if (layer.numLoadingTiles > 0) {
			map.removeLayer(layer);
			map.addLayer(layer);
		}
	}

	function createPDF() {
		var comment = "Map printed from: " + document.URL;
		if (ns.mainQueryArray)
			$.each(ns.mainQueryArray, function(i, val) {
				comment += "\n" + val;
			});
		if (ns.parametersQueryString)
			comment += "\n" + ns.parametersQueryString;
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
	var info = null;
	function registerClickBehaviour() {
		if (info !== null) {
			info.deactivate();
			map.removeControl(info);
		}
		var layers = [];
		$.each(parameterLayers, function(i, val) {
			if (val instanceof OpenLayers.Layer.WMS)
				layers.push(val);
		});

		for (layer in mapLayers) {
			if (layer !== 'datapoints' && mapLayers.hasOwnProperty(layer)) {
				layers.push(mapLayers[layer]);
				break;
			}
		}
		if (layers.length === 0)
			layers.push(mapLayers.datapoints);

		// clicking feature opens popup with basic info
		info = new OpenLayers.Control.WMSGetFeatureInfo({
			queryVisible : true,
			maxFeatures : 2000,
			layers : layers,
			// drillDown : true,
			eventListeners : {
				nogetfeatureinfo : function(event) {
					console.log("nogetfeatureinfo");
					console.log(event);
				},
				beforegetfeatureinfo : function(event) {
					console.log("beforegetfeatureinfo");
					console.log(event);
					var layersA = event.object.layers;
					var filters = "";
					var delimiter = "";
					for (var i = layersA.length - 1, l = 0; i >= l; i--) {
						var filter = "<Filter xmlns:gml=\"http://www.opengis.net/gml\"></Filter>";
						if (typeof layersA[i].params.FILTER === "string") {
							filter = layersA[i].params.FILTER;
						}
						filters += delimiter + '(' + filter + ')';
						delimiter = "";
					}
					event.object.vendorParams = {
						filter : filters + ""
					};

					// if (typeof event.object.layers[0].params.FILTER ===
					// "string") { console.log("Adding filter");
					// event.object.vendorParams = { filter :
					// event.object.layers[0].params.FILTER }; } else {
					// console.log(typeof event.object.layers[0].params.FILTER);
					// }

				},
				getfeatureinfo : function(event) {
					console.log("getfeatureinfo");
					console.log(event);
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
		var style = new OpenLayers.Style({
			pointRadius : "${radius}",
			fillColor : "#ffcc66",
			fillOpacity : 0.8,
			strokeColor : "#cc6633",
			strokeWidth : "${width}",
			strokeOpacity : 0.8,
			title : "${tooltip}"
		}, {
			context : {
				width : function(feature) {
					return (feature.cluster) ? 2 : 1;
				},
				radius : function(feature) {
					var pix = 2;
					if (feature.cluster) {
						pix = Math.min(feature.attributes.count, 7) + 3;
					}
					return pix;
				},
				tooltip : function(feature) {
					var count = feature.attributes.count;
					var tip = count + " data point";
					return count === 1 ? tip : tip + 's';
				}
			}
		});
		var strategy = new OpenLayers.Strategy.Cluster();
		strategy.distance = 5;
		strategy.treshold = 3;
		var pointLayer = new OL.Layer.Vector(name, {
			strategies : [ strategy ],
			styleMap : new OpenLayers.StyleMap({
				"default" : style,
				"select" : {
					fillColor : "#8aeeef",
					strokeColor : "#32a8a9"
				}
			}),
			projection : "EPSG:4326",
		});
		var pointFeatures = [];
		for (id in data) {
			if (data.hasOwnProperty(id)) {
				var lonLat = new OL.LonLat(data[id].geometry.coordinates[1], data[id].geometry.coordinates[0]);
				var pointGeometry = new OL.Geometry.Point(lonLat.lat, lonLat.lon);
				var pointFeature = new OL.Feature.Vector(pointGeometry);
				pointFeatures.push(pointFeature);
			}
		}
		map.addLayer(pointLayer);
		// map.setLayerIndex(pointLayer, 10);
		pointLayer.addFeatures(pointFeatures);
		parameterLayers[name] = pointLayer;
		// TODO:
		registerClickBehaviour()
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
			var startIndex = 0;
			while (true) {
				var newFilter = "";
				var startSub = filter.indexOf("<gml:lowerCorner>", startIndex) + 17;
				// Check if there actually is a bbox
				if (startSub === 16)
					return filter;
				var endSub = filter.indexOf("</gml:lowerCorner>", startIndex);
				newFilter += filter.substring(0, startSub);

				var oldCoordinates = filter.substring(startSub, endSub);
				var lonLat = oldCoordinates.split(" ");
				newFilter += lonLat[1] + " " + lonLat[0];
				var startSub = filter.indexOf("<gml:upperCorner>", startIndex) + 17;
				// Check if there actually is a bbox again
				if (startSub === 16)
					return filter;
				newFilter += filter.substring(endSub, startSub);
				endSub = filter.indexOf("</gml:upperCorner>", startIndex);

				oldCoordinates = filter.substring(startSub, endSub);
				lonLat = oldCoordinates.split(" ");
				newFilter += lonLat[1] + " " + lonLat[0];

				newFilter += filter.substring(endSub);
				if (debugmW)
					console.log("swapLonLatInFilteR ended with filter:" + newFilter);
				startIndex = endSub + 10;
				filter = newFilter;
			}
		} else {
			return "";
		}
	}

	// Adding a layer with a filter and name to the map using a WMS. The
	// handling of the metadatatable is customized. name should not be "Data
	// points"
	function addLayerWMS(filter, layer, name, barnes,valueAttr,scale,convergence,passes,minObservations,maxObservationDistance,pixelsPerCell,queryBuffer,opacity,min,max) {
		if (debugmW)
			console.log("addLayerWMS started");
		var layers = parameterLayers;
		// var index = 999;
		var color = window[layer + "Color"] || "#610B0B";
		var newLayer;
		if (layer === window.metaDataTable) {
			// index = 998;
			layers = mapLayers;
		} else {
			color = window[layer + "Color"] || ns.utilities.getRandomColor();
		}
		if (name in layers) {
			if (debugmW)
				console.log("name in parameterLayers: " + layers[name]);
			map.removeLayer(layers[name]);
		}

		var swapLonLatFilter = swapLonLatInFilteR(filter);

		if (barnes) {
			newLayer = new OpenLayers.Layer.WMS(name, window.WMSServer, {
				// layers : layer,
				transparent : true,
				filter : swapLonLatFilter,
				// styles : "BarnesSurface",
				//layer,valueAttr,scale,convergence,passes,minObservations,maxObservationDistance,pixelsPerCell,queryBuffer,opacity
				sld_body : getBarnesSLD(layer,valueAttr,scale,convergence,passes,minObservations,maxObservationDistance,pixelsPerCell,queryBuffer,opacity,min,max),
			//"value",20.0,0.2,2,1,2,10,40,0.8),
				format : window.WMSformat
			}, {
				isBaseLayer : false,
				tileOptions : {
					maxGetUrlLength : 2048
				},
			});
		} else {
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
		}

		if (debugmW)
			console.log("created the new layers");
		map.addLayer(newLayer);
		// map.setLayerIndex(newLayer, index);
		layers[name] = newLayer;
		// TODO:
		registerClickBehaviour();
		if (debugmW)
			console.log("Added the layer: " + name);
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
		var index = numberOfBackgroundLayers;
		if (shortName in customLayers) {
			index = map.getLayerIndex(customLayers[shortName])
			map.removeLayer(customLayers[shortName]);
			if (debugmW)
				console.log("Removed the existing WMS layer");
		}
		customLayers[shortName] = layer;
		map.addLayer(layer);
		while (map.getLayerIndex(layer) > index) {
			map.raiseLayer(layer, -1);
		}
		if (debugmW)
			console.log("Added the WMS layer");
	}

	function getExtent() {
		return map.getExtent();
	}

	function zoomToExtent(bbox, swapLonLat) {
		if (swapLonLat) {
			bbox = new OL.Bounds(bbox.bottom, bbox.left, bbox.top, bbox.right);
		}
		map.zoomToExtent(bbox, true);
	}

	// public interface
	return {
		addWMSLayer : addWMSLayer,
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
		triggerQTip2DoNotShowLoad : triggerQTip2DoNotShowLoad,
		getListOfLayers : getListOfLayers,
		updateIndex : updateIndex,
	};

}(OpenLayers, jQuery, myNamespace));
