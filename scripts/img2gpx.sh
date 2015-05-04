#!/bin/sh
TEMPLATE=$(dirname $0)/gpx.fmt
exiftool -if '$gpsdatetime' -fileOrder gpsdatetime -p $TEMPLATE -d %Y-%m-%dT%H:%M:%SZ "$@"
