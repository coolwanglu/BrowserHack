#BrowserHack

NetHack ported to the Web by Lu Wang

[Start your adventure](http://coolwanglu.github.io/BrowserHack/)

![Screenshot](https://raw.githubusercontent.com/coolwanglu/BrowserHack/master/screenshot.png)

Most porting stuffs go to `win/web/*` and `web/*`.

To build the project, read and modify `build.sh` according to your environment, install dependencies, and use some good luck.

Only minimum features are supported while I'm rushing to make it work, but more features are coming.
Search for `TODO` in `win/web/*` and `web/*`.

Need help for game testing, implementing more features and designing the interface.

###Tilesets
- `Default_32.png`
  - The default tileset from vanilla NetHack 
  - http://nethackwiki.com/wiki/Default_tileset_scaled_to_32x32
- `DawnHack_32.png`
  - By DragonDePlatino
  - Creative Commons Attribution 3.0 License
  - http://dragondeplatino.deviantart.com/art/DawnHack-NetHack-3-4-3-UnNetHack-5-1-0-416312313
- `Absurd_32.png`
  - By John Shaw
  - http://nethackwiki.com/wiki/The_Absurd_NetHack_Tileset
- `Nevanda_32.png`
  - By Nevanda
  - http://nevanda.deviantart.com/art/nethack-tiles-32x32px-416691316

###How to apply my tileset?
Run this in your browser console:
`nethack.apply_tilset(tile_file_url, tile_width, tile_height)`

###Where is my favorite ASCII interface?
As a player of SuperZZT, yeah, I agree that ASCII is definitely important. But it might worth a separate port. Even if the characters are implemented as a special type of tilesets, you may not get the smooth input experience.

Checkout [nethack.alt.org (aka NAO)](http://alt.org/nethack/) where you can play the ASCII version online.
