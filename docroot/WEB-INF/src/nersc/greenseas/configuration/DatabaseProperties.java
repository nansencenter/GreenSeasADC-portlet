package nersc.greenseas.configuration;

import java.io.File;
import java.io.FileInputStream;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.Properties;
import java.util.Set;
import java.util.Enumeration;
import java.util.Vector;

public class DatabaseProperties {

	static final Comparator<String[]> SORT_BY_FIRST_VALUE = new Comparator<String[]>() {
		@Override
		public int compare(String[] o1, String[] o2) {
			// TODO Auto-generated method stub
			return o1[0].compareTo(o2[0]);
		}
	};

	/**
	 * Reading in the parameterHeaders.properties file and adding the properties
	 * on the form layerName.propertyName="Header" to a javascript object on the
	 * form {layerName:{propertyName:header}}
	 * 
	 * @return A String on the format of a javascript object with
	 *         parameterHeaders
	 */
	public static String getAllParametersHeader() {
		StringBuffer allParametersHeader = new StringBuffer("window.allParametersHeader = {");
		String fileName = "parameterHeaders.properties";
		Properties prop = getProperties(fileName);
		if (prop == null)
			return "window.allParametersHeader = {};";
		Set<String> propNameSet = prop.stringPropertyNames();
		ArrayList<String[]> propList = new ArrayList<String[]>();
		for (String propName : propNameSet) {
			String[] splitPropName = propName.split("\\.");
			String[] propArray = { splitPropName[0], splitPropName[1], prop.getProperty(propName) };
			propList.add(propArray);
		}
		Collections.sort(propList, SORT_BY_FIRST_VALUE);

		String table = null;
		for (String[] propArray : propList) {
			if (table == null || !table.equals(propArray[0])) {
				if (table != null) {
					allParametersHeader.append("},");
				}
				allParametersHeader.append(propArray[0] + ":" + "{");
			} else {
				allParametersHeader.append(",");
			}
			table = propArray[0];
			allParametersHeader.append(propArray[1] + ":" + propArray[2]);
		}
		allParametersHeader.append("}};");
		return allParametersHeader.toString();
	}

	/**
	 * Reading in the parameterHeaders.properties file and adding the properties
	 * on the form layerName.propertyName="Header" to a javascript object on the
	 * form {layerName:{propertyName:header}}
	 * 
	 * @return A String on the format of a javascript object with
	 *         parameterHeaders
	 */
	public static String getAllLayers() {
		StringBuffer allLayersHeader = new StringBuffer("window.allLayersHeader = {");
		StringBuffer allLayers = new StringBuffer("window.allLayers = {");
		String fileName = "layerHeaders.properties";
		Properties prop = getProperties(fileName);
		if (prop == null)
			return "window.allLayersHeader = {};window.allLayers = {};";
		Set<String> propNameSet = prop.stringPropertyNames();
		String prefix = "";
		for (String propName : propNameSet) {
			allLayers.append(prefix);
			allLayersHeader.append(prefix);
			prefix = ",";
			allLayers.append(propName + ": false");
			allLayersHeader.append(propName + ":" + prop.getProperty(propName));
		}
		allLayersHeader.append("};");
		allLayers.append("};");
		return allLayersHeader.toString() + allLayers.toString();
	}

	public static String getLonghurstRegions() {
		StringBuffer properties = new StringBuffer();
		properties.append("window.longhurstRegions = {");
		String fileName = "Longhurst_regions.properties";
		Properties prop = getProperties(fileName);
		Set<String> propNameSet = prop.stringPropertyNames();
		for (String propName : propNameSet) {
			properties.append("\"" + propName + "\":" + prop.getProperty(propName) + ",");
		}
		properties.append("};");
		return properties.toString();
	}

	public static String getWmsLayers() {
		StringBuffer properties = new StringBuffer();
		properties.append("window.wmsLayers = [{ value:'NONE', name:'Select layer'},");
		String fileName = "wmsLayers.properties";
		Properties prop = getProperties(fileName);
		for (Enumeration<?> e = prop.propertyNames(); e.hasMoreElements();) {
			String propName = (String) e.nextElement();
			properties.append("{value:'" + prop.getProperty(propName) + "',name:'" + propName + "'},");
		}
		properties.append("];");
		return properties.toString();
	}

	public static String getOpenDAPURLs() {
		StringBuffer properties = new StringBuffer();
		properties.append("window.openDAPURLs = [");
		String fileName = "openDAPURLs.properties";
		Properties prop = getProperties(fileName);
		for (Enumeration<?> e = prop.propertyNames(); e.hasMoreElements();) {
			String propName = (String) e.nextElement();
			properties.append("{value:'" + prop.getProperty(propName) + "',name:'" + propName + "'},");
		}
		properties.append("];");
		return properties.toString();
	}
	

	public static String getCruisesList() {
		StringBuffer properties = new StringBuffer();
		properties.append("window.cruisesList = [");
		String fileName = "cruisesList.properties";
		Properties prop = getProperties(fileName);
		for (Enumeration<?> e = prop.propertyNames(); e.hasMoreElements();) {
			String propName = (String) e.nextElement();
			properties.append("{value:'" + propName + "',name:'" + prop.getProperty(propName) + "'},");
		}
		properties.append("];");
		return properties.toString();
	}

	public static String getLonghurstPolygon(String region) {
		String polygon = null;
		String fileName = "Longhurst_regions_polygons.properties";
		Properties prop = getProperties(fileName);
		polygon = prop.getProperty(region);
		return polygon;
	}

	public static String getAllProperties() {
		String fileName = "greenSeas.properties";
		StringBuffer properties = new StringBuffer();
		Properties prop = getProperties(fileName);
		Set<String> propNameSet = prop.stringPropertyNames();
		for (String propName : propNameSet) {
			properties.append("window." + propName + "=" + prop.getProperty(propName) + ";");
		}
		return properties.toString();
	}

	private static Properties getProperties(String fileName) {
		try {
			Properties prop = new OrderedProperties();
			String propertiesFolder = System.getProperty("user.home") + "\\.gsadbc\\properties\\";
			File file = new File(propertiesFolder + fileName);
			if (file.exists())
				prop.load(new FileInputStream(file));
			else
				prop.load(DatabaseProperties.class.getClassLoader().getResourceAsStream(fileName));
			return prop;
		} catch (Exception e) {
			System.out.println("Error reading the property file:" + fileName);
			return null;
		}
	}
	
	public static String[] getAllowedHosts(){
		String fileName = "greenSeasServer.properties";
		Properties prop = getProperties(fileName);
		return prop.getProperty("allowedHostsOnProxy").split(",");
	}

	public static String getCombinedParameters() {
		StringBuffer parameters = new StringBuffer();
		parameters.append("window.combinedParameters = {");
		String fileName = "combinedParameters.properties";
		Properties prop = getProperties(fileName);
		Set<String> propNameSet = prop.stringPropertyNames();
		for (String propName : propNameSet) {
			String[] splitP = prop.getProperty(propName).split(";");
			parameters.append("'combined:" + propName + "': { header:'" + splitP[0] + "'");
			parameters.append(",layer:'" + splitP[1] + "'");
			parameters.append(",method:'" + splitP[2] + "'");
			parameters.append(",index:'" + splitP[3] + "'");
			parameters.append(",parameters:[");
			String separator = "";
			for (int i = 4; i < splitP.length; i++) {
				parameters.append(separator + "'" + splitP[i] + "'");
				separator = ",";
			}
			parameters.append("]},");
		}
		parameters.append("};");
		return parameters.toString();
	}
}

/**
 * <a href="OrderedProperties.java.html"><b><i>View Source</i></b></a>
 * 
 * @author Brian Wing Shun Chan
 * 
 */
class OrderedProperties extends Properties {

	/**
	 * 
	 */
	private static final long serialVersionUID = 1L;

	public OrderedProperties() {
		super();
		_names = new Vector();
	}

	public Enumeration propertyNames() {
		return _names.elements();
	}

	public Object put(Object key, Object value) {
		if (_names.contains(key)) {
			_names.remove(key);
		}

		_names.add(key);

		return super.put(key, value);
	}

	public Object remove(Object key) {
		_names.remove(key);

		return super.remove(key);
	}

	private Vector _names;

}
