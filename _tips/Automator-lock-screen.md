---
title: Keyboard Combo To Lock Screen
layout: tip
date: 2017-05-27
categories: [Security]
---

## Overview
   In the previous tips we've seen how to [lock the screen quickly using mouse only and _Hot Horners_]({% capture itemLink %}{% include findCollectionItem.html collectionName='tips' itemTitle='Quickly Lock The Machine With Mouse Only' %}{% endcapture %}{{ itemLink | strip_newlines }}) or [using the _Keychain Access_ menu]({% capture itemLink %}{% include findCollectionItem.html collectionName='tips' itemTitle='Show Keychain Status In Menubar' %}{% endcapture %}{{ itemLink | strip_newlines }}). Another quick option to do that is to assign a key combination to a script execution/ This could either be the same AppleScript we've seen before that clicks the _Lock Screen_ button or a different one. For variety, let's go for a different one.

The following very simple bash command can be used to put the display to sleep:
```bash
$ pmset displaysleepnow
```


To assign a global shortcut to this script I've used [Simple hotkey daemon for macOS](https://github.com/koekeishiya/skhd). Just add the following line to the config file _```~/.skhdrc```_:
```bash
shift + cmd - l: ~/scripts/sleep.sh
````

You'll now be able to use the **⇧ +  ⌘ + L (Shift + CMD + Capital L)** to lock the screen. So here you have 3 quick ways, there's no reason to leave your machine unlocked anymore:

1. [**Hot Horners**]({% capture itemLink %}{% include findCollectionItem.html collectionName='tips' itemTitle='Quickly Lock The Machine With Mouse Only' %}{% endcapture %}{{ itemLink | strip_newlines }})
2. [**Keychain Access**]({% capture itemLink %}{% include findCollectionItem.html collectionName='tips' itemTitle='Show Keychain Status In Menubar' %}{% endcapture %}{{ itemLink | strip_newlines }})
3. [**Global shortcut**]({% capture itemLink %}{% include findCollectionItem.html collectionName='tips' itemTitle='Keyboard Combo To Lock Screen' %}{% endcapture %}{{ itemLink | strip_newlines }})
