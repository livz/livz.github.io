---
title: Test ASLR (Address Space Layout Randomization)
layout: tip
date: 2017-11-26
categories: [Internals, Security]
---

## Overview

In these four short posts we'll test a few traditional anti-exploitation measures. The experiments below are inspired from the great book [The Mac Hacker's Handbook](https://www.amazon.co.uk/Mac-Hackers-Handbook-Charlie-Miller/dp/0470395362) and are done on a _macOS Sierra_.

To check the other tests, see the links below:
* [Test Stack Smashing Protection](http://craftware.xyz/tips/Stack-police.html)
* [Test Code Execution On The Stack](http://craftware.xyz/tips/Stack-exec.html)
* [Test Code Execution On The Heap](http://craftware.xyz/tips/Heap-exec.html)

#### Test ASLR

The program below tests the randomisation for the following:
* **The stack**, by printing the address of a variable on the stack of ```main``` function.
* **The heap**, by printing a pointer allocated by ```malloc```.
* **The address where the binary gets loaded into memory**, by printing a function address.
* **The location where library functions are loaded**, by printing the address of ```malloc``` function.

```c
#include <stdio.h>
#include <stdlib.h>

void foo(){}

int main(int argc, char *argv[]){
    int y;
    char *x = (char *) malloc(128);
    
    printf("Library functions: %08x, Heap: %08x, Stack: %08x, Binary: %08x\n",
           &malloc, x, &y, &foo);
}
```

And the results:

```bash
$ gcc testAslr.c -o testAslr

$ ./testAslr
Library functions: e34551e8, Heap: 134025d0, Stack: 56608a0c, Binary: 095f7ed0
$ ./testAslr
Library functions: e34551e8, Heap: a64025d0, Stack: 56ac3a0c, Binary: 0913ced0
$ ./testAslr
Library functions: e34551e8, Heap: 85c025d0, Stack: 5a754a0c, Binary: 054abed0
```

## Conclusion

By default, **_heap and stack are randomised_**. So is the address of the binary and all the functions. The address where library functions are loaded is randomised as well at every reboot. To verify this, run the test program again after a restart:

```bash
$ ./testAslr
Library functions: d48b61e8, Heap: f3c025d0, Stack: 57fa6a0c, Binary: 07c59ed0
```
