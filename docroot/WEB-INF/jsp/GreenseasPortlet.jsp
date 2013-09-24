<%-- This is a JSP containing the main GUI elements of the viewer. 
  -- The CSS and JavaScript files needed are defined in liferay-portlet.xml
--%>


<%@page%>
<%@ taglib uri="http://java.sun.com/portlet_2_0" prefix="portlet"%>

<portlet:defineObjects />

<div id="portlet">

	<div id="simple_map"></div>

	<div id="tabs">
		<ul>
			<li><a href="#queryTab">Query and features</a></li>
			<li><a href="#temperatureTab">Temperature</a></li>
			<li><a href="#chlorophyllTab">Chlorophyll</a></li>
			<li><a href="#planktonTab">Plankton</a></li>
			<li><a href="#flagellateTab">Flagellate</a></li>
			<li><a href="#selectedParametersTab">Selected Parameters</a></li>

		</ul>
		<div id="queryTab">
			<div id='search'>
				<p>Search layers with various parameters. Disabling a parameter
					category means it will not be included in the query (equivalent to,
					but faster than setting parameters to "anywhere" etc.).</p>
				<div id='queryOptions'>
					<h3>
						<span id='bboxHeaderText'>Bounding box <em>(disabled)</em></span>
					</h3>
					<div id='bbox'>
						<input type="checkbox" id="bboxEnabledCheck"> Enable in
						query <br> <em>Tip: You can hold shift and draw with
							mouse on map to set bounding box</em> <br> <input type='button'
							id='toCurrentExtent' value="From map extent"
							title='Sets bounding box to the current extent of the map' /> <input
							type='button' id='anywhereButton' value="Anywhere" />
						<div>
							<form name="lonlatform">
								<div class='centered'>
									<input type='text' id='top' size="5" />
								</div>
								<div class='offcentered'>
									<input type='text' id='left' size="5" /><input type='text'
										id='right' size="5" />
								</div>
								<div class='centered'>
									<input type='text' id='bottom' size="5" />
								</div>

								<div
									title='If checked, map will move to this area when query is run'>
									<input type="checkbox" name="updatemapcheck"> Update
									map focus when query is run
								</div>
							</form>
						</div>
					</div>

					<h3>
						<span id='dateHeaderText'>Date/Time <em>(disabled)</em></span>
					</h3>
					<div id='datetime'>

						<input type="checkbox" id="dateEnabledCheck" checked="checked"> Enable in
						query <br> <br> <em>Date (Use yyyy-mm-dd format if
							no date picker appears)</em> <br> Between <input type="date"
							id="fromDate" value="2006-01-01"> and <input type="date"
							id="toDate" value="2007-01-01"><br> <br> <em>Time</em>
						<br> Between <input type="time" id="fromTime" value="00:00">
						and <input type="time" id="toTime" value="23:59"> <br>

					</div>

					<h3>
						<span id='attributesHeaderText'>Attributes <em>(disabled)</em></span>
					</h3>
					<div id='attributes'>

						<div>
							<input type="checkbox" id="attributesEnabledCheck">
							Enable in query
						</div>

						<div>
							<div>Area</div>
							<b>Not</b> <input type="checkbox" id="notArea"> <select
								id="areaNameAttribute">
								<option value="ANY">Any</option>
								<option value="SO">SO (Southern Ocean)</option>
								<option value="Arctic">Arctic</option>
								<option value="Nordic">Nordic</option>
								<option value="Atlantic">Atlantic</option>
							</select>
						</div>

						<div>
							<div>Measure type 1</div>
							<b>Not</b> <input type="checkbox" id="notMeasureType1"> <select
								id="vesselnameAttribute">
								<option value="ANY">Any</option>
								<option value="point">point</option>
								<option value="Point">Point</option>
								<option value="integrated">integrated</option>
								<option value="depth integrated">depth integrated</option>
								<option value="varies">varies</option>
								<option value="MLD derived">MLD derived</option>
								<option value="MMBI derived">MMBI derived</option>
							</select>
						</div>

						<div>							
							<div>Measure type 2</div>
							<b>Not</b> <input type="checkbox" id="notMeasureType2"> <select
								id="sourceAttribute">
								<option value="ANY">Any</option>
								<option value="grease /ice">grease /ice</option>
								<option value="bottle">bottle</option>
								<option value="profile">profile</option>
								<option value="Uptake rates, nutrient profiles">Uptake rates, nutrient profiles</option>
								<option value="Uptake rates, chlorophyll">Uptake rates, chlorophyll</option>
								<option value="brine">brine</option>
								<option value="nutrient uptake">nutrient uptake</option>
								<option value="incubation">incubation</option>
								<option value="open water">open water</option>
								<option value="chl size fraction profile">chl size fraction profile</option>
								<option value="hydrographic profiles">hydrographic profiles</option>
								<option value="surface transect">surface transect</option>
							</select>
						</div>

						</div>
						<h3>
							<span id='parametersHeaderText'>Parameters <em>(disabled)</em></span>
						</h3>
						<div id='Parameters'>

							<div>
								<input type="checkbox" id="parametersEnabledCheck">
								Enable in query
							</div>

							<div>
								<div>Area</div>
									<input type="checkbox" id="temperatureEnabledCheck"> Temperature <br>
									<input type="checkbox" id="chlorophyllEnabledCheck"> Chlorophyll <br>
							</div>
						</div>

					</div>

				<input type='button' id='filter' value="Run query" /> <!-- <input
					type='button' id='showRawQueryButton' value="Show raw query" />  -->

			</div>

			<div id="loadingText"></div>
			<div id="featuresAndParams">

				<div id="list"></div>

				<div id="exportDiv">
					<input type='button' id='export' value="Export results" disabled />
					<select id="exportFormats">
						<option value="csv">CSV</option>
						<option value="gml2">GML2</option>
						<option value="shape-zip">Shapefile</option>
						<option value="json">GeoJSON</option>
					</select>
				</div>
			</div>


			<!-- these divs are popus, don't actually appear -->
			<div id="rawRequestDialog" title="Raw request">
				<textarea id="rawRequestText"></textarea>
			</div>

			<div id="errorMessageDialog" title="An error occured"></div>

		</div>

		<div id="temperatureTab">
			<p>Run a query and select a feature (click a row) to view the temperature values
				here.</p>
			<div id="singlePlots">
				<div id="parameters" class="container">
					<div id="temperature" class="floatLeft"></div>
					<div id="salinity" class="floatRight"></div>
				</div>
				<div id="parameterPlots" class="container">
					<div id="temperaturePlot" class="floatLeft"></div>
					<div id="salinityPlot" class="floatRight"></div>
				</div>
			</div>
			<div id="exportTemperatureDiv">
				<input type='button' id='exportTemperature' value="Export temperature" disabled />
				<select id="exportTemperatureFormats">
					<option value="csv">CSV</option>
					<option value="gml2">GML2</option>
					<option value="shape-zip">Shapefile</option>
					<option value="json">GeoJSON</option>
				</select>
			</div>
		</div>

		<div id="chlorophyllTab">
			<p>
				Run a query and select a feature (click a row) to view the chlorophyll values here.
			</p>
			<div id="parameterTables">
				<div id="chlorophyllParameters" class="container">
					<div id="chlorophyll" class="floatLeft"></div>
				</div>
			</div>
			<div id="exportChlorophyllDiv">
				<input type='button' id='exportChlorophyll' value="Export chlorophyll" disabled />
				<select id="exportChlorophyllFormats">
					<option value="csv">CSV</option>
					<option value="gml2">GML2</option>
					<option value="shape-zip">Shapefile</option>
					<option value="json">GeoJSON</option>
				</select>
			</div>
		</div>
		
		<div id="planktonTab">
			<p>
				Run a query and select a feature (click a row) to view the plankton values here.
			</p>
			<div id="planktonParametersTables">
				<div id="planktonParameters" class="container">
					<div id="plankton" class="floatLeft"></div>
				</div>
			</div>
			<div id="exportPlanktonDiv">
				<input type='button' id='exportPlankton' value="Export plankton" disabled />
				<select id="exportPlanktonFormats">
					<option value="csv">CSV</option>
					<option value="gml2">GML2</option>
					<option value="shape-zip">Shapefile</option>
					<option value="json">GeoJSON</option>
				</select>
			</div>
		</div>
				
		<div id="flagellateTab">
			<p>
				Run a query and select a feature (click a row) to view the flagellate values here.
			</p>
			<div id="flagellateParametersTables">
				<div id="flagellateParameters" class="container">
					<div id="flagellate" class="floatLeft"></div>
				</div>
			</div>
			<div id="exportFlagellateDiv">
				<input type='button' id='exportFlagellate' value="Export flaggelate" disabled />
				<select id="exportFlaggellateFormats">
					<option value="csv">CSV</option>
					<option value="gml2">GML2</option>
					<option value="shape-zip">Shapefile</option>
					<option value="json">GeoJSON</option>
				</select>
			</div>
		</div>
	</div>
		<div id="selectedParametersTab">
			<p>Run a query and select a feature (click a row) to view the parameter values
				here.</p>
			<div id="selectedParametersTables">
				<div id="selectedParameters" class="container">
					<div id="selectedParameter" class="floatLeft"></div>
				</div>
			</div>
			<div id="exportSelectedParametersDiv">
				<input type='button' id='exportSelectedParameters' value="Export selected parameters" disabled />
				<select id="exportSelectedParametersFormats">
					<option value="csv">CSV</option>
					<option value="gml2">GML2</option>
					<option value="shape-zip">Shapefile</option>
					<option value="json">GeoJSON</option>
				</select>
			</div>
		</div>
</div>


<script type="text/javascript">
	$(document).ready(function() {
		myNamespace.control.init();
	});
</script>
