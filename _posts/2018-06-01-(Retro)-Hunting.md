---
title: (Retro) Hunting
layout: post
date: 2018-06-01
published: true
categories: [Security]
---

![Logo](/assets/images/hunt-logo.png)

# Retro-hunting for macOS process injection

## Overview
* In this [post]({% capture itemLink %}{% include findCollectionItem.html collectionName='tips' itemTitle='Code Injection (Run-Time)' %}{% endcapture %}{{ itemLink | strip_newlines }}) we've seen how to do run-time code injection on macOS up to the newest version 10.13. Because there are very limited resources online on how to do that (comapred to Windows/Linux), it's easier to find samples based on string patterns.

* 
[VirusTotal retrohunting](https://www.virustotal.com/intelligence/hunting/). To access this feature go to Intelligence →  Hunting →  Retrohunt
Search for code injections samples
### Vt hunt - how it works + yara rule;
### Mach_inject results

## Sample: detections + analysis https://www.virustotal.com/intelligence/search/?query=ab740081c549e00d41066e631a01c5e46a78a05730f830312ab36e7dc7e41ea9 

## Conclusions: retrohunt is very cool. No comment about the FPs?


```conf
private rule Macho
{
    meta:
        description = "private rule to match Mach-O binaries"
    condition:
        uint32(0) == 0xfeedface or uint32(0) == 0xcefaedfe or uint32(0) == 0xfeedfacf or uint32(0) == 0xcffaedfe or uint32(0) == 0xcafebabe or uint32(0) == 0xbebafeca

}

rule mach_inject {
    meta:
        author = "liviu - keemail - me"
        date = "2018-05-28"
        description = "Looks for process injection based on mach_inject project"
        share_level = "green"
        confidence = "high"
        reference_hash = "b00d55dbf45387e81d5d28adc4829e639740eda1"

    strings:
        $inject1 = "mach_inject"
        $inject2 = "bootstrap.dylib"
        $func1 = "vm_allocate"
        $func2 = "vm_deallocate"
        $func3 = "vm_protect"
        $func4 = "vm_write"

    condition:
        Macho and any of ($inject*) and any of ($func*)
}
```
