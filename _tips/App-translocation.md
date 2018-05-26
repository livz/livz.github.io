---
title: App Translocation
layout: tip
date: 2018-02-15
published: true
categories: [Internals, Security]
published: true
---

## Overview

* macOS 10.12 Sierra introduced a new security feature called **_Gatekeeper Path Randomization_**. Gatekeeper checks that an application has been signed with valid Developer ID certificates purchased from Apple. If the app is not signed, Gatekeeper will block the launch.
* A security vulnerability in Gatekeeper has been discovered in 2015 called [dylib hijacking](https://www.virusbulletin.com/virusbulletin/2015/03/dylib-hijacking-os-x) which is very similar to the [DLL hijacking](http://resources.infosecinstitute.com/dll-hijacking-attacks-revisited/#gref) class of vulnerabilities for Windows operating system. 
* If an app signed with a valid developer certificate loads resources external to its app bundle _via a relative path_, an attacker could package the app with a malicious external resource and bypass Gatekeeper protection. The app would be allowed to run and it will also load the malicious resource.
* *Gatekeeper Path Randomization* is meant to block this class of attacks:
<blockquote>
<p>Starting with macOS Sierra, running a newly-downloaded app from a disk image, archive, or the Downloads directory will cause Gatekeeper to isolate that app at a <i><b>unspecified read-only location</b></i> in the filesystem. This will prevent the app from accessing code or content using relative paths.
</p>
<cite><a target="_blank" href="https://developer.apple.com/library/content/technotes/tn2206/_index.html">macOS Code Signing In Depth</a></cite>
</blockquote>
  
## *When and how?*

The circumstances under which App Translocation occurs are documented in [this blog post](https://lapcatsoftware.com/articles/app-translocation.html). I'll test each of the three scenarios mentioned, using Patrick's [Task Explorer](https://objective-see.com/products/taskexplorer.html) tool, downloaded to _```~/Downloads```_ folder.

### 1. The app has the _```com.apple.quarantine```_ atrribute set

Launch the app straight after downloading it, when it still has the quarantine flag set:

```bash
$ xattr -l TaskExplorer.app
com.apple.quarantine: 0083;00000000;Safari;85EE825E-6D54-45B2-9D4D-18EF536FE29F

$ open TaskExplorer.app

$ ps axu | grep -i taskexplorer
m    1696   0.0  0.0  2423752      8   ??  T    12:44pm   0:00.00 /private/var/folders/p0/[..]/T/AppTranslocation/[..]/d/TaskExplorer.app/Contents/MacOS/TaskExplorer -psn_0_438379
```

Next remove the flag and re-launch:

```bash
$ xattr -d -r com.apple.quarantine TaskExplorer.app

$ open TaskExplorer.app

$ ps axu | grep -i taskexplorer
m    1708   0.0  0.9  2595032  36176   ??  S    12:47pm   0:00.44 /Users/m/Downloads/TaskExplorer.app/Contents/MacOS/TaskExplorer
```

### 2. The app must be opened by Launch Services

We've seen before that the application is relocated when started with the _```open```_ command, which launches it using the default application as determined via Launch Services. This is exactly the same as double clicking on it.

Although the app cannot be launched like this, we can invoke the binary directly:

```bash
$ xattr -l TaskExplorer.app
com.apple.quarantine: 0083;00000000;Safari;B4B73CA6-6A3C-44DC-9603-D960BC5876D0

$ xattr -l  ./TaskExplorer.app/Contents/MacOS/TaskExplorer
com.apple.quarantine: 0083;5ac60dc7;Safari;B4B73CA6-6A3C-44DC-9603-D960BC5876D0

$ ./TaskExplorer.app/Contents/MacOS/TaskExplorer

$ ps axu | grep -i taskexplorer
m    1735   0.0  0.8  2584252  34632 s000  S+   12:51pm   0:00.44 ./TaskExplorer.app/Contents/MacOS/TaskExplorer
```

### 3. The app must *not* have been moved by Finder

If we move the application to a different folder, notice that the bits in the _```com.apple.quarantine```_ (**```00a3```**) stay exactly the same. As expected, when launching the app it will still get translocated:

```bash
$ cp -R TaskExplorer.app ~/Desktop

$ xattr -l TaskExplorer.app
com.apple.quarantine: 00a3;00000000;Safari;C6D57542-F0E0-455E-9523-0C183E54EA8E

$ xattr -l ~/Desktop/TaskExplorer.app
com.apple.quarantine: 00a3;00000000;Safari;C6D57542-F0E0-455E-9523-0C183E54EA8E

$ open ~/Desktop/TaskExplorer.app

$ ps axu | grep -i taskexplorer
m    1870   0.0  0.0  2423752      8   ??  T    12:59pm   0:00.00 /private/var/folders/p0/[..]/T/AppTranslocation/[..]/d/TaskExplorer.app/Contents/MacOS/TaskExplorer -psn_0_528513
```

But if we copy the TaskExplorer app using Finder and paste it onto the Desktop folder, there is a slight change in the quarantine bits - **```01a3```**:

```bash
$ xattr -l ~/Desktop/TaskExplorer.app
com.apple.quarantine: 01a3;00000000;Safari;C6D57542-F0E0-455E-9523-0C183E54EA8E
```

And translocation doesn't happen anymore:

```bash
$ open ~/Desktop/TaskExplorer.app

$ ps axu | grep -i taskexplorer
m    1885   0.0  0.0  2423752      8   ??  T     1:04pm   0:00.00 /Users/m/Desktop/TaskExplorer.app/Contents/MacOS/TaskExplorer -psn_0_536707
```

<div class="box-note">
Notice that because the app <i>still has the quarantine flag</i>, there will be a warning when trying to launch it. The launcher knows that it has been downloaded from the Internet.
</div>
