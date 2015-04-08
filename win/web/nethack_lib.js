/* vim: set sw=2 ts=2 et ft=javascript */
// Copyright (c) 2015 Lu Wang <coolwanglu@gmail.com>
var LibraryNetHack = {
  $nethack: {
    // window types
    NHW_MESSAGE: 1,
    NHW_STATUS: 2,
    NHW_MAP: 3,
    NHW_MENU: 4,
    NHW_TEXT: 5,

    // text attributes
    ATR_NONE: 0,
    ATR_BOLD: 1,
    ATR_DIM: 2,
    ATR_ULINE: 4,
    ATR_BLINK: 5,
    ATR_INVERSE: 7,

    // menu
    PICK_NONE: 0,
    PICK_ONE: 1,
    PICK_ANY: 2,

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

    add_message: function(ele, attr, str) {
      var msg = document.createElement('p');
      msg.textContent = str;
      switch(attr) {
        case nethack.ATR_BOLD:
          msg.style.fontWeight = 'bold';
      }
      ele.appendChild(msg);
      ele.scrollTop = ele.scrollHeight;
    },

    _: null
  },

  Web_init: function(max_tile) {
    nethack.max_tile = max_tile;
    nethack.windows = [];
    nethack.keybuffer = [];
    nethack.mousebuffer = [];
    nethack.map_win = document.getElementById('browserhack-map');
    nethack.map_win_content = document.getElementById('browserhack-map-content');
    nethack.message_win = document.getElementById('browserhack-message');
    nethack.status_win = document.getElementById('browserhack-status');
    nethack.generate_default_tile_css();

    document.addEventListener('keypress', function(e) {
      e.preventDefault();
      nethack.keybuffer.push(e.charCode);
    });

    var mouse_event_handler = function(e) {
      var x = e.target.getAttribute('data-x');
      var y = e.target.getAttribute('data-y');
      if(x == null || y == null) return;

      x = parseInt(x);
      y = parseInt(y);
       
      var mod = 0;
      if(e.type == 'click') mod = 1;
      else if (e.type == 'dblclick') mod = 2;
      else return;

      nethack.mousebuffer.push({
        x: x,
        y: y,
        mod: mod
      });

      e.preventDefault();
    };

    nethack.map_win.addEventListener('click', mouse_event_handler);
    nethack.map_win.addEventListener('dblclick', mouse_event_handler);
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
    console.log('TODO destory_nhwindow');
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
    switch(win.type) {
      case nethack.NHW_MESSAGE:
        nethack.add_message(nethack.message_win, attr, str);
        break;
      case nethack.NHW_STATUS:
        nethack.add_message(nethack.status_win, attr, str);
        break;
      default:
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
  },

  Web_select_menu_helper: function(win, how, selected) {
    win = nethack.windows[win];
    assert(win);
    assert(win.menu);
    console.log('TODO: select_menu', win.menu_prompt, how);
    return 0;
  },

  Web_cliparound: function(x, y) {
    nethack.map_win_content.style.left = (-(x + 0.5) * nethack.tile_width + nethack.map_win.offsetWidth / 2) + 'px';
    nethack.map_win_content.style.top = (-(y + 0.5) * nethack.tile_height + nethack.map_win.offsetHeight / 2) + 'px';
  },

  Web_print_tile: function(win, x, y, tile) {
    win = nethack.windows[win];
    assert(win);
    assert(win.type == nethack.NHW_MAP);
    if(!nethack.maptiles) nethack.maptiles = [];
    if(!nethack.maptiles[x]) nethack.maptiles[x] = [];
    if(!nethack.maptiles[x][y]) {
      var e = document.createElement('div');
      e.style.left = x * nethack.tile_width + 'px';
      e.style.top = y * nethack.tile_height + 'px';
      e.setAttribute('data-x', x);
      e.setAttribute('data-y', y);
      nethack.map_win_content.appendChild(e);
      nethack.maptiles[x][y] = e;
    }
    nethack.maptiles[x][y].className = 'tile tile' + tile.toString(16);
  },

  Web_raw_print_helper: function(str, bold) {
    nethack.add_message(nethack.message_win, bold ? nethack.ATR_BOLD : nethack.ATR_NONE, Pointer_stringify(str));
  },

  Web_keybuffer_empty: function() { return nethack.keybuffer.length == 0; },
  Web_mousebuffer_empty: function() { return nethack.mousebuffer.length == 0; },
  Web_getch: function() { 
      // for keyboard events we enable the animation on the map
      nethack.map_win_content.classList.add('animated');
      return nethack.keybuffer.pop(0); 
  },
  Web_save_mouse: function(x, y, mod) {
    // for mouse events we disable the animation on the map
    nethack.map_win_content.classList.remove('animated');
    var e = nethack.mousebuffer.pop(0);
    {{{ makeSetValue('x', 0, 'e.x', 'i32') }}};
    {{{ makeSetValue('y', 0, 'e.y', 'i32') }}};
    {{{ makeSetValue('mod', 0, 'e.mod', 'i32') }}};
  },

  Web_getlin: function(quest, input) {
    str = window.prompt(Pointer_stringify(quest));
    writeStringToMemory(str, input); // TODO: check length
  },

  _: null
};
autoAddDeps(LibraryNetHack, '$nethack');
mergeInto(LibraryManager.library, LibraryNetHack);
