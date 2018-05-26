---
title: Code Injection (Run-Time)
layout: tip
date: 2018-01-15
categories: [Internals]
published: true
---

## Overview
* In the [previous](http://craftware.xyz/tips/Function-interposing.html) [posts](http://craftware.xyz/tips/Load-time-code-injection.html) we've seen how to do code injection at *load time* using ```DYLD_INSERT_LIBRARIES``` environment variable and *loadable classes* for both simple C application and Objective-C apps. This is very useful but sometimes the application you want to inject into has already been started. 
* Similarly to Windows and Linux platforms, it is possible to do run-time code injection in macOS as well. 
* The documentation on this subject if *very* sparse. All of the implementations available online are based on the [mach_inject](https://github.com/rentzsch/mach_inject) project.
* There is a good side to this lacking of documentation. There are limited resources for malware writers as well. Thus, it's easy to locate *possibly malicious* samples online that use process injection. For example, a quick Virus Total hunt reveals [this sample](https://www.virustotal.com/intelligence/search/?query=b00d55dbf45387e81d5d28adc4829e639740eda1) which had only 4 detections at the time it appeared. Currently 24/60 vendors detect it. I'm sure, however, there are many other samples (*Thsi will be the subject of another story*).
* Root privileges are needed to play with this project. More on the reason for this later on.

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
