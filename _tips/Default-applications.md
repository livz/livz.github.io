---
title: Default Applications
layout: tip
date: 2016-07-22
---

## Overview

Like other operating systems, MacOS also keeps an association of file types with default applications used to open them. This is effective when double-clicking a file in the GUI, but also when using the ```open (1)``` command-line tool. Sometimes we might want to change that and it's very easy.

## Change default associations

Right click on the file and select _Get Info_. In the _Open With_ section, you can chose an app from the list or browse to select a different one from the file system:

![open-with](/assets/images/tips/open-with.png)

## Dump Launch Service database 

To get a list of all the current associations (_and much more other info!_), locate the ```lsregister``` tool and dump the whole Launch Service database:

```
$ find / -name lsregister 2>/dev/null
/System/Library/Frameworks/CoreServices.framework/Versions/A/Frameworks/LaunchServices.framework/Versions/A/Support/lsregister

$ /System/Library/Frameworks/CoreServices.framework/Versions/A/Frameworks/LaunchServices.framework/Versions/A/Support/lsregister -h
lsregister: [OPTIONS] [ <path>... ]
                      [ -apps <domain>[,domain]... ]
                      [ -libs <domain>[,domain]... ]
                      [ -all  <domain>[,domain]... ]

Paths are searched for applications to register with the Launch Service database.
Valid domains are "system", "local", "network" and "user". Domains can also
be specified using only the first letter.

  -kill     Reset the Launch Services database before doing anything else
  -seed     If database isn't seeded, scan default locations for applications and libraries to register
  -lint     Print information about plist errors while registering bundles
  -lazy n   Sleep for n seconds before registering/scanning
  -r        Recursive directory scan, do not recurse into packages or invisible directories
  -R        Recursive directory scan, descending into packages and invisible directories
  -f        force-update registration even if mod date is unchanged
  -u        unregister instead of register
  -v        Display progress information
  -dump     Display full database contents after registration
  -h        Display this help

$ /System/Library/Frameworks/CoreServices.framework/Versions/A/Frameworks/LaunchServices.framework/Versions/A/Support/lsregister -dump >db.out
```
