---
title: DMG Images
layout: tip
date: 2017-08-07
categories: [Internals]
published: no
---

## Overview

- what are dmg files

<blockquote>
  <p>A DMG file is a mountable disk image created in Mac OS X. It contains raw block data typically compressed and sometimes encrypted. DMG files are commonly used for OS X software installers that are downloaded from the Internet and mounts a virtual disk on the desktop when opened.</p>
  <cite><a target="_blank" href="https://fileinfo.com/extension/dmg">.DMG File Extension</a>
</cite> </blockquote>

- how to create

## How to work with DMG files
```bash
~ hdiutil attach EliteMonitor.dmg
expected   CRC32 $D31C24BA
/dev/disk2          	GUID_partition_scheme
/dev/disk2s1        	Apple_HFS                      	/Volumes/EliteMonitor

~ ls /Volumes/EliteMonitor
total 32
[..]
drwxr-xr-x  3 m     staff    102 26 Aug  2017 .background
drwxr-xr-x  3 m     staff    102 26 Aug  2017 Elite Monitor Installer.app

~ hdiutil detach disk2s1
"disk2" unmounted.
"disk2" ejected.
```

## References
* [Apple Disk Image](https://en.wikipedia.org/wiki/Apple_Disk_Image)
* [How to Make a DMG File](https://www.wikihow.com/Make-a-DMG-File-on-a-Mac)
