package nersc.greenseas.rasterData;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.geotoolkit.referencing.CRS;
import org.geotoolkit.referencing.crs.DefaultGeographicCRS;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;
import org.opengis.referencing.NoSuchAuthorityCodeException;
import org.opengis.util.FactoryException;

import ucar.ma2.Array;
import ucar.ma2.IndexIterator;
import ucar.nc2.Variable;
import ucar.nc2.dataset.CoordinateAxis;
import ucar.nc2.dataset.CoordinateAxis1D;
import ucar.nc2.dataset.NetcdfDataset;
import ucar.nc2.dt.GridCoordSystem;
import ucar.nc2.dt.GridDatatype;
import ucar.nc2.dt.grid.GridDataset;
import ucar.nc2.units.DateUnit;
import ucar.unidata.geoloc.LatLonPoint;
import uk.ac.rdg.resc.edal.cdm.LookUpTableGrid;
import uk.ac.rdg.resc.edal.coverage.grid.GridCoordinates;
import uk.ac.rdg.resc.edal.coverage.grid.HorizontalGrid;
import uk.ac.rdg.resc.edal.geometry.HorizontalPosition;
import uk.ac.rdg.resc.edal.geometry.impl.HorizontalPositionImpl;

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
	public static Map<Integer, Map<String, Double>> getDatavaluesFromNetCDFFile(String uri,
			Map<String, String[]> parameterMap) {
		NetcdfDataset ncfile = null;
		Map<Integer, Map<String, Double>> values = null;
		try {
			ncfile = NetcdfDataset.openDataset(uri);
			GridDataset grid = new GridDataset(ncfile);
			PointSet pointSet = createPoints(parameterMap);
			values = getDatavaluesFromGridDataset(grid, pointSet.points, pointSet.parameter, pointSet.time,
					pointSet.elevation);
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
		Set<String> keySet = parameterMap.keySet();
		Point[] points = new Point[parameterMap.size() - 1];
		int i = 0;
		String parameter = null;
		String time = null;
		String elevation = null;
		for (String key : keySet) {
			if (key.startsWith("requestType")) {
				parameter = parameterMap.get(key)[0].substring(16);
			} else if (key.startsWith("time")) {
				time = parameterMap.get(key)[0];
			} else if (key.startsWith("elevation")) {
				elevation = parameterMap.get(key)[0];
			} else if (!key.startsWith("opendapDataURL")) {
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
		return new PointSet(points, parameter, time, elevation);
	}

	private static void log(String string, Exception e) {
		System.out.println(string);
		System.out.println("EXCEPTION:" + e.getMessage());
		e.printStackTrace();
	}

	private static Map<Integer, Map<String, Double>> getDatavaluesFromGridDataset(GridDataset gds, Point[] points,
			String parameter, Integer time, Integer elevation) throws IOException, NoSuchAuthorityCodeException,
			FactoryException {
		System.out.println("process file for parameter:" + parameter);
		GridDatatype grid = gds.findGridDatatype(parameter);
		GridCoordSystem gcs = grid.getCoordinateSystem();
		HorizontalGrid horizontalGrid = null;
		if (gcs.getXHorizAxis().getRank() > 1) {
			horizontalGrid = LookUpTableGrid.generate(gcs);
		}
		Map<Integer, Map<String, Double>> val = new HashMap<Integer, Map<String, Double>>();
		if (time == null)
			time = 0;
		if (elevation == null)
			elevation = 0;
		for (int i = 0; i < points.length; i++) {
			Point p = points[i];
			// find the x,y index for a specific lat/lon position
			// xy[0] = x, xy[1] = y
			try {
				if (p != null) {
					if (horizontalGrid != null) {
						HorizontalPosition pos = new HorizontalPositionImpl(p.lon, p.lat, DefaultGeographicCRS.WGS84/*CRS.decode("EPSG:4326")*/);
						GridCoordinates gridCoords = horizontalGrid.findNearestGridPoint(pos);
						if (gridCoords == null)
							throw new ReadRasterException("The position was outside the boundingbox");
						Array data = grid.readDataSlice(time, elevation, gridCoords.getCoordinateValue(1),
								gridCoords.getCoordinateValue(0));
						// we know its a scalar //TODO?
						if (data.getDouble(0) == Double.NaN) {
							// System.out.println("Lat/Long x/y NOT FOUND for "
							// + p
							// +
							// ": " + xy[0] + "," + xy[1] + " VALUE:"
							// + data.getDouble(0));
						} else {
							Map<String, Double> values = new HashMap<String, Double>();
							values.put("value", data.getDouble(0));
							LatLonPoint latlonP = gcs.getLatLon(gridCoords.getCoordinateValue(0),
									gridCoords.getCoordinateValue(1));
							values.put("lat", latlonP.getLatitude());
							values.put("lon", latlonP.getLongitude());
							// System.out.println("Lat/Long x/y FOUND for " + p
							// +
							// ": " +
							// xy[0] + "," + xy[1] + " VALUE:"
							// + data.getDouble(0));
							val.put(p.id, values);
						}
					} else {
						int[] xy = gcs.findXYindexFromLatLon(p.lat, p.lon, null);

						// read the data at that lat, lon and the first time and
						// z
						// level
						// (if
						// any)
						// note order is t, z, y, x
						// TODO: TIME/DEPTH
						Array data = grid.readDataSlice(time, elevation, xy[1], xy[0]);
						// we know its a scalar //TODO?
						if (data.getDouble(0) == Double.NaN) {
							// System.out.println("Lat/Long x/y NOT FOUND for "
							// + p
							// +
							// ": " + xy[0] + "," + xy[1] + " VALUE:"
							// + data.getDouble(0));
						} else {
							Map<String, Double> values = new HashMap<String, Double>();
							values.put("value", data.getDouble(0));
							LatLonPoint latlonP = gcs.getLatLon(xy[0], xy[1]);
							values.put("lat", latlonP.getLatitude());
							values.put("lon", latlonP.getLongitude());
							// System.out.println("Lat/Long x/y FOUND for " + p
							// +
							// ": " +
							// xy[0] + "," + xy[1] + " VALUE:"
							// + data.getDouble(0));
							val.put(p.id, values);
						}
					}
				}
			} catch (IndexOutOfBoundsException e) {
				log("Got IndexOutOfBoundsException when processing the point:" + p, e);
			} catch (ReadRasterException e) {
			}
		}
		return val;
	}

	public static Map<String, String> getLayersFromRaster(String uri) {
		System.out.println("Getting layers from raster:" + uri);
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
		System.out.println("getLayersFromNetCDFFile");
		HashMap<String, String> layers = new HashMap<String, String>();
		List<String> axisName = new ArrayList<String>();
		for (CoordinateAxis axis : ncfile.getCoordinateAxes()) {
			axisName.add(axis.getFullNameEscaped());
		}
		for (Variable v : ncfile.getVariables()) {
			// Check that its not an dimension, like time, depth,lan,lot
			if (v.getRank() > 1 && axisName.indexOf(v.getFullNameEscaped()) == -1) {
				String unit = v.getUnitsString();
				if (unit == null)
					unit = "No unit set";
				String description = v.getDescription();
				if (description.trim().equals(""))
					description = v.getFullName();
				layers.put(v.getFullName(), description + "(" + unit + ")");
			}
		}
		return layers;
	}

	public static Map<String, Map<String, String>> getDimensionsFromRasterParameter(String uri, String parameter) {
		NetcdfDataset ncfile = null;
		Map<String, Map<String, String>> values = null;
		try {
			ncfile = NetcdfDataset.openDataset(uri);
			GridDataset grid = new GridDataset(ncfile);
			values = getDimensionsFromNetCDFFile(grid, parameter);
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

	private static Map<String, Map<String, String>> getDimensionsFromNetCDFFile(GridDataset grid, String parameter)
			throws Exception {
		Map<String, Map<String, String>> dimensions = new HashMap<String, Map<String, String>>();
		GridDatatype gridDataType = grid.findGridDatatype(parameter);
		GridCoordSystem gridCoordSystem = gridDataType.getCoordinateSystem();
		CoordinateAxis time = gridCoordSystem.getTimeAxis();
		if (time != null) {
			Array values = time.read();
			String unitsString = time.getUnitsString();
			System.out.println("unit:" + unitsString);
			DateUnit unit = new DateUnit(unitsString);
			System.out.println("udunits dateunit: " + unit);
			IndexIterator iter = values.getIndexIterator();
			int i = 0;
			Map<String, String> timeMap = new HashMap<String, String>();
			while (iter.hasNext()) {
				double val = iter.getDoubleNext();
				String dateString = unit.makeStandardDateString(val);
				timeMap.put("" + i, dateString);
				i++;
			}
			dimensions.put("time", timeMap);
		}
		CoordinateAxis1D elevation = gridCoordSystem.getVerticalAxis();
		if (elevation != null) {
			Array values = elevation.read();
			IndexIterator iter = values.getIndexIterator();
			int i = 0;
			Map<String, String> elevationMap = new HashMap<String, String>();
			while (iter.hasNext()) {
				double val = iter.getDoubleNext();
				elevationMap.put("" + i, "" + val);
				i++;
			}
			elevationMap.put("units", elevation.getUnitsString());
			dimensions.put("elevation", elevationMap);
		}
		return dimensions;
	}
}

class PointSet {
	Point[] points;
	String parameter;
	Integer time, elevation;

	public PointSet(Point[] points, String parameter, String time, String elevation) {
		this.points = points;
		this.parameter = parameter;
		try {
			this.time = Integer.parseInt(time);
		} catch (NumberFormatException e) {
			this.time = null;
		}
		try {
			this.elevation = Integer.parseInt(elevation);
		} catch (NumberFormatException e) {
			this.elevation = null;
		}
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
		// System.out.println("Generated new point:" + toString());
	}

	@Override
	public String toString() {
		return "Point [id=" + id + ", lat=" + lat + ", lon=" + lon + ", depth=" + depth + ", date=" + date + ", time="
				+ time + "]";
	}
}
