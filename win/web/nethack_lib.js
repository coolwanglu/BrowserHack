// vim: set sw=2 ts=2 et ft=javascript
// Copyright (c) 2015 Lu Wang <coolwanglu@gmail.com>
var LibraryVIM = {
  $nethack__deps: ['mktemp'],
  $nethack: {
    windows: [],

    _: null
  },

  Web_init_nhwindows: function(argcp, argv) {
    nethack.windows = [];
    nethack.Window = function() {
      this.x = 0;
      this.y = 0;
    };
    nethack.Window.prototype.destroy = function() { };
    nethack.Window.prototype.setXY = function(x, y) {
      this.x = x;
      this.y = y;
    };
    nethack.Window.prototype.putstr = function(attr, str) {
      console.log('putstr', attr, str);
    };
    nethack.Window.prototype.add_menu = function() { };
    nethack.Window.prototype.end_menu = function() { };
  },

  Web_askname_helper: function(buf, len) {
    str = window.prompt('Who are you?');
    if (str == '') str = 'Unnamed Player';
    writeStringToMemory(str, buf); // TODO: check length
  },

  Web_create_nhwindow: function(type) {
    for(var i = 0;;++i) {
      if(!nethack.windows[i]) {
        nethack.windows[i] = new nethack.Window();
        return i;
      }
    }
  },

  Web_clear_nhwindow: function(win) {
  },

  Web_display_nhwindow: function(win, blocking) {
  },

  Web_destroy_nhwindow: function(win) {
    win = nethack.windows[win];
    if(win) win.destroy();
    nethack.windows[win] = null;
  },

  Web_curs: function(win, x, y) {
    win = nethack.windows[win];
    if(win) win.setXY(x, y);
  },

  Web_putstr: function(win, attr, str) {
    win = nethack.windows[win];
    if(win) win.putstr(attr, Pointer_stringify(str));
  },

  Web_display_file: function(str, complain) {
    console.log('display_file'); 
    console.log(FS.readfile(Pointer_stringify(str)));
  },

  Web_start_menu: function(win) {
  },

  Web_add_menu: function(win, glyph, identifier, accelerator, groupacc, attr, str, preselected) {
    win = nethack.windows[win];
    if(win) win.add_menu(glyph, identifier, accelerator, groupacc, attr, str, preselected);
  },

  Web_end_menu: function(win, prmpt) {
    win = nethack.windows[win];
    if(win) win.end_menu(prmpt);
  },

  /*
  Web_select_menu: function(win, how, selected) {
  },
  */

  Web_cliparound: function(x,y) {
  },

  Web_print_glyph: function(winid, x, y, glyph) {
    win = nethack.windows[win];
    if(win) win.print_glyph(x, y, glyph);
  },

  Web_getlin: function(quest, input) {
    str = window.prompt(Pointer_stringify(quest));
    writeStringToMemory(str, input); // TODO: check length
  },

  _: null
};
autoAddDeps(LibraryVIM, '$nethack');
mergeInto(LibraryManager.library, LibraryVIM);
