---
title: Quarantined files
layout: tip
date: 2017-09-24
categories: [Internals]
published: true
---

## Overview

* In a nutshell, the file quarantine feature that was introduced in macOS Leopard 10.5 to protect users from accidentally running applications downloaded from an untrusted source.

<blockquote>
  <p>File Quarantine is a new feature in Leopard designed to protect users from trojan horse attacks. It allows applications which download file content from the Internet to place files in “quarantine” to indicate that the file could be from an untrustworthy source. An application quarantines a file simply by assigning values to one or more quarantine properties which preserve information about when and where the file come from.
<br /><br />
When the Launch Services API is used to open a quarantined file and the file appears to be an application, script, or other executable file type, Launch Services will display an alert to confirm the user understands the file is some kind of application.</p>
  <cite><a target="_blank" href="https://developer.apple.com/library/content/releasenotes/Carbon/RN-LaunchServices/index.html">File Quarantine feature</a>
</cite> </blockquote>

* Starting with macOS Sierra (10.12), this also applies to _any application distributed outside the Mac App Store_.
* Quarantined files have an additional extended attribute, _**com.apple.quarantine**_. 
* Windows applies a [similar restriction](https://www.howtogeek.com/70012/what-causes-the-file-downloaded-from-the-internet-warning-and-how-can-i-easily-remove-it/) for files downloaded from the internet.  It creates an alternate data stream (ADS) for the file, named _```Zone.Identifier```_, which stores information about where the file came from.

<div class="box-note">
If you're not familiar with the Windows <a target="_blank" href="https://blogs.technet.microsoft.com/askcore/2013/03/24/alternate-data-streams-in-ntfs">Alternate Data Streams</a> feature, definitely <a target="_blank" href="https://blog.malwarebytes.com/101/2015/07/introduction-to-alternate-data-streams">read about it</a>. I know it's old but it's very cool. Both from a forensics analysis and an offensive perspective.
</div>

## Working with quarantined files

#### List extended attributes

To get a feeling of how this works we can download multiple file types - let's say a zipped application and a PDF report, using *both Safari and Chrome*. The output of ```_ls_``` command marks files that have extended attributes with the **@** sign after the permissions field:


```bash
$ ls -l KnockKnock_1.9.3.zip
-rw-r--r--@ 1 liv  staff  1752586  3 Apr 20:57 KnockKnock_1.9.3.zip

$ ls -l 2016_human_development_report.pdf
-rw-r--r--@ 1 liv  staff  2959815  3 Apr 20:59 2016_human_development_report.pdf
  ```

Similarly, to view the attributes, use **```-@```** flag with _ls_ or the **```xattr```** command:

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

#### Remove extended attributes

To remove the quarantine (or any other) attribute, use the **_```xattr -d```_** command. IF you're dealing with _```.app```_ files, which are basically directories, the **-r** flag is needed to recursively remove the flag for all the containing files:

```bash
$ xattr -d com.apple.quarantine 2016_human_development_report.pdf
$ xattr 2016_human_development_report.pdf
	com.apple.FinderInfo
	com.apple.metadata:_kMDItemUserTags
	com.apple.metadata:kMDItemWhereFroms
```

<div class="box-warning">
Pre-Yosemite you could permanently disable the warnings befopre launching quarantined files with <b><i>defaults write com.apple.LaunchServices LSQuarantine -bool false</i></b>. In general, this wouldn't have been such a great idea for obvious reasons and now this option is removed!
</div>

#### Create quarantined files

Files created or downloaded by an application that has the **LSFileQuarantineEnabled** flag set to _true_ in the Info.plist will have the _```com.apple.quarantine```_ attribute. By default, the *LSFileQuarantineEnabled* is set to false. For more information about this and other quarantine related flags see [Launch Services Keys](https://developer.apple.com/library/content/documentation/General/Reference/InfoPlistKeyReference/Articles/LaunchServicesKeys.html). Let's verify:

```bash
$ cat /Applications/Safari.app/Contents/Info.plist | grep LSFileQuarantineEnabled -A 1
	<key>LSFileQuarantineEnabled</key>
	<true/>
$ cat /Applications/Google\ Chrome.app/Contents/Info.plist| grep LSFileQuarantineEnabled -A 1
	<key>LSFileQuarantineEnabled</key>
	<true/>
```

#### Get extended information about quarantined files

More information is usually available for quarantined files, including the **_date it was downloaded_**, the **_full URL_**, and in this case the **_browser used_**:

```bash
$ xattr -p com.apple.quarantine  2016_human_development_report-*
2016_human_development_report-Chrome.pdf: 0081;5ac3e719;Google Chrome;D479B87B-CFBF-4B78-8921-7835020E11A1
2016_human_development_report-Safari.pdf: 0083;5ac3e75a;Safari;AEA4EEB7-905C-42C7-BE24-75D4C215ABD0

$ date -r 0x5ac3e719
Tue  3 Apr 2018 21:42:01 BST
$ date -r 0x5ac3e75a
Tue  3 Apr 2018 21:43:06 BST

$ sqlite3 ~/Library/Preferences/com.apple.LaunchServices.QuarantineEventsV2 .dump | grep D479B87B-CFBF-4B78-8921-7835020E11A1
INSERT INTO "LSQuarantineEvent" VALUES('D479B87B-CFBF-4B78-8921-7835020E11A1',544480918.0,'com.google.Chrome','Google Chrome','http://hdr.undp.org/sites/default/files/2016_human_development_report.pdf',NULL,NULL,0,NULL,'http://hdr.undp.org/sites/default/files/2016_human_development_report.pdf',NULL);

$ sqlite3 ~/Library/Preferences/com.apple.LaunchServices.QuarantineEventsV2 .dump | grep AEA4EEB7-905C-42C7-BE24-75D4C215ABD0
INSERT INTO "LSQuarantineEvent" VALUES('AEA4EEB7-905C-42C7-BE24-75D4C215ABD0',544480986.962668,'com.apple.Safari','Safari','http://hdr.undp.org/sites/default/files/2016_human_development_report.pdf',NULL,NULL,0,NULL,'http://hdr.undp.org/sites/default/files/2016_human_development_report.pdf',NULL);
```
