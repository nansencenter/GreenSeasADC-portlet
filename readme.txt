Directions for deployment: make war with liferay sdk and deploy as a plugin in liferay

# Copyright and license
Copyright (C) 2018 Nansen Environmental and Remote Sensing Center (NERSC).

GreenSeasADC is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

# Contact
Email: post@nersc.no
Address: Thormøhlens gate 47, N-5006 Bergen, Norway

Explanation of the main file structure:

|-- docroot
|   |-- META-INF ### contains manifest file
|   |-- WEB-INF ### Contains configuration files and:
|   |   |-- lib ### contains a few java dependencies
|   |   |-- src ### contains the Java code in the project and a lot of properties files
|   |   |   |-- nersc ### nersc specific code
|   |   |   |-- uk ### contains code based on code from University of Reading
|   |   |   |-- combinedParameters.properties ### Defines the grouping of parameters in the long tree
|   |   |   |-- cruisesList.properties ### Lists of cruises that are queryable
|   |   |   |-- greenSeas.properties ### A Few global settings for the portlet, these are relayed to the javascript front-end
|   |   |   |-- greenSeasServer.properties ### A global setting which is only readable from server-side
|   |   |   |-- layerHeaders.properties ### Top level headers for the parameters tree
|   |   |   |-- Longhurst_regions.properties ### Configures the search options for longhurst regions
|   |   |   |-- Longhurst_regions_polygons.properties ### Defines the polygons for the longhurst regions
|   |   |   |-- openDAPURLs.properties ### URLs for OPeNDAP data to the "Model/data matchup" tab
|   |   |   |-- parameterDataType.properties ### datatype of each parameter
|   |   |   |-- parameterHeaders.properties ### header for each parameter
|   |   |   |-- parameterTooltips.properties ### tooltip for each parameter
|   |   |   |-- parameterUnits.properties ### units for each parameter
|   |   |   |-- shortParameterHeaders.properties ### short header for each parameter
|   |   |   `-- wmsLayers.properties ### URLs for WMS data to the "Configure map Layers" tab
|   |-- css ### contains css and icons
|   |-- images ### contains some icons
|   |-- js
|   |   |-- lib ### contains some javascript libraries
|   |   |-- src ### contains the main front-end code
|   |-- jsp ### contains the one jsp file for the fron-end
