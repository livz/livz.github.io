---
title: Load-time Code Injection
layout: tip
date: 2018-01-11
categories: [Internals]
published: false
---

## Overview

Function interposing
* http://craftware.xyz/tips/Function-interposing.html

- not much information out there

Old article - 2012
https://blog.timac.org/2012/1218-simple-code-injection-using-dyld_insert_libraries/

- walkthrough and describe the whole process. Apply to other processes

## Process

#### Test current version
- doesntwork


#### RE the calculator to find teh function
...
ida pro
locate function showAbout
get signature


#### Debug
~ lldb /Applications/Calculator.app
(lldb) target create "/Applications/Calculator.app"
Current executable set to '/Applications/Calculator.app' (x86_64).
(lldb)

(lldb) run
error: process exited with status -1 (cannot attach to process due to System Integrity Protection)

--after disablign SIP
 [14:07] ~ lldb /Applications/Calculator.app
(lldb) target create "/Applications/Calculator.app"
Current executable set to '/Applications/Calculator.app' (x86_64).
(lldb) r
Process 398 launched: '/Applications/Calculator.app/Contents/MacOS/Calculator' (x86_64)
Process 398 exited with status = 0 (0x00000000)

target modules lookup -r -n controller (/Application....)
40 matches found in /System/Library/Frameworks/AppKit.framework/Versions/C/AppKit:

(lldb) disassemble -name -[Controller ...]  --> not found. Go by address

---> https://stackoverflow.com/questions/47922665/what-is-lldb-unnamed-symbol


(lldb) disassemble --start-address 00000001000098AE
Calculator`___lldb_unnamed_symbol160$$Calculator:
0x1000098ae <+0>:  pushq  %rbp
0x1000098af <+1>:  movq   %rsp, %rbp
0x1000098b2 <+4>:  movq   0x1f58f(%rip), %rdi       ; (void *)0x0000000000000000
0x1000098b9 <+11>: movq   0x1eab0(%rip), %rsi       ; "dictionaryWithObject:forKey:"
0x1000098c0 <+18>: leaq   0x15319(%rip), %rdx       ; @"2000"
0x1000098c7 <+25>: leaq   0x15332(%rip), %rcx       ; @"CopyrightStartYear"

(lldb) breakpoint set --name ___lldb_unnamed_symbol160$$Calculator
Breakpoint 2: where = Calculator`___lldb_unnamed_symbol160$$Calculator, address = 0x00000001000098ae

(lldb) breakpoint list
Current breakpoints:
2: name = '___lldb_unnamed_symbol160$$Calculator', locations = 1
  2.1: where = Calculator`___lldb_unnamed_symbol160$$Calculator, address = 0x00000001000098ae, unresolved, hit count = 0
  
(lldb) thread backtrace
* thread #1, queue = 'com.apple.main-thread', stop reason = breakpoint 2.1
  * frame #0: 0x00000001000098ae Calculator`___lldb_unnamed_symbol160$$Calculator
    frame #1: 0x00007fffd1a053a7 libsystem_trace.dylib`_os_activity_initiate_impl + 53
    frame #2: 0x00007fffba2c1721 AppKit`-[NSApplication(NSResponder) sendAction:to:from:] + 456
    frame #3: 0x00007fffb9d94666 AppKit`-[NSMenuItem _corePerformAction] + 324
    frame #4: 0x00007fffb9d943d2 AppKit`-[NSCarbonMenuImpl performActionWithHighlightingForItemAtIndex:] + 114
    [..]
    
    
(lldb) image lookup --address 0x00000001000098ae
      Address: Calculator[0x00000001000098ae] (Calculator.__TEXT.__text + 32810)
      Summary: Calculator`___lldb_unnamed_symbol160$$Calculator
      
http://stevenygard.com/projects/class-dump/

~ /Volumes/VMware\ Shared\ Folders/tmp/class-dump -A /Applications/Calculator.app | grep showAbout
- (void)showAbout:(id)arg1;	// IMP=0x00000001000098ae


#### Create and test hello world
done - hello.m


#### Show the functions in the lib
otool -TV your.dylib

nm -g your.dylib

nm -a CalculatorOverrides.dylib | grep -i about
0000000000001940 t -[ACCalculatorOverrides patchedShowAbout:]
0000000000001940 - 01 0000   FUN -[ACCalculatorOverrides patchedShowAbout:]

machoview
https://sourceforge.net/projects/machoview/


#### Create lib in xcode and compile manually
- when to exchange methods ? load function

#### Load adn test

