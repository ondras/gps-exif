#!/bin/sh

die () {
    echo >&2 "$@"
    exit 1
}

#[ "$#" -ge 2 ] || die "Syntax: $0 logfile imagefile... "
exiftool -if 'not $gpsdatetime' -geotag "$@"
