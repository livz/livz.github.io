---
title: App Translocation
layout: tip
date: 2018-02-15
published: true
categories: [Internals, Security]
published: false
---

## Overview

* MacOS 10.12 Sierra introduced a new security feature called **_Gatekeeper Path Randomization_**. Gatekeeper checks that an application has been signed with valid Developer ID certificates purchased from Apple. If the app is not signed, Gatekeeper will block the launch.
* A security vulnerability in Gatekeeper has been discovered in 2015 called [dylib hijacking](https://www.virusbulletin.com/virusbulletin/2015/03/dylib-hijacking-os-x) which is very similar to the [DLL hijacking](http://resources.infosecinstitute.com/dll-hijacking-attacks-revisited/#gref) class of vulnerabilities for Windows operating system. 
* If an app signed with a valid developer certificate loads resources external to its app bundle via a relative path, an attacker could package the app with a malicious external resource and bypass Gatekeeper protection. The app would be allowed to run and it will also load the malicious resource.
* *Gatekeeper Path Randomization* is meant to block this class of attacks:
<blockquote>
<p>Starting with macOS Sierra, running a newly-downloaded app from a disk image, archive, or the Downloads directory will cause Gatekeeper to isolate that app at a <i><b>unspecified read-only location</b></i> in the filesystem. This will prevent the app from accessing code or content using relative paths.
</p>
<cite><a target="_blank" href="https://developer.apple.com/library/content/technotes/tn2206/_index.html">macOS Code Signing In Depth</a></cite>
</blockquote>
  
## How it works?

Under what circumstances does App Translocation occur?
https://lapcatsoftware.com/articles/app-translocation.html

1. quarantine

2. launch services

3. Move the pp by finder
