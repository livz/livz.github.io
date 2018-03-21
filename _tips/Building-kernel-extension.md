---
title: Building A Kernel Extension
layout: tip
date: 2017-12-08
---

## Overview

This post goes step by step through the process of bulding a simple kernel extension for MacOS High Sierra, using Xcode. This should, hopefully, be educational for anyone with an interest in MacOS security even if not on the kernel level.

## Step by step

* Open Xcode and create a new project. From the _Templates_ window, select _MacOS → Generic Kernel Extension_. In the next screen, select a product name and organisation identifier, as below:

![newkext](/assets/images/tips/newkext.png)
* In the next screen, select the location for your project and optionally source code versioning. Once the project is created, open the only source file, _```mykext.c```_ and paste the following code:

```c
//
//  My first kernel extension
//

#include <mach/mach_types.h>
#include <libkern/libkern.h>

kern_return_t mykext_start(kmod_info_t * ki, void *d);
kern_return_t mykext_stop(kmod_info_t *ki, void *d);

kern_return_t mykext_start(kmod_info_t * ki, void *d)
{
    printf("Hello World!\n");
    
    return KERN_SUCCESS;
}

kern_return_t mykext_stop(kmod_info_t *ki, void *d)
{
    printf("Goodbye World!\n");
    
    return KERN_SUCCESS;
}
```
* Build the project using the shortcut **⌘+ B** or from the menu by going to _Product → Build_. You should get a _"Build succeded"_ message.
* Find out the location of the final ```.kext``` file by selecting it under _Products_ and the full path will be displayed in the _Identity and Type_ panel on the right side of the screen:

![kextpath](/assets/images/tips/kextpath.png)
* Let's see what happens when we try to load the extension:

```bash
$ cd /Users/m/Library/Developer/Xcode/DerivedData/mykext-cmdafbbungdvopampwipyggeenhm/Build/Products/Debug/
$ sudo kextload mykext.kext
/Users/m/Library/Developer/Xcode/DerivedData/mykext-cmdafbbungdvopampwipyggeenhm/Build/Products/Debug/mykext.kext failed to load - (libkern/kext) validation failure (plist/executable); check the system/kernel logs for errors or try kextutil(8).
```
* We still have a few issues to solve before being able to load the extension, as highlighted by ```kextutil```:

```bash
$ kextutil -n -t mykext.kext
mykext.kext is invalid; can't resolve dependencies.
mykext.kext is invalid; can't resolve dependencies.
mykext.kext is invalid; can't resolve dependencies.
Diagnostics for mykext.kext:
Validation Failures:
    Info dictionary property value is illegal:
        OSBundleLibraries
    Info dictionary missing required property/value:
        OSBundleLibraries

Authentication Failures:
    File owner/permissions are incorrect (must be root:wheel, nonwritable by group/other):
        mykext.kext
        Contents
        _CodeSignature
        CodeResources
        Info.plist
        MacOS
        mykext

Code Signing Failure: code signature is invalid
```
* Let's start with the first issue of unresolved dependencies. To find out the libraries needed by a ```kext```, we'll use ```kextlibs```:

```bash
$ kextlibs -xml mykext.kext
	<key>OSBundleLibraries</key>
	<dict>
		<key>com.apple.kpi.libkern</key>
		<string>16.7</string>
	</dict>
```
* Our _Info.plist_ file now doesn't contain any library. Add the library above to the file by replacing

```
	<key>OSBundleLibraries</key>
	<dict/>
```
with:

```
	<key>OSBundleLibraries</key>
	<dict>
		<key>com.apple.kpi.libkern</key>
		<string>16.7</string>
	</dict>
```
* Re-build the project and re-run ```kextutil```:
```bash
$ kextutil -n -t mykext.kext
Diagnostics for mykext.kext:
Authentication Failures:
    File owner/permissions are incorrect (must be root:wheel, nonwritable by group/other):
        mykext.kext
        Contents
        _CodeSignature
        CodeResources
        Info.plist
        MacOS
        mykext

Code Signing Failure: code signature is invalid
```
* Let's ignore the code signing for now and focus on fixing the permissions as indicated in the error message:

```bash
$ sudo chown -R root:wheel  mykext.kext

$ sudo chmod -R 0644 mykext.kext

$ kextutil -n -t mykext.kext
mykext.kext has no Info.plist file.
```
* We should be good to go now. Check that the loading works as expected, then unload the extension:

```bash
$ sudo kextload mykext.kext

$ sudo dmesg | tail
[..]
+-IOAudioEngine[<ptr>]::setState(0x0. oldState=0)
Hello World!

$ kextstat| grep mykext
111    0 0xffffff7f82531000 0x2000     0x2000     com.osxfun.mykext (1) 0FA408C5-387C-30AC-95D2-77938717C21E <4>
  
$ sudo kextunload -b com.osxfun.mykext

$ sudo dmesg | tail
[..]
+-IOAudioEngine[<ptr>]::setState(0x0. oldState=0)
Hello World!
Goodbye World!
```
