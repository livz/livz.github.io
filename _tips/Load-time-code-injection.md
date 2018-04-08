---
title: Code Injection (Load-Time)
layout: tip
date: 2018-01-12
categories: [Internals]
published: true
---

## Overview

* After playing with [function interposing](http://craftware.xyz/tips/Function-interposing.html) to backdoor the random number generator, I wanted to apply the same  *__load-time code injection__* technique to a proper Objective-C application.
* Although there is very little information available, I found [this very detailed article](https://blog.timac.org/2012/1218-simple-code-injection-using-dyld_insert_libraries) from 2012. Surprisingly, after downloading the two Xcode projects (the launcher and the dynamic library) the injection was still working on macOS Sierra.
* In this post I'll walk through the process of understanding how this works under the hood, to be able to apply this technique to any application.

## Walkthrough

### Locate the function to be overwritten

I'll replace the same function as the one from the original guide: ```showAbout```. Ida Pro with [Hex-Rays Decompiler](https://www.hex-rays.com/products/decompiler) shows its implementation nicely:

```c
void __cdecl -[CalculatorController showAbout:](CalculatorController *self, SEL a2, id a3)
{
  void *v3; // rax

  v3 = objc_msgSend(
         &OBJC_CLASS___NSDictionary,
         "dictionaryWithObject:forKey:",
         CFSTR("2000"),
         CFSTR("CopyrightStartYear"));
  NSShowSystemInfoPanel((__int64)v3);
}
```

Similarly, we could use [class-dump](http://stevenygard.com/projects/class-dump) to view its signature and static load address (_before ASLR!_):

```bash
$ class-dump -A /Applications/Calculator.app | grep showAbout
- (void)showAbout:(id)arg1;	// IMP=0x00000001000098ae
```

### Debugging

Although not strictly necessary, let's see how to debug the Calculator app with ```LLDB``` and break at our desired function. 

#### Roabblock #1 - SIP
Because of SIP (System Integrity Protection), we cannot attach to the process, which is considered a system application:

```bash
$ lldb /Applications/Calculator.app
(lldb) target create "/Applications/Calculator.app"
Current executable set to '/Applications/Calculator.app' (x86_64).
(lldb) run
error: process exited with status -1 (cannot attach to process due to System Integrity Protection)
```

To work around this, [disable SIP](http://craftware.xyz/tips/Disable-rootless.html) and try again:

```
$ lldb /Applications/Calculator.app
(lldb) target create "/Applications/Calculator.app"
Current executable set to '/Applications/Calculator.app' (x86_64).
(lldb) run
Process 398 launched: '/Applications/Calculator.app/Contents/MacOS/Calculator' (x86_64)
```

#### Roadblock #2 - No symbols
All good so far, but we haven't actually done anything yet. The command below searches a symbol using regular expressions, but nothing is found:

```bash
(lldb) target modules lookup -r -n load showAbout
warning: Unable to find an image that matches 'showAbout'.
```

Nothing to worry about since we know the address of the function from Ida static analysis - ```0x00000001000098AE```.  Let's disassemble the code from that address and see it matches the code disassembled by Ida:

```bash
(lldb) disassemble --start-address 00000001000098AE
Calculator`___lldb_unnamed_symbol160$$Calculator:
0x1000098ae <+0>:  pushq  %rbp
0x1000098af <+1>:  movq   %rsp, %rbp
0x1000098b2 <+4>:  movq   0x1f58f(%rip), %rdi       ; (void *)0x0000000000000000
0x1000098b9 <+11>: movq   0x1eab0(%rip), %rsi       ; "dictionaryWithObject:forKey:"
0x1000098c0 <+18>: leaq   0x15319(%rip), %rdx       ; @"2000"
0x1000098c7 <+25>: leaq   0x15332(%rip), %rcx       ; @"CopyrightStartYear"
```

The function name ```___lldb_unnamed_symbol160$$Calculator``` means that LLDB was unable to read the symbols for that module. We can set a breakpoint here anyway:

```bash
(lldb) breakpoint set --name ___lldb_unnamed_symbol160$$Calculator
Breakpoint 2: where = Calculator`___lldb_unnamed_symbol160$$Calculator, address = 0x00000001000098ae

(lldb) breakpoint list
Current breakpoints:
1: name = '___lldb_unnamed_symbol160$$Calculator', locations = 1
  1.1: where = Calculator`___lldb_unnamed_symbol160$$Calculator, address = 0x00000001000098ae, unresolved, hit count = 0
 ```
 
As an alternative to see what symbol is located at a specific address, we could have used the **```image lookup```** command as below and get the same result:

```bash
(lldb) image lookup --address 0x00000001000098ae
      Address: Calculator[0x00000001000098ae] (Calculator.__TEXT.__text + 32810)
      Summary: Calculator`___lldb_unnamed_symbol160$$Calculator
```

#### Backtrace

With the breakpoint in place, I wanted to see the stack trace when the ```showAbout``` function is called:

```bash
(lldb) thread backtrace
* thread #1, queue = 'com.apple.main-thread', stop reason = breakpoint 2.1
  * frame #0: 0x00000001000098ae Calculator`___lldb_unnamed_symbol160$$Calculator
    frame #1: 0x00007fffd1a053a7 libsystem_trace.dylib`_os_activity_initiate_impl + 53
    frame #2: 0x00007fffba2c1721 AppKit`-[NSApplication(NSResponder) sendAction:to:from:] + 456
    frame #3: 0x00007fffb9d94666 AppKit`-[NSMenuItem _corePerformAction] + 324
    frame #4: 0x00007fffb9d943d2 AppKit`-[NSCarbonMenuImpl performActionWithHighlightingForItemAtIndex:] + 114
    [..]
```

<div class="box-note">
You might be wondering why there was no ASLR, why the static address found in Ida was the same in LLDB. The reason is that by default, to ease the debugging process, LLDB loaded the binary with address space layout randomization <b>turned off</b>. 
<br /><br />
Check <a target="_blank" href="http://craftware.xyz/tips/Test-ASLR.html">this tip</a> to make sure ASLR is working as expected!
</div>

### Objective-C *Hello World!*

Before building the library, in case you're not very familiar with Objective-C, here's a short program that displays a message box:

```c
#import <AppKit/AppKit.h>

int main (int argc, const char * argv[])
{
  NSAlert *alert = [[NSAlert alloc] init];
  [alert setMessageText:@"Some code was executed here!"];
  [alert runModal];

  return 0;
}
```

Compile and test with:

```bash
$ clang -framework AppKit hello.m -o hello
```

### Objective-C library

I've stripped the projects down to one source file to make it easier to follow and understand. I've defined the ```Hello_Lib``` interface in the ```hello_lib.h```:

```c
#import <Foundation/Foundation.h>

@interface Hello_Lib : NSObject

- (void)patchedShowAbout:(id)sender;

@end
```

And the implementation with a few changes in the ```hello_lib.m``` file:

```c
#import "Hello_Lib.h"

#include <objc/runtime.h>
#include <AppKit/AppKit.h>

@implementation Hello_Lib

static IMP sOriginalImpl = NULL;

+ (void)load
{
  // Replace the method -[CalculatorController showAbout:]
  Class originalClass = NSClassFromString(@"CalculatorController");
  Method originalMethod = class_getInstanceMethod(originalClass, @selector(showAbout:));
  sOriginalImpl = method_getImplementation(originalMethod);

  Method replacementMethod = class_getInstanceMethod(self, @selector(patchedShowAbout:));
  method_setImplementation(originalMethod, method_getImplementation(replacementMethod));

  NSLog(@"%@", [NSThread callStackSymbols]);
}

- (void)patchedShowAbout:(id)sender
{
  NSLog(@"%@", [NSThread callStackSymbols]);

  NSAlert *alert = [[NSAlert alloc] init];
  [alert setMessageText:@"Some code was executed here!"];
  [alert runModal];

  // Call original method implementation
  sOriginalImpl(self, @selector(showAbout:), self);
}

@end
```

That's all we need to successfully test the dylib injection. Compile and test it:

```bash
$ clang -framework AppKit -o hello_lib.dylib -dynamiclib hello_lib.m
$ DYLD_INSERT_LIBRARIES=hello_lib.dylib /Applications/Calculator.app/Contents/MacOS/Calculator
```

Notice the key function here - [_method_setImplementation_](https://developer.apple.com/documentation/objectivec/1418707-method_setimplementation?language=objc) which is use to replace the implementation of the original ```showAbout``` function with out own.

### Down the rabbit hole

Starting from the _CalculatorLauncher_ and _CalculatorOverrides_ projects, we'll create a library to perform code injection and compile it manually. In the [previous post](http://craftware.xyz/tips/Function-interposing.html) we've replaced a simple C function. Now we want to replace the function ```showAbout``` from class ```CalculatorController```. 

To make things easier, we could print a stacktrace in the ```load``` function, which performs the method substitution in the original project. Add the line below and recompile:

```c
  NSLog(@"%@", [NSThread callStackSymbols]);
```

It's clear what's happening. The loader calls ```load_images```, which in turn calls a method named **```load```** from every class:

```bash
DYLD_INSERT_LIBRARIES=hello_lib.dylib /Applications/Calculator.app/Contents/MacOS/Calculator
2018-04-07 21:15:01.861 Calculator[1556:74348] (
	0   hello_lib.dylib                     0x000000010ceddd9d +[Hello_Lib load] + 157
	1   libobjc.A.dylib                     0x00007fffd0ee1e12 call_load_methods + 708
	2   libobjc.A.dylib                     0x00007fffd0ededca load_images + 70
  [..]
```

#### How come?

Let's dig deeper and disassemble the ```call_load_methods``` function from ```libobjc.A.dylib``` in Ida. The code snippet below goes through a list of **_loadable classes_** and calls the *load()* method from each:

<img src="/assets/images/tips/loadable_classes.png" alt="Loadable classes" class="figure-body">

If we search for cross-references for the ```loadable_classes``` variable, we can see it is being built in the ```add_class_to_loadable_list``` function: 

<img src="/assets/images/tips/load_method.png" alt="Building list of loadable classes" class="figure-body">

#### Loadable classes

**Q:** What are loadable classes? And what classes are usually loaded when we launch the Calculator app?

**A:** _libobjc_ library supports a lot of debugging related environment variables. To view a list of all of them, set **```OBJC_PRINT_LOAD_METHODS```** as below.

```bash
$ OBJC_HELP=YES /Applications/Calculator.app/Contents/MacOS/Calculator
objc[1611]: Objective-C runtime debugging. Set variable=YES to enable.
objc[1611]: OBJC_HELP: describe available environment variables
objc[1611]: OBJC_PRINT_OPTIONS: list which options are set
objc[1611]: OBJC_PRINT_IMAGES: log image and library names as they are loaded
objc[1611]: OBJC_PRINT_IMAGE_TIMES: measure duration of image loading steps
objc[1611]: OBJC_PRINT_LOAD_METHODS: log calls to class and category +load methods
objc[1611]: OBJC_PRINT_INITIALIZE_METHODS: log calls to class +initialize methods
objc[1611]: OBJC_PRINT_RESOLVED_METHODS: log methods created by +resolveClassMethod: and +resolveInstanceMethod:
[..]
```

Of particular interest in this case is **```OBJC_PRINT_LOAD_METHODS```**.

Another way we could have easily found this environment variable by cross-referencing the ```PrintLoading``` variable from the code above:
<img src="/assets/images/tips/print_loading.png" alt="Print load methods" class="figure-body">

We know now how to view al lthe classes sheduled to be loaded:

```bash
$ OBJC_PRINT_LOAD_METHODS=YES DYLD_INSERT_LIBRARIES=hello_lib.dylib /Applications/Calculator.app/Contents/MacOS/Calculator
[..]
objc[1620]: LOAD: class 'Hello_Lib' scheduled for +load
objc[1620]: LOAD: +[Hello_Lib load]
```

### Demo time

Start the Calculator with our custom library, then go to _Calculator → About Calculator_:

```bash
$ DYLD_INSERT_LIBRARIES=hello_lib.dylib /Applications/Calculator.app/Contents/MacOS/Calculator
```

<img src="/assets/images/tips/demo.png" alt="Code injection!" class="figure-body">

## Summary

Since this post turned out a bit longer than expected, here's a recap of the most interesting things:

* Load time code injection can be done easily with **```DYLD_INSERT_LIBRARIES```**.
* We've seen how to replace native C functions and also Objective-C  class methods.
* LLDB loads binaries with ASLR turned off.
* ```dyld``` loader looks for a method called ```load``` in all loadable classes.
* Another useful environment variable is **```OBJC_PRINT_LOAD_METHODS```** which shows all the classes scheduled for load.
* There are usually more than one way to go about solving reverse engineering problems!
* Code injection is cool!
* We didn't cover run-time code injection. This will be the subject of another post.
