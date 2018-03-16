---
title: The Curious Case Of HFS+
layout: tip
date: 2017-01-18
---

## Overview

A strange and not very well known property of the HFS+ file system is that it is _**case preserving**_ but _**case insensitive**_. In practice, this means it doesn't care about the case when you type a command or a file name, but it will remember what you type. Let's see an example:
```bash
$ echo Hello > TeSt
$ cat test
Hello
$ CAT TEST
Hello
$ ls
total 17896
drwxr-xr-x   6 liv  staff      204 16 Mar 18:30 .
drwxr-xr-x  20 liv  staff      680 16 Mar 00:01 ..
-rw-r--r--   1 liv  staff        6 16 Mar 18:30 TeSt
```
