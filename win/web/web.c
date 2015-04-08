#include "hack.h"

// this file will be compiled twice
// one with EMSCRIPTEN and one without
#ifndef EMSCRIPTEN
// the first pass, without EMSCRIPTEN, is for building data files
// this file is not actually used
// just define a dummy structure to make the linker happy
struct window_procs Web_procs;
#else
// the second pass, with EMSCRIPTEN
// is the real deal
#include <emscripten.h>

extern short glyph2tile[];
extern int total_tiles_used;

void Web_init(int max_tile);
void Web_init_nhwindows(int * argcp, char ** argv) { Web_init(total_tiles_used); }
void Web_player_selection() 
{ 
    /* return a random choice */
    flags.initrole = randrole();
    flags.initrace = randrace(flags.initrole);
    flags.initgend = randgend(flags.initrole, flags.initrace);
    flags.initalign = randalign(flags.initrole, flags.initrace);
}
void Web_askname_helper(char * buf, int len); // in JS
void Web_askname() { Web_askname_helper(plname, PL_NSIZ); }
void Web_get_nh_event() { emscripten_sleep(1); }
void Web_exit_nhwindows(const char * str) { }
void Web_suspend_nhwindows(const char * str) { }
void Web_resume_nhwindows() { }
winid Web_create_nhwindow(int type); // in JS
void Web_clear_nhwindow(winid window); // in JS
void Web_display_nhwindow(winid window, BOOLEAN_P blocking) { emscripten_sleep(1); }
void Web_destroy_nhwindow(winid window); // in JS
void Web_curs(winid window, int x, int y); // in JS
void Web_putstr(winid window, int attr, const char* str); // in JS
void Web_display_file(const char * str, BOOLEAN_P complain); // in JS
void Web_start_menu(winid window); // in JS
void Web_add_menu(winid window, 
                  int glyph, 
                  const ANY_P * identifier, 
                  CHAR_P accelerator, 
                  CHAR_P groupacc, 
                  int attr, 
                  const char * str, 
                  BOOLEAN_P preselected); // in JS
void Web_end_menu(winid window, const char * prompt); // in JS
int Web_get_menu_count(winid window); // in JS
int Web_select_menu_helper(winid window, int how, MENU_ITEM_P ** selected); // in JS
int Web_select_menu(winid window, int how, MENU_ITEM_P ** selected)
{
    *selected = (MENU_ITEM_P*)alloc(sizeof(MENU_ITEM_P) * Web_get_menu_count(window));
    int ret = Web_select_menu_helper(window, how, selected);
    if(ret <= 0) free(*selected);
    return ret;
}
char Web_message_menu(CHAR_P let, int how, const char *mesg) { return genl_message_menu(let, how, mesg); }
void Web_update_inventory() { display_inventory(NULL, FALSE); }
void Web_mark_synch() { emscripten_sleep(1); }
void Web_wait_synch() { emscripten_sleep(1); }
#ifdef CLIPPING
void Web_cliparound(int x, int y); // in JS
#endif
#ifdef POSITIONBAR
void Web_update_positionbar(char * features) { }
#endif
void Web_print_tile(winid window, XCHAR_P x, XCHAR_P y, int tile); // in JS
void Web_print_glyph(winid window, XCHAR_P x, XCHAR_P y, int glyph) { Web_print_tile(window, x, y, glyph2tile[glyph]); }
void Web_raw_print_helper(const char * str, BOOLEAN_P bold); // in JS
void Web_raw_print(const char * str) { Web_raw_print_helper(str, FALSE); }
void Web_raw_print_bold(const char * str) { Web_raw_print_helper(str, TRUE); }
int Web_keybuffer_empty(); // in JS
int Web_getch(); // in JS
int Web_nhgetch()
{ 
    while(Web_keybuffer_empty()) emscripten_sleep(10);
    return Web_getch();
}
int Web_mousebuffer_empty(); // in JS
void Web_save_mouse(int * x, int * y, int * mod); // in JS
int Web_nh_poskey(int * x, int * y, int * mod)
{ 
    while(Web_keybuffer_empty() && Web_mousebuffer_empty()) emscripten_sleep(10);
    if(!Web_keybuffer_empty()) return Web_getch();
    Web_save_mouse(x, y, mod);
    return 0;
}
void Web_nhbell() { }
int Web_doprev_message() { return 0; }
char Web_yn_function(const char * ques, const char * choices, CHAR_P def) // TODO
{ return def; }
void Web_getlin(const char * ques, char * input); // in JS
int Web_get_ext_cmd() // TODO
{ return -1; } 
void Web_number_pad(int state) { }
void Web_delay_output() { emscripten_sleep(50); }
#ifdef CHANGE_COLOR
void Web_change_color(int _1, long _2, int _3) { }
#ifdef MAC
void Web_change_background(int _) { }
short Web_set_font_name(winid _1, char * _2) { return 0; }
#endif
char * Web_get_color_string() { return ""; }
#endif
void Web_start_screen() { }
void Web_end_screen() { }
void Web_outrip(winid window, int how) // TODO
{ }
void Web_preference_update(const char * preference) { }

struct window_procs Web_procs = {
    "Web",
    0L, // wincap1
    0L, // wincap2
    Web_init_nhwindows,
    Web_player_selection,
    Web_askname,
    Web_get_nh_event,
    Web_exit_nhwindows,
    Web_suspend_nhwindows,
    Web_resume_nhwindows,
    Web_create_nhwindow,
    Web_clear_nhwindow,
    Web_display_nhwindow,
    Web_destroy_nhwindow,
    Web_curs,
    Web_putstr,
    Web_display_file,
    Web_start_menu,
    Web_add_menu,
    Web_end_menu,
    Web_select_menu,
    Web_message_menu,
    Web_update_inventory,
    Web_mark_synch,
    Web_wait_synch,
#ifdef CLIPPING
    Web_cliparound,
#endif
#ifdef POSITIONBAR
    Web_update_positionbar,
#endif
    Web_print_glyph,
    Web_raw_print,
    Web_raw_print_bold,
    Web_nhgetch,
    Web_nh_poskey,
    Web_nhbell,
    Web_doprev_message,
    Web_yn_function,
    Web_getlin,
    Web_get_ext_cmd,
    Web_number_pad,
    Web_delay_output,
#ifdef CHANGE_COLOR
    Web_change_color,
#ifdef MAC
    Web_change_background,
    Web_set_font_name,
#endif
    Web_get_color_string,
#endif
    Web_start_screen,
    Web_end_screen,
    Web_outrip,
    Web_preference_update
};

#endif //ifndef EMSCRIPTEN
