---
title: Chrome Disable Swipe Navigation
layout: tip
date: 2017-04-23
published: true
categories: [Internals]
---

## Overview

Google Chrome on MacOS implements backward/forward navigation in the browser history using *__two-finger swipe on the trackpad or Magic Mouse__*. This is enabled by default and you're probably already aware of it. Swipe navigation is very useful in general in other applications, but in Chrome I've noticed that I would _accidentally trigger it very often_, especially while scrolling through long text boxes, or when scrolling a bit sideways instead of completely vertical.

Luckily, this is very easy to fix:

```
$ defaults read com.google.Chrome AppleEnableSwipeNavigateWithScrolls
1
$ defaults write com.google.Chrome AppleEnableSwipeNavigateWithScrolls -bool FALSE
$ defaults read com.google.Chrome AppleEnableSwipeNavigateWithScrolls
0
```

I'm using a trackapd. For the Magic Mouse, the corresponding property to modify is ```AppleEnableMouseSwipeNavigateWithScrolls```.
