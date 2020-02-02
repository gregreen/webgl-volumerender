#!/usr/bin/env bash

width_array=( 256 512 1024 2048 )

echo "Bayestar15"
for width in "${width_array[@]}"; do
  height=$(( $width / 2 ))
  echo "$width x $height -> $width x $width"
  for k in {0..3}; do
    j=$(( $k + 4 ))
    echo "${k} + ${j} -> ${k}"
    convert -append \
      app/static/media/texture_b15_${width}x${height}_${k}.png \
      app/static/media/texture_b15_${width}x${height}_${j}.png \
      app/static/media/texture_b15_${width}x${width}_${k}.png
  done
done

echo "Bayestar19"
for width in "${width_array[@]}"; do
  height=$(( $width / 2 ))
  echo "$width x $height -> $width x $width"
  for k in {0..14}; do
    j=$(( $k + 15 ))
    echo "${k} + ${j} -> ${k}"
    convert -append \
      app/static/media/texture_b19_${width}x${height}_${k}.png \
      app/static/media/texture_b19_${width}x${height}_${j}.png \
      app/static/media/texture_b19_${width}x${width}_${k}.png
  done
done
