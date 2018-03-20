---
title: Trace Dynamic Memory Allocations
layout: tip
date: 2017-11-18
published: false
---

## Overview

- description

The malloc_history(1) tool, which requires MallocStackLogging  to be set, provides a detailed account of every memory allocation that occurred in the process, including the initial ones made by dyld(1).

This tool can be used to show all allocations in the process (using –allBySize or –allByCount) and even deallocations (-allEvents), 

- 2 examples (

[17:58] ~ MallocStackLogging=1 open /Applications/Safari.app
17:58] ~ ps axu | grep Safari.app
m  4828   0.0  3.0  3788332  61888   ??  S     5:56pm   0:02.23 /Applications/Safari.app/Contents/MacOS/Safari    

malloc_history 4828 -allBySize

malloc_history 4828 -callTree -showContent)

- mem leaks

The leaks(1) tool walks the process heap to detect suspected memory leaks. It samples the process to produce a report of pointers, which have been allocated but not freed. For example, consider the program in Listing 5-6.

leaks 4828
Process:         Safari [4828]
Path:            /Applications/Safari.app/Contents/MacOS/Safari
Load Address:    0x10229d000
Identifier:      com.apple.Safari
Version:         11.0.2 (12604.4.7.1.4)
Build Info:      WebBrowser-7604004007001004~1
Code Type:       X86-64
Parent Process:  ??? [1]

Date/Time:       2018-03-20 17:59:55.779 +0000
Launch Time:     2018-03-20 17:56:02.600 +0000
OS Version:      Mac OS X 10.12.6 (16G1114)
Report Version:  7
Analysis Tool:   /usr/bin/leaks
----

leaks Report Version:  2.0
Process 4828: 76182 nodes malloced for 13285 KB
Process 4828: 0 leaks for 0 total leaked bytes.

- my program



Listing 5-6: A simple memory leak demonstration

#include <stdio.h>
int f()
{  
    char *c = malloc(24);
}
void main() 
{
    f();
    sleep(100);
}
