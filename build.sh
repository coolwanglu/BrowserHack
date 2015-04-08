#!/bin/bash

EMCC=~/src/emscripten/emcc
JOBS=4
MYDIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )

stage1() {
sh sys/unix/setup.sh
make CC=$EMCC -j$JOBS
make install CC=$EMCC PREFIX=$MYDIR/build
}

stage2() {
pushd build
  cp ../src/nethack nethack.bc 
  $EMCC nethack.bc \
    -o browserhack.js \
    -O3 \
    -Oz \
    -s EMTERPRETIFY=1 \
    -s EMTERPRETIFY_ASYNC=1 \
    --memory-init-file 1 \
    --js-library ../win/web/nethack_lib.js \
    --preload-file nethack \

popd
cp build/browserhack.js web/
cp build/browserhack.js.mem web/
cp build/browserhack.data web/
}

stage1
stage2
