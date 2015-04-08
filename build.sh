#!/bin/bash

EMCC=~/src/emscripten/emcc
JOBS=4
MYDIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )

stage1() {
sh sys/unix/setup.sh
make -j$JOBS
make PREFIX=$MYDIR/web install
rm $MYDIR/web/nethack/nethack
rm $MYDIR/web/nethack/recover
}

stage2() {
pushd src
  rm *.o
  make CC=$EMCC -j$JOBS
popd
}

#stage1
stage2
