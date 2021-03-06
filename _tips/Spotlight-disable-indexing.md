---
title: Spotlight Disable Indexing
layout: tip
date: 2017-07-01
categories: [Internals]
---

## Overview

The [previous tip]({% capture itemLink %}{% include findCollectionItem.html collectionName='tips' itemTitle='Spotlight Architecture' %}{% endcapture %}{{ itemLink | strip_newlines }}) covered the way Spotlight works. A very little documented feature of Spotlight, but one that can be very useful, is the possibility to disable indexing for specific sensitive folders. By default, indexing will be performed immediately after file notifications are received by the ```mds``` daemon:

<img src="/assets/images/tips/spotlight-indexed.png" alt="spotlight-indexed" class="figure-body">

* **GUI** - Using the interface, got to _System Preferences → Spotlight → Privacy_ and add your desired folder to the list:

<img src="/assets/images/tips/spotlight-noindex.png" alt="spotlight-noindex" class="figure-body">

* **Manual** - Previously, you could create a file named _```.metadata_never_index```_ in the folder you wanted to prevent indexing, but currently this trick no longer works. However, the following works fine with macOS Sierra to prevent a specific folder or file from being indexed by Spotlight. Simply add a **_".noindex"_** extension and the folder will be removed from the database and not indexed in the future. 

_**Note**: The manual method works only with folders and files, not with whole drives._
