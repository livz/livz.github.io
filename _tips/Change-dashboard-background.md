---
title: Change Dashboard Background
layout: tip
date: 2017-01-21
---

## Overview

*Note: This tip here only worked until MacOS 10.9 Mavericks. Since OS X Yosemite (10.10), the background of the Dashboard is a blured version of the wallpaper on Desktop 1*

**Steps to change the dashboard background:**

* Find a suitable image with good resolution, in PNG format. Use at least 2880 x 1600 for best results.
* Save the image as **_pirelli.png_**, and duplicate it as **_pirelli@2x.png_** (the _@2x_ is for retina displays).
* Next, open up Finder and select *Go → Go To Folder* option and enter the following path:

```
/System/Library/CoreServices/Dock.app/Contents/Resources/
```
* This will open up the resources of _Dock.app_ application. Replace the two files named _pirelli_ and _pirelli@2x_. When asked to authenticate, enter the password since you are modifying system files.
* Restart the dashboard application:

```
killall Dock
```
