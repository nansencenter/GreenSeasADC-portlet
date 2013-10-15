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
import java.io.PrintWriter;
import java.util.ArrayList;

import javax.portlet.PortletException;
import javax.portlet.RenderRequest;
import javax.portlet.RenderResponse;
import javax.portlet.ResourceRequest;
import javax.portlet.ResourceResponse;

import nersc.greenseas.configuration.DatabaseProperties;

import com.liferay.portal.kernel.json.JSONArray;
import com.liferay.portal.kernel.json.JSONFactoryUtil;
import com.liferay.portal.kernel.json.JSONObject;
import com.liferay.util.bridges.mvc.MVCPortlet;

/**
 * GreenSeasPortlet displays the location of oceanographic measurements on a map
 * and allows extraction of data within a user defined geographic area.
 * 
 * @author Aleksander Vines
 * 
 */
public class GreenseasPortlet extends MVCPortlet {

	@Override
	public void doView(RenderRequest renderRequest, RenderResponse renderResponse) throws IOException, PortletException {
		renderRequest.setAttribute("allParametersHeader", DatabaseProperties.getAllParametersHeader());
		renderRequest.setAttribute("allLayers", DatabaseProperties.getAllLayers());
		renderRequest.setAttribute("allProperties", DatabaseProperties.getAllProperties());
		super.doView(renderRequest, renderResponse);
	}

	@Override
	public void serveResource(ResourceRequest resourceRequest, ResourceResponse resourceResponse) throws IOException,
			PortletException {
		resourceResponse.setContentType("text/javascript");

		// Print What you get from Server
//		System.out.println("param1 sent from Browser- " + resourceRequest.getParameter("param1"));
//		System.out.println("param2 sent from Browser- " + resourceRequest.getParameter("param2"));

		JSONObject jsonObject = JSONFactoryUtil.createJSONObject();
//		ArrayList<String> strList = new ArrayList<String>();

//		strList.add("ITS WORKING!");
//		strList.add("SECOND ONE");

		// Send Data Back
//		jsonObject.put("retVal1", "Returing First value from server");
//		jsonObject.put("retVal2", strList.toString());

		PrintWriter writer = resourceResponse.getWriter();
		writer.write(jsonObject.toString());
	}

}
