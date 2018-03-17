---
title: Easier Navigation in Save/Open Dialogs
layout: tip
date: 2016-02-04
---

## Overview

These short tips are for easier navigation in Finder windows, and also in Save File/Open or the like dialogs.

* Go directly to a desired path: **CMD + Shift + G**
* Navigate up one folder: **CMD + UP**
* Show the current file path in the Status bar of the Finder window: **OPTION + CMD + P**
* Enable/Disable showing the current file path in the Title bar of the current window:
```
$ defaults read com.apple.finder _FXShowPosixPathInTitle
0
$ defaults write com.apple.finder _FXShowPosixPathInTitle -bool true; killall Finder
$ defaults read com.apple.finder _FXShowPosixPathInTitle
1
```
