package nersc.greenseas.rasterData;

import java.io.IOException;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;
import java.util.Set;

import org.json.simple.JSONArray;
import org.json.simple.JSONObject;
import ucar.ma2.Array;
import ucar.ma2.ArrayChar;
import ucar.ma2.ArrayDouble;
import ucar.ma2.ArrayInt;
import ucar.ma2.DataType;
import ucar.ma2.InvalidRangeException;
import ucar.nc2.Attribute;
import ucar.nc2.NetcdfFileWriter;
import ucar.nc2.NetcdfFileWriter.Version;
import ucar.nc2.Variable;

public class NetCDFWriter {

	public static String createNetCDF(JSONArray data, JSONObject variables, int numberOfFeatures) {
		// TODO Auto-generated method stub
		NetcdfFileWriter writer = null;
		try {
			final int NAME_STRLEN = 50;
			System.out.println("Creating netCDF");
			String location = "C:\\Users\\alevin\\Documents\\Greenseas\\testCreateNetCDF\\Test-"
					+ System.currentTimeMillis() + ".nc";
			writer = NetcdfFileWriter.createNew(Version.netcdf3, location, null);
			writer.addDimension(null, "obs", numberOfFeatures);

			Set<?> variablesKeys = variables.keySet();

			HashMap<String, Array> values = new HashMap<String, Array>();
			HashMap<String, DataType> dataTypes = new HashMap<String, DataType>();
			boolean addedStrlen = false;
			for (Object key : variablesKeys) {
				JSONObject variableO = (JSONObject) variables.get(key);
				// TODO: not all are doubles!
				DataType dataType = DataType.DOUBLE;
				String dataTypeString = (String) variableO.get("dataType");
				String dimension = "obs";
				Variable v = null;
				if (dataTypeString.equals("int")) {
					dataType = DataType.INT;
					v = writer.addVariable(null, (String) key, dataType, dimension);
					int[] shape = v.getShape();
					values.put((String) key, new ArrayInt(shape));
				} else if (dataTypeString.equals("string")) {
					dataType = DataType.CHAR;
					dimension += " name_strlen";
					if (!addedStrlen) {
						writer.addDimension(null, "name_strlen", NAME_STRLEN);
						addedStrlen = true;
					}
					v = writer.addVariable(null, (String) key, dataType, dimension);
					int[] shape = v.getShape();
					values.put((String) key, new ArrayChar(shape));
				} else {
					// double
					v = writer.addVariable(null, (String) key, dataType, dimension);
					int[] shape = v.getShape();
					values.put((String) key, new ArrayDouble(shape));
				}
				dataTypes.put((String) key, dataType);
				Set<?> keys = variableO.keySet();
				for (Object k : keys) {
					String k2 = (String) k;
					if (!k2.equals("dataType"))
						v.addAttribute(new Attribute(k2, (String) variableO.get(k)));
				}
			}
			for (int i = 0; i < data.size(); i++) {
				JSONObject variableValues = (JSONObject) data.get(i);
				Set<?> keys = variableValues.keySet();
				for (Object k : keys) {
					DataType dataType = dataTypes.get((String) k);
					if (dataType == DataType.INT) {
						ArrayInt array = (ArrayInt) values.get((String) k);
						Object object = variableValues.get(k);
						Integer value = null;
						if (object != null)
							try {
								value = (Integer) object;
							} catch (Exception e) {
								value = null;
								try {
									// System.out.println("got exception when trying to convert:"
									// + (String) object);
								} catch (Exception e2) {
									// TODO: handle exception
								}
							}
						if (value != null) {
							array.setInt(i, value);
						}
					} else if (dataType == DataType.DOUBLE) {
						ArrayDouble array = (ArrayDouble) values.get((String) k);
						Object object = variableValues.get(k);
						Double value = Double.NaN;
						if (object != null)
							try {
								value = (Double) object;
							} catch (Exception e) {
								value = Double.NaN;
								try {
									// System.out.println("got exception when trying to convert:"
									// + (String) object);
								} catch (Exception e2) {
									// TODO: handle exception
								}
							}
						array.setDouble(i, value);
					} else if (dataType == DataType.CHAR) {
						ArrayChar array = (ArrayChar) values.get((String) k);
						String value = (String) variableValues.get(k);
						if (value != null)
							array.setString(i, value);
					}
				}
			}
			// Add global attributes
			writer.addGroupAttribute(null, new Attribute("featureType", "point"));
			// create the file
			try {
				writer.create();
			} catch (IOException e) {
				System.err.printf("ERROR creating file %s%n%s", location, e.getMessage());
			}
			// Add values
			Iterator<?> valuesIterator = values.entrySet().iterator();
			while (valuesIterator.hasNext()) {
				Map.Entry pairs = (Map.Entry) valuesIterator.next();
				// System.out.println(pairs.getKey() + " = " +
				// pairs.getValue());
				int[] origin = new int[1];
				Array array = (Array) pairs.getValue();
				if (array instanceof ArrayChar)
					origin = new int[2];
				writer.write(writer.findVariable((String) pairs.getKey()), origin, array);
				valuesIterator.remove(); // avoids a
											// ConcurrentModificationException
			}
			return location;
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		} catch (InvalidRangeException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		} finally {
			try {
				writer.close();
			} catch (IOException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
		}
		return null;
	}
}
