---
title: Mojave Permissions to Poke Around
layout: tip
date: 2018-10-10
published: false
categories: [Internals, Security]
published: true
---

## Overview

* We keep hearing that [macOS 10.14 Mojave](https://www.apple.com/uk/macos/mojave/) introduced a lot of new security features but what exactly that means in practice? Some of the new [security additions](https://www.intego.com/mac-security-blog/macos-mojave-whats-new-in-security-and-privacy-features/) focus around data privacy by *minimizing online fingerprint and tracking*, *new permissions for apps* and *better passowrd management for Safari*.
* 

Certain system directories have been off-limits for some time, and in Mojave Apple is introducing tighter restrictions even for some user directories. Applications, including script applets and script editors, will not be able to access many such directories unless the user specifically grants them permission.

This includes a wide range of subdirectories of the Home directory and ~/Library. It means Mail and Safari files, as well as many settings files.

  
## *When and how?*

* Which folders? Show permissions and try to list


The circumstances under which App Translocation occurs are documented in this blog post]
<blockquote>
<p>Starting with macOS Sierra, running a newly-downloaded app from a disk image, archive, or the Downloads directory will cause Gatekeeper to isolate that app at a <i><b>unspecified read-only location</b></i> in the filesystem. This will prevent the app from accessing code or content using relative paths.
</p>
<cite><a target="_blank" href="https://developer.apple.com/library/content/technotes/tn2206/_index.html">macOS Code Signing In Depth</a></cite>
</blockquote>

<div class="box-note">
Notice that because the app <i>still has the quarantine flag</i>, there will be a warning when trying to launch it. The launcher knows that it has been downloaded from the Internet.
</div>
