---
title: Show Keychain Status In Menubar
layout: tip
date: 2017-05-20
---

## Overview

I like having the keychain icon in the status bar because it allows me to quickly lock the screen or the keychain itself:

![keychain-bar](/assets/images/tips/keychain-bar.png)

It's very simple to enable this:
1. Press the Spotlight Search button at the top right corner of the screen (or use **⌘ + Space**).
2. Search _Keychain Access_. 
3. In _Keychain Access_, open Preferences (**⌘ + ,**).
4. Check Show Status in Menu Bar option.

![keychain-show](/assets/images/tips/keychain-show.png)

Having that _Lock Screen_ menu item available, we can use an AppleScript to quickly lock the screen:

```bash
$ cat lock.applescript
tell application "System Events" to tell process "SystemUIServer"
    tell (menu bar item 1 of menu bar 1 where description is "Keychain menu extra")
        click
        click menu item "Lock Screen" of menu 1
    end tell
end tell

$ osascript lock.applescript
```

It's also possibe to assign a key combination to the execution of the script, which will be the subject of the next tip!
