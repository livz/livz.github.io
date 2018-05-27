---
title: Keyboard Combo To Lock Screen
layout: tip
date: 2017-05-27
categories: [Security]
---

## Overview

In the previous tips we've seen how to [lock the screen quickly using mouse only and _Hot Horners_]({{ site.baseurl }}-{{ site.tips | where: "title", "Quickly Lock The Machine With Mouse Only" }}) or [using the _Keychain Access_ menu](http://craftware.xyz/tips/Keychain-status-menubar.html). Another quick option to do that is to assign a key combination to a script execution/ This could either be the same AppleScript we've seen before that clicks the _Lock Screen_ button or a different one. For variety, let's go for a different one.

The following very simple bash command can be used to put the display to sleep:
```bash
$ pmset displaysleepnow
```


To assign a global shortcut to this script I've used [Simple hotkey daemon for macOS](https://github.com/koekeishiya/skhd). Just add the following line to the config file _```~/.skhdrc```_:
```bash
shift + cmd - l: ~/scripts/sleep.sh
````

You'll now be able to use the **⇧ +  ⌘ + L (Shift + CMD + Capital L)** to lock the screen. So here you have 3 quick ways, there's no reason to leave your machine unlocked anymore:

1. [**Hot Horners**](http://craftware.xyz/tips/Lock-machine-gestures.html)
2. [**Keychain Access**](http://craftware.xyz/tips/Keychain-status-menubar.html)
3. [**Global shortcut**](http://craftware.xyz/tips/Automator-lock-screen.html)
