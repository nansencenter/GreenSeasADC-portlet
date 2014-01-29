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

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.PrintWriter;
import java.util.HashMap;
import java.util.Map;

import javax.portlet.ActionRequest;
import javax.portlet.ActionResponse;
import javax.portlet.PortletException;
import javax.portlet.PortletSession;
import javax.portlet.RenderRequest;
import javax.portlet.RenderResponse;
import javax.portlet.ResourceRequest;
import javax.portlet.ResourceResponse;

import org.json.simple.JSONObject;

import nersc.greenseas.configuration.DatabaseProperties;
import nersc.greenseas.rasterData.NetCDFReader;

import com.liferay.portal.kernel.upload.UploadPortletRequest;
import com.liferay.portal.util.PortalUtil;
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
		renderRequest.setAttribute("longhurstRegions", DatabaseProperties.getLonghurstRegions());
		renderRequest.setAttribute("combinedParameters", DatabaseProperties.getCombinedParameters());
		renderRequest.setAttribute("wmsLayers", DatabaseProperties.getWmsLayers());
		renderRequest.setAttribute("openDAPURLs", DatabaseProperties.getOpenDAPURLs());
		renderRequest.setAttribute("cruisesList", DatabaseProperties.getCruisesList());
		super.doView(renderRequest, renderResponse);
	}

	@Override
	public void serveResource(ResourceRequest resourceRequest, ResourceResponse resourceResponse) throws IOException,
			PortletException {
		System.out.println("Calling serveResource");
		resourceResponse.setContentType("text/javascript");
		PortletSession session = resourceRequest.getPortletSession();
		String uri = (String) session.getAttribute("rasterFile");
		String requestType = resourceRequest.getParameter("requestType");
		System.out.println("requestType:'" + requestType + "'");
		String opendapDataURL = resourceRequest.getParameter("opendapDataURL");
		if (opendapDataURL != null) {
			uri = opendapDataURL;
			System.out.println("uri set to:" + opendapDataURL);
		}
		if (uri != null) {
			if (requestType.startsWith("getDataValuesOf:")) {
				System.out.println("requestType is getDataValuesOf:");
				Map<String, String[]> parameterMap = resourceRequest.getParameterMap();
				Map<Integer, Map<String, Double>> values = NetCDFReader.getDatavaluesFromNetCDFFile(uri, parameterMap);
				if (values == null)
					return;
				JSONObject jsonObject = new JSONObject(values);
				System.out.println("Returning with jsonObject:");
				System.out.println(jsonObject.toJSONString());

				PrintWriter writer = resourceResponse.getWriter();
				writer.write(jsonObject.toString());
				return;
			} else if (requestType.equals("getLayersFromNetCDFFile")) {
				System.out.println("requestType is getLayersFromNetCDFFile:");
				System.out.println("opendapDataURL:" + opendapDataURL);
				System.out.println("uri:" + uri);
				Map<String, String> values = NetCDFReader.getLayersFromRaster(uri);
				if (values == null){System.out.println("No values found!");
					return;}
				JSONObject jsonObject = new JSONObject(values);

				System.out.println("Returning with jsonObject:");
				System.out.println(jsonObject.toJSONString());

				PrintWriter writer = resourceResponse.getWriter();
				writer.write(jsonObject.toString());
				session.setAttribute("rasterFile", uri);
				return;
			} else if (requestType.equals("getMetaDimensions")) {
				System.out.println("getMetaDimensions:" + uri);
				String parameter = resourceRequest.getParameter("rasterParameter");
				if (parameter == null)
					return;
				Map<String, Map<String, String>> values = NetCDFReader.getDimensionsFromRasterParameter(uri, parameter);
				if (values == null)
					return;
				JSONObject jsonObject = new JSONObject(values);

				System.out.println("Returning with jsonObject:");
				System.out.println(jsonObject.toJSONString());

				PrintWriter writer = resourceResponse.getWriter();
				writer.write(jsonObject.toString());
				return;
			}
		}
		if (requestType.equals("getLonghurstPolygon")) {
			Map<String, String> values = new HashMap<String, String>();
			String region = resourceRequest.getParameter("longhurstRegion");
			System.out.println("getLonghurstPolygon:" + region);
			String polygon = DatabaseProperties.getLonghurstPolygon(region);
			values.put(region, polygon);
			JSONObject jsonObject = new JSONObject(values);

			System.out.println("Returning with polygon!=null:" + (polygon != null));

//			System.out.println("Returning with jsonObject:");
//			System.out.println(jsonObject.toJSONString());
			
			PrintWriter writer = resourceResponse.getWriter();
			writer.write(jsonObject.toString());
			return;
		}
	}

	public void submitFile(ActionRequest actionRequest, ActionResponse actionResponse) throws Exception {
		UploadPortletRequest uploadRequest = PortalUtil.getUploadPortletRequest(actionRequest);

		// uploaded filename
		String submissionFileName = uploadRequest.getFileName("file");
		// uploaded file you can see it in /tomcat/temp
		// TODO: must delete these files when done with!
		File submissionFile = uploadRequest.getFile("file");
		System.out.println("Uploaded files");
		/* System.getProperty("user.home") */
		String[] folders = {"content","gsadbc","uploadedFiles"};
		String filePath = createDirectory(System.getProperty("catalina.base"), folders);
		String fileURI = filePath + submissionFileName;
		moveFile(submissionFile.getAbsolutePath(), fileURI);

		PortletSession session = actionRequest.getPortletSession();
		// String oldFileName = (String) session.getAttribute("rasterFile");
		session.setAttribute("rasterFile", fileURI);

	}

	private String createDirectory(String base, String[] subFolders) {
		base += File.separator;
		File directory = new File(base);
		// if the directory does not exist, create it
		if (directory.exists()) {
			for (int i = 0; i < subFolders.length; i++) {
				base += subFolders[i] + File.separator;
				directory = new File(base);
				if (!directory.exists()) {
					System.out.println("creating directory: " + base);
					boolean result = directory.mkdir();

					if (result) {
						System.out.println("DIR created");
					} else {
						System.out.println("Did not manage to create '"+base+"'");
						return null;}
				}
			}
		} else
			return null;
		return base;
	}

	private void moveFile(String moveFrom, String moveTo) {

		InputStream inStream = null;
		OutputStream outStream = null;

		try {

			File afile = new File(moveFrom);
			File bfile = new File(moveTo);

			inStream = new FileInputStream(afile);
			outStream = new FileOutputStream(bfile);

			byte[] buffer = new byte[1024];

			int length;
			// copy the file content in bytes
			while ((length = inStream.read(buffer)) > 0) {

				outStream.write(buffer, 0, length);

			}

			inStream.close();
			outStream.close();

			// delete the original file
			afile.delete();

			System.out.println("File is copied successful from '" + moveFrom + "' to '" + moveTo + "'");

		} catch (IOException e) {
			e.printStackTrace();
		}
	}
}
