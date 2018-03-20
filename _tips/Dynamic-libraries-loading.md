---
title: Debugging Dynamic Loaded
layout: tip
date: 2017-11-11
---

## Overview

Another not so well-known environment variable is ```DYLD_PRINT_LIBRARIES```. When set, a program will display all the dynamic libraries as they get loaded. 

To see the names and versions of the shared libraries that a program is linked against, we can use ```otool```:

```bash:
$ otool -L /bin/echo
/bin/echo:
	/usr/lib/libSystem.B.dylib (compatibility version 1.0.0, current version 1238.0.0)
```

Next, let's see all the libraries _as they get loaded_:

```bash
$ DYLD_PRINT_LIBRARIES=1 /bin/echo
dyld: loaded: /bin/echo
dyld: loaded: /usr/lib/libSystem.B.dylib
dyld: loaded: /usr/lib/system/libcache.dylib
dyld: loaded: /usr/lib/system/libcommonCrypto.dylib
[..]
```

If you're wondering why that many libraries got loaded when the original program had only one dependency, the reason is that that dependency loaded other libraries as well. Let's check to make sure:

```bash
$ otool -L /usr/lib/libSystem.B.dylib
/usr/lib/libSystem.B.dylib:
	/usr/lib/libSystem.B.dylib (compatibility version 1.0.0, current version 1238.60.2)
	/usr/lib/system/libcache.dylib (compatibility version 1.0.0, current version 79.0.0)
	/usr/lib/system/libcommonCrypto.dylib (compatibility version 1.0.0, current version 60092.50.5)
[..]
```

## More hidden gems

Other interesting variables that print debug information during the loading process, extracted from the dynamic linker ```dyld``` man page are:

* ```DYLD_PRINT_APIS```: Dump dyld API calls (for example dlopen).
* ```DYLD_PRINT_ENV```: Dump initial environment variables.
* ```DYLD_PRINT_OPTS```: Dump to file descriptor 2 (normally standard error) the command line options.
* ```DYLD_PRINT_INITIALIZERS```: Dump library initialization (entry point) calls.
* ```DYLD_PRINT_LIBRARIES```: Show libraries as they are loaded.
* ```DYLD_PRINT_LIBRARIES_POST_LAUNCH```: Show libraries loaded dynamically, after load.
* ```DYLD_PRINT_SEGMENTS```: Dump segment mapping.
* ```DYLD_PRINT_STATISTICS```: Show runtime statistics.

Let's try a few of them. To view all the segments of the application, including the loaded libraries and their access permissions, enable the ```DYLD_PRINT_SEGMENTS``` variable:

```bash
$ DYLD_PRINT_SEGMENTS=1 /bin/echo hello world
dyld: Main executable mapped /bin/echo
        __PAGEZERO at 0x00000000->0x100000000
            __TEXT at 0x10081D000->0x10081E000
            __DATA at 0x10081E000->0x10081F000
        __LINKEDIT at 0x10081F000->0x100822000
dyld: re-using existing development shared cache mapping
        0x7FFFC874E000->0x7FFFE3546FFF read execute  init=5, max=5
        0x7FFFE7547000->0x7FFFEC200FFF read write  init=3, max=3
        0x7FFFF0201000->0x7FFFF7A15FFF read  init=1, max=1
        0x7FFF9F2C8000->0x7FFF9F7B0000 (code signature)
dyld: Using shared cached for /usr/lib/libSystem.B.dylib
            __TEXT at 0x7FFFE1D2B000->0x7FFFE1D2D000
            __DATA at 0x7FFFEBF70000->0x7FFFEBF702D0
        __LINKEDIT at 0x7FFFF0807000->0x7FFFF7A16000
[..]

hello world
```

To view usefult statistics about the loading process, enable the ```DYLD_PRINT_STATISTICS``` variable:
```bash
[17:42] ~ DYLD_PRINT_STATISTICS=1 /bin/echo hello world
Total pre-main time:   1.06 milliseconds (100.0%)
         dylib loading time:   0.40 milliseconds (37.7%)
        rebase/binding time:   0.04 milliseconds (3.9%)
            ObjC setup time:   0.26 milliseconds (24.8%)
           initializer time:   0.32 milliseconds (30.2%)
           slowest intializers :
             libSystem.B.dylib :   0.24 milliseconds (23.2%)
                libc++.1.dylib :   0.03 milliseconds (3.4%)

hello world
```

