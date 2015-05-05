#!/bin/sh

# generate a GPX track log from geotagged files

TEMPLATE=$(dirname $0)/gpx.fmt
exiftool -if '$gpslatitude' -fileOrder datetimeoriginal -p $TEMPLATE -d %Y-%m-%dT%H:%M:%SZ "$@"
