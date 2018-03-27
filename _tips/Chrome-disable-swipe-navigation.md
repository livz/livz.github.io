---
title: Chrome Disable Swipe Navigation
layout: tip
date: 2017-04-23
published: false
---

## Overview

* Google Chrome on MacOS implements backward/forward navigation in the browser history using *__two-finger swipe__*.
* Swipe navigation is very useful in general in other applications, but in Chroem I've noticed that I would accidentally trigger it very often while scrolling through long text boxes


```
$ defaults read com.google.Chrome AppleEnableSwipeNavigateWithScrolls
1
$ defaults write com.google.Chrome AppleEnableSwipeNavigateWithScrolls -bool FALSE
$ defaults read com.google.Chrome AppleEnableSwipeNavigateWithScrolls
0
```
