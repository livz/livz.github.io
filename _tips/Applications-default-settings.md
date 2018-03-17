---
title: Applications Default Settings
layout: tip
date: 2017-01-28
---

## Overview

Unlike the Windows way of storing applications preferences within the Registry, neither MacOS nor iOS use or have a registry. This tip covers the mechanism used to store user preferences and default settings of applications.

## Defaults

The mechanism Apple provides is known as __*defaults*__. Each application has its own namespace where it can add or remove settings. Additionally, there is a global namespace  common to all applications. For example, to [enable substring matching in Safari](http://craftware.xyz/tips/Safari-match-substrings.html) we would need to modify the ```FindOnPageMatchesWordStartsOnly``` property:
```bash
$ defaults write com.apple.Safari FindOnPageMatchesWordStartsOnly -bool FALSE
```

Usually, these default settings are stored in property list files. Users preferences are maintained in the ```~/Library/Preferences``` folder, while ```/Library/Preferences``` contains system-wide settings.

*__Note:__ These files are binary files! They would need to be [converted to XML](http://craftware.xyz/tips/Plists-convert%20formats.html) before proper examination. Using the ```defaults``` command-line tool is preferred to editing the plist files, for obvious reasons.*