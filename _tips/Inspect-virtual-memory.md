---
title: Inspect Process Virtual memory
layout: tip
date: 2018-01-17
published: true
categories: [Internals]
---

## Overview

* ```vmmap``` command can be used to view the memory layout of a process.
* ```vmmap``` shows the region names, address ranges, permissions (current and maximum), and region details, which include the name of the backing file. 
* The example below, taken from [Mac OS X and iOS Internals: To the Apple's Core (2013)](https://www.amazon.com/Mac-OS-iOS-Internals-Apples/dp/1118057651), prints the address of different memory locations which we'll correlate with with the output of ```vmmap```.

## Demo

```c
#include <stdlib.h>
#include <stdio.h>
#include <unistd.h>

int global_j;
const int ci = 24;

int main (int argc, char **argv)
{
    int local_stack = 0;
    
    char *const_data = "This data is constant";
    char *tiny = malloc (32);            /* allocate 32 bytes */
    char *small = malloc (2*1024);       /* Allocate 2K */
    char *large = malloc (1*1024*1024);  /* Allocate 1MB */
    
    printf ("Text is %p\n", main);
    printf ("Global Data is %p\n", &global_j);
    printf ("Local (Stack) is %p\n", &local_stack);
    printf ("Constant data is %p\n", &ci );
    printf ("Hardcoded string (also constant) are at %p\n", const_data );
    printf ("Tiny allocations from %p\n", tiny );
    printf ("Small allocations from %p\n", small );
    printf ("Large allocations from %p\n", large );
    printf ("Malloc (i.e. libSystem) is at %p\n", malloc );
    
    sleep(100); /* so we can use vmmap on this process before it exits */
}
```

Let'c check the address of various memory locations and then verify their permissions and details with ```vmmap```:

```bash
$ clang memmap.c -o memmap
$ ./memmap
Text is 0x10022ad30
Global Data is 0x10022b030
Local (Stack) is 0x7fff5f9d5a0c
Constant data is 0x10022aeac
Hardcoded string (also constant) are at 0x10022aeb0
Tiny allocations from 0x7fd6a4c025d0
Small allocations from 0x7fd6a5001000
Large allocations from 0x100260000
Malloc (i.e. libSystem) is at 0x7fffc80b41e8
```

With ```-interleaved``` option, ```vmmap``` prints all regions in ascending order of starting address, making it easier to identify them. Below are only the zones corresponding to the test program:

```
$ vmmap -interleaved memmap
REGION TYPE                      START - END             [ VSIZE  RSDNT  DIRTY   SWAP] PRT/MAX SHRMOD PURGE    REGION DETAIL
__TEXT                 000000010022a000-000000010022b000 [    4K     4K     0K     0K] r-x/rwx SM=COW          ...p/blog/memmap
__DATA                 000000010022b000-000000010022c000 [    4K     4K     4K     0K] rw-/rwx SM=COW          ...p/blog/memmap
Stack                  00007fff5f1d6000-00007fff5f9d6000 [ 8192K    20K    20K     0K] rw-/rwx SM=PRV          thread 0
MALLOC_LARGE (reserved 0000000100260000-0000000100360000 [ 1024K     0K     0K     0K] rw-/rwx SM=NUL          DefaultMallocZone_0x10022f000
MALLOC_TINY            00007fd6a4c00000-00007fd6a4d00000 [ 1024K    20K    20K     0K] rw-/rwx SM=PRV          DefaultMallocZone_0x10022f000
MALLOC_SMALL           00007fd6a5000000-00007fd6a5800000 [ 8192K    12K    12K     0K] rw-/rwx SM=PRV          DefaultMallocZone_0x10022f000
__TEXT                 00007fffc80b3000-00007fffc80d2000 [  124K   108K     0K     0K] r-x/r-x SM=COW          ...tem/libsystem_malloc.dylib
```

## Conclusions

* The ```_TEXT``` section is readable and executable, but _not writable_.
* The ```_DATA``` section is readable and writable, but _not executable_. 
* The ```malloc```ed ranges are readable and writable, but _not executable_. 
* An interesting fact, the constant data and hardcoded local strings get stored in the ```_TEXT``` section. That means we should be able to test the shellcode from [this post](http://craftware.xyz/tips/Stack-exec.html) by directly storing it in a local variable:

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

typedef int (*funcPtr)();

int main(int argc, char *argv[]){
    int (*f)();		// Function pointer

    // Infinite loop shellcode
    char *const_data = "\xeb\xfe";

    // Cast to function pointer and execute
    f = (funcPtr)const_data;
    (*f)();
}
```

Let's see:

```bash
$ clang execStack3.c -o execStack3
$ ./execStack3
```

Infinite loop! It worked as expected.
