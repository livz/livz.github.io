---
title: Quarantined files
layout: tip
date: 2017-09-24
categories: [Internals]
published: true
---

## Overview

* In a nutshell, the file quarantine feature that was introduced in MacOS Leopard 10.5 to protect users from accidentally opening files and applications downloaded from an untrusted source.

<blockquote>
  <p>File Quarantine is a new feature in Leopard designed to protect users from trojan horse attacks. It allows applications which download file content from the Internet to place files in “quarantine” to indicate that the file could be from an untrustworthy source. An application quarantines a file simply by assigning values to one or more quarantine properties which preserve information about when and where the file come from.
<br /><br />
When the Launch Services API is used to open a quarantined file and the file appears to be an application, script, or other executable file type, Launch Services will display an alert to confirm the user understands the file is some kind of application.</p>
  <cite><a target="_blank" href="https://developer.apple.com/library/content/releasenotes/Carbon/RN-LaunchServices/index.html">File Quarantine feature</a>
</cite> </blockquote>

* Starting with MacOS Sierra (10.12), this also applies to _any application distributed outside the Mac App Store_.
* Quarantined files have an additional extended attribute, _**com.apple.quarantine**_. 
* Windows applies a [similar restriction](https://www.howtogeek.com/70012/what-causes-the-file-downloaded-from-the-internet-warning-and-how-can-i-easily-remove-it/) for files downloaded from the internet.  It will create an alternate data stream (ADS) for the file named _```Zone.Identifier```_ which stores information about where the file came from.

<div class="box-note">
If you're not familiar with the Windows <a href="https://blogs.technet.microsoft.com/askcore/2013/03/24/alternate-data-streams-in-ntfs">Alternate Data Streams</a> feature, definitely <a href="https://blog.malwarebytes.com/101/2015/07/introduction-to-alternate-data-streams">read about it</a>. I know it's old but it's very cool. Both from a forensics and an analysis perspective.
</div>

## Understanding how quarantine works

#### Working with quarantined files

To get a feeling of how this works we can download multiple file types - let's say a zipped application and a PDF report, using *both Safari and Chrome*. The ```ls``` command output indicates that a file has extended attributed by the **@** sign after the permissions field:


```bash
$ ls -l KnockKnock_1.9.3.zip
-rw-r--r--@ 1 liv  staff  1752586  3 Apr 20:57 KnockKnock_1.9.3.zip

$ ls -l 2016_human_development_report.pdf
-rw-r--r--@ 1 liv  staff  2959815  3 Apr 20:59 2016_human_development_report.pdf
  ```

Similarly, to view the attributes, use **```-@```** flag or the **```xattr```** command:

```bash
$ ls -l@ KnockKnock_1.9.3.zip
-rw-r--r--@ 1 liv  staff  1752586  3 Apr 20:57 KnockKnock_1.9.3.zip
	com.apple.metadata:kMDItemWhereFroms	    471
	com.apple.quarantine	     64

$ ls -l@ 2016_human_development_report.pdf
-rw-r--r--@ 1 liv  staff  2959815  3 Apr 20:59 2016_human_development_report.pdf
	com.apple.metadata:_kMDItemUserTags	     42
	com.apple.metadata:kMDItemWhereFroms	    198
	com.apple.quarantine	     64
  
$ xattr 2016_human_development_report.pdf
com.apple.metadata:_kMDItemUserTags
com.apple.metadata:kMDItemWhereFroms
com.apple.quarantine
```

To remove the attribute, use the **_```xattr -d```_** command. IF you're dealing with _```.app```_ files, which is basically a directory, the **-r** flag is needed to recursively remove the flag for all the containing files:

```bash
xattr -d com.apple.quarantine 2016_human_development_report.pdf
[21:18] ~ xattr 2016_human_development_report.pdf
com.apple.FinderInfo
com.apple.metadata:_kMDItemUserTags
com.apple.metadata:kMDItemWhereFroms
```

#### Get more details using sqlite

#### How they are created



