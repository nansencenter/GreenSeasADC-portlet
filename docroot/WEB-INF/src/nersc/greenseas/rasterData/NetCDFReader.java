package nersc.greenseas.rasterData;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;

import ucar.ma2.Array;
import ucar.nc2.Variable;
import ucar.nc2.dataset.NetcdfDataset;
import ucar.nc2.dt.GridCoordSystem;
import ucar.nc2.dt.GridDatatype;
import ucar.nc2.dt.grid.GridDataset;

public class NetCDFReader {

	/**
	 * @param uri
	 *            URI to the netCDF file
	 * @param parameterMap
	 *            Map with key=the ID of the measurement and value[0] as a
	 *            jsonObject with lat/lon parameters like: {lat:12.3, lon:31.2}
	 * @param parameter
	 * @return Map with key=ID and value the datavalue from the file, or null if
	 *         not present.
	 */
	public static Map<Integer, Double> getDatavaluesFromNetCDFFile(String uri, Map<String, String[]> parameterMap) {
		NetcdfDataset ncfile = null;
		Map<Integer, Double> values = null;
		try {
			ncfile = NetcdfDataset.openDataset(uri);
			GridDataset grid = new GridDataset(ncfile);
			PointSet pointSet = createPoints(parameterMap);
			values = getDatavaluesFromGridDataset(grid, pointSet.points, pointSet.parameter);
		} catch (IOException ioe) {
			log("getDatavaluesFromNetCDFFile got IOException: trying to open " + uri, ioe);
		} catch (Exception e) {
			log("getDatavaluesFromNetCDFFile got Exception: trying to open " + uri, e);
		} finally {
			if (null != ncfile)
				try {
					ncfile.close();
				} catch (IOException ioe) {
					log("trying to close " + uri, ioe);
				}
		}
		NetcdfDataset.shutdown();
		return values;
	}

	private static PointSet createPoints(Map<String, String[]> parameterMap) {
		JSONParser parser = new JSONParser();

		// -1 because it should contain one requestType
		Point[] points = new Point[parameterMap.size()-1];
		int i = 0;
		String parameter = null;
		for (String key : parameterMap.keySet()) {
			if (key.startsWith("requestType")) {
				parameter = parameterMap.get(key)[0].substring(16);
			} else {
				String values = parameterMap.get(key)[0];
				try {
					JSONObject jsonO = (JSONObject) parser.parse(values);
					points[i++] = new Point(Integer.parseInt(key), Double.parseDouble(jsonO.get("lat").toString()),
							Double.parseDouble(jsonO.get("lon").toString()), 0, "", "");
				} catch (ParseException e) {
					log("ParseException", e);
				} catch (NumberFormatException e) {
					log("NumberFormatException", e);
				} catch (Exception e) {
					log("Exception", e);
				}
			}
		}
		return new PointSet(points, parameter);
	}

	private static void log(String string, Exception e) {
		System.out.println(string);
		System.out.println("EXCEPTION:" + e.getMessage());
	}

	private static Map<Integer, Double> getDatavaluesFromGridDataset(GridDataset gds, Point[] points, String parameter)
			throws IOException {
		System.out.println("process file");
		GridDatatype grid = gds.findGridDatatype(parameter);
		GridCoordSystem gcs = grid.getCoordinateSystem();
		Map<Integer, Double> val = new HashMap<Integer, Double>();
		for (int i = 0; i < points.length; i++) {

			Point p = points[i];
			// find the x,y index for a specific lat/lon position
			// xy[0] = x, xy[1] = y
			int[] xy = gcs.findXYindexFromLatLon(p.lat, p.lon, null);
			

			System.out.println("Lat/Long x/y found: " + xy[0] +","+xy[1]);
			// read the data at that lat, lon and the first time and z level (if
			// any)
			// note order is t, z, y, x
			Array data = grid.readDataSlice(0, 0, xy[1], xy[0]);
			// we know its a scalar
			val.put(p.id, data.getDouble(0));
		}
		return val;
	}

	public static Map<String, String> getLayersFromRaster(String uri) {
		NetcdfDataset ncfile = null;
		Map<String, String> values = null;
		try {
			ncfile = NetcdfDataset.openDataset(uri);
			values = getLayersFromNetCDFFile(ncfile);
		} catch (IOException ioe) {
			log("getLayersFromNetCDFFile got IOException: trying to open " + uri, ioe);
		} catch (Exception e) {
			log("getLayersFromNetCDFFile got Exception: trying to open " + uri, e);
		} finally {
			if (null != ncfile)
				try {
					ncfile.close();
				} catch (IOException ioe) {
					log("trying to close " + uri, ioe);
				}
		}
		NetcdfDataset.shutdown();
		return values;
	}

	private static Map<String, String> getLayersFromNetCDFFile(NetcdfDataset ncfile) {
		HashMap<String, String> layers = new HashMap<String, String>();
		for (Variable v : ncfile.getVariables()) {
			layers.put(v.getNameAndDimensions(), v.getDescription());
		}
		return layers;
	}
}

class PointSet {
	Point[] points;
	String parameter;

	public PointSet(Point[] points, String parameter) {
		this.points = points;
		this.parameter = parameter;
	}
}

class Point {
	int id;
	double lat, lon, depth;
	String date, time;

	public Point(int id, double lat, double lon, double depth, String date, String time) {
		this.id = id;
		this.lat = lat;
		this.lon = lon;
		this.depth = depth;
		this.date = date;
		this.time = time;
		//System.out.println("Generated new point:" + toString());
	}

	@Override
	public String toString() {
		return "Point [id=" + id + ", lat=" + lat + ", lon=" + lon + ", depth=" + depth + ", date=" + date + ", time="
				+ time + "]";
	}
}