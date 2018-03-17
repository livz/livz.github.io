---
title: Change Default Location For Fusion VMs
layout: tip
date: 2017-04-08
---

## Overview

In VMWare Workstation and Oracle VirtualBox is relatively straightforward to change the default location for new virtual machines. But for some reason in Fusion this option is not exposed via the GUI. So we need to do a bit of digging.

1. Open up _```~/Library/Preferences/VMWare Fusion/preferences```_ in a text editor.
2. Save a backup of the VMWare Fusion preferences file and then edit the original:
```bash
cd ~/Library/Preferences/VMWare\ Fusion
cp preferences preferences.backup
vi preferences
```
3. Find the line starting with _```prefvmx.defaultVMPath```_ and edit it. 
