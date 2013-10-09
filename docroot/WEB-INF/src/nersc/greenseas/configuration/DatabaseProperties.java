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

	public static String getAllParametersHeader() {
		StringBuffer allParametersHeader = new StringBuffer("{");
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
			return "{}";
		}
		allParametersHeader.append("}}");
		return allParametersHeader.toString();
	}
}
