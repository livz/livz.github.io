---
title: Debugging A Kernel Panic
layout: tip
date: 2018-01-06
published: false
---

## Overview

This post goes step by step through the process of debugging a kernel panic on MacOS High Sierra. This should, hopefully, be educational for anyone with an interest in MacOS security even if not on the kernel level.

Server:
$ sudo mkdir /PanicDumps
$ sudo chown root:wheel /PanicDumps
$ sudo chmod 1777 /PanicDumps

Then activate kdumpd on the system (attention: this activates it across reboots)
$ sudo launchctl load -w /System/Library/LaunchDaemons/com.apple.kdumpd.plist

$ sudo launchctl list | grep kdump

OR

lsof/netstat

Target:
$ sudo nvram boot-args='debug=0x444 _panicd_ip=1.2.3.4'

$ sudo reboot
$ sysctl kern.bootargs

Trigger a kernel panic:
$ sudo dtrace -w -n "BEGIN{ panic(); }"


## References
[Technical Note TN2118 - Kernel Core Dumps](https://developer.apple.com/library/content/technotes/tn2004/tn2118.html#SECSERVER)
