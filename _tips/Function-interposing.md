---
title: Function Interposing
layout: tip
date: 2018-01-10
---

## Overview

* In the Linux world, the ```LD_PRELOAD``` environment variable can be set to the path of a shared object, that will be loaded at runtime _**before any other library**_ (including the C runtime, ```libc.so```). 
* This mechanism can be used both for good and bad purposes, from inspecting program memory and adding trace logs to inject nefarious code into applications.
* To prevent privilege escalation using ```suid``` binaries, **the loader ignores the ```LD_PRELOAD``` variable if _real user id_ is different than the _effective user id_**. 
* [This blog](https://rafalcieslak.wordpress.com/2013/04/02/dynamic-linker-tricks-using-ld_preload-to-cheat-inject-features-and-investigate-programs) has a working example showing how this trick works for Linux. 
* MacOS loader supports a similar feature called _**function interposing**_.

## How it works

* The technique was described in [Mac OS X Internals: A Systems Approach (2006)](https://www.amazon.co.uk/Mac-OS-Internals-Approach-paperback/dp/0321278542) and [Mac OS X and iOS Internals: To the Apple's Core (2013)](https://www.amazon.com/Mac-OS-iOS-Internals-Apples/dp/1118057651). 
* In a nutshell, function interposing is done by specifying a _dylib library_ we want to _interpose_ in the ```DYLD_INSERT_LIBRARIES``` environment variable.
* We also need to enable ```DYLD_FORCE_FLAT_NAMESPACE```. as described in [```dyld (1)``` man page](https://developer.apple.com/legacy/library/documentation/Darwin/Reference/ManPages/man1/dyld.1.html):

```
DYLD_INSERT_LIBRARIES
  This  is  a colon separated list of dynamic libraries to load before the ones specified in the
  program.  This lets you test new modules of existing dynamic shared libraries that are used in
  flat-namespace images by loading a temporary dynamic shared library with just the new modules.
  Note that this has no effect on images built a two-level  namespace  images  using  a  dynamic
  shared library unless DYLD_FORCE_FLAT_NAMESPACE is also used.
              
DYLD_FORCE_FLAT_NAMESPACE
  Force all images in the program to be linked as flat-namespace images and ignore any two-level
  namespace bindings.  This may cause programs to fail to execute with a multiply defined symbol
  error if two-level namespace images are used to allow the images to have multiply defined symbols.
  bols.
```

### Example

* The program below prints six random lucky numbers:

```c
#include <stdio.h>
#include <stdlib.h>
#include <time.h>

int main(){
    srand(time(NULL));
    
    int i = 0;
    while(i<6)
        printf("Lucky number %d: %d\n", ++i, rand() % 100);
    
    return 0;
}
```

```bash
$ ./genRand
Lucky number 1: 19
Lucky number 2: 53
Lucky number 3: 0
Lucky number 4: 22
Lucky number 5: 5
Lucky number 6: 43
```
* The code for our library containing the function(s) to interpose:

```c
#include <stdio.h>
#include <unistd.h>
#include <dlfcn.h>

/*
 * Compile with:
 * $ gcc -Wall -o myRandLib.dylib -dynamiclib myRandLib.c
 *
 * Test with:
 * $ gcc -o genRand genRand.c
 * $ DYLD_FORCE_FLAT_NAMESPACE=1 DYLD_INSERT_LIBRARIES=myRandLib.dylib ./genRand
 *
 */

// Override original rand() function
int rand(void)
{
    return 42;
}

```
* Finally, let's test using the two environment variables from above:
```bash
$ gcc -Wall -o myRandLib.dylib -dynamiclib myRandLib.c
$ DYLD_FORCE_FLAT_NAMESPACE=1 DYLD_INSERT_LIBRARIES=myRandLib.dylib ./genRand
Lucky number 1: 42
Lucky number 2: 42
Lucky number 3: 42
Lucky number 4: 42
Lucky number 5: 42
Lucky number 6: 42
```

## References
* [Using LD_PRELOAD to cheat, inject features and investigate programs](https://rafalcieslak.wordpress.com/2013/04/02/dynamic-linker-tricks-using-ld_preload-to-cheat-inject-features-and-investigate-programs)
