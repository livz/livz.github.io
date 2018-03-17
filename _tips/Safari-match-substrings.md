---
title: Safari Search For Substrings
layout: tip
date: 2016-04-22
---

## Overview

By default you've probably noticed that when you search for a string in a webpage, Safari matches strings that are _whole words_ or that _appeared at the beginnings of words_, but **_doesn't find them within words_**. You can easily change that behaviour by modifying the following property:
```
$ defaults read com.apple.Safari FindOnPageMatchesWordStartsOnly
1
$ defaults write com.apple.Safari FindOnPageMatchesWordStartsOnly -bool FALSE
$ defaults read com.apple.Safari FindOnPageMatchesWordStartsOnly
0
```
