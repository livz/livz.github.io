---
title: DMG Images
layout: tip
date: 2017-08-07
categories: [Internals]
published: no
---

## Overview

[*__Universal binaries__*](https://en.wikipedia.org/wiki/Universal_binary) are executables or application bundles that run natively on PowerPC or 32/64 bit Macintosh computers. They are larger in size (hence the name **_fat binaries_**) since they contain code compiled for multiple architectures. However, they contain library code shared between architectures so the total size is still less than the sum of individual binaries for each arch.

## How to work with fat binaries

### Compilation

To create a fat binary, simply specify the architectures to compile for:
```bash
$ gcc -o hello -arch i386 -arch x86_64 hello.c
$ file hello
hello: Mach-O universal binary with 2 architectures: [i386:Mach-O executable i386] [x86_64:Mach-O 64-bit executable x86_64]
hello (for architecture i386):	Mach-O executable i386
hello (for architecture x86_64):	Mach-O 64-bit executable x86_64
```

### View

To view the header containing the information for all architectures, use ```otool (1)```:
```bash
$ otool -f hello
Fat headers
fat_magic 0xcafebabe
nfat_arch 2
architecture 0
    cputype 7
    cpusubtype 3
    capabilities 0x0
    offset 4096
    size 8416
    align 2^12 (4096)
architecture 1
    cputype 16777223
    cpusubtype 3
    capabilities 0x80
    offset 16384
    size 8432
    align 2^12 (4096)
```

```lipo``` tool is more friendly and displays human readable information for the fields above:

```bash
$ lipo -detailed_info hello
Fat header in: hello
fat_magic 0xcafebabe
nfat_arch 2
architecture i386
    cputype CPU_TYPE_I386
    cpusubtype CPU_SUBTYPE_I386_ALL
    offset 4096
    size 8416
    align 2^12 (4096)
architecture x86_64
    cputype CPU_TYPE_X86_64
    cpusubtype CPU_SUBTYPE_X86_64_ALL
    offset 16384
    size 8432
    align 2^12 (4096)
```

### Force a specific architecture

To force a specific arch to be loaded when launching the binary, use ```arch (1)``` tool:
```bash
$ arch -i386 ./hello
hello world!
$ arch -x86_64 ./hello
hello world!
```

## References
* [Playing with Mach-O binaries and dyld](https://blog.lse.epita.fr/articles/82-playing-with-mach-os-and-dyld.html)
