---
title: Code Signing
layout: tip
date: 2017-09-30
---

## Overview

* Apple uses a special language to define code signing requirements. ```csreq (1)``` is a command-line tool to manipulate requirements directly. 
* ```codesign (1)``` command-line tool allows developers to sign their apps and to display existing signatures.
* A valid, trusted certificate is needed to sign your app. This can be obtained by registering as a Developer with Apple's Developer Program.

## Work with signatures

#### Display app signature

```bash
$ codesign --display --verbose=4 /Applications/Siri.app
Executable=/Applications/Siri.app/Contents/MacOS/Siri
Identifier=com.apple.siri.launcher
Format=app bundle with Mach-O thin (x86_64)
CodeDirectory v=20100 size=264 flags=0x0(none) hashes=3+3 location=embedded
Platform identifier=2
OSPlatform=36
OSSDKVersion=658432
OSVersionMin=658432
Hash type=sha256 size=32
CandidateCDHash sha256=533c83f3ab50c68c8b3922c91d6e610433612bbf
Hash choices=sha256
Page size=4096
CDHash=533c83f3ab50c68c8b3922c91d6e610433612bbf
Signature size=4105
Authority=Software Signing
Authority=Apple Code Signing Certification Authority
Authority=Apple Root CA
Info.plist entries=24
TeamIdentifier=not set
Sealed Resources version=2 rules=12 files=2
Internal requirements count=1 size=72
```

#### Verify application soignature

```bash
$ codesign --verify --verbose=4 /Applications/Siri.app
/Applications/Siri.app: valid on disk
/Applications/Siri.app: satisfies its Designated Requirement
```

## Resources
[Code Signing Requirement Language](https://developer.apple.com/library/content/documentation/Security/Conceptual/CodeSigningGuide/RequirementLang/RequirementLang.html)
