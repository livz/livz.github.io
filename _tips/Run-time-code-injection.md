---
title: Code Injection (Run-Time)
layout: tip
date: 2018-01-15
categories: [Internals]
published: true
---

## Overview
* In the [previous](http://craftware.xyz/tips/Function-interposing.html) [posts](http://craftware.xyz/tips/Load-time-code-injection.html) we've seen how to do code injection at *load time* using ```DYLD_INSERT_LIBRARIES``` environment variable and *loadable classes* for both simple C applications and complex Objective-C apps. This is very useful but sometimes the application you want to inject into has already been started so we need another approach.
* Similarly to Windows and Linux platforms, it is possible to do run-time code injection in macOS as well. 
* The documentation on this subject if *very* sparse. All of the implementations available online are based on the [mach_inject](https://github.com/rentzsch/mach_inject) project.
* There is also a good side to this lack of documentation. There are limited resources for malware writers as well. Thus, it's easy to locate *possibly malicious* samples online that perform process injection. For example, a quick Virus Total hunt reveals [this sample](https://www.virustotal.com/intelligence/search/?query=b00d55dbf45387e81d5d28adc4829e639740eda1) which, at the time of submission, had only 4 detections. Currently 24/60 vendors detect it. I'm sure, however, there are many other samples (*This will be the subject of another story*).
* Root privileges are needed to play with this project. More on the reason for this later.

## How it works
* There's no need to reinvent the wheel. Better, let's understand how [osxinj project](https://github.com/scen/osxinj/tree/master/osxinj) works, without getting into too many low level details. This project is an amazing resource to understand the internals of process injection. Huge thanks to the [author](https://github.com/scen) and also to the [writer of mach_inject](https://github.com/rentzsch).
* There is a warning on the main page of the *mach_inject* process:

<div class="box-warning">
<i>Please don't file a bug report stating mach_inject is crashing for you when you try to use it -- you have to be hard-core enough to debug the problem yourself.</i>
</div>

* The idea is to *inject bootstrapping code into the target process* that will then invoke ```dyld``` to load any custom library. After writing the bootstrap code into the target process a new thread is spawned, having the function ```bootstrap``` as its enty point. In order to start the thread correctly, ```mach_inject``` function performs the following actions:
   * Allocates space for the stack in the remote process
   * Allocates space for the code in the remote process
   * Create a new thread and launch it. 

* The definition of *mach_inject* function hints at the purpose of its parameters:

```c
mach_error_t mach_inject(
            const mach_inject_entry   threadEntry,
            const void                *paramBlock,
            size_t                    paramSize,
            pid_t                     targetProcess,
            vm_size_t                 stackSize );
```

* Last point before seeing a demo. __*Why are root privileges needed?*__ If we try to perform process injection without *sudo*, we have the following error:

```
Could not access task for pid 800. You probably need to add user to procmod group
```

* Browsing through the code, we can trace this to the ```task_for_pid``` function call. This functions returns the __*mac task*__ corresponding to a process. With a mach task, you can do pretty much anything, including reading and writing a remote process' memory. There is not much documentation about this function online, but [these](https://www.spaceflint.com/?p=150) [articles](https://attilathedud.me/mac-os-x-el-capitan-10-11-and-task_for_pid/) provide a solid starting point.

## Walkthrough

* Downlaod the [osxinj project](https://github.com/scen/osxinj). This includes a test application, test library and the bootstrapping library.

```c
~ git clone https://github.com/scen/osxinj.git
```
* You can use the test app and library or simply create your own. For the test program:

```c
#include <cstdio>
#include <unistd.h>

int main(int argc, char* argv[])
{
    printf("Sleeping!\n");

    sleep(100000000);
    
    return 0;
}
```

```bash
~ clang main.cpp -o testapp
```

* compile testdylib
* compile bootstrap
* move all to one folder and test


## References
* <a href="http://stanleycen.com/blog/2013/mac-osx-code-injection/" target="_blank">Mac OS X code injection & reverse engineering</a>
* <a href="https://github.com/rentzsch/mach_inject" target="_blank">Interprocess code injection for Mac OS X</a>
* <a href="https://www.spaceflint.com/?p=150" target="_blank">Using ptrace on OS X</a>
* <a href="https://attilathedud.me/mac-os-x-el-capitan-10-11-and-task_for_pid/" target="_blank">Mac OS X El Capitan (10.11) and task_for_pid()</a>


