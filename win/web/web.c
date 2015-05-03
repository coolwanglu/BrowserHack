#include "hack.h"
#include "func_tab.h"

#include <emscripten.h>

extern short glyph2tile[];
extern int total_tiles_used;
extern const char *killed_by_prefix[];

// forward declaration
winid Web_create_nhwindow(int type);

void Web_init(int max_tile, int *win_message, int *win_status, int *win_map, int *win_inven);
void Web_init_nhwindows(int * argcp, char ** argv) 
{ 
    // in JS we treat ANY_P as integer
    if(sizeof(ANY_P) != 4) { EM_ASM( throw new Error('sizeof ANY_P is not 4!'); ); }
    if(sizeof(ANY_P) != sizeof(int)) { EM_ASM( throw new Error('sizeof ANY_P is not sizeof int!'); ); }
    if(sizeof(MENU_ITEM_P) != 8) { EM_ASM( throw new Error('sizeof MENU_ITEM_P is not 8!'); ); }
    Web_init(total_tiles_used, &WIN_MESSAGE, &WIN_STATUS, &WIN_MAP, &WIN_INVEN); 

    WIN_MESSAGE = Web_create_nhwindow(NHW_MESSAGE);
    iflags.window_inited = 1;
}
void Web_player_selection() 
{ 
    // based on tty port
	int i, k, n;
	char pick4u = 'n', thisch, lastch = 0;
	char pbuf[QBUFSZ], plbuf[QBUFSZ];
	winid win;
	anything any;
	menu_item *selected = 0;

	/* prevent an unnecessary prompt */
	rigid_role_checks();

	/* Should we randomly pick for the player? */
	if (!flags.randomall &&
	    (flags.initrole == ROLE_NONE || flags.initrace == ROLE_NONE ||
	     flags.initgend == ROLE_NONE || flags.initalign == ROLE_NONE)) {
	    char *prompt = build_plselection_prompt(pbuf, QBUFSZ, flags.initrole,
				flags.initrace, flags.initgend, flags.initalign);
        if(prompt != pbuf) {
          // this should not happen!
          pline("Error: prompt != pbuf in Web_player_selection!");
          Strcpy(pbuf, prompt);
          prompt = pbuf;
        }

        // remove the trailing " [ynq] "
        const char * suffix = " [ynq] ";
        int suffix_len = strlen(suffix);
        int prompt_len = strlen(prompt);
        if((prompt_len >= suffix_len) && !strcmp(prompt + prompt_len - suffix_len, suffix))
            *(prompt + prompt_len - suffix_len) = 0;

        pick4u = yn(prompt);
	}

	(void)  root_plselection_prompt(plbuf, QBUFSZ - 1,
			flags.initrole, flags.initrace, flags.initgend, flags.initalign);

	/* Select a role, if necessary */
	/* we'll try to be compatible with pre-selected race/gender/alignment,
	 * but may not succeed */
	if (flags.initrole < 0) {
	    char rolenamebuf[QBUFSZ];
	    /* Process the choice */
	    if (pick4u == 'y' || flags.initrole == ROLE_RANDOM || flags.randomall) {
            /* Pick a random role */
            flags.initrole = pick_role(flags.initrace, flags.initgend,
                            flags.initalign, PICK_RANDOM);
            if (flags.initrole < 0) {
                pline("Incompatible role!");
                flags.initrole = randrole();
            }
        } else {
            /* Prompt for a role */
            win = create_nhwindow(NHW_MENU);
            start_menu(win);
            any.a_void = 0;         /* zero out all bits */
            for (i = 0; roles[i].name.m; i++) {
                if (ok_role(i, flags.initrace, flags.initgend,
                            flags.initalign)) {
                    any.a_int = i+1;	/* must be non-zero */
                    thisch = lowc(roles[i].name.m[0]);
                    if (thisch == lastch) thisch = highc(thisch);
                    if (flags.initgend != ROLE_NONE && flags.initgend != ROLE_RANDOM) {
                        if (flags.initgend == 1  && roles[i].name.f)
                            Strcpy(rolenamebuf, roles[i].name.f);
                        else
                            Strcpy(rolenamebuf, roles[i].name.m);
                    } else {
                        if (roles[i].name.f) {
                            Strcpy(rolenamebuf, roles[i].name.m);
                            Strcat(rolenamebuf, "/");
                            Strcat(rolenamebuf, roles[i].name.f);
                        } else 
                            Strcpy(rolenamebuf, roles[i].name.m);
                    }	
                    add_menu(win, NO_GLYPH, &any, thisch,
                            0, ATR_NONE, an(rolenamebuf), MENU_UNSELECTED);
                    lastch = thisch;
                }
            }
            any.a_int = pick_role(flags.initrace, flags.initgend,
                    flags.initalign, PICK_RANDOM)+1;
            if (any.a_int == 0)	/* must be non-zero */
                any.a_int = randrole()+1;
            add_menu(win, NO_GLYPH, &any , '*', 0, ATR_NONE,
                    "Random", MENU_UNSELECTED);
            Sprintf(pbuf, "Pick a role for your %s", plbuf);
            end_menu(win, pbuf);

            while((n = select_menu(win, PICK_ONE, &selected)) != 1) { }
            destroy_nhwindow(win);

            /* Process the choice */
            flags.initrole = selected[0].item.a_int - 1;
            free((genericptr_t) selected),	selected = 0;
        }
        (void)  root_plselection_prompt(plbuf, QBUFSZ - 1,
            flags.initrole, flags.initrace, flags.initgend, flags.initalign);
	}
	
	/* Select a race, if necessary */
	/* force compatibility with role, try for compatibility with
	 * pre-selected gender/alignment */
	if (flags.initrace < 0 || !validrace(flags.initrole, flags.initrace)) {
	    /* pre-selected race not valid */
	    if (pick4u == 'y' || flags.initrace == ROLE_RANDOM || flags.randomall) {
            flags.initrace = pick_race(flags.initrole, flags.initgend,
                                flags.initalign, PICK_RANDOM);
            if (flags.initrace < 0) {
                pline("Incompatible race!");
                flags.initrace = randrace(flags.initrole);
            }
        } else {	/* pick4u == 'n' */
            /* Count the number of valid races */
            n = 0;	/* number valid */
            k = 0;	/* valid race */
            for (i = 0; races[i].noun; i++) {
                if (ok_race(flags.initrole, i, flags.initgend,
                                flags.initalign)) {
                    n++;
                    k = i;
                }
            }
            if (n == 0) {
                for (i = 0; races[i].noun; i++) {
                    if (validrace(flags.initrole, i)) {
                        n++;
                        k = i;
                    }
                }
            }

            /* Permit the user to pick, if there is more than one */
            if (n > 1) {
                win = create_nhwindow(NHW_MENU);
                start_menu(win);
                any.a_void = 0;         /* zero out all bits */
                for (i = 0; races[i].noun; i++)
                    if (ok_race(flags.initrole, i, flags.initgend,
                                    flags.initalign)) {
                        any.a_int = i+1;	/* must be non-zero */
                        add_menu(win, NO_GLYPH, &any, races[i].noun[0],
                        0, ATR_NONE, races[i].noun, MENU_UNSELECTED);
                    }
                any.a_int = pick_race(flags.initrole, flags.initgend,
                        flags.initalign, PICK_RANDOM)+1;
                if (any.a_int == 0)	/* must be non-zero */
                    any.a_int = randrace(flags.initrole)+1;
                add_menu(win, NO_GLYPH, &any , '*', 0, ATR_NONE,
                        "Random", MENU_UNSELECTED);
                Sprintf(pbuf, "Pick the race of your %s", plbuf);
                end_menu(win, pbuf);
                while((n = select_menu(win, PICK_ONE, &selected)) != 1) { }
                destroy_nhwindow(win);

                k = selected[0].item.a_int - 1;
                free((genericptr_t) selected),	selected = 0;
            }
            flags.initrace = k;
	    }
	    (void)  root_plselection_prompt(plbuf, QBUFSZ - 1,
			flags.initrole, flags.initrace, flags.initgend, flags.initalign);
	}

	/* Select a gender, if necessary */
	/* force compatibility with role/race, try for compatibility with
	 * pre-selected alignment */
	if (flags.initgend < 0 || !validgend(flags.initrole, flags.initrace,
						flags.initgend)) {
	    /* pre-selected gender not valid */
	    if (pick4u == 'y' || flags.initgend == ROLE_RANDOM || flags.randomall) {
            flags.initgend = pick_gend(flags.initrole, flags.initrace,
                            flags.initalign, PICK_RANDOM);
            if (flags.initgend < 0) {
                pline("Incompatible gender!");
                flags.initgend = randgend(flags.initrole, flags.initrace);
            }
        } else {	/* pick4u == 'n' */
            /* Count the number of valid genders */
            n = 0;	/* number valid */
            k = 0;	/* valid gender */
            for (i = 0; i < ROLE_GENDERS; i++) {
                if (ok_gend(flags.initrole, flags.initrace, i,
                                flags.initalign)) {
                    n++;
                    k = i;
                }
            }
            if (n == 0) {
                for (i = 0; i < ROLE_GENDERS; i++) {
                    if (validgend(flags.initrole, flags.initrace, i)) {
                        n++;
                        k = i;
                    }
                }
            }

            /* Permit the user to pick, if there is more than one */
            if (n > 1) {
                win = create_nhwindow(NHW_MENU);
                start_menu(win);
                any.a_void = 0;         /* zero out all bits */
                for (i = 0; i < ROLE_GENDERS; i++)
                    if (ok_gend(flags.initrole, flags.initrace, i,
                                        flags.initalign)) {
                        any.a_int = i+1;
                        add_menu(win, NO_GLYPH, &any, genders[i].adj[0],
                        0, ATR_NONE, genders[i].adj, MENU_UNSELECTED);
                    }
                any.a_int = pick_gend(flags.initrole, flags.initrace,
                            flags.initalign, PICK_RANDOM)+1;
                if (any.a_int == 0)	/* must be non-zero */
                    any.a_int = randgend(flags.initrole, flags.initrace)+1;
                add_menu(win, NO_GLYPH, &any , '*', 0, ATR_NONE,
                        "Random", MENU_UNSELECTED);
                Sprintf(pbuf, "Pick the gender of your %s", plbuf);
                end_menu(win, pbuf);
                while((n = select_menu(win, PICK_ONE, &selected)) != 1) { }
                destroy_nhwindow(win);

                k = selected[0].item.a_int - 1;
                free((genericptr_t) selected),	selected = 0;
            }
            flags.initgend = k;
        }
	    (void)  root_plselection_prompt(plbuf, QBUFSZ - 1,
			flags.initrole, flags.initrace, flags.initgend, flags.initalign);
	}

	/* Select an alignment, if necessary */
	/* force compatibility with role/race/gender */
	if (flags.initalign < 0 || !validalign(flags.initrole, flags.initrace,
							flags.initalign)) {
	    /* pre-selected alignment not valid */
	    if (pick4u == 'y' || flags.initalign == ROLE_RANDOM || flags.randomall) {
            flags.initalign = pick_align(flags.initrole, flags.initrace,
                                flags.initgend, PICK_RANDOM);
            if (flags.initalign < 0) {
                pline("Incompatible alignment!");
                flags.initalign = randalign(flags.initrole, flags.initrace);
            }
        } else {	/* pick4u == 'n' */
            /* Count the number of valid alignments */
            n = 0;	/* number valid */
            k = 0;	/* valid alignment */
            for (i = 0; i < ROLE_ALIGNS; i++) {
                if (ok_align(flags.initrole, flags.initrace, flags.initgend,
                                i)) {
                    n++;
                    k = i;
                }
            }
            if (n == 0) {
                for (i = 0; i < ROLE_ALIGNS; i++) {
                    if (validalign(flags.initrole, flags.initrace, i)) {
                        n++;
                        k = i;
                    }
                }
            }

            /* Permit the user to pick, if there is more than one */
            if (n > 1) {
                win = create_nhwindow(NHW_MENU);
                start_menu(win);
                any.a_void = 0;         /* zero out all bits */
                for (i = 0; i < ROLE_ALIGNS; i++)
                if (ok_align(flags.initrole, flags.initrace,
                                flags.initgend, i)) {
                    any.a_int = i+1;
                    add_menu(win, NO_GLYPH, &any, aligns[i].adj[0],
                     0, ATR_NONE, aligns[i].adj, MENU_UNSELECTED);
                }
                any.a_int = pick_align(flags.initrole, flags.initrace,
                            flags.initgend, PICK_RANDOM)+1;
                if (any.a_int == 0)	/* must be non-zero */
                    any.a_int = randalign(flags.initrole, flags.initrace)+1;
                add_menu(win, NO_GLYPH, &any , '*', 0, ATR_NONE,
                        "Random", MENU_UNSELECTED);
                Sprintf(pbuf, "Pick the alignment of your %s", plbuf);
                end_menu(win, pbuf);
                while((n = select_menu(win, PICK_ONE, &selected)) != 1) { }
                destroy_nhwindow(win);

                k = selected[0].item.a_int - 1;
                free((genericptr_t) selected),	selected = 0;
            }
            flags.initalign = k;
	    }
	}
	/* Success! */
}
void Web_askname_helper(char * buf, int len); // in JS
void Web_askname() { Web_askname_helper(plname, PL_NSIZ); }
void Web_get_nh_event() { emscripten_sleep(1); }
void Web_exit_nhwindows(const char * str) { }
void Web_suspend_nhwindows(const char * str) { }
void Web_resume_nhwindows() { }
winid Web_create_nhwindow(int type); // in JS
void Web_clear_nhwindow(winid window); // in JS
void Web_display_nhwindow(winid window, BOOLEAN_P blocking); // in JS
void Web_destroy_nhwindow(winid window); // in JS
void Web_curs(winid window, int x, int y); // in JS
void Web_putstr(winid window, int attr, const char* str); // in JS
void Web_display_file(const char * str, BOOLEAN_P complain); // in JS
void Web_start_menu(winid window); // in JS
void Web_add_menu_helper(winid window, 
                  int tile, 
                  const ANY_P * identifier, 
                  CHAR_P accelerator, 
                  CHAR_P groupacc, 
                  int attr, 
                  const char * str, 
                  BOOLEAN_P preselected); // in JS
void Web_add_menu(winid window, 
                  int glyph, 
                  const ANY_P * identifier, 
                  CHAR_P accelerator, 
                  CHAR_P groupacc, 
                  int attr, 
                  const char * str, 
                  BOOLEAN_P preselected)
{
    Web_add_menu_helper(window, 
                       ((glyph == NO_GLYPH) ? (-1) : glyph2tile[glyph]),
                       identifier,
                       accelerator,
                       groupacc,
                       attr,
                       str,
                       preselected);
}
void Web_end_menu(winid window, const char * prompt); // in JS
int Web_select_menu(winid window, int how, MENU_ITEM_P ** selected); // in JS
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
void Web_print_tile(winid window, XCHAR_P x, XCHAR_P y, int tile, int is_pet); // in JS
void Web_print_glyph(winid window, XCHAR_P x, XCHAR_P y, int glyph) 
{ 
    Web_print_tile(window, x, y, 
                   glyph2tile[glyph], 
                   (glyph_is_pet(glyph) && iflags.wc_hilite_pet)); 
}
void Web_raw_print(const char * str) { puts(str); }
void Web_raw_print_bold(const char * str) { puts(str); }
int Web_nhgetch(void); // in JS;
int Web_mousebuffer_empty(void); // in JS
int Web_nh_poskey(int * x, int * y, int * mod); // in JS
void Web_nhbell() { }
int Web_doprev_message() { return 0; }
char Web_yn_function(const char * ques, const char * choices, CHAR_P def); // in JS
void Web_getlin(const char * ques, char * input); // in JS
int Web_get_ext_cmd_helper(const char ** command_list, int num_commands); // in JS
int Web_get_ext_cmd()
{ 
    // from X11 port
    int num_commands;
    const char **command_list;

    /* count commands */
    for (num_commands = 0; extcmdlist[num_commands].ef_txt; num_commands++)
    { }	/* do nothing */

    command_list = (const char **) alloc((unsigned)num_commands * sizeof(char *));

    for (int i = 0; i < num_commands; i++)
        command_list[i] = extcmdlist[i].ef_txt;

    int ret = Web_get_ext_cmd_helper(command_list, num_commands);
    free(command_list);
    return ret;
} 
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
void Web_outrip_helper(char **lines, int line_count); // in JS
void Web_outrip(winid window, int how)
{
    // Code from X11 windowport
#define STONE_LINE_LEN 16    /* # chars that fit on one line */
#define NAME_LINE 0	/* line # for player name */
#define GOLD_LINE 1	/* line # for amount of gold */
#define DEATH_LINE 2	/* line # for death description */
#define YEAR_LINE 6	/* line # for year */

    static char** rip_line=0;
    if (!rip_line) {
        rip_line = (char**)malloc(sizeof(char*) * (YEAR_LINE+1));
        for (int i=0; i<YEAR_LINE+1; i++) {
            rip_line[i]=(char*)malloc(sizeof(char) * STONE_LINE_LEN+1);
        }
    }

    /* Follows same algorithm as genl_outrip() */
    char buf[BUFSZ];
    char *dpx;
    int line;

    /* Put name on stone */
    Sprintf(rip_line[NAME_LINE], "%s", plname);

    /* Put $ on stone */
#ifndef GOLDOBJ
    Sprintf(rip_line[GOLD_LINE], "%ld Au", u.ugold);
#else
    Sprintf(rip_line[GOLD_LINE], "%ld Au", done_money);
#endif

    /* Put together death description */
    switch (killer_format) {
	default: impossible("bad killer format?");
	case KILLED_BY_AN:
	    Strcpy(buf, killed_by_prefix[how]);
	    Strcat(buf, an(killer));
	    break;
	case KILLED_BY:
	    Strcpy(buf, killed_by_prefix[how]);
	    Strcat(buf, killer);
	    break;
	case NO_KILLER_PREFIX:
	    Strcpy(buf, killer);
	    break;
    }

    /* Put death type on stone */
    for (line=DEATH_LINE, dpx = buf; line<YEAR_LINE; line++) {
        register int i,i0;
        char tmpchar;

        if ( (i0=strlen(dpx)) > STONE_LINE_LEN) {
            for(i = STONE_LINE_LEN;
            ((i0 > STONE_LINE_LEN) && i); i--)
            if(dpx[i] == ' ') i0 = i;
            if(!i) i0 = STONE_LINE_LEN;
        }
        tmpchar = dpx[i0];
        dpx[i0] = 0;
        strcpy(rip_line[line], dpx);
        if (tmpchar != ' ') {
            dpx[i0] = tmpchar;
            dpx= &dpx[i0];
        } else  dpx= &dpx[i0+1];
    }

    /* Put year on stone */
    Sprintf(rip_line[YEAR_LINE], "%4d", getyear());

    Web_outrip_helper(rip_line,YEAR_LINE+1);
}
void Web_preference_update(const char * preference) { }

struct window_procs Web_procs = {
    "Web",
    WC_HILITE_PET | WC_MOUSE_SUPPORT,
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
