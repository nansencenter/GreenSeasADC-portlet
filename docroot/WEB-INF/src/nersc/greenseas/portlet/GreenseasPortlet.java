/**
 *  GreenseasPortlet -  a portlet to view and extract values from the GreenSeas
 *  Analytical Database.
 *  
 *  Copyright (C) 2013 Nansen Environmental and Remote Sensing Center (NERSC)
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
package nersc.greenseas.portlet;

import java.io.IOException;
import java.util.ResourceBundle;

import javax.portlet.ActionRequest;
import javax.portlet.ActionResponse;
import javax.portlet.GenericPortlet;
import javax.portlet.PortletException;
import javax.portlet.PortletURL;
import javax.portlet.ProcessAction;
import javax.portlet.RenderMode;
import javax.portlet.RenderRequest;
import javax.portlet.RenderResponse;

//import org.apache.log4j.Logger;

/**
 * GreenSeasPortlet displays the location of oceanographic measurements on
 * a map and allows extraction of data within a user defined geographic area.
 * 
 * @author torillh
 * 
 */
public class GreenseasPortlet extends GenericPortlet {
	
	
	/* TODO: define private parameters for portlet configuration, if needed */
	/*
	private String a;
	*/
	
	/*
	 * Overrides the init method of the GenericPortlet class to get
	 * text strings and URL parameters specified in portlet.xml.
	 * 
	 * @see javax.portlet.GenericPortlet#init()
	 */
	public void init() {
		/* TODO: get parameters (if any) */ 
		/* a = getPortletConfig().getInitParameter("a"); */
//		logger.debug("initiating");
	}

	/**
	 * Renders input parameters (if any), and dispatch control to a JSP file.
	 * 
	 * @param request
	 * @param response
	 * @throws PortletException
	 * @throws IOException
	 */
	@RenderMode(name = "VIEW")
	public void renderForm(RenderRequest request, RenderResponse response)
			throws PortletException, IOException {
//		logger.debug("rendering form");
		// -- create render URL for the image display form.
		PortletURL resetRenderUrl = response.createRenderURL();
		request.setAttribute("resetRenderUrl", resetRenderUrl);
		request.setAttribute("someParameterToTest", "Seems to work nicely with parameters from renderform");
		
		// -- TODO store the text and image url in the response object
		/*
		request.setAttribute("a", a);
		*/

		// -- dispatch control to JSP file
		getPortletContext().getRequestDispatcher(
				"/WEB-INF/jsp/GreenseasPortlet.jsp").include(request, response);
//		logger.debug("finished rendering form");
	}

}
