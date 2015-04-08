/* vim: set sw=2 ts=2 et ft=javascript */
// Copyright (c) 2015 Lu Wang <coolwanglu@gmail.com>
var LibraryVIM = {
  $nethack: {
    NHW_MESSAGE: 1,
    NHW_STATUS: 2,
    NHW_MAP: 3,
    NHW_MENU: 4,
    NHW_TEXT: 5,

    generate_default_tile_css: function() {
      var default_tile_image = 'default_tiles.png';
      var tile_width = nethack.tile_width = 32;
      var tile_height = nethack.tile_height = 32;
      var tile_per_row = 40;

      // preload it
      var img = new Image();
      img.src = default_tile_image;

      // generate styles
      var css_string = [];
      css_string.push('.tile{width:' + tile_width + 'px;height:' + tile_height + 'px;background-image:url(\'' + default_tile_image + '\');background-repeat:no-repeat;position:absolute;}');
      for(var i = 0; i < nethack.max_tile; ++i) {
        css_string.push('.tile' + i.toString(16) + '{background-position:' + -((i % tile_per_row) * tile_width) + 'px '+ -(((i / tile_per_row)|0) * tile_height) + 'px;}');
      }

      // enable the styles
      var style = document.createElement('style');
      style.type = 'text/css';
      style.innerHTML = css_string.join('\n');
      document.getElementsByTagName('head')[0].appendChild(style);
    },

    raw_print: function(str, bold) {
      var ele = document.getElementById('browserhack-msg');
      var msg = document.createElement('p');
      msg.innerText = Pointer_stringify(str);
      if(bold) msg.style.fontWeight = 'bold';
      ele.appendChild(msg);
      ele.scrollTop = ele.scrollHeight;
    },

    _: null
  },

  Web_init: function(max_tile) {
    nethack.max_tile = max_tile;

    nethack.windows = [];
    nethack.generate_default_tile_css();
  },

  Web_askname_helper: function(buf, len) {
    str = window.prompt('Who are you?');
    if (str == '') str = 'Unnamed Player';
    writeStringToMemory(str, buf); // TODO: check length
  },

  Web_create_nhwindow: function(type) {
    switch(type) {
        case nethack.NHW_MESSAGE:
        case nethack.NHW_STATUS:
        case nethack.NHW_MAP:
        case nethack.NHW_MENU:
        case nethack.NHW_TEXT:
            break;
        default:
            assert(false);
    }
    for(var i = 0;;++i) {
      if(!nethack.windows[i]) {
        nethack.windows[i] = {
          type: type,
          x: 0,
          y: 0
        };
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
    assert(win);
    win.x = x;
    win.y = y;
  },

  Web_putstr: function(win, attr, str) {
    str = Pointer_stringify(str);
    win = nethack.windows[win];
    assert(win);
    if(win.type == nethack.NHW_MESSAGE) {
      nethack.raw_print(str);
    } else {
      console.log(win.type, 'TODO putstr');
    }
  },

  Web_display_file: function(str, complain) {
    fn = Pointer_stringify(str);
    var data = '';
    try {
      data = FS.readFile(fn);
    } catch (e) {
      if (!complain) return;
      data = 'File not found: ' + fn;
    }
    console.log('display_file', data);
  },

  Web_start_menu: function(win) {
    win = nethack.windows[win];
    assert(win);
    win.menu = [];
  },

  Web_add_menu: function(win, glyph, identifier, accelerator, groupacc, attr, str, preselected) {
    win = nethack.windows[win];
    assert(win);
    win.menu.push({
      glyph: glyph,
      identifier: identifier,
      accelerator: accelerator,
      groupacc: groupacc,
      attr: attr,
      str: Pointer_stringify(str),
      preselected: preselected
    });
  },

  Web_end_menu: function(win, prmpt) {
    win = nethack.windows[win];
    assert(win);
    win.menu_prompt = Pointer_stringify(prmpt);
  },

  Web_get_menu_count: function(win) {
    win = nethack.windows[win];
    assert(win);
    assert(win.menu);
    return win.menu.length;
  }

  Web_select_menu_helper: function(win, how, selected) {
    win = nethack.windows[win];
    assert(win);
    assert(win.menu);
    console.log('TODO: select_menu', win.menu_prompt);
    win.menu.forEach(function(menu) {
      console.log(menu.str);
    });
    return 0;
  },

  Web_cliparound: function(x, y) {
    var ele = document.getElementById('browserhack-map');
    ele.scrollLeft = x * nethack.tile_width - ele.offsetWidth / 2;
    ele.scrollTop = y * nethack.tile_height - ele.offsetHeight / 2;
  },

  Web_print_glyph_helper: function(win, x, y, tile) {
    win = nethack.windows[win];
    assert(win);
    assert(win.type == nethack.NHW_MAP);
    if(!win.tiles) win.tiles = [];
    if(!win.tiles[x]) win.tiles[x] = [];
    if(!win.tiles[x][y]) {
      var map_e = document.getElementById('browserhack-map');
      var e = document.createElement('div');
      e.style.left = x * nethack.tile_width + 'px';
      e.style.top = y * nethack.tile_height + 'px';
      map_e.appendChild(e);
      win.tiles[x][y] = e;
    }
    win.tiles[x][y].className = 'tile tile' + tile.toString(16);
  },

  Web_raw_print_helper: function(str, bold) {
    nethack.raw_print(str, bold);
  },

  Web_getlin: function(quest, input) {
    str = window.prompt(Pointer_stringify(quest));
    writeStringToMemory(str, input); // TODO: check length
  },

  _: null
};
autoAddDeps(LibraryVIM, '$nethack');
mergeInto(LibraryManager.library, LibraryVIM);
