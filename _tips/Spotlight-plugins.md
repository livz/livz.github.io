---
title: Spotlight Architecture
layout: tip
date: 2017-01-25
---

## Overview

Spotlight is the quick search technology in MacOS and iOS, launched on MacOS by clicking the magnifying glass icon on the top right corner of the screen, at the end of the menu bar, or on iOS by _swiping down from around the middle of the screen_.

## How it works

* Spotlight is controlled by the _```mds daemon (metadata server)```_. Every time a file operation occurs (creation, modification, or deletion) the kernel notifies this daemon via _```fsevents```_. 
* Upon receiving of the notification, ```mds``` launches a worker process (```mdsworker```) to extract metadata from the file and import it into the database. 
* ```mdsworker```s launch specific **_importers_** based on the type of files being processed. There is quite extensive official documentation on how to write such a plugin. The plugins are stored in _```/System/Library/Spotlight```_:
```bash
$ ls /System/Library/Spotlight
total 0
drwxr-xr-x  23 root  wheel   782 15 Jul  2017 .
drwxr-xr-x  93 root  wheel  3162  2 Jan 12:41 ..
drwxr-xr-x   3 root  wheel   102 16 Jun  2017 Application.mdimporter
drwxr-xr-x   3 root  wheel   102 15 Oct  2016 Archives.mdimporter
drwxr-xr-x   3 root  wheel   102 11 May  2017 Audio.mdimporter
drwxr-xr-x   3 root  wheel   102 29 Oct  2016 Automator.mdimporter
drwxr-xr-x   3 root  wheel   102 14 Oct  2016 Bookmarks.mdimporter
drwxr-xr-x   3 root  wheel   102 28 Mar  2017 Chat.mdimporter
drwxr-xr-x   3 root  wheel   102 25 May  2017 CoreMedia.mdimporter
drwxr-xr-x   3 root  wheel   102 20 May  2017 Font.mdimporter
drwxr-xr-x   3 root  wheel   102 15 Oct  2016 Image.mdimporter
drwxr-xr-x   3 root  wheel   102 11 May  2017 MIDI.mdimporter
drwxr-xr-x   3 root  wheel   102 11 Mar  2017 Mail.mdimporter
drwxr-xr-x   3 root  wheel   102 31 May  2017 Notes.mdimporter
drwxr-xr-x   3 root  wheel   102 15 Oct  2016 PDF.mdimporter
drwxr-xr-x   3 root  wheel   102 15 Oct  2016 PS.mdimporter
drwxr-xr-x   3 root  wheel   102 20 Oct  2016 QuartzComposer.mdimporter
drwxr-xr-x   3 root  wheel   102  1 Feb  2017 RichText.mdimporter
drwxr-xr-x   3 root  wheel   102  7 Dec  2016 SystemPrefs.mdimporter
drwxr-xr-x   3 root  wheel   102 15 Oct  2016 iCal.mdimporter
drwxr-xr-x   3 root  wheel   102 15 Oct  2016 iPhoto.mdimporter
drwxr-xr-x   3 root  wheel   102 15 Oct  2016 iPhoto8.mdimporter
drwxr-xr-x   3 root  wheel   102  8 Feb  2017 vCard.mdimporter
```

## References
1. [Spotlight Importer Programming Guide](https://developer.apple.com/library/content/documentation/Carbon/Conceptual/MDImporters/MDImporters.html)
2. [Writing a Spotlight Importer](https://developer.apple.com/library/content/documentation/Carbon/Conceptual/MDImporters/Concepts/WritingAnImp.html)
