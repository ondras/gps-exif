#!/bin/sh
exiftool -filename -gpslatitude -gpslongitude -gpsaltitude -T -n "$@"
