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

    create_text_element: function(attr, str) {
      var ele = document.createElement('p');
      ele.textContent = str;
      switch(attr) {
        case nethack.ATR_NONE:
          break;
        case nethack.ATR_BOLD:
          ele.style.fontWeight = 'bold';
          break;
        default:
          console.log('TODO attr', attr);
      }
      return ele;
    },

    add_message: function(ele, attr, str) {
      ele.appendChild(this.create_text_element(attr, str));
      ele.scrollTop = ele.scrollHeight;
    },

    create_text_window: function(lines, onclose) {
      // show text 
      var e1 = document.createElement('div'); e1.className = 'modal fade';
        var e2 = document.createElement('div'); e2.className = 'modal-dialog';
          var e3 = document.createElement('div'); e3.className = 'modal-content';
            /*
            var e4 = document.createElement('div'); e4.className = 'modal-header';
            e3.appendChild(e4);
            */
            var e6 = document.createElement('div'); e6.className = 'modal-body';
              var e5 = document.createElement('button'); e5.className = 'close'; 
              e5.type = 'button';
              e5.innerHTML = '<span>&times;</span>';
              e5.addEventListener('click', function(e) {
                e1.classList.remove('in');
                e1.classList.add('out');
                if(onclose) onclose();
                // set display:none after the transition, or it will block the mouse events
                var transition_end_handler = function(e) {
                  e1.style.display = 'none';
                }
                e1.addEventListener('transitionend', transition_end_handler);
                e1.addEventListener('webkitTransitionEnd', transition_end_handler);
              });
              e6.appendChild(e5);
              lines.forEach(function(line){
                e6.appendChild(nethack.create_text_element(line.attr, line.str));
              });
            e3.appendChild(e6);
          e2.appendChild(e3);
        e1.appendChild(e2);
        return e1;
    },

    create_inventory_element: function(item) {
      var ele = document.createElement('span');
      ele.className = 'inventory-item';
      if(item.str.indexOf('(weapon in hand)') > -1 || item.str.indexOf('(being worn)') > -1)
          ele.className += ' equipped'

      var tile = document.createElement('span');
      tile.className = 'tile';
      if(item.tile == -1) {
        console.log('TODO no tile in inventory!');
        tile.className += ' tile-empty';
      } else {
        tile.className += ' tile' + item.tile.toString(16);
      }
      ele.appendChild(tile);

      var acc = document.createElement('div');
      acc.className = 'inventory-item-accelerator';
      acc.textContent = String.fromCharCode(item.accelerator);  
      ele.appendChild(acc);

      var des = document.createElement('div');
      des.className = 'inventory-item-description';
      des.textContent = item.str;
      ele.appendChild(des);
      
      return ele;
    },

    show_inventory_window: function(items) {
      // show inventory window
      nethack.inventory_win.innerHTML = '';
      var cur_row = null;
      items.forEach(function(item) {
        if(item.identifier == 0) {
          nethack.inventory_win.appendChild(nethack.create_text_element(nethack.ATR_NONE, item.str));
          cur_row = null;
        } else {
          if(!cur_row) {
            cur_row = document.createElement('p');
            nethack.inventory_win.appendChild(cur_row);
          } 
          var ele = nethack.create_inventory_element(item);
          cur_row.appendChild(ele);
        }
      });
    },

    _: null
  },

  Web_init: function(max_tile, win_message_p, win_status_p, win_map_p, win_inven_p) {
    document.getElementById('browserhack-loading').style.display = 'none';

    nethack.max_tile = max_tile;
    nethack.win_message_p = win_message_p;
    nethack.win_status_p = win_status_p;
    nethack.win_map_p = win_map_p;
    nethack.win_inven_p = win_inven_p;

    nethack.windows = [];

    nethack.keybuffer = [];
    nethack.mousebuffer = [];
    nethack.input_disabled = false;

    nethack.map_win = document.getElementById('browserhack-map');
    nethack.map_win_content = document.getElementById('browserhack-map-content');
    nethack.message_win = document.getElementById('browserhack-message');
    nethack.status_win = document.getElementById('browserhack-status');
    nethack.inventory_win = document.getElementById('browserhack-inventory');
    nethack.generate_default_tile_css();

    document.addEventListener('keypress', function(e) {
      if(nethack.input_disabled) return;
      e.preventDefault();
      nethack.keybuffer.push(e.charCode);
    });

    var mouse_event_handler = function(e) {
      if(nethack.input_disabled) return;
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
          y: 0,
          id: i
        };
        return i;
      }
    }
  },

  Web_clear_nhwindow: function(win) {
    win = nethack.windows[win];
    assert(win);
    switch(win.type) {
      case nethack.NHW_MESSAGE:
        if(win.id != {{{ makeGetValue('nethack.win_message_p', '0', 'i32') }}}) console.log('TODO: extra message window');
        break;
      case nethack.NHW_STATUS:
        if(win.id != {{{ makeGetValue('nethack.win_status_p', '0', 'i32') }}}) console.log('TODO: extra status window');
        nethack.status_win.innerHTML = '';
        break;
      case nethack.NHW_MAP:
        if(win.id != {{{ makeGetValue('nethack.win_map_p', '0', 'i32') }}}) console.log('TODO: extra map window');
        nethack.map_win_content.innerHTML = '';
        nethack.maptiles = [];
        break;
      default:
        console.log(win.type, 'TODO clear_nhwindow');
    } 
  },

  Web_modal_window_opened: function() {
    return nethack.input_disabled;
  },

  Web_display_nhwindow_helper: function(win, blocking) {
    win = nethack.windows[win];
    assert(win);
    switch(win.type) {
      case nethack.NHW_MAP:
      case nethack.NHW_STATUS:
      case nethack.NHW_MESSAGE:
        break;
      case nethack.NHW_MENU:
        if(!blocking) console.log(win.type, 'TODO display_nhwindow', blocking);
        if(win.lines) {
          var ele = nethack.create_text_window(win.lines, function(){
            nethack.input_disabled = false;
          });
          win.element_to_remove = ele;
          ele.style.display = 'block';
          document.body.appendChild(ele);
          setTimeout(function() {
            ele.classList.add('in');
          },1);
          if(blocking) nethack.input_disabled = true;
        } else {
          // show menu
        }
        break;
      default:
        console.log(win.type, 'TODO display_nhwindow', blocking);
    }
  },

  Web_destroy_nhwindow: function(win) {
    old_win = nethack.windows[win];
    assert(old_win);
    nethack.windows[win] = null;
    if(old_win.element_to_remove) old_win.element_to_remove.parentNode.removeChild(old_win.element_to_remove);
  },

  Web_curs: function(win, x, y) {
    win = nethack.windows[win];
    assert(win);
    win.x = x;
    win.y = y;
    switch(win.type) {
        case nethack.NHW_MAP:
        case nethack.NHW_STATUS:
            break;
        default:
            console.log(win.type, 'DEBUG curs', x, y);
    }
  },

  Web_putstr: function(win, attr, str) {
    str = Pointer_stringify(str);
    win = nethack.windows[win];
    assert(win);
    switch(win.type) {
      case nethack.NHW_MESSAGE:
        if(win.id != {{{ makeGetValue('nethack.win_message_p', '0', 'i32') }}}) console.log('TODO: extra message window');
        nethack.add_message(nethack.message_win, attr, str);
        break;
      case nethack.NHW_STATUS:
        if(win.id != {{{ makeGetValue('nethack.win_status_p', '0', 'i32') }}}) console.log('TODO: extra status window');
        nethack.add_message(nethack.status_win, attr, str);
        break;
      case nethack.NHW_MENU:
        if(!win.lines) win.lines = [];
        win.lines.push({ attr: attr, str: str });
        break;
      default:
        console.log(win.type, 'TODO putstr', attr, str);
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

  Web_add_menu_helper: function(win, tile, identifier, accelerator, groupacc, attr, str, preselected) {
    win = nethack.windows[win];
    assert(win);
    win.menu.push({
      tile: tile,
      identifier: {{{ makeGetValue('identifier', '0', 'i32') }}},
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
    switch(win.type) {
      case nethack.NHW_MENU:
        if(win.id == {{{ makeGetValue('nethack.win_inven_p', '0', 'i32') }}}) {
          nethack.show_inventory_window(win.menu);
        } else {
          console.log(win.type, 'TODO: select_menu', win.menu_prompt, how, win.menu);
        }
        break;
      default:
        console.log(win.type, 'ERROR: select_menu called on a non-menu window');
    }

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
    if(win.id != {{{ makeGetValue('nethack.win_map_p', '0', 'i32') }}}) console.log('TODO: extra map window');
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
