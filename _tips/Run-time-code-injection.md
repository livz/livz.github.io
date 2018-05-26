---
title: Code Injection (Run-Time)
layout: tip
date: 2018-01-15
categories: [Internals]
published: true
---

## Overview
* short description for load-time code injection
* run-time code injection
* solution already available online - only one based on mach_star (rentsch)
* very easy to find malware derivatives using this technique
 . e.g. vt hunt link
* warning - root needed. 



## How it works
* how mach_inject works:
https://github.com/rentzsch/mach_inject
Please don't file a bug report stating mach_inject is crashing for you when you try to use it -- you have to be hard-core enough to debug the problem yourself.
    . bootstrap code, find thread, allocae stack, etc1!!!
* why root needed?
    . Could not access task for pid 800. You probably need to add user to procmod group
mach_inject failing.. (ipc/send) invalid destination port
* task_for_pid

## Walkthrough

* downlaod project (contains all libs including bootstrap)
* modify and compile testapp
* compile testdylib
* compile bootstrap
* move all to one folder and test


## References
* <a href="http://stanleycen.com/blog/2013/mac-osx-code-injection/" target="_blank">Mac OS X code injection & reverse engineering</a>
* <a href="https://github.com/rentzsch/mach_inject" target="_blank">Interprocess code injection for Mac OS X</a>
* <a href="https://www.spaceflint.com/?p=150" target="_blank">Using ptrace on OS X</a>
