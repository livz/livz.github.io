---
title: Change Folders Color Tags
layout: tip
date: 2017-03-04
categories: [UX]
---

## Overview

For better organisation and retrieval, we can tag individual files and folders. Let's see two ways to do this:

* **From the GUI** - to add multiple tags at once using OS X Finder, select the items you want to tag and click **_Edit Tags_** icon in Finder bar:

<img src="/assets/images/tips/tags.png" alt="tags" class="figure-body">

* **From the console** - for brevity I'll show only how to read tags, to see that it's possible. If interested, there are good resources online showing how to set tags programatically using *bash* or *AppleScript* scripts:

```bash
$ xattr -px com.apple.metadata:_kMDItemUserTags tags.png
62 70 6C 69 73 74 30 30 A1 01 55 52 65 64 0A 36
08 0A 00 00 00 00 00 00 01 01 00 00 00 00 00 00
00 02 00 00 00 00 00 00 00 00 00 00 00 00 00 00
00 10

$ mdls -raw -name kMDItemUserTags tags.png
(
    Red
)
```

## Resources
[Tagging files from command line](http://brettterpstra.com/2017/08/22/tagging-files-from-the-command-line/)
