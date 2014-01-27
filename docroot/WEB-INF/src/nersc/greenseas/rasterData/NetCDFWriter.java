package nersc.greenseas.rasterData;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.json.simple.JSONArray;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;

import nersc.greenseas.portlet.GreenseasPortlet;
import ucar.ma2.Array;
import ucar.ma2.ArrayChar;
import ucar.ma2.ArrayDouble;
import ucar.ma2.DataType;
import ucar.ma2.Index;
import ucar.ma2.InvalidRangeException;
import ucar.nc2.Dimension;
import ucar.nc2.NetcdfFileWriteable;

//TODO: use something that is not deprecated
@SuppressWarnings("deprecation")
public class NetCDFWriter {

	public static boolean createNetCDF(Map<String, String[]> parameterMap) {

		// TODO: close the file
		try {

			JSONParser parser = new JSONParser();
			JSONObject jsonData = (JSONObject) parser.parse(parameterMap.get("jsonData")[0]);
			String fileName;
			while (true) {
				String[] folders = { "content", "gsadbc", "createdNetCDFFiles" };
				String filePath = GreenseasPortlet.createDirectory(System.getProperty("catalina.base"), folders);
				fileName = filePath + "CreatedFile_" + System.currentTimeMillis() + ".nc";
				File f = new File(fileName);
				if (!f.exists()) {
					break;
				}
			}
			JSONArray temp = (JSONArray) jsonData.get("allLat");
			int sizeOfTemp = temp.size();
			float[] allLat = new float[sizeOfTemp];
			for (int i = 0; i < sizeOfTemp; i++)
				allLat[i] = Float.parseFloat((String) temp.get(i));

			temp = (JSONArray) jsonData.get("allLon");
			sizeOfTemp = temp.size();
			float[] allLon = new float[sizeOfTemp];
			for (int i = 0; i < sizeOfTemp; i++)
				allLon[i] = Float.parseFloat((String) temp.get(i));

			temp = (JSONArray) jsonData.get("allDepth");
			sizeOfTemp = temp.size();
			float[] allDepth = new float[sizeOfTemp];
			for (int i = 0; i < sizeOfTemp; i++)
				allDepth[i] = Float.parseFloat(String.valueOf((Long) temp.get(i)));

			temp = (JSONArray) jsonData.get("allTimes");
			sizeOfTemp = temp.size();
			int[] allTimes = new int[sizeOfTemp];
			for (int i = 0; i < sizeOfTemp; i++) {
				Object tempI = temp.get(i);
				allTimes[i] = Integer.parseInt(String.valueOf((Long) tempI));
			}

			temp = (JSONArray) jsonData.get("variables");
			sizeOfTemp = temp.size();
			String[] variables = new String[sizeOfTemp];
			String[][] valDescr = new String[sizeOfTemp][];
			JSONObject temp2 = (JSONObject) jsonData.get("allDescriptions");
			for (int i = 0; i < sizeOfTemp; i++) {
				variables[i] = (String) temp.get(i);
				valDescr[i] = new String[3];
				for (int j = 0; j < 3; j++) {
					valDescr[i][j] = (String) ((JSONArray) temp2.get(variables[i])).get(j);
				}
			}

			JSONArray jsonlatArray = (JSONArray) jsonData.get("latArray");
			float[] latArray = new float[jsonlatArray.size()];

			JSONArray jsonlonArray = (JSONArray) jsonData.get("lonArray");
			float[] lonArray = new float[jsonlonArray.size()];

			JSONArray jsondepthArray = (JSONArray) jsonData.get("depthArray");
			float[] depthArray = new float[jsondepthArray.size()];

			// TODO: DEPTHARRAY
			JSONArray jsontimeArray = (JSONArray) jsonData.get("timeArray");
			int[] timeArray = new int[jsontimeArray.size()];

			JSONObject jsonValuesObj = (JSONObject) jsonData.get("allVariables");
			JSONArray[] jsonValuesArray = new JSONArray[sizeOfTemp];
			float[][] valArrays = new float[sizeOfTemp][];
			int numberOfDataPoints = latArray.length;
			for (int i = 0; i < sizeOfTemp; i++) {
				jsonValuesArray[i] = (JSONArray) jsonValuesObj.get(variables[i]);
				valArrays[i] = new float[numberOfDataPoints];
			}

			for (int i = 0; i < numberOfDataPoints; i++) {
				latArray[i] = Float.parseFloat((String) jsonlatArray.get(i));
				timeArray[i] = Integer.parseInt(String.valueOf((Long) jsontimeArray.get(i)));
				depthArray[i] = Float.parseFloat(String.valueOf((Long) jsondepthArray.get(i)));
				lonArray[i] = Float.parseFloat((String) jsonlonArray.get(i));
				for (int j = 0; j < sizeOfTemp; j++) {
					float value = Float.NaN;
					try {
						value = Float.parseFloat((String) jsonValuesArray[j].get(i));
					} catch (NumberFormatException e) {
					}
					valArrays[j][i] = value;
				}
			}

			/*
			 * float[][] valArrays = new float[variables.length][]; JSONObject
			 * jsonallVariables = (JSONObject)
			 * parser.parse(.get("allVariables")[0]); JSONObject
			 * jsonDescriptions = (JSONObject)
			 * parser.parse(.get("allDescriptions")[0]); for (int j = 0; j <
			 * variables.length; j++) { jsonallVariablesArray = (JSONArray)
			 * jsonallVariables
			 * .get(variables[j]);//parameterMap.get(variables[j]); int
			 * numberOfValues = jsonallVariablesArray.size(); valArrays[j] = new
			 * float[numberOfValues]; for (int i = 0; i < numberOfValues; i++) {
			 * float value = Float.NaN; try { value =
			 * Float.parseFloat((String)jsonallVariablesArray.get(i)); } catch
			 * (NumberFormatException e) {
			 * System.out.println("NumberFormatException for:"
			 * +i+","+(String)jsonallVariablesArray.get(i)); } valArrays[j][i] =
			 * value;
			 * 
			 * } }
			 */

			if (writeNetCDFGridByWritingOneRecordAtATime(fileName, allLat, allLon, allDepth, timeArray, allTimes, valArrays, valDescr,
					latArray, lonArray, depthArray))
				return true;
			else
				return false;
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
			return false;
		} catch (InvalidRangeException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
			return false;
		} catch (ParseException e1) {
			// TODO Auto-generated catch block
			e1.printStackTrace();
			return false;
		}
	}
	
	/**
	 * 
	 * Generates NetCDF timeSeriesProfile after
	 * http://cf-pcmdi.llnl.gov/documents
	 * /cf-conventions/1.6/cf-conventions.html#idp8432528 H5.3
	 * 
	 * @param fileName
	 * @param allLat
	 * @param allLon
	 * @param allDepth
	 * @param timeArray
	 * @param allTimes
	 * @param valArrays
	 * @param valDescr
	 * @param latArray
	 * @param lonArray
	 * @param depthArray
	 * @return
	 * @throws IOException
	 * @throws InvalidRangeException
	 */
	private static boolean writeNetCDFHFiveThree(String fileName, float[] allLat, float[] allLon, float[] allDepth,
			int[] timeArray, int[] allTimes, float[][] valArrays, String[][] valDescr, float[] latArray,
			float[] lonArray, float[] depthArray) throws IOException, InvalidRangeException {
		NetcdfFileWriteable writeableFile = NetcdfFileWriteable.createNew(fileName, false);
		// define dimensions, including unlimited
		Map<Station, Station> stationMap = findStations(latArray, lonArray, timeArray);

		int numberOfStations = stationMap.size();
		int numberOfProfiles = 0;
		Collection<Station> stationCollection = stationMap.values();
		for (Station s : stationCollection) {
			numberOfProfiles += s.timeIndexMap.size();
		}
		Dimension obsDim = writeableFile.addUnlimitedDimension("obs");
		Dimension profilesDim = writeableFile.addDimension("profile", numberOfProfiles);
		Dimension stationsDim = writeableFile.addDimension("station", numberOfStations);
		int name_strlen = 23;
		Dimension name_strlenDim = writeableFile.addDimension("name_strlen", name_strlen);
		

		// define Variables
		// TODO: perhaps something is D3 or D2
		writeableFile.addVariable("lat", DataType.FLOAT, new Dimension[] { stationsDim });
		writeableFile.addVariableAttribute("lat", "units", "degrees_north");
		writeableFile.addVariableAttribute("lat", "long_name", "station latitude");
		writeableFile.addVariableAttribute("lat", "standard_name", "latitude");
//		writeableFile.addVariableAttribute("lat", "axis", "lat");
		writeableFile.addVariable("lon", DataType.FLOAT, new Dimension[] { stationsDim });
		writeableFile.addVariableAttribute("lon", "units", "degrees_east");
		writeableFile.addVariableAttribute("lon", "long_name", "station longitude");
		writeableFile.addVariableAttribute("lon", "standard_name", "longitude");
//		writeableFile.addVariableAttribute("lon", "axis", "lon");
		writeableFile.addVariable("station_name", DataType.CHAR, new Dimension[] { stationsDim, name_strlenDim });
		writeableFile.addVariableAttribute("station_name", "long_name", "station name");
		writeableFile.addVariableAttribute("station_name", "cf_role", "timeseries_id");
		writeableFile.addVariable("station_info", DataType.CHAR, new Dimension[] { stationsDim, name_strlenDim });
		writeableFile.addVariableAttribute("station_info", "long_name", "some kind of station info");

		writeableFile.addVariable("profile", DataType.INT, new Dimension[] { profilesDim });
		writeableFile.addVariableAttribute("profile", "cf_role", "profile_id");
		writeableFile.addVariable("time", DataType.INT, new Dimension[] { profilesDim });
		writeableFile.addVariableAttribute("time", "standard_name", "time");
		writeableFile.addVariableAttribute("time", "units", "minutes since 1900-01-01");
		writeableFile.addVariableAttribute("time", "calendar", "Standard");
//		writeableFile.addVariableAttribute("time", "axis", "time");
		writeableFile.addVariable("station_index", DataType.INT, new Dimension[] { profilesDim });
		writeableFile.addVariableAttribute("station_index", "long_name", "which station this profile is for");
		writeableFile.addVariableAttribute("station_index", "instance_dimension", "station");
		writeableFile.addVariable("row_size", DataType.INT, new Dimension[] { profilesDim });
		writeableFile.addVariableAttribute("row_size", "long_name", "number of obs for this profile ");
		writeableFile.addVariableAttribute("row_size", "sample_dimension", "obs");

		writeableFile.addVariable("depth", DataType.FLOAT, new Dimension[] { obsDim });
		writeableFile.addVariableAttribute("depth", "long_name", "Depth");
		writeableFile.addVariableAttribute("depth", "standard_name", "depth");
		writeableFile.addVariableAttribute("depth", "units", "meters");
		writeableFile.addVariableAttribute("depth", "positive", "down");


		int numberOfObs = timeArray.length;
		float[][] values = new float[valDescr.length][];
		int valuesIndex = 0;
		for (String[] valD : valDescr) {
			valD[0] = valD[0].replace(":", "_");
			writeableFile.addVariable(valD[0], DataType.FLOAT, new Dimension[] { obsDim });
			writeableFile.addVariableAttribute(valD[0], "long_name", valD[1]);
			writeableFile.addVariableAttribute(valD[0], "standard_name", valD[1]);
			writeableFile.addVariableAttribute(valD[0], "units", valD[2]);
			writeableFile.addVariableAttribute(valD[0], "coordinates", "time lon lat depth");
			values[valuesIndex++] = new float[numberOfObs];
		}

		writeableFile.addGlobalAttribute("featureType", "timeSeriesProfile");
		writeableFile.addGlobalAttribute("Conventions", "CF-1.6");

		// create the file
		writeableFile.create();
		float[] lat = new float[numberOfStations];
		float[] lon = new float[numberOfStations];
		ArrayChar.D2 stationName = new ArrayChar.D2(numberOfStations, name_strlen);
		int[] profile = new int[numberOfProfiles];
		int[] time = new int[numberOfProfiles];
		int[] station = new int[numberOfProfiles];
		int[] rowSize = new int[numberOfProfiles];

		float[] depth = new float[numberOfObs];
		int stationIndex = 0, profileIndex = 0, obsIndex = 0;
		for (Station s : stationCollection) {
			stationName.set(stationIndex, 0, (char) ('a' + stationIndex));
			lat[stationIndex] = s.lat;
			lon[stationIndex] = s.lon;
			for (Integer currentTime : s.timeIndexMap.keySet()) {
				profile[profileIndex] = profileIndex;
				time[profileIndex] = currentTime;
				station[profileIndex] = stationIndex;
				int nObs = s.timeIndexMap.get(currentTime).size();
				rowSize[profileIndex++] = nObs;
				for (int i = 0; i < nObs; i++) {
					Integer currentObsIndex = s.timeIndexMap.get(currentTime).get(i);
					depth[obsIndex] = depthArray[currentObsIndex];
					for (int j = 0; j < values.length; j++)
						values[j][obsIndex] = valArrays[j][currentObsIndex];
					obsIndex++;
				}
			}
			stationIndex++;
		}
		writeableFile.write("lat", Array.factory(lat));
		writeableFile.write("lon", Array.factory(lon));
		writeableFile.write("station_name", stationName);
		writeableFile.write("station_info", stationName);

		writeableFile.write("profile", Array.factory(profile));
		writeableFile.write("time", Array.factory(time));
		writeableFile.write("station_index", Array.factory(station));
		writeableFile.write("row_size", Array.factory(rowSize));

		writeableFile.write("depth", Array.factory(depth));

		for (int j = 0; j < values.length; j++)
			writeableFile.write(valDescr[j][0], Array.factory(values[j]));
		writeableFile.close();
		return true;
	}
	
	

	/**
	 * @param allLat
	 * @param allLon
	 * @param allDepth
	 * @param allTimes
	 * @param valArrays
	 * @param latArray
	 * @param lonArray
	 * @param depthArray
	 * @param timeArray
	 * @return int[numberOfStations][numberofProfilesonEachStation][
	 *         numberofObsOnEachProfile]
	 */
	private static Map<Station, Station> findStations(float[] latArray, float[] lonArray, int[] timeArray) {
		int numberOfPoints = latArray.length;

		Map<Station, Station> stationMap = new HashMap<Station, Station>();
		for (int i = 0; i < numberOfPoints; i++) {
			Station station = new Station(latArray[i], lonArray[i]);
			Station stationFromSet = stationMap.get(station);
			if (stationFromSet == null) {
				stationMap.put(station, station);
			} else
				station = stationFromSet;
			List<Integer> timeList = station.timeIndexMap.get(timeArray[i]);
			if (timeList == null) {
				timeList = new ArrayList<Integer>();
				station.timeIndexMap.put(timeArray[i], timeList);
			}
			timeList.add(i);
		}

		return stationMap;
	}

	/**
	 * @param fileName
	 * @param allLat
	 * @param allLon
	 * @param allDepth
	 * @param timeArray
	 * @param valArrays
	 * @param valDescr
	 *            must be of same length as timeArray
	 * 
	 *            valD[0] = short_name, valD[1] = long_name, valD[2] = units
	 * @param latArray
	 * @param lonArray
	 * @param depthArray
	 * @return
	 * @throws IOException
	 * @throws InvalidRangeException
	 */
	private static boolean writeNetCDFGridByWritingOneRecordAtATime(String fileName, float[] allLat, float[] allLon,
			float[] allDepth, int[] timeArray, int[] allTimes, float[][] valArrays, String[][] valDescr,
			float[] latArray, float[] lonArray, float[] depthArray) throws IOException, InvalidRangeException {
		NetcdfFileWriteable writeableFile = NetcdfFileWriteable.createNew(fileName, false);
		// define dimensions, including unlimited
		Dimension latDim = writeableFile.addDimension("lat", allLat.length);
		Dimension lonDim = writeableFile.addDimension("lon", allLon.length);
		Dimension depthDim = writeableFile.addDimension("depth", allDepth.length);
		Dimension timeDim = writeableFile.addUnlimitedDimension("time");
		// define Variables
		// TODO: perhaps something is D3 or D2
		Dimension[] dim4 = new Dimension[4];
		dim4[0] = timeDim;
		dim4[1] = depthDim;
		dim4[2] = latDim;
		dim4[3] = lonDim;
		writeableFile.addVariable("lat", DataType.FLOAT, new Dimension[] { latDim });
		writeableFile.addVariableAttribute("lat", "units", "degrees_north");
		writeableFile.addVariable("lon", DataType.FLOAT, new Dimension[] { lonDim });
		writeableFile.addVariableAttribute("lon", "units", "degrees_east");
		writeableFile.addVariable("depth", DataType.FLOAT, new Dimension[] { depthDim });
		writeableFile.addVariableAttribute("depth", "long_name", "Depth");
		writeableFile.addVariableAttribute("depth", "units", "meters");
		writeableFile.addVariableAttribute("depth", "positive", "down");
		writeableFile.addVariable("time", DataType.INT, new Dimension[] { timeDim });
		writeableFile.addVariableAttribute("time", "units", "minutes since 1900-01-01");
		writeableFile.addVariableAttribute("time", "calendar", "Standard");

		writeableFile.addGlobalAttribute("grid_mapping_name", "latitude_longitude");
		writeableFile.addGlobalAttribute("Conventions", "CF-1.6");
		// System.out.println(valDescr.length);
		for (String[] valD : valDescr) {
			// System.out.println("valD:");
			// for (String s : valD)
			// System.out.println(s);
			writeableFile.addVariable(valD[0], DataType.DOUBLE, dim4);
			writeableFile.addVariableAttribute(valD[0], "long_name", valD[1]);
			writeableFile.addVariableAttribute(valD[0], "units", valD[2]);
		}

		// create the file
		writeableFile.create();
		// write out the non-record variables
		writeableFile.write("lat", Array.factory(allLat));
		writeableFile.write("lon", Array.factory(allLon));
		writeableFile.write("depth", Array.factory(allDepth));
		// // heres where we write the record variables
		// different ways to create the data arrays.
		// Note the outer dimension has shape 1, since we will write one record
		// at a time

		ArrayDouble.D4[] data = new ArrayDouble.D4[valDescr.length];
		for (int i = 0; i < valDescr.length; i++) {
			data[i] = new ArrayDouble.D4(1, depthDim.getLength(), latDim.getLength(), lonDim.getLength());
		}
		Array timeData = Array.factory(DataType.INT, new int[] { 1 });
		int[] origin = new int[] { 0, 0, 0, 0 };

		int[] time_origin = new int[] { 0 };
		// loop over each record
		int i = 0;
		Arrays.sort(allDepth);
		while (i < allTimes.length) {
			int time = allTimes[i];
			Index timeIndex = timeData.getIndex();
			timeData.setInt(timeIndex, time);

			// Needed to create the whole grid...
			for (int lat = 0; lat < allLat.length; lat++) {
				for (int lon = 0; lon < allLon.length; lon++) {
					for (int depth = 0; depth < allDepth.length; depth++) {
						for (int k = 0; k < valDescr.length; k++) {
							data[k].set(0, depth, lat, lon, Double.NaN);
						}
					}
				}
			}
			int index = indexOf(timeArray, time, 0);
			// System.out.println("DEPTHS:");
			// for (float depth : depthArray)
			// System.out.printf("%f",depth);
			// System.out.println("\nDEPTHS done");
			/*
			 * Float[] allLatFloat = convertToFloat(allLat); Float[] allLonFloat
			 * = convertToFloat(allLon); Float[] allDepthFloat =
			 * convertToFloat(allDepth);
			 */
			while (index >= 0) {
				// System.out.println(time);
				int latIndex = Arrays.binarySearch(allLat, latArray[index]);
				int lonIndex = Arrays.binarySearch(allLon, lonArray[index]);
				int depthIndex = Arrays.binarySearch(allDepth, depthArray[index]);
				// System.out.println("indexes:");
				// System.out.printf("%f,%f,%f%n", latArray[index],
				// lonArray[index], depthArray[index]);
				// System.out.printf("%d,%d,%d%n", latIndex, lonIndex,
				// depthIndex);
				for (int k = 0; k < valDescr.length; k++) {
					if (valArrays[k][index] != Float.NaN)
						data[k].set(0, depthIndex, latIndex, lonIndex, valArrays[k][index]);
				}
				index = indexOf(timeArray, time, ++index);
			}
			// write the data out for one record
			// set the origin here
			time_origin[0] = i;
			origin[0] = i++;

			for (int k = 0; k < valDescr.length; k++) {
				writeableFile.write(valDescr[k][0], origin, data[k]);
			}
			writeableFile.write("time", time_origin, timeData);
		} // loop over record
			// all done
		writeableFile.close();
		return true;
	}

	private static int indexOf(int[] array, int key, int fromIndex) {
		for (int i = fromIndex; i < array.length; i++)
			if (array[i] == key)
				return i;
		return -1;
	}

	private static int indexOf(float[] array, float key, int fromIndex, float epsilon) {
		for (int i = fromIndex; i < array.length; i++) {
			if (Math.abs(array[i] - key) <= epsilon)
				return i;
		}
		return -1;
	}
}

class Station {
	float lat, lon;
	Map<Integer, List<Integer>> timeIndexMap;

	@Override
	public int hashCode() {
		final int prime = 31;
		int result = 1;
		result = prime * result + Float.floatToIntBits(lat);
		result = prime * result + Float.floatToIntBits(lon);
		return result;
	}

	@Override
	public boolean equals(Object obj) {
		if (this == obj)
			return true;
		if (obj == null)
			return false;
		if (getClass() != obj.getClass())
			return false;
		Station other = (Station) obj;
		if (Float.floatToIntBits(lat) != Float.floatToIntBits(other.lat))
			return false;
		if (Float.floatToIntBits(lon) != Float.floatToIntBits(other.lon))
			return false;
		return true;
	}

	public Station(float lat, float lon) {
		super();
		this.lat = lat;
		this.lon = lon;
		timeIndexMap = new HashMap<Integer, List<Integer>>();
	}

}