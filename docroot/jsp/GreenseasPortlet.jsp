<%-- This is a JSP containing the main GUI elements of the viewer. 
  -- The CSS and JavaScript files needed are defined in liferay-portlet.xml
--%>


<%@page%>
<%@ taglib uri="http://java.sun.com/portlet_2_0" prefix="portlet"%>
<%@ taglib uri="http://alloy.liferay.com/tld/aui" prefix="aui"%>

<portlet:defineObjects />

<!--  Create a serveResource URL -->
<portlet:resourceURL var="ajaxCallResourceURL" />

<div id="portlet">

	<div id="simple_map"></div>

	<div id="tabs">
		<ul>
			<li><a href="#queryTab">Query and features</a></li>
			<li><a href="#parametersTab">Parameters</a></li>

		</ul>
		<div id="queryTab">
			<div id='search'>
				<p>Search layers with various parameters.</p>
				<div id='queryOptions'>
					<h3>
						<span id='bboxHeaderText'>Bounding box <em>(disabled)</em></span>
					</h3>
					<div id='bbox'>
						<input type="checkbox" id="bboxEnabledCheck"> Enable in query <br> <em>Tip: You can hold shift
							and draw with mouse on map to set bounding box</em> <br> <input type='button' id='toCurrentExtent'
							value="From map extent" title='Sets bounding box to the current extent of the map' /> <input type='button'
							id='anywhereButton' value="Anywhere" />
						<div>
							<form name="lonlatform">
								<div class='centered'>
									<input type='text' id='top' size="5" />
								</div>
								<div class='offcentered'>
									<input type='text' id='left' size="5" /><input type='text' id='right' size="5" />
								</div>
								<div class='centered'>
									<input type='text' id='bottom' size="5" />
								</div>

								<div title='If checked, map will move to this area when query is run'>
									<input type="checkbox" name="updatemapcheck"> Update map focus when query is run
								</div>
							</form>
						</div>
					</div>

					<h3>
						<span id='dateHeaderText'>Date/Time <em>(disabled)</em></span>
					</h3>
					<div id='datetime'>

						<input type="checkbox" id="dateEnabledCheck"> Enable in query <br> <br> <em>Date (Use
							yyyy-mm-dd format if no date picker appears)</em> <br> Between <input type="date" id="fromDate"
							value="1915-01-01"> and <input type="date" id="toDate" value="2007-01-01"> <br>
						<input type="checkbox" id="timeEnabledCheck"> Search for time <br> <br> Between <input
							type="time" id="fromTime" value="00:00"> and <input type="time" id="toTime" value="23:59"> <br>

					</div>

					<h3>
						<span id='depthHeaderText'>Depth<em>(disabled)</em></span>
					</h3>
					<div id='depth'>

						<input type="checkbox" id="depthEnabledCheck"> Enable in query <br> <br>

						<div>
							<form name="depthform">
								<div class='left'>
									<input type='text' id='depthMin' size="3" value="0" /> Minimum depth
								</div>
								<div class='left'>
									<input type='text' id='depthMax' size="3" value="10" /> Maximum depth
								</div>

							</form>
						</div>
					</div>

					<h3>
						<span id='parametersHeaderText'>Parameters <em>(disabled)</em></span>
					</h3>
					<div id='parametersNeeded'>

						<div>
							<input type="checkbox" id="parametersEnabledCheck"> Enable in query
						</div>

						<em> Tip: Selecting multiple parameters within a group resolves to "one of these". Selecting variables from
							different groups resolves to "all of these". <br> Example: Selecting variables Physical.x1, Phyiscal.x2,
							Plankton.y1, Plankton.y2 and Plankton.y3 would resolve in the query: ((Physical.x1 OR Phyiscal.x2)AND(Plankton.y1
							OR Plankton.y2 OR Plankton.y3)).
						</em>
						<div id="parametersTree"></div>
						<br>
						<div>
							<input type="checkbox" id="qualityFlagsEnabledCheck"> Include qualityflags
						</div>
					</div>
				</div>

				<input type='button' id='filter' value="Run main query" /> <input type='button' id='filterParameters'
					value="Filter selected parameters" />

			</div>

			<div id="loadingText"></div>
			<div id="featuresAndParams">

				<div id="list"></div>

			</div>

			<!-- these divs are popus, don't actually appear -->
			<div id="rawRequestDialog" title="Raw request">
				<textarea id="rawRequestText"></textarea>
			</div>

			<div id="errorMessageDialog" title="An error occured"></div>
		</div>

		<div id="parametersTab">
			<p>Run a query and filter selected parameters to view the parameter values here.</p>
			<div id="singlePlots">
				<div id="parametersContainer" class="container">
					<div id="parametersTable" class="floatLeft"></div>
				</div>
			</div>
			<div id="exportParametersDiv">
				<input type='button' id='exportParameter' value="Export data" disabled /> <select id="exportParametersFormats">
					<option value="csv">CSV</option>
				</select>
			</div>
		</div>
	</div>
</div>

<aui:script>
	window.allParametersHeader = <%=renderRequest.getAttribute("allParametersHeader")%>;
	window.portletNameSpace = '<portlet:namespace />';
	window.ajaxCallResourceURL = '<%=ajaxCallResourceURL.toString()%>';
	$(document).ready(function() {
		myNamespace.control.init();
	});
</aui:script>