package nersc.greenseas.rasterData;

import java.io.File;
import java.io.IOException;
import java.util.Arrays;
import java.util.Map;

import nersc.greenseas.portlet.GreenseasPortlet;

import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;

import ucar.ma2.Array;
import ucar.ma2.ArrayDouble;
import ucar.ma2.DataType;
import ucar.ma2.Index;
import ucar.ma2.InvalidRangeException;
import ucar.nc2.Dimension;
import ucar.nc2.NetcdfFileWriteable;

public class NetCDFWriter {

	public static boolean createNetCDF(Map<String, String[]> parameterMap) {

		try {
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
		String[] temp = parameterMap.get("allLat");
		float[] allLat = new float[temp.length];
		for (int i = 0; i < temp.length;i++)
			allLat[i]=Float.parseFloat(temp[i]);

		temp = parameterMap.get("allLon");
		float[] allLon = new float[temp.length];
		for (int i = 0; i < temp.length;i++)
			allLon[i]=Float.parseFloat(temp[i]);
		
		temp = parameterMap.get("allDepth");
		float[] allDepth = new float[temp.length];
		for (int i = 0; i < temp.length;i++)
			allDepth[i]=Float.parseFloat(temp[i]);
		
		temp = parameterMap.get("latArray");
		float[] latArray = new float[temp.length];
		for (int i = 0; i < temp.length;i++)
			latArray[i]=Float.parseFloat(temp[i]);
		
		temp = parameterMap.get("lonArray");
		float[] lonArray = new float[temp.length];
		for (int i = 0; i < temp.length;i++)
			lonArray[i]=Float.parseFloat(temp[i]);

		//TODO: DEPTHARRAY
		temp = parameterMap.get("timeArray");
		int[] timeArray = new int[temp.length];
		for (int i = 0; i < temp.length;i++)
			timeArray[i]=Integer.parseInt(temp[i]);		

		String[]vals = parameterMap.get("vals");
		float[][] valArrays = new float[vals.length][];
		String[][] valDescr = new String[vals.length][];
		for (int j = 0; j < vals.length;j++){
			temp = parameterMap.get(vals[j]);
			valArrays[j] = new float[temp.length];
			for (int i = 0; i < temp.length;i++)
				valArrays[j][i]=Float.parseFloat(temp[i]);
			valDescr[j] = new String[3];
			valDescr[j] = parameterMap.get(vals[j]+"Description");
		}
		
			if (testWriteRecordAtaTime(fileName, allLat, allLon, allDepth, timeArray, valArrays, valDescr, latArray,
					lonArray))
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
		}
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
	 * @return
	 * @throws IOException
	 * @throws InvalidRangeException
	 */
	@SuppressWarnings("deprecation")
	private static boolean testWriteRecordAtaTime(String fileName, float[] allLat, float[] allLon, float[] allDepth,
			int[] timeArray, float[][] valArrays, String[][] valDescr, float[] latArray, float[] lonArray)
			throws IOException, InvalidRangeException {
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
		writeableFile.addVariableAttribute("time", "units", "minutes since 1914-01-01");
		writeableFile.addVariableAttribute("time", "calendar", "Standard");

		for (String[] valD : valDescr) {
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
		int i = 0, j = 0;
		while (i < timeArray.length) {
			int time = timeArray[i];
			Index timeIndex = timeData.getIndex();
			timeData.setInt(timeIndex, time);

			// Needed to create the whole grid...
			for (int lat = 0; lat < allLat.length; lat++) {
				for (int lon = 0; lon < allLon.length; lon++) {
					for (int k = 0; k < valDescr.length; k++) {
						data[k].set(0, 0, lat, lon, Double.NaN);
					}
				}
			}
			while (i < timeArray.length && timeArray[i] == time) {

				int latIndex = Arrays.binarySearch(allLat, latArray[i]);
				int lonIndex = Arrays.binarySearch(allLon, lonArray[i]);
				for (int k = 0; k < valDescr.length; k++) {
					data[k].set(0, 0, latIndex, lonIndex, valArrays[k][i]);
				}
				i++;
			}
			// write the data out for one record
			// set the origin here
			time_origin[0] = j;
			origin[0] = j++;

			for (int k = 0; k < valDescr.length; k++) {
				writeableFile.write(valDescr[k][0], origin, data[k]);
			}
			writeableFile.write("time", time_origin, timeData);

		} // loop over record
			// all done
		writeableFile.close();
		return true;
	}
}
