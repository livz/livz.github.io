---
title:  "Hacking GNOME Minesweeper"
---

![Logo](/assets/images/mines/minesweeper.jpg)

## Context
First I would like to give credit to the author of the picture I've used above, taken from [pxleyes](http://www.pxleyes.com/photoshop-pictures/minesweeper/). It's awesome, thank you! :pray: 

After reading [Game Hacking: WinXP Minesweeper](https://0x00sec.org/t/game-hacking-winxp-minesweeper/1266) I realised I wanted to do something similar but on a Linux system. This would be a great opportunity for me to learn some new skills, like debuging stripped GTK applications or becoming a GDB ninja (not!) while doing something interesting all along and with potential applications outside this gaming area.

My goal in this post is to reverse engineer the GNOME Minesweeper game and locate relevant areas in memory to patch. As a bonus, let's make this as visually pleasing as possible! No pre-requisites are strictly necessary to follow along, but basic reversing knowledge and familiarity with GDB is always nice to have! Most important of course is a desire to learn. So let's begin. 

## Debugging GTK applications
To perform debugging and inspection of GTK applications, we have two quite stable options: [GTKInspector](https://wiki.gnome.org/Projects/GTK+/Inspector) and [gtkparasite](http://chipx86.github.io/gtkparasite/) (on which the GTKInspector is also based). I opted for the Parasite, which seems to be more established and has interesting features, like the ability to interact with GTK widgets from a Python shell, and apply CSS styles globally or individually per objects. A few things are neededt to quickly get it working:
* A
* b
* c

## Static analysis 

## Reverse engineering GTK 

## GDB Kung-Fu

## CSS beautification
