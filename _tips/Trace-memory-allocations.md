---
title: Trace Dynamic Memory Allocations
layout: tip
date: 2017-11-18
---

## Overview

In this post we'll cover two MacOS applications, part of Xcode Developer Tools, which can be extremely useful to track memory allocations and leaks - **```malloc_history```** and **```leaks```**. 

#### ```malloc_history```

**```malloc_history```** provides a detailed account of __*every memory allocation that occurred in the process*__, including allocations by ```dyld```.  ```malloc_history``` relies on information provided by the standard ```malloc``` library when ```malloc``` stack logging has been enabled for the target process (for example  by setting the ```MallocStackLogging``` environment variable).


To show all allocations currently live in a process, use **```–allBySize```** or **```–allByCount```** flags:

```bash
$ MallocStackLogging=1 open /Applications/Safari.app

$ ps axu | grep Safari.app
m  4828   0.0  3.0  3788332  61888   ??  S     5:56pm   0:02.23 /Applications/Safari.app/Contents/MacOS/Safari    

$ malloc_history 4828 -allBySize
alloc_history Report Version:  2.0
Process:         Safari [4828]
Path:            /Applications/Safari.app/Contents/MacOS/Safari
Load Address:    0x10229d000
Identifier:      com.apple.Safari
Version:         11.0.2 (12604.4.7.1.4)
Build Info:      WebBrowser-7604004007001004~1
Code Type:       X86-64
Parent Process:  ??? [1]

Date/Time:       2018-03-20 19:56:27.939 +0000
Launch Time:     2018-03-20 17:56:02.600 +0000
OS Version:      Mac OS X 10.12.6 (16G1114)
Report Version:  7
Analysis Tool:   /usr/bin/malloc_history
----

2 calls for 1003520 bytes: thread_700005856000 | start_wqthread | _pthread_wqthread | _dispatch_worker_thread3 | _dispatch_root_queue_drain | _dispatch_queue_override_invoke | _dispatch_queue_invoke | _dispatch_queue_serial_drain | _dispatch_client_callout | _dispatch_call_block_and_release | __63-[ClosedTabOrWindowStateManager performDelayedLaunchOperations]_block_invoke | -[ClosedTabOrWindowStateManager _loadRecentlyClosedTabsOrWindowsFromDisk] | -[BrowserTabPersistentState initWithDictionaryRepresentation:encryptionProvider:] | -[KeychainEncryptionProvider decryptData:] | +[NSMutableData(NSMutableData) dataWithLength:] | -[NSConcreteMutableData initWithLength:]
[..]
```

To include _**deallocations**_ as well, use  **```-allEvents```** flag. 

Another interesting usage is with the **```-callTree```** option, which generates a ```call tree of the backtraces of malloc calls``` for all live allocations in the target process:

```bash
$ malloc_history 4828 -callTree -showContent
Process:         Safari [4828]
Path:            /Applications/Safari.app/Contents/MacOS/Safari
Load Address:    0x10229d000
Identifier:      com.apple.Safari
Version:         11.0.2 (12604.4.7.1.4)
Build Info:      WebBrowser-7604004007001004~1
Code Type:       X86-64
Parent Process:  ??? [1]

Date/Time:       2018-03-20 20:01:48.869 +0000
Launch Time:     2018-03-20 17:56:02.600 +0000
OS Version:      Mac OS X 10.12.6 (16G1114)
Report Version:  7
Analysis Tool:   /usr/bin/malloc_history
----

Call graph:
    76221 (13.0M) << TOTAL >>
      57934 (7.82M) Thread_ec1f13c1
      + 56356 (7.50M) start  (in libdyld.dylib) + 1  [0x7fffe32d4235]
      + ! 45992 (6.13M) NSApplicationMain  (in AppKit) + 1237  [0x7fffcb604e0e]
      + ! : 41313 (4.84M) -[NSApplication run]  (in AppKit) + 926  [0x7fffcb63a3db]
      + ! : | 41313 (4.84M) -[BrowserApplication nextEventMatchingMask:untilDate:inMode:dequeue:]  (in Safari) + 252  [0x10235c686]
      + ! : |   41306 (4.84M) -[NSApplication(NSEvent) _nextEventMatchingEventMask:untilDate:inMode:dequeue:]  (in AppKit) + 2796  [0x7fffcbdc17ee]
      + ! : |   + 23726 (2.89M) _DPSNextEvent  (in AppKit) + 1833  [0x7fffcb645d1d]
[..]
```

#### ```leaks```

The **```leaks (1)```** tool walks the process heap to detect suspected memory leaks. It looks for pointers which have been allocated but not freed. For example, taking the same Safari instance from above, we can see there are no leaks. _Nice!_

```bash
$ leaks 4828
Process:         Safari [4828]
Path:            /Applications/Safari.app/Contents/MacOS/Safari
Load Address:    0x10229d000
Identifier:      com.apple.Safari
Version:         11.0.2 (12604.4.7.1.4)
Build Info:      WebBrowser-7604004007001004~1
Code Type:       X86-64
Parent Process:  ??? [1]

Date/Time:       2018-03-20 20:05:07.732 +0000
Launch Time:     2018-03-20 17:56:02.600 +0000
OS Version:      Mac OS X 10.12.6 (16G1114)
Report Version:  7
Analysis Tool:   /usr/bin/leaks
----

leaks Report Version:  2.0
Process 4828: 76238 nodes malloced for 13288 KB
Process 4828: 0 leaks for 0 total leaked bytes.
```

### Practice 

To make sure it works as expected, let's build a simple program to check:

```bash
#include <stdio.h>
#include <stdlib.h>

void doLeak() {
    char *c = malloc(256);
}

int main(int argc, char *argv[]) {
    int i = 0;
    while(i++ < 3)
        doLeak();

    getchar();        // Wait for key press

    return 0;
}
```

Compile, launch and verify:

```bash
$ clang leaky.c -o leaky

$ ./leaky

$ ps axu | grep leaky
m    4976   0.0  0.0  2432780    636 s002  S+    8:13pm   0:00.00 ./leaky

$ leaks 4976
Process:         leaky [4976]
Path:            /Users/m/leaky
Load Address:    0x103ea0000
Identifier:      leaky
Version:         ???
Code Type:       X86-64
Parent Process:  zsh [4329]

Date/Time:       2018-03-20 20:13:58.547 +0000
Launch Time:     2018-03-20 20:13:27.793 +0000
OS Version:      Mac OS X 10.12.6 (16G1114)
Report Version:  7
Analysis Tool:   /usr/bin/leaks
----

leaks Report Version:  2.0
Process 4976: 157 nodes malloced for 17 KB
Process 4976: 3 leaks for 768 total leaked bytes.
Leak: 0x7fec8b4025d0  size=256  zone: DefaultMallocZone_0x103ea5000
	0x00000000 0xd0000000 0x00000000 0xd0000000 	................
	0xec080010 0x00007fff 0xe29e308f 0x00007fff 	.........0......
	0xec0870c8 0x00007fff 0xe29e3095 0x00007fff 	.p.......0......
	0xec087168 0x00007fff 0xe29fac2b 0x00007fff 	hq......+.......
	0x00000000 0x00000000 0x00000000 0x00000000 	................
	0x00000000 0x00000000 0x00000000 0x00000000 	................
	0x00000000 0x00000000 0x00000000 0x00000000 	................
	0x00000000 0x00000000 0x00000000 0x00000000 	................
[..]
```

_As expected, the unallocated memory locations (```256*3=768``` bytes) were correctly detected!_
