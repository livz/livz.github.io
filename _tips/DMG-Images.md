---
title: DMG Images
layout: tip
date: 2017-08-07
categories: [Internals]
published: yes
---

## Overview

- [Apple disk images](https://en.wikipedia.org/wiki/Apple_Disk_Image), typically having a *.dmg* extension, are a format used to distribute software because it *__allows the creator to control the Finder's presentation of the window__* and to instruct the user to copy the applications to the *Applications* folder.

<blockquote>
  <p>A DMG file is a mountable disk image created in Mac OS X. It contains raw block data typically compressed and sometimes encrypted. DMG files are commonly used for OS X software installers that are downloaded from the Internet and mounts a virtual disk on the desktop when opened.</p>
  <cite><a target="_blank" href="https://fileinfo.com/extension/dmg">.DMG File Extension</a>
</cite> </blockquote>
* Because Apple disk images allow *__secure password protection__* and *__file compression__*. This makes them very useful for software distribution.
* A disk image can contain *__multiple file systems__* (HFS, HFS+, FAT, etc.)
* It's easy to [create disk images](https://www.wikihow.com/Make-a-DMG-File-on-a-Mac) using just utilities bundled with Mac OS X. 

## How to work with DMG files

* There are a few options to extract the content from the proprietary image format using 3rd party utilities, but the easiest way is to use built-in tools:

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
