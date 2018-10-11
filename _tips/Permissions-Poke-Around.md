---
title: Mojave Permissions to Poke Around
layout: tip
date: 2018-10-10
categories: [Internals, Security]
published: true
---

## Overview

* We keep hearing that [macOS 10.14 Mojave](https://www.apple.com/uk/macos/mojave/) introduced a lot of new security features but what exactly are they? Some of the new [security additions](https://www.intego.com/mac-security-blog/macos-mojave-whats-new-in-security-and-privacy-features/) focus around data privacy by *minimizing online fingerprint and tracking*, *new permissions for apps* and *better passowrd management for Safari*.
* Mojave introduced new restrictions *even for user directories*. Applications won't be able to access folders like Mail, Messages and Time Machine backups unless __*explicitely granted permissions!*__

## *What does it mean in practice?*

* A very important aspect is that **_an application cannot prompt for this permission_**. It must be granted it manually. The process is however, very simple:
    1. Open *System Preferences*
    2. Go to *Security & Privacy*
    3. Click on the *Privacy* Tab
    4. Click *Full Disk Access* section in the sidebar

After unlocking the interface, just drag-and-drop an application here, or use the **+** button to add manually.

<img src="/assets/images/tips/mojave-privacy-settings.png" alt="Mojave privacy settings" class="figure-body">

* Notice that the protected folders have *no special attributes or permissions*:

```bash
~ ls -ald@ ~/Library/Safari
drwxr-xr-x@ 41 liv  staff  1312 11 Oct 13:31 /Users/liv/Library/Safari
	com.apple.quarantine	  -1
  
~ xattr ~/Library/Safari
com.apple.quarantine

~ ls -al ~/Library/Safari
ls: Safari: Operation not permitted
```
