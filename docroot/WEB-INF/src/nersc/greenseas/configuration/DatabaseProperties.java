package nersc.greenseas.configuration;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.Properties;
import java.util.Set;

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
		try {
			Properties prop = new Properties();
			prop.load(DatabaseProperties.class.getClassLoader().getResourceAsStream("parameterHeaders.properties"));
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
		} catch (Exception e) {
			return "window.allParametersHeader = {};";
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
		try {
			Properties prop = new Properties();
			prop.load(DatabaseProperties.class.getClassLoader().getResourceAsStream("layerHeaders.properties"));
			Set<String> propNameSet = prop.stringPropertyNames();
			String prefix = "";
			for (String propName : propNameSet) {
				allLayers.append(prefix);
				allLayersHeader.append(prefix);
				prefix = ",";
				allLayers.append(propName + ": false");
				allLayersHeader.append(propName + ":" + prop.getProperty(propName));
			}

		} catch (Exception e) {
			return "window.allLayersHeader = {};window.allLayers = {};";
		}
		allLayersHeader.append("};");
		allLayers.append("};");
		return allLayersHeader.toString() + allLayers.toString();
	}

	public static String getLonghurstRegions() {
		StringBuffer properties = new StringBuffer();
		properties.append("window.longhurstRegions = {");
		try {
			Properties prop = new Properties();
			prop.load(DatabaseProperties.class.getClassLoader().getResourceAsStream("Longhurst_regions.properties"));
			Set<String> propNameSet = prop.stringPropertyNames();
			for (String propName : propNameSet) {
				properties.append("\"" + propName + "\":" + prop.getProperty(propName) + ",");
			}

		} catch (Exception e) {
			return "";
		}
		properties.append("};");
		return properties.toString();
	}

	public static String getLonghurstPolygon(String region) {
		//System.out.println("getLonghurstPolygon");
		String polygon = null;
		try {
			Properties prop = new Properties();
			prop.load(DatabaseProperties.class.getClassLoader().getResourceAsStream(
					"Longhurst_regions_polygons.properties"));
			polygon = prop.getProperty(region);
		} catch (Exception e) {
			System.out.println("getLonghurstPolygon EXCEPTION");
			return polygon;
		}
		//System.out.println("getLonghurstPolygon returns:" + polygon);
		return polygon;
	}

	public static String getAllProperties() {
		StringBuffer properties = new StringBuffer();
		try {
			Properties prop = new Properties();
			prop.load(DatabaseProperties.class.getClassLoader().getResourceAsStream("greenSeas.properties"));
			Set<String> propNameSet = prop.stringPropertyNames();
			for (String propName : propNameSet) {
				properties.append("window." + propName + "=" + prop.getProperty(propName) + ";");
			}

		} catch (Exception e) {
			return "";
		}
		return properties.toString();
	}
}
