#!/bin/sh

# print a gps data summary

exiftool -filename -gpslatitude -gpslongitude -gpsaltitude -T -n "$@"
