#include "hack.h"

void Web_init_nhwindows(int * argcp, char ** argv) 
{ }
void Web_player_selection() 
{ }
void Web_askname() 
{ }
void Web_get_nh_event() 
{ }
void Web_exit_nhwindows(const char * str) 
{ 
    // print str 
}
void Web_suspend_nhwindows(const char * str) 
{ }
void Web_resume_nhwindows() 
{ }
winid Web_create_nhwindow(int type) 
{ }
void Web_clear_nhwindow(winid window)
{ }
void Web_display_nhwindow(winid window, BOOLEAN_P blocking)
{ }
void Web_destroy_nhwindow(winid window)
{ }
void Web_curs(winid window, int x, int y)
{ }
void Web_putstr(winid window, int attr, const char* str)
{ }
void Web_display_file(const char * str, BOOLEAN_P complain)
{ }
void Web_start_menu(winid window)
{ }
void Web_add_menu(winid window, 
                  int glyph, 
                  const ANY_P * identifier, 
                  CHAR_P accelerator, 
                  CHAR_P groupacc, 
                  int attr, 
                  const char * str, 
                  BOOLEAN_P preselected)
{ }
void Web_end_menu(winid window, const char * prompt)
{ }
int Web_select_menu(winid window, int how, MENU_ITEM_P ** selected)
{ }
char Web_message_menu(CHAR_P let, int how, const char *mesg)
{ }
void Web_update_inventory()
{ }
void Web_mark_synch()
{ }
void Web_wait_synch()
{ }
#ifdef CLIPPING
void Web_cliparound(int x, int y)
{ }
#endif
#ifdef POSITIONBAR
void Web_update_positionbar(char * features)
{ }
#endif
void Web_print_glyph(winid window, XCHAR_P x, XCHAR_P y, int glyph)
{ }
void Web_raw_print(const char * str)
{ }
void Web_raw_print_bold(const char * str)
{ }
int Web_nhgetch()
{ }
int Web_nh_poskey(int * x, int * y, int * mod)
{ }
void Web_nhbell()
{ }
int Web_doprev_message()
{ }
char Web_yn_function(const char * ques, const char * choices, CHAR_P def)
{ }
void Web_getlin(const char * ques, char * input)
{ }
int Web_get_ext_cmd()
{ }
void Web_number_pad(int state)
{ }
void Web_delay_output()
{ }
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
void Web_outrip(winid window, int how) 
{ }
void Web_preference_update(const char * preference)
{ }

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

