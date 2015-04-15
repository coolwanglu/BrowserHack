#!/usr/bin/env python

import os
import re
import json

FILES = ['monsters.txt', 'objects.txt', 'other.txt']
DIR = os.path.join(os.path.dirname(os.path.realpath(__file__)), '..', 'share')
OUT_FILE = 'tilenames.json'
PATTERN = re.compile(r'^# tile (\d+) \((.*?)\)$', re.MULTILINE)

tilenames = []

for fn in FILES:
    with open(os.path.join(DIR, fn)) as inf:
        items = PATTERN.findall(inf.read());
        for i, item in enumerate(items):
            tileid, tilename = item
            assert(i == int(tileid))
            tilenames.append(tilename)

with open(OUT_FILE, 'w') as outf:
    json.dump(tilenames, outf)

