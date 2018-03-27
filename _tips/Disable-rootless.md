---
title: Enable/Disable Rootless Mode
layout: tip
date: 2017-04-29
---

## What is SIP?

SIP (aka _**rootless mode**_) is a security feature introduced in Mac OS X El Capitan that amongst other things stops anybody (_including root!_) from writing to certain folders and files, typically related to the system or Apple’s own apps. The following folders are protected by default, and also most applications that came preinstalled with OS X (e.g. _Dashboard_):
```
/System
/usr
/bin
/sbin
```

The average user doesn't usually need to mess around with root-level files. This also adds another layer of security for users with admin privileges, since they sometimes can be tricked by attackers into disclosing their password, or even their machine could be compromised and an attacker would get local code execution.

## View files protected by SIP  and check status
```bash
$ csrutil status
System Integrity Protection status: enabled.

$ cat /System/Library/Sandbox/rootless.conf

$ cat /System/Library/Sandbox/Compatibility.bundle/Contents/Resources/paths
```

You can also check whether a file or folder is protected by adding the **O** (capital O) flag to the ```ls``` command:
```
$ ls -lO /System/Library/CoreServices/Dock.app
total 0
drwxr-xr-x    3 root  wheel  restricted  102 26 Mar  2017 .
drwxr-xr-x  160 root  wheel  restricted 5440 14 Mar 12:10 ..
drwxr-xr-x   10 root  wheel  restricted  340 26 Mar  2017 Contents
```

## Enable/Disable SIP
Assuming you understand the implications and know what you're doing, you can turn off SIP in a few steps:

* Restart your Mac
* While restarting, hold down **⌘ + R** to enter Recovery System. Hold down the two keys until the Apple logo appears.
* This will boot the system into OS X Utilities window. Select _Utilities → Terminal_ and enter the following:

```bash
$ csrutil disable
```
* Click the Apple menu and select _Restart_. The system will start up with SIP disabled.


