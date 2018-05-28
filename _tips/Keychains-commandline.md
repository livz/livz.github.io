---
title: CLI For Working With Keychains
layout: tip
date: 2017-08-26
categories: [Howto]
---

## Overview

To play with keychains from CLI, macOS has the ```security (1)``` tool, which is basically a command line interface to keychains and Security framework. Of course if you have the [keychain icon in the menu bar]() it's much easier, but cli interface is handy as well. 

### Usage

Start the ```security``` tool in interactive mode (```-i```) and play around:

```bash
$ security -i

security> list-keychains
    "/Users/m/Library/Keychains/login.keychain-db"
    "/Library/Keychains/System.keychain"

security> dump-keychain "/Users/m/Library/Keychains/login.keychain-db"
[..]

security> lock-keychain "/Users/m/Library/Keychains/login.keychain-db"

security> leaks
An admin user name and password is required to enter Developer Mode.
Admin user name (m):
Password:
Process:         security [2343]
Path:            /usr/bin/security
Load Address:    0x10e139000
Identifier:      security
Version:         ???
Code Type:       X86-64
Parent Process:  zsh [1493]

Date/Time:       2018-03-18 11:13:20.462 +0000
Launch Time:     2018-03-18 11:00:00.068 +0000
OS Version:      Mac OS X 10.12.6 (16G1114)
Report Version:  7
Analysis Tool:   /usr/bin/leaks
----

leaks Report Version:  2.0
Process 2343: 2034 nodes malloced for 292 KB
Process 2343: 0 leaks for 0 total leaked bytes.
leaks: returned 1
```
