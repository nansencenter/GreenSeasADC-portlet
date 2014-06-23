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
import java.io.Writer;
import java.net.URL;
import java.net.URLConnection;
import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.zip.ZipOutputStream;

import javax.portlet.ActionRequest;
import javax.portlet.ActionResponse;
import javax.portlet.PortletException;
import javax.portlet.PortletURL;
import javax.portlet.RenderRequest;
import javax.portlet.RenderResponse;
import javax.portlet.ResourceRequest;
import javax.portlet.ResourceResponse;
import javax.servlet.http.HttpServletRequest;

import org.json.simple.JSONArray;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;

import nersc.greenseas.configuration.DatabaseProperties;
import nersc.greenseas.rasterData.NetCDFReader;
import nersc.greenseas.rasterData.NetCDFWriter;

import com.liferay.portal.kernel.servlet.HttpHeaders;
import com.liferay.portal.kernel.upload.UploadPortletRequest;
import com.liferay.portal.util.PortalUtil;
import com.liferay.portlet.PortletURLUtil;
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
		// TODO: validate/escape to prevent injection
		renderRequest.setAttribute("allParametersHeader", DatabaseProperties.getAllParametersHeader());
		renderRequest.setAttribute("allParametersShortHeader", DatabaseProperties.getAllParametersShortHeader());
		renderRequest.setAttribute("allParametersTooltips", DatabaseProperties.getAllParametersTooltips());
		renderRequest.setAttribute("allParametersUnit", DatabaseProperties.getAllParametersUnit());
		renderRequest.setAttribute("allParametersDataType", DatabaseProperties.getAllParametersDataType());
		renderRequest.setAttribute("allLayers", DatabaseProperties.getAllLayers());
		renderRequest.setAttribute("allProperties", DatabaseProperties.getAllProperties());
		renderRequest.setAttribute("longhurstRegions", DatabaseProperties.getLonghurstRegions());
		renderRequest.setAttribute("combinedParameters", DatabaseProperties.getCombinedParameters());
		renderRequest.setAttribute("wmsLayers", DatabaseProperties.getWmsLayers());
		renderRequest.setAttribute("openDAPURLs", DatabaseProperties.getOpenDAPURLs());
		renderRequest.setAttribute("cruisesList", DatabaseProperties.getCruisesList());
		HttpServletRequest request = PortalUtil.getHttpServletRequest(renderRequest);
		String query = PortalUtil.getOriginalServletRequest(request).getParameter("query");
		renderRequest.setAttribute("linkedQuery", query);
		PortletURL url = PortletURLUtil.getCurrent(renderRequest, renderResponse);
		renderRequest.setAttribute("portletURL", url.toString().split("\\?")[0].split(";")[0]);
		super.doView(renderRequest, renderResponse);
	}

	@Override
	public void serveResource(ResourceRequest resourceRequest, ResourceResponse resourceResponse) throws IOException,
			PortletException {
		System.out.println("Calling serveResource");
		resourceResponse.setContentType("text/javascript");
		String uri = resourceRequest.getParameter("fileID");
		String requestType = resourceRequest.getParameter("requestType");
		System.out.println("requestType:'" + requestType + "'");
		String opendapDataURL = resourceRequest.getParameter("opendapDataURL");
		if (requestType != null) {
			if (requestType.equals("serveNetCDFFile")) {
				String location = resourceRequest.getParameter("fileID");
				if (location != null) {
					String[] folders = { "content", "gsadbc", "createdFiles" };
					String filePath = createDirectory(System.getProperty("catalina.base"), folders);
					for (int i = 0; i < location.length(); i++) {
						char c = uri.charAt(i);
						if (c < '0' || (c > '9' && c < 'A') || (c > 'Z' && c < 'a') || c > 'z')
							throw new InvalidFileNameException("Invalid file name (illegal character:'" + c + "'):"
									+ uri);
					}
					String fileExtension = ".nc";
					location = filePath + location + fileExtension;
					resourceResponse.setContentType("application/x-netcdf");
					OutputStream out = resourceResponse.getPortletOutputStream();
					InputStream in = null;
					try {
						in = new FileInputStream(new File(location));
						if (in != null) {
							byte[] buffer = new byte[4096];
							int len;

							while ((len = in.read(buffer)) != -1) {
								out.write(buffer, 0, len);
							}

							out.flush();
							System.out.println("Wrote nc file to outputstream");
						}
					} catch (Exception e) {
						// TODO: handle exception
					} finally {
						if (in != null)
							in.close();
						if (out != null)
							out.close();
					}
				}
				return;
			}
			if (uri != null || opendapDataURL != null) {
				if (opendapDataURL == null) {
					String[] folders = { "content", "gsadbc", "uploadedFiles" };
					String filePath = createDirectory(System.getProperty("catalina.base"), folders);
					for (int i = 0; i < uri.length(); i++) {
						char c = uri.charAt(i);
						if (c < '0' || (c > '9' && c < 'A') || (c > 'Z' && c < 'a') || c > 'z')
							throw new InvalidFileNameException("Invalid file name (illegal character:'" + c + "'):"
									+ uri);
					}
					String fileExtension = ".nc";
					uri = filePath + uri + fileExtension;
				} else {
					uri = opendapDataURL;
				}
				if (requestType.startsWith("getDataValuesOf:")) {
					System.out.println("requestType is getDataValuesOf:");
					Map<String, String[]> parameterMap = resourceRequest.getParameterMap();
					Map<Integer, Map<String, Double>> values = NetCDFReader.getDatavaluesFromNetCDFFile(uri,
							parameterMap);
					if (values == null)
						return;
					JSONObject jsonObject = new JSONObject(values);
					// System.out.println("Returning with jsonObject:");
					// System.out.println(jsonObject.toJSONString());

					PrintWriter writer = resourceResponse.getWriter();
					writer.write(jsonObject.toString());
					return;
				} else if (requestType.equals("getLayersFromNetCDFFile")) {
					System.out.println("requestType is getLayersFromNetCDFFile:");
					System.out.println("opendapDataURL:" + opendapDataURL);
					System.out.println("uri:" + uri);
					Map<String, String> values = NetCDFReader.getLayersFromRaster(uri);
					if (values == null) {
						System.out.println("No values found!");
						return;
					}
					JSONObject jsonObject = new JSONObject(values);

					System.out.println("Returning with jsonObject:");
					System.out.println(jsonObject.toJSONString());

					PrintWriter writer = resourceResponse.getWriter();
					writer.write(jsonObject.toString());
					return;
				} else if (requestType.equals("getMetaDimensions")) {
					System.out.println("getMetaDimensions:" + uri);
					String parameter = resourceRequest.getParameter("rasterParameter");
					if (parameter == null)
						return;
					Map<String, Map<String, String>> values = NetCDFReader.getDimensionsFromRasterParameter(uri,
							parameter);
					if (values == null)
						return;
					JSONObject jsonObject = new JSONObject(values);

					System.out.println("Returning with jsonObject:");
					System.out.println(jsonObject.toJSONString());

					PrintWriter writer = resourceResponse.getWriter();
					writer.write(jsonObject.toString());
					return;
				} else if (requestType.equals("loadFileFromID")) {
					//TODO: fix security hole
					System.out.println(uri);
					JSONObject jsonObject = new JSONObject();
					File f = new File(uri);
					boolean exists = f.exists();
					// sleep for 1 seconds to mitigate brute force attacks
					try {
						Thread.sleep(1000);
					} catch (InterruptedException e) {
					}
					jsonObject.put("fileIDExists", exists);
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

				PrintWriter writer = resourceResponse.getWriter();
				writer.write(jsonObject.toString());
				return;
			} else if (requestType.equals("createNetCDFUsingH.1")) {
				JSONParser parser = new JSONParser();
				JSONArray jsonA = null;
				JSONObject jsonO = null;
				int numberOfFeatures = 0;
				try {
					jsonA = (JSONArray) parser.parse(resourceRequest.getParameter("data"));
					String variablesString = resourceRequest.getParameter("variables");
					numberOfFeatures = Integer.parseInt(resourceRequest.getParameter("numberOfFeatures"));
					System.out.println(variablesString);
					jsonO = (JSONObject) parser.parse(variablesString);
				} catch (ParseException e) {
				}
				String[] folders = { "content", "gsadbc", "createdFiles" };
				String filePath = createDirectory(System.getProperty("catalina.base"), folders);
				
				String fileID = NetCDFWriter.createNetCDF(jsonA, jsonO, numberOfFeatures,filePath);
				Map<String, String> values = new HashMap<String, String>();
				
				values.put("fileID", fileID);
				JSONObject jsonObject = new JSONObject(values);

				
				/*resourceResponse.setContentType("application/x-netcdf");
				resourceResponse.addProperty(HttpHeaders.CACHE_CONTROL, "max-age=3600, must-revalidate");

				OutputStream out = resourceResponse.getPortletOutputStream();

				InputStream in = new FileInputStream(new File(location));

				byte[] buffer = new byte[4096];
				int len;

				while ((len = in.read(buffer)) != -1) {
					out.write(buffer, 0, len);
				}

				out.flush();
				in.close();
				out.close();*/
				System.out.println("Returning with fileID" + fileID);

				PrintWriter writer = resourceResponse.getWriter();
				writer.write(jsonObject.toString());
				return;
			} else if (requestType.equals("getLonghurstPolygon")) {
				Map<String, String> values = new HashMap<String, String>();
				String region = resourceRequest.getParameter("longhurstRegion");
				System.out.println("getLonghurstPolygon:" + region);
				String polygon = DatabaseProperties.getLonghurstPolygon(region);
				values.put(region, polygon);
				JSONObject jsonObject = new JSONObject(values);

				System.out.println("Returning with polygon!=null:" + (polygon != null));

				PrintWriter writer = resourceResponse.getWriter();
				writer.write(jsonObject.toString());
				return;
			} else if (requestType.equals("updateTreeWithInventoryNumbers")) {
				String urlS = resourceRequest.getParameter("url");
				String region = resourceRequest.getParameter("gsadbcRegionFilterPlaceHolder");
				if (region != null) {
					region = region.substring(51, region.length() - 13);
				}
				JSONParser parser = new JSONParser();
				JSONObject jsonO = null;
				try {
					jsonO = (JSONObject) parser.parse(resourceRequest.getParameter("data"));
				} catch (ParseException e) {
				}
				String charset = "UTF-8";
				int numberOfThreads = 4;
				Set<?> entrySet = jsonO.keySet();
				ArrayList<Map<String, String>> responseMaps = new ArrayList<Map<String, String>>();
				ArrayList<Map<String, String>> requestMaps = new ArrayList<Map<String, String>>();
				for (int i = 0; i < numberOfThreads; i++) {
					responseMaps.add(new HashMap<String, String>());
					requestMaps.add(new HashMap<String, String>());
				}

				int thredd = 0;
				for (Object o : entrySet) {
					String key = (String) o;
					String request = (String) jsonO.get(key);
					requestMaps.get(thredd).put(key, request);
					thredd = (thredd + 1) % numberOfThreads;
				}
				ArrayList<GetNumberOfFeatures> threadds = new ArrayList<GetNumberOfFeatures>();
				for (int i = 0; i < numberOfThreads; i++) {
					GetNumberOfFeatures runnable = new GetNumberOfFeatures(responseMaps.get(i), requestMaps.get(i),
							charset, urlS, i, region);
					Thread thread = new Thread(runnable);
					thread.start();
					threadds.add(runnable);
				}
				while (true) {
					try {
						Thread.sleep(2000);
					} catch (InterruptedException e) {
						e.printStackTrace();
					}
					boolean done = true;
					for (int i = 0; i < numberOfThreads; i++) {
						if (!threadds.get(i).done) {
							done = false;
							break;
						}
					}
					if (done)
						break;
				}
				Map<String, String> responseMap = new HashMap<String, String>();

				for (int i = 0; i < numberOfThreads; i++) {
					responseMap.putAll(responseMaps.get(i));
				}
				JSONObject jsonObject = new JSONObject(responseMap);
				PrintWriter writer = resourceResponse.getWriter();
				writer.write(jsonObject.toString());
				return;
			}
		} else {

		}
	}

	private static String placeHolder = "<ogc:Within><ogc:PropertyName>point</ogc:PropertyName><gml:Envelope xmlns:gml=\"http://www.opengis.net/gml\"><gml:lowerCorner>undefined undefined</gml:lowerCorner><gml:upperCorner>undefined undefined</gml:upperCorner></gml:Envelope></ogc:Within>";

	class GetNumberOfFeatures implements Runnable {

		public GetNumberOfFeatures(Map<String, String> responseMap, Map<String, String> requestMap, String charset,
				String url, int number, String region) {
			super();
			this.responseMap = responseMap;
			this.requestMap = requestMap;
			this.charset = charset;
			this.urlS = url;
			this.number = number;
			this.region = region;
		}

		Map<String, String> responseMap, requestMap;
		String charset, urlS, region;
		boolean done = false;
		int number;

		@Override
		public void run() {
			try {
				for (String key : requestMap.keySet()) {
					URL url = new URL(urlS);
					String requestS = (String) requestMap.get(key);
					if (region != null) {
						requestS = requestS.replace(GreenseasPortlet.placeHolder, region);
					}
					byte[] request = requestS.getBytes(charset);
					URLConnection connection = url.openConnection();
					// POST REQUEST!
					connection.setDoOutput(true);
					connection.setRequestProperty("Accept-Charset", charset);
					connection.setRequestProperty("Content-Type", "text/xml;charset=" + charset);
					OutputStream wr = connection.getOutputStream();
					try {
						wr.write(request);
					} finally {
						wr.flush();
						wr.close();
					}
					InputStream response = connection.getInputStream();
					String numberOfFeatures = getNumberOfFeatures(response);
					if (numberOfFeatures == null)
						numberOfFeatures = "An error occured";
					responseMap.put(key, numberOfFeatures);
				}
			} catch (Exception e) {
				e.printStackTrace();
			}
			done = true;
		}
	}

	public String getNumberOfFeatures(InputStream in) {
		String searchingFor = "numberOfFeatures=\"";
		int length = searchingFor.length();
		int index = 0;
		boolean found = false;
		String result = "";
		while (true) {
			try {
				int nextI = in.read();
				if (nextI == -1)
					return null;
				char next = (char) nextI;
				if (found) {
					if (next == '"') {
						break;
					} else {
						result += next;
					}
				} else {
					if (next == searchingFor.charAt(index)) {
						index++;
						if (index == length) {
							found = true;
						}
					} else {
						index = 0;
					}
				}

			} catch (IOException e) {
				return null;
			}
		}
		return result;
	}

	private static String createRandomString(int number) {
		SecureRandom sr = new SecureRandom();
		StringBuffer sb = new StringBuffer();
		for (int i = 0; i < number; i++) {
			int randomInt = sr.nextInt(62);
			char nextChar = '_';
			if (randomInt < 10) {
				nextChar = (char) (randomInt + 48);
			} else if (randomInt < 36) {
				nextChar = (char) (randomInt + 55);
			} else {
				nextChar = (char) (randomInt + 61);
			}
			sb.append(nextChar);
		}
		return sb.toString();
	}

	public void submitFile(ActionRequest actionRequest, ActionResponse actionResponse) throws Exception {
		UploadPortletRequest uploadRequest = PortalUtil.getUploadPortletRequest(actionRequest);

		// uploaded filename
		String randomFileName = createRandomString(30);
		String fileExtension = ".nc";

		// uploaded file you can see it in /tomcat/temp is moved to
		// /tomcat/content/gsadbc/uploadedFiles
		File submissionFile = uploadRequest.getFile("file");
		System.out.println("Uploaded files");
		String[] folders = { "content", "gsadbc", "uploadedFiles" };
		String filePath = createDirectory(System.getProperty("catalina.base"), folders);
		String fileURI = filePath + randomFileName + fileExtension;
		moveFile(submissionFile.getAbsolutePath(), fileURI);

		actionResponse.addProperty("fileID", randomFileName);
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
						System.out.println("Did not manage to create '" + base + "'");
						return null;
					}
				}
			}
		} else
			return null;
		return base;
	}

	private boolean moveFile(String moveFrom, String moveTo) {
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
			return true;

		} catch (IOException e) {
			e.printStackTrace();
			return false;
		}
	}
}
