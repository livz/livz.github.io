---
title: CLI For Working With Keychains
layout: tip
date: 2017-08-26
---

## Overview

To play with keychains from CLI, MacOS has the ```security (1)``` tool, which is basically a command line interface to keychains and Security framework. Of course if you have the [keychain icon in the menu bar](http://craftware.xyz/tips/Keychain-status-menubar.html) it's much easier, but cli interface is handy as well. 

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
```
