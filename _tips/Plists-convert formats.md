---
title: Convert Between Plists Formats
layout: tip
date: 2017-01-23
---

## Overview

The current format for the ```.plist``` files introduced in 10.4 is binary, which means it can no longer be edited easily using text editors. Luckily, there is an utility to convert back and forth between the binary format and user-readable XML format.

You can convert the .plist file you want to edit to XML format, edit it in your favourite text editor, then convert it back to binary. The syntax is as:
```bash
$ plutil -convert <intended format> -o <output file>
```

* Convert a binary .plist file to XML:
```bash
$ plutil -convert xml1 Info.plist -o Info.xml.plist
```
* Convert an XML .plist file to binary:
```bash
$ plutil -convert binary1 Info.plist -o Info.bin.plist
$ file Info.*
Info.bin.plist: Apple binary property list
Info.plist:     XML 1.0 document text, ASCII text
```
