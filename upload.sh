#!/bin/bash
set -e

git checkout master
mkdir /tmp/browserhack || true
cp web/* /tmp/browserhack
git checkout gh-pages
mv /tmp/browserhack/* .
rm nethackrc.default
git commit -am "upload script"
git push
git checkout master
