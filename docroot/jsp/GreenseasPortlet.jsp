<%-- This is a JSP containing the main GUI elements of the viewer. 
  -- The CSS and JavaScript files needed are defined in liferay-portlet.xml
--%>


<%@page%>
<%@ taglib uri="http://java.sun.com/portlet_2_0" prefix="portlet"%>
<%@ taglib uri="http://alloy.liferay.com/tld/aui" prefix="aui"%>

<portlet:defineObjects />

<!--  Create a serveResource URL -->
<portlet:resourceURL var="ajaxCallResourceURL" />
<portlet:actionURL var="submitFileAction" name="submitFile">
</portlet:actionURL>

<div id="gsadbcPortlet">

	<div id="mapContainer">
		<div id="simple_map"></div>
		<div id="rightOfMap">
			<div id="legend">
				<div id="innerLegend"></div>
			</div>
		</div>
	</div>

	<div id="tabs">
		<ul>
			<li><a href="#queryTab">Search</a></li>
			<li><a href="#parametersTab">Search results</a></li>
			<li><a href="#statsTab">Statistics, plots and charts</a></li>
			<!-- 			<li><a href="#rasterTab">Configure raster data</a></li> -->
			<li><a href="#matchUpTab">Model/data matchup</a></li>
			<li><a href="#layersTab">Configure Map layers</a></li>
			<li><a href="#saveTab">Save</a></li>

		</ul>
		<div id="queryTab">
			<div id='search'>
				<p>Search options. If the search is too big, it may take some time, especially in Internet Explorer. The
					recommended browser is the latest version of Google Chrome.</p>
				<div id='queryOptions'>
					<h3>
						<span id='bboxHeaderText'>Bounding box <em>(off)</em></span>
					</h3>
					<div id='bbox'>
						<input type="checkbox" id="bboxEnabledCheck" title='Enables the bounding box query' />
						Enable in query
						<br>
						<em>Tip: You can hold shift and draw with mouse on map to set bounding box. This will also automatically
							enable this query.</em>
						<br>
						<input type='button' id='toCurrentExtent' value="From map extent"
							title='Sets bounding box to the current extent of the map' />
						<input type='button' id='anywhereButton' value="Anywhere" title='Sets bounding box to the whole globe' />
						<div>
							<form name="lonlatform">
								<div class='centered'>
									<input type='text' id='top' size="5" title='Maximum latitude' />
								</div>
								<div class='offcentered'>
									<input type='text' id='left' size="5" title='Minimum longitude' />
									<input type='text' id='right' size="5" title='Maximum longitude' />
								</div>
								<div class='centered'>
									<input type='text' id='bottom' size="5" title='Minimum latitude' />
								</div>

								<br>
								<input type="checkbox" name="updatemapcheck" title='If checked, map will zoom to this area when query is run'>
								Update map focus when query is run
							</form>
						</div>
					</div>

					<h3>
						<span id='dateHeaderText'>Date/Time/Month <em>(off)</em></span>
					</h3>
					<div id='datetime'>

						<input type="checkbox" id="dateEnabledCheck" title='Enables the Date query' />
						Search by date
						<br>
						<br>
						<em>Date (Use yyyy-mm-dd format if no date picker appears)</em>
						<br>
						Between
						<input type="date" id="fromDate" value="1913-01-01" />
						and
						<input type="date" id="toDate" value="2012-01-01" />
						<br>
						<input type="checkbox" id="timeEnabledCheck" title='Enables the time query within the date-query' />
						Include time in the date-search (date search must be enabled for this)
						<br>
						<br>
						Between
						<input type="time" id="fromTime" value="00:00" />
						and
						<input type="time" id="toTime" value="23:59" />
						<br>
						<input type="checkbox" id="monthEnabledCheck" title='Enables the search-by-month query' />
						Search by month
						<br>
						<br>
						Between <select id="fromMonth">
							<option value="January">January</option>
							<option value="February">February</option>
							<option value="March">March</option>
							<option value="April">April</option>
							<option value="May">May</option>
							<option value="June">June</option>
							<option value="July">July</option>
							<option value="August">August</option>
							<option value="September">September</option>
							<option value="October">October</option>
							<option value="November">November</option>
							<option value="December">December</option>
						</select> and <select id="toMonth">
							<option value="January">January</option>
							<option value="February">February</option>
							<option value="March">March</option>
							<option value="April">April</option>
							<option value="May">May</option>
							<option value="June">June</option>
							<option value="July">July</option>
							<option value="August">August</option>
							<option value="September">September</option>
							<option value="October">October</option>
							<option value="November">November</option>
							<option value="December">December</option>
						</select>
						<br>

					</div>

					<h3>
						<span id='depthHeaderText'>Depth<em>(off)</em></span>
					</h3>
					<div id='depth'>

						<input type="checkbox" id="depthEnabledCheck" title='Enables the depth query'>
						Enable in query
						<br>
						<br>

						<div>
							<form name="depthform">
								<div class='left'>
									<input type='text' id='depthMin' size="3" value="0" />
									Minimum depth
								</div>
								<div class='left'>
									<input type='text' id='depthMax' size="3" value="0" />
									Maximum depth
								</div>

							</form>
						</div>
					</div>

					<h3>
						<span id='metadataHeaderText'>Metadata <em>(off)</em></span>
					</h3>
					<div id='metadataSelected'>

						<div>
							<input type="checkbox" id="metadataEnabledCheck" title='Enables the metadata query' />
							Enable in query
						</div>
						<em>Select the metadata you want to accompany the data. If this is not enabled, then, by default, all
							metadata will be selected.</em>
						<div id="metadataTree"></div>
					</div>

					<h3>
						<span id='cruiseHeaderText'>Cruise/Station <em>(off)</em></span>
					</h3>
					<div id='cruiseSelectedDiv'>

						<div>
							<input type="checkbox" id="cruiseEnabledCheck" title='Enable the Cruise/Station query' />
							Enable in query
						</div>
						<em>Select a cruise</em>
						<div id="cruiseSelectorDiv"></div>
					</div>

					<h3>
						<span id='regionHeaderText'>Longhurst region <em>(off)</em></span>
					</h3>
					<div id='regionSelected'>
						<div>
							<input type="checkbox" id="regionEnabledCheck" title='Enables the Longhurst region query' />
							Enable in query
						</div>
						<em>Select the region you want to search by. All provinces that include data are supported. However, be aware
							that the Austral Polar Province and the Boreal Polar Province are defined by huge polygons which will severely
							slow down the application.</em>
						<div id="regionList"></div>
					</div>

					<h3>
						<span id='parametersHeaderText'>Parameters</span>
					</h3>
					<div id='parametersNeeded'>

						<!-- 						<div> -->
						<!-- 							<input type="checkbox" id="parametersEnabledCheck"> -->
						<!-- 							Enable in query -->
						<!-- 						</div> -->
						<em>Tip1: Start with a main query based on the different search criteria above, and press the button for main
							query. Now a number should be updated behind each parameter (it will take some time to compute them all), which
							indicates how many entries of this kind there are available in the first search. Then select parameters and press
							the filter button. </em>
						<br>
						<em> Tip2: Selecting multiple parameters within a group resolves to "one of these". Selecting variables from
							different groups resolves to "all of these". <br> Example: Selecting variables Salinity.x1, Salinity.x2,
							Plankton.y1, Plankton.y2 and Plankton.y3 would resolve in the query: ((Salinity.x1 OR Salinity.x2)AND(Plankton.y1
							OR Plankton.y2 OR Plankton.y3)).
						</em>
						<br>
						Search the parameterslist:
						<input type='text' id='treeSearchParameter' size="10" />
						<input type='button' id=filterParametersTreeButton value="Search" />
						<input type="button" id="clearSelectionButton" value="Clear selection" title='Deselect all parameters' />
						<input type="button" id="collapseAllButton" value="Collapse All" title='Collapse all nodes in the list' />
						<input type="button" id="expandAllButton" value="Expand All" title='Expand all nodes in the list' />
						<input type="button" id="toggleOrderPlanktonButton" value="Sort plankton by type"
							title='Toggle sort by plankton type/size' />
						<div id='loadTreeNumbersDiv'></div>
						<div id="parametersTree"></div>
						<br>
						<br>
						<div>
							<input type="checkbox" id="qualityFlagsEnabledCheck" title='Include qualityflags for the variables in the output' />
							Include qualityflags (This will include an extra collumn for quality flags for each variable in the output).
						</div>
					</div>
				</div>
				<input type="checkbox" id="updateParametersList"
					title='If this option is selected when the main query is run, an inventory of all available parameters in the selection will be updated in the parameters list.'
					checked />
				Update the list of parameters with inventory numbers when the main query is run.
				<br>
				<input type='button' id='filter' value="Run main query"
					title='Runs the main query based on the enabled queries above. The parameters list does not affect this initial query.' />
				<input type='button' id='filterParameters' value="Filter selected parameters"
					title='Filter the results in the main query based on the parameters selected.' />

			</div>

			<div id="loadingText"></div>
			<div id="featuresAndParams">

				<div id="list"></div>

			</div>
		</div>

		<div id="parametersTab">
			<div id="parametersTabText">
				<p>Run a query and filter selected parameters to view the search results here.</p>
			</div>
			<div id="singlePlots">
				<div id="parametersContainer" class="container">
					<div id="parametersTable" class="floatLeft"></div>
				</div>
			</div>
			<div id="exportParametersDiv" class="floatLeft">
				<input type='button' id='exportParameter' value="Export data" disabled />
				<select id="exportParametersFormats">
					<option value="csv">CSV</option>
				</select>
			</div>
		</div>


		<div id="statsTab">
			<div id="parametersTabText">
				<p>Run a query and filter selected parameters to view options here.</p>
			</div>
			<div id='statsOptions'>
				<h3>
					<span>Statistics</span>
				</h3>
				<div id="outerStatistics">
					<div id="statistics">
						<input type="button" id="calculateStatisticsButton" value="Calculate statistics"
							title='Calculate quantity, min, max, average, sample standard deviation and variance of the selected parameters' />
						<div id="statisticsContainer"></div>
						<br>
					</div>
				</div>
				<h3>
					<span>Time Series</span>
				</h3>
				<div id='outerTimeSeriesDiv'>
					<div id='timeSeriesDiv'>
						<div id="timeSeriesVariableDiv"></div>
						<br>
						<input type='button' id='addTimeSeriesVariableButton' value="Add another variable" />
						<br>
						<input type='button' id='timeSeriesButton' value="Generate Timeseries" />
						<div id="timeSeriesContainer" style="width: 100%; height: 400px;"></div>
					</div>
				</div>
				<h3>
					<span>Properties Plot</span>
				</h3>
				<div id='outerPropertiesPlotDiv'>
					<div id='propertiesPlotDiv'>
						<div id="propertiesPlotVariableDiv"></div>
						<br>
						<input type='button' id='propertiesPlotButton' value="Generate Properties Plot" />
						<div id="propertiesPlotContainer" style="width: 100%; height: 400px;"></div>
					</div>
				</div>
			</div>
		</div>

		<div id="rasterTab">
			<div id='uploadRaster'></div>
		</div>

		<div id="matchUpTab">
			<div id='modelOptions'>
				<h3>
					<span id='modelOptionsHeaderText'>Upload NetCDF File <em>(off)</em></span>
				</h3>
				<div id='fileOption'>
					<div>
						<input type="checkbox" id="fileOptionCheck" title='Use the uploaded file' />
						Use an uploaded file
					</div>
					<p>Upload the raster data you want to compare to.</p>
					<form id="uploadRasterForm" action="<%=submitFileAction%>" method="post" enctype="multipart/form-data">
						<input type="file" id="file" name='<portlet:namespace />file' size="50" accept=".nc" />
						<input type="submit" value="Upload" />
					</form>
					<div id="progress">
						<div id="bar"></div>
						<div id="percent">0%</div>
					</div>
					<div id="status"></div>
					<div id="loadFromFileIDDiv">
						<br>
						File ID:
						<input id='rasterUploadedFileID' type="text" size="35" />
						<input type='button' id='loadFileFromIDButton' value="Load from fileID" />
					</div>
				</div>
				<h3>
					<span id='openDAPOptionHeaderText'>Use dataset from OpenDAP <em>(on)</em></span>
				</h3>
				<div id='openDAPOption'>
					<div>
						<input type="checkbox" id="opendapDataURLCheck" checked />
						Use OPeNDAP data URL
					</div>
					<div id="opendapURLContainer"></div>
				</div>
			</div>
			<input type='button' id='initiateRasterDataButton' value="Initiate raster data"
				title='Initiate a selector from the NetCDF file or OpenDAP URL' />
			<div id='compareRaster'></div>
			<input type='button' id='compareRasterButton' value="Compare" />
			<div id="highchartsContainer" style="width: 100%; height: 500px;"></div>
		</div>

		<div id="layersTab">
			<p>Select/configure Layers:</p>
			<div id='rasterLayersDiv'>
				<h3>
					<span id='upDownLayersDivHeaderText'>Move layers up/down<!-- <em>(off)</em> --></span>
				</h3>
				<div id='upDownLayersDiv'>
					<div id='upDownLayersHelpText'></div>
					<div id='upDownLayersTableDiv'></div>
				</div>
				<h3>
					<span id='rasterLayersDivHeaderText'>Add Raster Layers <!-- <em>(off)</em> --></span>
				</h3>
				<div id='mapLayersDiv'>
					Dataset/Variable/Colorscale(min/max/auto)/Layertype(boxfill/contour/etc)/Scale(linear/logarithmic)/Elevation/Date/Time
					<br>
					<div id="layerURLSelectorContainer"></div>
					<input type='button' id='addLayerButton' value="Add new layer" />
				</div>
				<h3>
					<span id='parametersLayerDivHeaderText'>Add Parameter Layers <!-- <em>(off)</em> --></span>
				</h3>
				<div id='parameterLayerVariableAccordionDiv'>
					<div id='parameterLayerVariableHelpText'></div>
					<div id='parameterLayerVariableContainer'></div>
				</div>
			</div>
		</div>

		<div id="saveTab">
			<div id='saveAccordionDiv'>
				<h3>
					<span id='saveDivHeaderText'>Save Query</span>
				</h3>
				<div id='saveDiv'>
					This is currently in beta and it is possible that the link might not work in future versions, however it would
					always be possible to interpret the query from the link.
					<div id="saveContainer"></div>
					<br><input type="checkbox" id="saveQueryRunMainQuery"  />Automatically run main query
					<br><input type="checkbox" id="saveQueryUpdateInventory"  />Automatically update inventory numbers
					<br><input type="checkbox" id="saveQueryRunParameterFilter"  />Automatically run the parameter filter
					<br><input type="checkbox" id="saveQueryAutoDownloadCSV"  />Automatically download as csv
					<br><input type="checkbox" id="saveQueryDisableMap" title='Disables the map for faster execution of queries' />Disable the map
					<br><input type='button' id='saveQueryButton' value="Save Query" />
				</div>
			</div>
		</div>

	</div>

	<!-- these divs are popus, don't actually appear -->
	<div id="errorMessageDialog" title="Warning"></div>
</div>

<aui:script>
	$(document).ready(function() {
	myNamespace.parameters = {};
	<!-- Initiating context path for images -->
	window.contextPath = "<%=request.getContextPath()%>";
	<!-- Initiating all properties from the main properties file -->
	<%=renderRequest.getAttribute("allProperties")%>
	<!-- Initiating window.allParametersHeader -->
	<%=renderRequest.getAttribute("allParametersHeader")%>
	<!-- Initiating window.wmsLayers -->linkedQuery
	<%=renderRequest.getAttribute("wmsLayers")%>
	<!-- Initiating window.openDAPURLs -->
	<%=renderRequest.getAttribute("openDAPURLs")%>
	<!-- Initiating window.cruisesList -->
	<%=renderRequest.getAttribute("cruisesList")%>
	<!-- Initiating window.combinedParamaters -->
	<%=renderRequest.getAttribute("combinedParameters")%>
	<!-- Initiating window.longhurstRegions -->
	<%=renderRequest.getAttribute("longhurstRegions")%>
	<!-- Initiating window.allLayersHeader and window.allLayers -->
	<%=renderRequest.getAttribute("allLayers")%>
		window.portletNameSpace = '<portlet:namespace />';
		window.ajaxCallResourceURL = '<%=ajaxCallResourceURL.toString()%>';
	myNamespace.parameters.linkedQuery="<%=renderRequest.getAttribute("linkedQuery")%>";
	myNamespace.parameters.portletURL="<%=renderRequest.getAttribute("portletURL")%>";
		myNamespace.control.init();
	});
</aui:script>