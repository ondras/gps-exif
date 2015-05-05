#!/bin/sh

# fill in gps timestamp for files that have a gps position, but only local time info

DIFF=+02
exiftool -if 'not $gpsdatetime' -if '$gpslatitude' "-gpsdatestamp<\${datetimeoriginal}${DIFF}:00" "-gpstimestamp<\${datetimeoriginal}${DIFF}:00" "$@"
