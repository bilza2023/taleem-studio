#!/bin/bash
# /home/bilal-tariq/00--TALEEM/audio/process.sh
# Cleans every file in raw/ → audio/ as opus, then moves the original to archieve/
# Usage: ./process.sh

cd "$(dirname "$0")"
IN=raw
OUT=audio
ARCHIVE=archieve
mkdir -p "$OUT" "$ARCHIVE"

FILTERS="highpass=f=80,afftdn=nf=-25,equalizer=f=3000:t=q:w=1:g=2,deesser,acompressor=threshold=-18dB:ratio=3:attack=5:release=100,loudnorm=I=-16:TP=-1.5:LRA=11"

count=0
for f in "$IN"/*.{wav,mp3,m4a,ogg,opus,aac,webm}; do
  [ -e "$f" ] || continue
  name=$(basename "${f%.*}")
  if ffmpeg -loglevel error -y -i "$f" -af "$FILTERS" -ar 48000 -ac 1 -c:a libopus -b:a 32k "$OUT/$name.opus"; then
    dest="$ARCHIVE/$(basename "$f")"
    [ -e "$dest" ] && dest="$ARCHIVE/${name}_$(date +%Y%m%d-%H%M%S).${f##*.}"
    mv "$f" "$dest"
    echo "✅ $name"
    count=$((count+1))
  else
    echo "❌ $name (left in raw/)"
  fi
done
echo "Done: $count file(s) → $OUT/"