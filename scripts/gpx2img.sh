#!/bin/sh

# interpolate gps position where missing, using a GPX tracklog as a position source

die () {
    echo >&2 "$@"
    exit 1
}

#[ "$#" -ge 2 ] || die "Syntax: $0 logfile imagefile... "
exiftool -if 'not $gpslatitude' -geotag "$@"
