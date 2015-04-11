/* vim: set sw=2 ts=2 et ft=javascript */
// Copyright (c) 2015 Lu Wang <coolwanglu@gmail.com>
var LibraryNetHack = {
  $nethack: {
    // Macros from NetHack source code
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
      ele.appendChild(nethack.create_text_element(attr, str));
      ele.scrollTop = ele.scrollHeight;
    },

    create_window: function(obj) {
      var onclose = obj.onclose;
      var win_e = document.createElement('div'); win_e.className = 'modal fade';
        var dialog_e = document.createElement('div'); dialog_e.className = 'modal-dialog';
          var content_e = document.createElement('div'); content_e.className = 'modal-content';
            var button_e = document.createElement('button'); button_e.className = 'close'; 
            button_e.type = 'button';
            button_e.innerHTML = '<span>&times;</span>';
            button_e.addEventListener('click', function(e) {
              if(onclose) onclose();
              nethack.hide_window(win_e);
            });
            if(obj.title) {
              var header_e = document.createElement('div'); header_e.className = 'modal-header';
              header_e.appendChild(button_e);

              var title_e = document.createElement('h4'); title_e.className = 'modal-title';
              title_e.textContent = obj.title;
              header_e.appendChild(title_e);

              content_e.appendChild(header_e);
            }
            var body_e = document.createElement('div'); body_e.className = 'modal-body';
            if(!obj.title) body_e.appendChild(button_e);
            if(obj.make_body) obj.make_body(body_e);
          content_e.appendChild(body_e);
        dialog_e.appendChild(content_e);
      win_e.appendChild(dialog_e);
      return win_e;
    },

    show_text_window: function(lines, auto_remove) {
       var win = nethack.create_window({
        make_body: function(body) {
          var ele = document.createElement('div');
          ele.className = 'container modal-content-wrapper';
          lines.forEach(function(line){
            ele.appendChild(nethack.create_text_element(line.attr, line.str));
          });
          body.appendChild(ele);
        },
        onclose: function() {
          nethack.input_disabled = false;
          if(auto_remove) win.parentNode.removeChild(win);
        }
      });
      nethack.input_disabled = true;
      nethack.show_window(win);

      return win;
    },

    show_menu_window: function(items, title, how, auto_remove) {
      var list_items = [];
      var save_menu_selection = function() {
        nethack.last_menu_selection = [];
        list_items.forEach(function(item) {
          if(item.classList.contains('active'))
            nethack.last_menu_selection.push(parseInt(item.getAttribute('data-identifier')));
        });
        list_items = [];
      };
      nethack.last_menu_selection = null;
      var win = nethack.create_window({
        title: title,
        make_body: function(body) {
          var ele = document.createElement('div');
          ele.className = 'container modal-content-wrapper';
            var list = document.createElement('div');
            list.className = 'list-group'
            items.forEach(function(item) {
              var li = document.createElement('a');
              li.href = '#';
              li.className = 'list-group-item';
              if(item.preselected)
                li.className += ' active';
              li.appendChild(nethack.create_text_element(item.attr, item.str));
              li.setAttribute('data-identifier', item.identifier);
              if(item.identifier != 0) {
                if(how == nethack.PICK_ONE) {
                  li.addEventListener('click', function(e) {
                    e.currentTarget.classList.add('active');
                    save_menu_selection();
                    nethack.input_disabled = false;
                    nethack.hide_window(win);
                    if(auto_remove)  win.parentNode.removeChild(win);
                  });
                } else if (how == nethack.PICK_ANY) {
                  li.addEventListener('click', function(e) {
                    e.currentTarget.classList.toggle('active');
                  });
                } else if (how == nethack.PICK_NONE) {
                   // do nothing
                } else {
                  console.log('ERR, unknown `how` for select_menu');
                }
              }
              list_items.push(li);
              list.appendChild(li);
            });
          ele.appendChild(list);
          body.appendChild(ele);

          if(how == nethack.PICK_ANY) {
            var button_e = document.createElement('button'); 
            button_e.className = 'btn btn-primary'; 
            button_e.type = 'button';
            button_e.textContent = 'OK';
            button_e.addEventListener('click', function(e) {
              save_menu_selection();
              nethack.input_disabled = false;
              nethack.hide_window(win);
              if(auto_remove) win.parentNode.removeChild(win);
            });
            body.appendChild(button_e);
          }
        },
        onclose: function() {
          nethack.input_disabled = false;
          nethack.last_menu_selection = 'canceled';
          if(auto_remove) win.parentNode.removeChild(win);
        } 
      });
      nethack.input_disabled = true;
      nethack.last_menu_selection = 'waiting';
      nethack.show_window(win);

      return win;
    },

    create_inventory_element: function(item) {
      var ele = document.createElement('span');
      ele.className = 'inventory-item';
      if( item.str.indexOf('(wielded)') > -1 
         || item.str.indexOf('(weapon in hand)') > -1 
         || item.str.indexOf('(weapon in hands)') > -1 
         || item.str.indexOf('(being worn)') > -1)
          ele.className += ' active'

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

      // parse description
      var description = item.str;
      var count = null;
      var idx = description.indexOf(' ');
      if(idx > -1) {
        var prefix = description.substr(0, idx);
        if((prefix == 'a') || (prefix == 'an')) {
          count = 1;
        } else {
          count = parseInt(prefix);
          if(isNaN(count)) count = null;
        }
        if(count != null) {
          description = description.substr(idx + 1);
        }
      }
      
      if(count == null) {
        console.log('TODO cannot parse description', description);
        count = 1;
      }

      var des = document.createElement('div');
      des.className = 'inventory-item-description';
      des.textContent = description;
      ele.appendChild(des);

      if(count > 1) {
        var cnt = document.createElement('div');
        cnt.className = 'inventory-item-count';
        cnt.textContent = count;
        ele.appendChild(cnt);
      }
      
      return ele;
    },

    update_inventory_window: function(items) {
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

    show_window: function(ele) {
      document.body.appendChild(ele);
      ele.style.display = 'block';
      try {
        ele.getElementsByClassName('close')[0].focus();
      } catch(e) { }
      setTimeout(function() {
        ele.classList.add('in');
      },1);
    },

    hide_window: function(ele) {
      ele.classList.remove('in');
    },

    _: null
  },

  Web_init: function(max_tile, win_message_p, win_status_p, win_map_p, win_inven_p, yn_number_p) {
    document.getElementById('browserhack-loading').style.display = 'none';

    nethack.max_tile = max_tile;
    // pointer to global variables
    nethack.win_message_p = win_message_p;
    nethack.win_status_p = win_status_p;
    nethack.win_map_p = win_map_p;
    nethack.win_inven_p = win_inven_p;
    nethack.yn_number_p = yn_number_p;

    nethack.windows = [];

    nethack.keybuffer = [];
    nethack.mousebuffer = [];
    nethack.input_disabled = false;

    nethack.map_win = document.getElementById('browserhack-map');
    nethack.map_win_content = document.getElementById('browserhack-map-content');
    nethack.message_win = document.getElementById('browserhack-message');
    nethack.status_win = document.getElementById('browserhack-status');
    nethack.inventory_win = document.getElementById('browserhack-inventory');
    nethack.yn_area = document.getElementById('browserhack-yn-area');
    nethack.generate_default_tile_css();

    document.addEventListener('keypress', function(e) {
      if(nethack.yn_arg) { // pending a yn question
        var key = e.charCode;
        var choices = nethack.yn_arg.choices;
        var ch = String.fromCharCode(key); 
        if(choices == '') { // accept any 
          nethack.yn_result = ch;
        } else {
          ch = ch.toLowerCase();
          if(key == 27) { // ESC
            nethack.yn_result = (choices.indexOf('q') > -1) ? 'q'
                                  : (choices.indexOf('n') > -1) ? 'n'
                                  : nethack.yn_arg.def;
          } else if (' \n\r'.indexOf(ch) > -1) {
            nethack.yn_result = nethack.yn_arg.def;
          } else if (choices.indexOf(ch) > -1) {
            if (ch == '#') {
              var num = NaN;
              while(isNan(num)) num = parseInt(window.prompt('Enter a number'));
              {{{ makeSetValue('nethack.yn_number_p', '0', 'num', 'i32'); }}};
            }
            nethack.yn_result = ch;
          }
        }
        if (nethack.yn_result != null) {
          e.preventDefault();
          nethack.input_disabled = false;
          nethack.yn_area.classList.remove('in');
          nethack.yn_arg = null;
        }
      } else {
        if(nethack.input_disabled) return;
        e.preventDefault();
        var code = e.charCode;
        if(e.ctrlKey) {
          // some browsers do not `apply` the control key to charCode
          if((code <= 65) && (code <= 90)) { // A~Z
            code = code - 64;
          } else if ((code >= 97) && (code <= 122)) {
            code = code - 96;
          }
        }
        nethack.keybuffer.push(code);
      }
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

    document.getElementById('browserhack-replay-btn').addEventListener('click', function() { window.location.reload(); });
  },

  Web_askname_helper: function(buf, len) {
    var storage_key = 'BrowserHack_LastPlayerName';
    var last_name = '';
    if(typeof localStorage !== 'undefined') last_name = localStorage[storage_key] || '';
    var str = window.prompt('Who are you?', last_name);
    if(typeof localStorage !== 'undefined') localStorage[storage_key] = str;
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
      case nethack.NHW_TEXT:
        win.element_to_remove = nethack.show_text_window(win.lines);
        break;
      case nethack.NHW_MENU:
        if(!blocking) console.log(win.type, 'TODO display_nhwindow', blocking);
        if(win.lines) {
          win.element_to_remove = nethack.show_text_window(win.lines);
        } else if(win.menu) {
          // show menu
          console.log(win.type, 'TODO display_nhwindow (menu)', blocking);
        } else {
          console.log(win.type, 'ERROR nothing to display!');
        }
        break;
      default:
        console.log(win.type, 'TODO display_nhwindow', blocking);
    }
  },

  Web_destroy_nhwindow: function(win) {
    old_win = nethack.windows[win];
    if(old_win.element_to_remove) {
      old_win.element_to_remove.parentNode.removeChild(old_win.element_to_remove);
      old_win.element_to_remove = null;
    }
    assert(old_win);
    switch(win) {
      case {{{ makeGetValue('nethack.win_message_p', '0', 'i32') }}}:
      case {{{ makeGetValue('nethack.win_status_p', '0', 'i32') }}}:
      case {{{ makeGetValue('nethack.win_map_p', '0', 'i32') }}}:
      case {{{ makeGetValue('nethack.win_inven_p', '0', 'i32') }}}:
        // do not destroy standard windows
        break;
      default:
        nethack.windows[win] = null;
    }
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
        break;
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
      case nethack.NHW_TEXT:
        if(!win.lines) win.lines = [];
        win.lines.push({ attr: attr, str: str });
        break;
      default:
        console.log(win.type, 'TODO putstr', attr, str);
    } 
  },

  Web_display_file_helper: function(str, complain) {
    fn = Pointer_stringify(str);
    var data = '';
    try {
      data = FS.readFile(fn);
      data = UTF8ArrayToString(data, 0) 
    } catch (e) {
      if (!complain) return;
      data = 'File not found: ' + fn;
    }
    nethack.show_text_window([{ attr:nethack.ATR_NONE, str:data }], true);
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

  Web_get_last_menu_selection_count: function() {
    if(nethack.last_menu_selection == 'waiting') return -2;
    if(nethack.last_menu_selection == 'canceled') return -1;
    assert(nethack.last_menu_selection instanceof Array);
    return nethack.last_menu_selection.length;
  },

  Web_get_last_menu_selection_identifier: function(idx) {
    return nethack.last_menu_selection[idx];
  },

  Web_select_menu_helper: function(win, how, selected) {
    win = nethack.windows[win];
    assert(win);
    assert(win.menu);
    switch(win.type) {
      case nethack.NHW_MENU:
        if((win.id == {{{ makeGetValue('nethack.win_inven_p', '0', 'i32') }}}) && (how == nethack.PICK_NONE)) {
          nethack.update_inventory_window(win.menu);
        } else {
          win.element_to_remove = nethack.show_menu_window(win.menu, win.menu_prompt, how);
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

  Web_get_yn_result: function() {
    assert(nethack.yn_result != null);
    return nethack.yn_result.charCodeAt(0);
  },

  Web_yn_function_helper: function(ques, choices, def) {
    ques = Pointer_stringify(ques);
    choices = Pointer_stringify(choices);   
    def = String.fromCharCode(def & 0xff);

    var i = choices.indexOf(String.fromCharCode(27)); //ESC
    if(i > -1) choices = choices.substr(0, i);
    
    var yn_area_text = ques;
    if(choices != '') yn_area_text += ' [' + choices + ']';
    nethack.yn_area.textContent = yn_area_text;
    nethack.yn_area.classList.add('in');

    nethack.yn_arg = {
      ques: ques,
      choices: choices,
      def: def
    };
    nethack.yn_result = null;
    
    nethack.input_disabled = true;
  },

  Web_getlin: function(quest, input) {
    str = window.prompt(Pointer_stringify(quest));
    writeStringToMemory(str, input); // TODO: check length
  },

  Web_outrip_helper: function(lines, line_count) {
    var ele = document.getElementById('browserhack-rip-text');
    ele.innerHTML = '';
    for(var i = 0; i < line_count; ++i) {
      var str = Pointer_stringify({{{ makeGetValue('lines', 'i*4', 'i32'); }}});
      var cur_line = document.createElement('p');
      cur_line.textContent = str;
      ele.appendChild(cur_line);
    }
        
    document.getElementById('browserhack-rip').classList.add('in');
    document.getElementById('browserhack-replay-btn').focus();
    
    nethack.input_disabled = true; 
  },

  Web_get_ext_cmd_helper: function(commands, command_count) {
    var items = [];
    for(var i = 0; i < command_count; ++i) {
      items.push({
        identifier: i + 1, // 0 means not selectable, so have to plus one here, will get it removed in the C code
        attr: nethack.ATR_NONE,
        str: Pointer_stringify({{{ makeGetValue('commands', 'i*4', 'i32'); }}})
      });
    }
    nethack.show_menu_window(items, null, nethack.PICK_ONE, true);
  },

  _: null
};
autoAddDeps(LibraryNetHack, '$nethack');
mergeInto(LibraryManager.library, LibraryNetHack);
