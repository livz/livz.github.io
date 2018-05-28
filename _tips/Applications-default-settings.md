---
title: Applications Default Settings
layout: tip
date: 2017-07-15
categories: [Internals]
---

## Overview

Unlike the Windows way of storing applications preferences within the Registry, neither macOS nor iOS use or have a registry. This tip covers the mechanism used to store user preferences and default settings of applications.

## Defaults

The mechanism Apple provides is known as __*defaults*__. Each application has its own namespace where it can add or remove settings. Additionally, there is a global namespace  common to all applications. For example, to [enable substring matching in Safari]({% capture itemLink %}{% include findCollectionItem.html collectionName='tips' itemTitle='Safari Search For Substrings' %}{% endcapture %}{{ itemLink | strip_newlines }}) we would need to modify the ```FindOnPageMatchesWordStartsOnly``` property:

```bash
$ defaults write com.apple.Safari FindOnPageMatchesWordStartsOnly -bool FALSE
```

Usually, these default settings are stored in property list files. Users preferences are maintained in the ```~/Library/Preferences``` folder, while ```/Library/Preferences``` contains system-wide settings.

<div class="box-note">
These files are binary files! They would need to be <a href="{% capture itemLink %}{% include findCollectionItem.html collectionName='tips' itemTitle='Convert Between Plists Formats' %}{% endcapture %}{{ itemLink | strip_newlines }}" target="_blank">converted to XML</a> before proper examination. Using the <i>defaults</i> command-line tool is preferred to editing the plist files, for obvious reasons.
</div>
