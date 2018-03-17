---
title: Debugging Plists Issues
layout: tip
date: 2017-01-24
---

## Overview

When you've created or modified a Plist file and the desired service or application doesn't start as expected, there are a few things you can do to locate and debug errors related to the plist files:

Firstly, set the _```StandardOutPath```_ and _```StandardErrorPath```_ fields in the XML plist file:

```
  <key>StandardErrorPath</key>
  <string>/tmp/mycommand.err</string>
  <key>StandardOutPath</key>
  <string>/tmp/mycommand.out</string>
```

![plist-dbg](/assets/images/tips/plist-dbg.png)

Second thing is to check the system log for any messages related to your plist:

```bash
$ tail -F /var/log/system.log | grep "com.apple.myPlist"
```
