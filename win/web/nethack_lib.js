/* vim: set sw=2 ts=2 et ft=javascript */
// Copyright (c) 2015 Lu Wang <coolwanglu@gmail.com>
var LibraryNetHack = {
  $nethack__deps: ['$EmterpreterAsync'],
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

    // for localStorage
    LS_UI_PREFERENCES: 'BrowserHack_UI_Preferences',
    LS_OPTIONS: 'BrowserHack_Options',

    apply_tileset: function(tile_file, tile_width, tile_height) {
      var tile_per_row = 40;

      nethack.tile_file = tile_file;
      nethack.tile_width = tile_width;
      nethack.tile_height = tile_height;

      // generate styles
      var css_string = [];
      css_string.push('.tile{width:' + tile_width + 'px;height:' + tile_height + 'px;background-image:url(\'' + tile_file + '\');background-repeat:no-repeat;position:absolute;}');
      for(var i = 0; i < nethack.max_tile; ++i) {
        css_string.push('.tile' + i.toString(16) + '{background-position:' + -((i % tile_per_row) * tile_width) + 'px '+ -(((i / tile_per_row)|0) * tile_height) + 'px;}');
      }

      // remove old styles
      var ele = document.getElementById('browserhack-tileset-style');
      if(ele) ele.parentNode.removeChild(ele);

      // enable the styles
      var style = document.createElement('style');
      style.id = 'browserhack-tileset-style';
      style.type = 'text/css';
      style.innerHTML = css_string.join('\n');
      document.getElementsByTagName('head')[0].appendChild(style);

      // move existing tiles
      if(nethack.maptiles) {
        for(var x = 0; x < nethack.maptiles.length; ++x) {
          var col = nethack.maptiles[x];
          if(col) {
            for(var y = 0; y < col.length; ++y) {
              if(col[y]) {
                var cell = col[y];
                cell.style.left = x * nethack.tile_width + 'px';
                cell.style.top = y * nethack.tile_height + 'px';
              }
            }
          }
        }
      }         
    },

    create_text_element: function(attr, str) {
      var ele = document.createElement('p');
      ele.textContent = str;
      switch(attr) {
        case nethack.ATR_NONE:
        case nethack.ATR_INVERSE: // inversed are usually for headers, we handle them ourselves
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
              nethack.hide_window(win_e);
              if(onclose) onclose();
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

    show_text_window: function(lines, callback, auto_remove) {
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
          if(auto_remove) win.parentNode.removeChild(win);
          callback();
        }
      });
      nethack.show_window(win);

      return win;
    },

    show_menu_window: function(items, title, how, selected_pp, resume_callback) {
      var menu_items = [];
      var save_menu_selection = function() {
        var selections = [];
        menu_items.forEach(function(item) {
          if(item.classList.contains('active')) {
            var id = parseInt(item.getAttribute('data-identifier'));
            assert(!isNaN(id));
            selections.push(id);
          }
        });
        menu_items = [];

        // allocate memory inside emterpreter resume !
        resume_callback(function() {
          if(selections.length > 0) {
            var selected_p = _malloc(selections.length * 8); // sizeof(MENU_ITEM_P) == 8
            for(var i = 0; i < selections.length; ++i) {
              // id
              {{{ makeSetValue('selected_p', 'i*8', 'selections[i]', 'i32') }}};
              // count TODO
              {{{ makeSetValue('selected_p', 'i*8+4', '-1', 'i32') }}};
            }

            {{{ makeSetValue('selected_pp', 0, 'selected_p', 'i32') }}};
          } else {
            {{{ makeSetValue('selected_pp', 0, '0', 'i32') }}};
          }

          return selections.length;
        });
      };

      // event handlers
      var select_one = function(e) {
        e.currentTarget.classList.add('active');
        save_menu_selection();
        nethack.hide_window(win);
      };
      var toggle_one = function(e) {
        e.currentTarget.classList.toggle('active');
      };

      // build menu window
      var win = nethack.create_window({
        title: title,
        make_body: function(body) {
          var ele = document.createElement('div');
          ele.className = 'container modal-content-wrapper';
            var list = document.createElement('div');
            list.className = 'list-group';
            items.forEach(function(item) {
              var li = document.createElement('a');
              li.href = '#';
              li.className = 'list-group-item';
              if(item.preselected) li.className += ' active';
              li.appendChild(nethack.create_text_element(item.attr, item.str));
              li.setAttribute('data-identifier', item.identifier);
              if(item.identifier != 0) {
                if(how == nethack.PICK_ONE) {
                  li.addEventListener('click', select_one);
                } else if (how == nethack.PICK_ANY) {
                  li.addEventListener('click', toggle_one);
                } else if (how == nethack.PICK_NONE) {
                   // do nothing
                } else {
                  console.log('ERR, unknown `how` for select_menu');
                }
              }
              menu_items.push(li);
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
              nethack.hide_window(win);
            });
            body.appendChild(button_e);
          }
        },
        onclose: function() { 
          resume_callback(function() { return -1; });
        } 
      });
      nethack.show_window(win);

      return win;
    },

    create_inventory_element: function(item) {
      var ele = document.createElement('span');
      ele.className = 'inventory-item';
      if( item.str.indexOf('(wielded)') > -1 
         || item.str.indexOf('(in quiver)') > -1 
         || item.str.indexOf('(weapon in hand)') > -1 
         || item.str.indexOf('(weapon in hands)') > -1 
         || item.str.indexOf('(on left hand)') > -1 
         || item.str.indexOf('(on right hand)') > -1 
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
      
      ++nethack.window_pending;
      setTimeout(function() {
        ele.classList.add('in');
      },1);
    },

    hide_window: function(ele) {
      --nethack.window_pending;
      ele.classList.remove('in');
    },

    update_map_cursor: function(x, y) {
      if(nethack.map_cursor_ele.parentNode)
        nethack.map_cursor_ele.parentNode.removeChild(nethack.map_cursor_ele);

      if(!nethack.maptiles[x]) return;
      if(!nethack.maptiles[x][y]) return;

      nethack.maptiles[x][y].appendChild(nethack.map_cursor_ele);
    },

    toggle_fullscreen: function() {
      nethack.main_win.classList.toggle('fullscreen');
      nethack.recenter_map();
    },

    toggle_zoom: function() {
      nethack.main_win.classList.toggle('zoomed-out');
      nethack.recenter_map();
    },

    recenter_map: function() {
      var center_x = (nethack.map_center_x + 0.5) * nethack.tile_width;
      var center_y = (nethack.map_center_y + 0.5) * nethack.tile_height;
      if(nethack.ui_preferences.zoom_out) {
        center_x /= 2;
        center_y /= 2;
      }
      var left = (-center_x + nethack.map_win.offsetWidth / 2);
      var top = (-center_y + nethack.map_win.offsetHeight / 2);
      nethack.map_win_content.style.left = left + 'px';
      nethack.map_win_content.style.top = top + 'px';
    },

    save_ui_preferences: function() {
      if(typeof localStorage !== 'undefined')
        localStorage[nethack.LS_UI_PREFERENCES] = JSON.stringify(nethack.ui_preferences);
    },

    _: null
  },

  Web_init: function(max_tile, win_message_p, win_status_p, win_map_p, win_inven_p, yn_number_p) {
    document.getElementById('browserhack-loading').style.display = 'none';

    // pointer to global variables
    nethack.win_message_p = win_message_p;
    nethack.win_status_p = win_status_p;
    nethack.win_map_p = win_map_p;
    nethack.win_inven_p = win_inven_p;
    nethack.yn_number_p = yn_number_p;

    nethack.max_tile = max_tile;
    nethack.map_center_x = 0;
    nethack.map_center_y = 0;
    nethack.windows = [];
    nethack.maptiles = [];

    // input buffers
    nethack.keybuffer = [];
    nethack.mousebuffer = [];
    nethack.window_pending = 0;

    // commonly used elements
    nethack.main_win = document.getElementById('browserhack-main');
    nethack.map_win = document.getElementById('browserhack-map');
    nethack.map_win_content = document.getElementById('browserhack-map-content');
    nethack.map_win_overlay = document.getElementById('browserhack-map-overlay');
    nethack.message_win = document.getElementById('browserhack-message');
    nethack.status_win = document.getElementById('browserhack-status');
    nethack.inventory_win = document.getElementById('browserhack-inventory');
    nethack.input_area = document.getElementById('browserhack-input-area');
    nethack.replay_btn = document.getElementById('browserhack-replay-btn');

    nethack.map_cursor_ele = document.createElement('div');
    nethack.map_cursor_ele.className = 'map-cursor';

    // input handlers
    document.addEventListener('keypress', function(e) {
      if(nethack.options_dialog) { // editing user options
        // do nothing
      } else if(nethack.pending_ext_cmd_arg) { // waiting for an ext command
        // do nothing
      } else if(nethack.pending_yn_arg) { // pending a yn question
        var key = e.charCode;
        var choices = nethack.pending_yn_arg.choices;
        var ch = String.fromCharCode(key); 
        var yn_result = null;
        if(choices == '') { // accept any 
          yn_result = ch;
        } else {
          ch = ch.toLowerCase();
          if(key == 27) { // ESC
            yn_result = (choices.indexOf('q') > -1) ? 'q'
                         : (choices.indexOf('n') > -1) ? 'n'
                         : nethack.pending_yn_arg.def;
          } else if (' \n\r'.indexOf(ch) > -1) {
            yn_result = nethack.pending_yn_arg.def;
          } else if (choices.indexOf(ch) > -1) {
            if (ch == '#') {
              var num = NaN;
              while(isNan(num)) num = parseInt(window.prompt('Enter a number'));
              {{{ makeSetValue('nethack.yn_number_p', '0', 'num', 'i32'); }}};
            }
            yn_result = ch;
          }
        }
        if (yn_result != null) {
          e.preventDefault();
          nethack.input_area.classList.remove('in');
          var resume_callback = nethack.pending_yn_arg.resume_callback;
          nethack.pending_yn_arg = null;
          resume_callback(function() {
            return yn_result.charCodeAt(0);
          });
        }
      } else if (nethack.window_pending) { // text window etc
        // do nothing
      } else {
        e.preventDefault();
        var code = e.charCode;
        if(e.ctrlKey) {
          // some browsers do not `apply` the control key to charCode
          if((code >= 65) && (code <= 90)) { // A~Z
            code = code - 64;
          } else if ((code >= 97) && (code <= 122)) {
            code = code - 96;
          }
        }
        nethack.keybuffer.push(code);
      }
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

    // ui logics
    nethack.ui_preferences = {};
    if(typeof localStorage !== 'undefined') {
      try {
        nethack.ui_preferences = JSON.parse(localStorage[nethack.LS_UI_PREFERENCES]) || {};
      } catch(e) { }
    }

    document.getElementById('browserhack-replay-btn').addEventListener('click', function() { window.location.reload(); });

    nethack.builtin_tilesets = [
        { file: 'Default_32.png', width: 32, height: 32 },
        { file: 'DawnHack_32.png', width: 32, height: 32 },
        { file: 'Absurd_32.png', width: 32, height: 32 },
        { file: 'Nevanda_32.png', width: 32, height: 32 },
        { file: 'Geoduck_40x24.png', width: 24, height: 40 }
    ];

    if(!nethack.ui_preferences.tileset)
        nethack.ui_preferences.tileset = nethack.builtin_tilesets[0];

    nethack.apply_tileset(
      nethack.ui_preferences.tileset.file,
      nethack.ui_preferences.tileset.width,
      nethack.ui_preferences.tileset.height
    );

    var btn_toggle_tileset = document.getElementById('browserhack-toggle-tileset');
    btn_toggle_tileset.addEventListener('click', function() {
      var i;
      for(i = 0; i < nethack.builtin_tilesets.length; ++i)
        if(nethack.builtin_tilesets[i].file == nethack.tile_file)
          break;
      if(i == nethack.builtin_tilesets.length) i = 0; // use default if current is not builtin
      else i = (i+1) % nethack.builtin_tilesets.length;

      var next_tileset = nethack.builtin_tilesets[i];
      nethack.ui_preferences.tileset = next_tileset;
      nethack.save_ui_preferences();
      nethack.apply_tileset(next_tileset.file, next_tileset.width, next_tileset.height);
    });

    var btn_toggle_zoom = document.getElementById('browserhack-toggle-zoom');
    btn_toggle_zoom.addEventListener('click', function() {
      // set ui preferences first, toggle_zoom will need the current value (in recenter_map())
      nethack.ui_preferences.zoom_out = !nethack.ui_preferences.zoom_out;
      nethack.save_ui_preferences();

      nethack.toggle_zoom();
    });
    if(nethack.ui_preferences.zoom_out) { nethack.toggle_zoom(); }

    var btn_toggle_fullscreen = document.getElementById('browserhack-toggle-fullscreen');
    btn_toggle_fullscreen.addEventListener('click', function() {
      // set ui preferences first, toggle_fullscreen will need the current value (in recenter_map())
      nethack.ui_preferences.fullscreen = !nethack.ui_preferences.fullscreen;
      nethack.save_ui_preferences();

      nethack.toggle_fullscreen();
    });

    if(nethack.ui_preferences.fullscreen) { nethack.toggle_fullscreen(); }

    var btn_options = document.getElementById('browserhack-options');
    if(typeof localStorage === 'undefined') {
      btn_options.style.display = 'none';
    } else {
      // try to load user .nethackrc 
      var textarea = document.createElement('textarea');
      textarea.className = 'form-control';
      textarea.rows = '20';
      textarea.value = localStorage[nethack.LS_OPTIONS] || '';
      btn_options.addEventListener('click', function() {
        if(!nethack.options_dialog) {
          nethack.options_dialog = nethack.create_window({
            make_body: function(body) {
              body.appendChild(textarea);
            },
            onclose: function() {
              localStorage[nethack.LS_OPTIONS] = textarea.value;
              nethack.options_dialog.parentNode.removeChild(nethack.options_dialog);
              nethack.options_dialog = null;
            }
          });
          nethack.show_window(nethack.options_dialog);
        }
      });
    }

    nethack.save_ui_preferences();
  },

  Web_askname_helper: function(buf, len) {
    var last_name = nethack.ui_preferences.player_name || '';
    var str = window.prompt('Who are you?', last_name) || 'Unnamed Player';
    nethack.ui_preferences.player_name = str;
    nethack.save_ui_preferences();
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
        var last_child = nethack.message_win.lastChild;
        if(!(last_child && (last_child.tagName == 'BR')))
          nethack.message_win.appendChild(document.createElement('br'));
        nethack.message_win.scrollTop = nethack.message_win.scrollHeight;
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

  Web_display_nhwindow: function(win, blocking) {
    return EmterpreterAsync.handle(function(emterpreter_resume) {
      var async = false;
      win = nethack.windows[win];
      assert(win);
      switch(win.type) {
        case nethack.NHW_MAP:
        case nethack.NHW_STATUS:
        case nethack.NHW_MESSAGE:
          break;
        case nethack.NHW_TEXT:
          win.element_to_remove = nethack.show_text_window(win.lines, emterpreter_resume);
          async = true;
          break;
        case nethack.NHW_MENU:
          if(!blocking) console.log('TODO windows are always blocking');
          if(win.lines) {
            win.element_to_remove = nethack.show_text_window(win.lines, emterpreter_resume);
            async = true;
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
      if(!async) setTimeout(emterpreter_resume, 1);
    });
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
    win.curs_x = x;
    win.curs_y = y;
    switch(win.type) {
      case nethack.NHW_MAP:
        nethack.update_map_cursor(x, y);
        break;
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
        // there are only 2 lines in the status windows
        if(nethack.status_win.childNodes.length >= 2) nethack.status_win.innerHTML = '';
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

  Web_display_file: function(str, complain) {
    return EmterpreterAsync.handle(function(emterpreter_resume) {
      fn = Pointer_stringify(str);
      var data = '';
      try {
        data = FS.readFile(fn, { encoding: 'utf8' });
        data = UTF8ArrayToString(data, 0) 
      } catch (e) {
        if (!complain) {
          setTimeout(emterpreter_resume, 1);
          return;
        }
        data = 'File not found: ' + fn;
      }
      nethack.show_text_window([{ attr:nethack.ATR_NONE, str:data }], emterpreter_resume, true);
    });
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

  Web_select_menu: function(win, how, selected_pp) {
    return EmterpreterAsync.handle(function(emterpreter_resume) {
      var async = false;
      win = nethack.windows[win];
      assert(win);
      assert(win.menu);
      switch(win.type) {
        case nethack.NHW_MENU:
          if((win.id == {{{ makeGetValue('nethack.win_inven_p', '0', 'i32') }}}) && (how == nethack.PICK_NONE)) {
            nethack.update_inventory_window(win.menu);
          } else {
            win.element_to_remove = nethack.show_menu_window(win.menu, win.menu_prompt, how, selected_pp, emterpreter_resume);
            async = true;
          }
          break;
        default:
          console.log(win.type, 'ERROR: select_menu called on a non-menu window');
      }
      if(!async) setTimeout(function() {
        emterpreter_resume(function() { return -1; });
      }, 1);
    });
  },

  Web_cliparound: function(x, y) {
    nethack.map_center_x = x;
    nethack.map_center_y = y;
    nethack.recenter_map();
  },

  Web_print_tile: function(win, x, y, tile, is_pet) {
    win = nethack.windows[win];
    assert(win);
    assert(win.type == nethack.NHW_MAP);
    if(win.id != {{{ makeGetValue('nethack.win_map_p', '0', 'i32') }}}) console.log('TODO: extra map window');
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
    var tile_ele = nethack.maptiles[x][y];
    tile_ele.className = 'tile tile' + tile.toString(16);
    tile_ele.innerHTML = '';
    if(is_pet) {
      var pet_icon_ele = document.createElement('div');
      pet_icon_ele.className = 'glyphicon glyphicon-heart pet-icon';
      tile_ele.appendChild(pet_icon_ele);
    }
    if((x == win.curs_x) && (y == win.curs_y)) nethack.update_map_cursor(x, y);
  },

  Web_keybuffer_empty: function() { return nethack.keybuffer.length == 0; },
  Web_mousebuffer_empty: function() { return nethack.mousebuffer.length == 0; },
  Web_getch: function() { 
      // for keyboard events we enable the animation on the map
      nethack.map_win_content.classList.add('smooth-scrolling');
      return nethack.keybuffer.pop(0); 
  },
  Web_save_mouse: function(x, y, mod) {
    // for mouse events we disable the animation on the map
    nethack.map_win_content.classList.remove('smooth-scrolling');
    var e = nethack.mousebuffer.pop(0);
    {{{ makeSetValue('x', 0, 'e.x', 'i32') }}};
    {{{ makeSetValue('y', 0, 'e.y', 'i32') }}};
    {{{ makeSetValue('mod', 0, 'e.mod', 'i32') }}};
  },

  Web_yn_function: function(ques, choices, def) {
    return EmterpreterAsync.handle(function(emterpreter_resume) {
      ques = Pointer_stringify(ques);
      choices = Pointer_stringify(choices);   
      def = String.fromCharCode(def & 0xff);

      var i = choices.indexOf(String.fromCharCode(27)); //ESC
      if(i > -1) choices = choices.substr(0, i);

      var yn_area_text = ques;
      if(choices != '') yn_area_text += ' [' + choices + ']';
      nethack.input_area.textContent = yn_area_text;
      nethack.input_area.classList.add('in');

      nethack.pending_yn_arg = {
        ques: ques,
        choices: choices,
        def: def,
        resume_callback: emterpreter_resume
      };
    });
  },

  Web_getlin: function(quest, input) {
    str = window.prompt(Pointer_stringify(quest)) || '';
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
        
    nethack.map_win_overlay.classList.add('rip');
  },

  Web_get_ext_cmd_helper: function(commands, command_count) {
    return EmterpreterAsync.handle(function(emterpreter_resume) {
      var cmds = [];
      for(var i = 0; i < command_count; ++i) 
        cmds.push(Pointer_stringify({{{ makeGetValue('commands', 'i*4', 'i32'); }}}));
      nethack.pending_ext_cmd_arg = {
        cmds: cmds,
        resume_callback: emterpreter_resume
      };

      nethack.input_area.innerHTML = '';
      var label = document.createElement('label');
      label.textContent = '#';
      nethack.input_area.appendChild(label);
      var input = document.createElement('input');
      input.type = 'text';

      var done = false;
      var select_ext_cmd = function(cmd) {
        if(done) return; // prevent select_ext_cmd from being called twice (once via enter & once via onblur)
        done = true;

        assert(nethack.pending_ext_cmd_arg);
        nethack.input_area.classList.remove('in');
        var cmd_idx = nethack.pending_ext_cmd_arg.cmds.indexOf(cmd);
        if((cmd_idx == -1) && (cmd != ''))
          nethack.add_message(nethack.message_win, nethack.ATR_NONE, 'Unknown extended command: ' + cmd);
        var resume_callback = nethack.pending_ext_cmd_arg.resume_callback;
        nethack.pending_ext_cmd_arg = null;
        
        resume_callback(function() { return cmd_idx; });
      };
      input.addEventListener('keyup', function(e) {
        if(e.keyCode == 13) { // Enter
          e.preventDefault();
          select_ext_cmd(input.value);
        } else if (e.keyCode == 27) { // ESC
          e.preventDefault();
          select_ext_cmd('');
        } else if (e.keyCode == 9) { // Tab
          // prevent losing focus
          e.preventDefault();
        }
      });
      input.addEventListener('blur', function(e) {
        select_ext_cmd('');
      });
      nethack.input_area.appendChild(input);
      nethack.input_area.classList.add('in');
      input.focus();
    });
  },

  nethack_exit: function(status) {
    nethack.map_win_overlay.classList.add('in');
    nethack.map_win_overlay.classList.add('exited');
    nethack.replay_btn.focus();
    // emscripten_force_exit
    Module['noExitRuntime'] = false;
    Module['exit'](status);
  },

  _: null
};
autoAddDeps(LibraryNetHack, '$nethack');
mergeInto(LibraryManager.library, LibraryNetHack);
