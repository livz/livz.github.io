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

#### Create lib in xcode and compiel manually

#### Show the functions in the lib
otool -TV your.dylib

nm -g your.dylib

nm -a CalculatorOverrides.dylib | grep -i about
0000000000001940 t -[ACCalculatorOverrides patchedShowAbout:]
0000000000001940 - 01 0000   FUN -[ACCalculatorOverrides patchedShowAbout:]

machoview
https://sourceforge.net/projects/machoview/

#### Load adn test

