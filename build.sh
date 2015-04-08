#!/bin/bash

EMCC=~/src/emscripten/emcc
JOBS=4

stage1() {
sh sys/unix/setup.sh
pushd util
  make makedefs
  make tilemap
popd
pushd dat
  make options
popd
}

stage2() {
pushd src
  make ../include/onames.h
  make ../include/pm.h
  make ../include/vis_tab.h
  make monstr.c
  make tile.c
  rm *.o
  make CC=$EMCC -j$JOBS
popd
}


stage1
#stage2
