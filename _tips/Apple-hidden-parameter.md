---
title: Secret Apple Parameter
layout: tip
date: 2017-10-21
---

## Overview

Traditionally, applications compiled in C have have access to 3 parameters passed to the ```main``` function:
* ```int argc``` - Numebr of arguments
* ```char *argv[]``` - An array of strings containing the program arguments, ending in a NULL element.
* ```char *envp[]``` - An array of strings containing the environment variables, ending in a NULL element.

But on MacOS, programs actually have access to another parameter - the ```apple``` array of strings, which is passed on the stack as the 4th argument, after the ```envp```.

```c
#include <stdio.h>

int main(int argc, char *argv[], char *envp[], char *apple[]) {
  printf("apple[0] = %s\n", apple[0]);
  return 0;
}
```

Although not documented anywhere, it appears that ```apple[0] contains the full path of the executable being run:

```bash
$ gcc -o apple apple.c

$ ./apple
apple[0] = executable_path=./apple

$ ./Downloads/../apple
apple[0] = executable_path=./Downloads/../apple
```

I wonder what's the purpose of the other elements of the array ?!
