---
title: Quarantined files
layout: tip
date: 2017-09-24
categories: [Internals]
published: false
---

## Overview

* In a nutshell, the file quarantine feature that was introduced in MacOS Leopard 10.5 to protect users from accidentally opening files and applications downloaded from an untrusted source.

<blockquote>
  <p>File Quarantine is a new feature in Leopard designed to protect users from trojan horse attacks. It allows applications which download file content from the Internet to place files in “quarantine” to indicate that the file could be from an untrustworthy source. An application quarantines a file simply by assigning values to one or more quarantine properties which preserve information about when and where the file come from.

When the Launch Services API is used to open a quarantined file and the file appears to be an application, script, or other executable file type, Launch Services will display an alert to confirm the user understands the file is some kind of application.</p>
  <cite><a target="_blank" href="https://developer.apple.com/library/content/releasenotes/Carbon/RN-LaunchServices/index.html">File Quarantine feature</a>
</cite> </blockquote>

* Starting with MacOS Sierra (10.12), this also applies to _any application distributed outside the Mac App Store_.
* Quarantined files have an additional extended attribute, _**com.apple.quarantine**_. 
* Windows applies a [similar restriction](https://www.howtogeek.com/70012/what-causes-the-file-downloaded-from-the-internet-warning-and-how-can-i-easily-remove-it/) with files downloaded from the internet.  It will create an alternate data stream (ADS) for the file named _```Zone.Identifier```_ which stores information about where the file came from.

<div class="box-note">
If you're not familiar with the Windows [Alternate Data Streams](https://blogs.technet.microsoft.com/askcore/2013/03/24/alternate-data-streams-in-ntfs/) [feature](https://blog.malwarebytes.com/101/2015/07/introduction-to-alternate-data-streams/), definitely read about it. I know it's old but it's very cool. Both from a forensics and an analysis perspective.
</div>

## Understanding ..

#### Test

#### Get more details using sqlite
#### Remove the quarantine bit


