---
title:  "Hacking GNOME Minesweeper"
---

![Logo](/assets/images/mines/minesweeper.jpg)

## Context
First I would like to give credit to the author of the picture I've used above, taken from [pxleyes](http://www.pxleyes.com/photoshop-pictures/minesweeper/). It's awesome, thank you! :pray: 

After reading [Game Hacking: WinXP Minesweeper](https://0x00sec.org/t/game-hacking-winxp-minesweeper/1266) I realised I wanted to do something similar but on a Linux system. This would be a great opportunity for me to learn some new skills, like debuging stripped GTK applications or becoming a GDB ninja (not!) while doing something interesting all along and with potential applications outside this gaming area.

My goal in this post is to reverse engineer the GNOME Minesweeper game and locate relevant areas in memory to patch. As a bonus, let's make this as visually pleasing as possible! No pre-requisites are strictly necessary to follow along, but basic reversing knowledge and familiarity with GDB is always nice to have! Most important of course is a desire to learn. So let's begin. 

## Debugging GTK applications
To perform debugging and inspection of GTK applications, we have two quite stable options: [GTKInspector](https://wiki.gnome.org/Projects/GTK+/Inspector) and [gtkparasite](http://chipx86.github.io/gtkparasite/) (on which the GTKInspector is also based). I opted for the Parasite, which seems to be more established and has interesting features, like the ability to interact with GTK widgets from a Python shell, and apply CSS styles globally or individually per objects. A few things are needed to quickly get it working:
* Download and install: 
```bash
$ git clone git://github.com/chipx86/gtkparasite
$ cd gtkparasite
$ ./autogen.sh --with-gtk=3.0
$ make
$ sudo make install
```

* Set the `GTK_modules` environment variable:
```bash
 export GTK_MODULES=gtkparasite:$GTK_MODULES
```

* Make sure the application to be debugged is built using GTK3, because gtkparasite [dropped support for GTK2](https://bbs.archlinux.org/viewtopic.php?id=160197). Check out which version of GTK `gnome-mines` was built against:
```bash
$ ldd `which gnome-mines` | grep gtk
    libgtk-3.so.0 => /usr/lib/x86_64-linux-gnu/libgtk-3.so.0 (0x00007f2dc7f18000)
```

* If you still get an error when trying to lunch GTK apps, make sure the libraries are placed in the correct location. The following applies for Ubuntu 16.04:
```bash
$ gnome-calculator                                  
Gtk-Message: Failed to load module "gtkparasite"
$ find / -name  "libgtkparasite*.so" 2>/dev/null
/home/liv/Downloads/gtkparasite/src/.libs/libgtkparasite.so
/usr/lib/x86_64-linux-gnu/gtk-3.0/modules/libgtkparasite.so
/usr/local/lib/gtk-3.0/modules/libgtkparasite.so
$ sudo cp /usr/local/lib/gtk-3.0/modules/libgtkparasite.so /usr/lib/x86_64-linux-gnu/gtk-3.0/modules
```

Now that `gtkparasire` is up and running, let's make sure we can perform some basic inspection of GUI widgets:
* If everything worked fine, when  launching the calculator (`gnome-calc`) you should also see also the gtk-parasite window.
* Use the magnifying glass to select the text box.
* In the right pane with the object's properties, double-click on the buffer's value. 
* Then navigate to the properties of `text` field and change it to whatever you like. Voila!
[![](/assets/images/mines/calc-small.png)](/assets/images/mines/calc.png)

## Static analysis 
To be able to mess with objects in memory, we need to understand the internals of Minesweeper first. Luckily, the source code is available [online](https://github.com/GNOME/gnome-mines). The goal for this section is to perform simple identification of data structures in memory, like obtaining the number of mines and details of the board (width, height) for example. Let's begin.

* From gtk-parasite we can see that the mine field is stored in a *MinefieldView* class. This will be the starting point. In the source code ([minefield.vala](https://github.com/GNOME/gnome-mines/blob/3190bf2afee96110ad15bb10016c10396d107830/src/minefield.vala) we see however that all the interesting fields are stored in a *minefield* class:
```c
public class Minefield : Object
{
    /* Size of map */
    public uint width = 0;
    public uint height = 0;

    /* Number of mines in map */
    public uint n_mines = 0;

    /* State of each location */
    protected Location[,] locations;
    [...]
```

* After a bit of poking around with IDA Pro, we find the link between the _MineFieldView_ object and the _minefield_ class. All the interesting funtions and classes below (e.g. MFView) have been renamed manually :
```c
__int64 __fastcall get_minefield(__int64 MFView)
{
  __int64 result; // rax@2

  if ( MFView )
    result = *(_QWORD *)(*(_QWORD *)(MFView + 0x30) + 0x28LL);
  else
    result = ERR_minefield_view_get_minefield();
  return result;
}
```

* That means that to obtain a pointer to the most important structure - _minefield_, we can perform the following steps in GDB using [convenience variables](https://sourceware.org/gdb/onlinedocs/gdb/Convenience-Vars.html):
```
gdb$ set $minefieldview = 0x816dd0
gdb$ set $minefield = *($minefieldview+0x30)+0x28
```

* Going further, let's locate where exactly in the _minefield_ structure we have the _width_, _height_ and _n_mines_ fields. for the sake of brevity I won't list all the steps to locate those fields, however, the minefield class looks like this:
```
00000000 minefield_class struc ; (sizeof=0x44, mappedto_9)
00000000 field_0         dd ?
00000004 field_4         dd ?
00000008 field_8         dd ?
0000000C field_C         dd ?
00000010 field_10        dd ?
00000014 field_14        dd ?
00000018 _n_cleared      dd ?
0000001C _n_flags        dd ?
00000020 width           dd ?
00000024 height          dd ?
00000028 n_mines         dd ?
0000002C field_2C        dd ?
00000030 locations       dd ?
00000034 field_34        dd ?
00000038 _paused         dd ?
0000003C field_3C        dd ?
00000040 exploded        dd ?
```

* Back in GDB, for an 8x8 table with 10 mines, we have:
```
set $width=*(*$minefield+0x20)
set $height=*(*$minefield+0x24)
set $n_mines=*(*$minefield+0x28)
gdb$ print $width
$1 = 0x8
gdb$ print $height
$2 = 0x8
gdb$ print $n_mines
$3 = 0xa

```

## GDB Kung-Fu
Using similar logic as before, we can map all the needed information related to the position of the mines. The _**has_mine**_ function :

```
public bool has_mine (uint x, uint y)
{
    return locations[x, y].has_mine
}
```    

set $x=1
set $y=1

set $has_mine_xy = *(*(*(*$minefield+0x30) +8*(*(*$minefield+0x3c)*$x+$y))+0x20)
print $has_mine_xy
$20 = 0x0


## CSS beautification
