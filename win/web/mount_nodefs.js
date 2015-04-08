// vim: set sw=2 ts=2 et ft=javascript
// Copyright (c) 2015 Lu Wang <coolwanglu@gmail.com>

// mount local file system for util files
// this file is supposed to be bulit with --pre-js

var Module = {};
Module['preRun'] = function() {
  var fs = require('fs');
  var path = require('path');
  // find top dir
  var cur_dir = path.normalize(process.cwd());
  var top_dir = path.normalize(cur_dir+'/..');
  assert(fs.existsSync(top_dir+'/README.md'));
  
  // mount directories
  ['dat', 'include', 'src', 'util'].forEach(function(dn) {
      var slash_dn = '/' + dn;
      FS.mkdir(slash_dn);
      FS.mount(NODEFS, { root: top_dir + slash_dn }, slash_dn);
      if(cur_dir == path.normalize(top_dir + slash_dn))
        FS.chdir(slash_dn);
  });
};
