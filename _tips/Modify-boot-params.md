---
title: Boot Parameters And EFI
layout: tip
date: 2017-11-04
---

## Overview

The booting process is a very interesting topic from a security perspective. In an attempt to understand it a bit better, this short post only scratches the surface by mentioning two useful built-in tools and what they can do.

#### ```nvram```

```nvram (8)``` command provides access to the firmware's variables from user mode. The most interesting description of this tool in the context of the boot process I've found in _Vault 7: CIA Hacking Tools Revealed_. No surprise here :) As an exemple, let's print _all_ the exposed variables:

```
csr-active-config	w%00%00%00
fmm-computer-name	M%e2%80%99s Mac
SystemAudioVolumeDB	%f0
platform-uuid	%00%11"3DUfw%88%99%aa%bb%cc%dd%ee%ff
SystemAudioVolume	0
bluetoothActiveControllerInfo	%08%00%0f%0e%00%00%00%00`%01%00%00%00%00%00%00
```

It can also be used to clear all variables or delete only specific ones. 

An interesting issue observed by the article above is that _Although ```nvram -p``` claims to print all of the firmware variables, it does not print any of the variables that belong to the Efi GUID._

#### ```bless```

```bless(1)``` command-line tool can be used to control and modify the boot characteristics of the system, specifically related to where and how the system would boot from. [This article](https://bombich.com/kb/ccc4/what-makes-volume-bootable) explains it very good.

Basicallym every bootable volume must indicate the location of the system folder. Let's see an example:

```bash
$ sudo bless -info /
finderinfo[0]:     91 => Blessed System Folder is /System/Library/CoreServices
finderinfo[1]: 440178 => Blessed System File is /System/Library/CoreServices/boot.efi
finderinfo[2]:      0 => Open-folder linked list empty
finderinfo[3]:      0 => No alternate OS blessed file/folder
finderinfo[4]:      0 => Unused field unset
finderinfo[5]:     91 => OS X blessed folder is /System/Library/CoreServices
64-bit VSDB volume id:  0xA38A81DE2AE452DC
```

In this case the _blessed system folder_ is at _inode 96_, and that path is ```/System/Library/CoreServices```. The _"Blessed System File"_ indicates where the _**secondary boot loarder**_ resides. In this case, that is the file at inode 440178 and is located at ```/System/Library/CoreServices/boot.efi```.

## References
[EFI Basics: NVRAM Variables](https://wikileaks.org/ciav7p1/cms/page_26968084.html)
[What makes a volume bootable?](https://bombich.com/kb/ccc4/what-makes-volume-bootable)
