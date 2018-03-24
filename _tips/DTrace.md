---
title: DTrace on Sierra
layout: tip
date: 2018-02-10
published: true
---

## Overview

* In this short post I'll test a few handy examples of the very powerful ```dtrace``` utility. For in-depth explanation check the awesome [DTrace Book](http://www.brendangregg.com/dtracebook/index.html).

From the DTrace [_man page_](https://developer.apple.com/legacy/library/documentation/Darwin/Reference/ManPages/man1/dtrace.1.html):

> The  dtrace  command  is a generic front-end to the DTrace facility.  The command implements a simple
> interface to invoke the D language compiler, the ability to retrieve buffered  trace  data  from  the
> DTrace kernel facility, and a set of basic routines to format and print traced data.
* To enable all features of DTrace on MacOS Sierra, boot into recovery mode and [disable SIP](http://craftware.xyz/tips/Disable-rootless.html), or enable with dtrace:

```bash
$ csrutil enable --without dtrace
```
* This will enable a custom system configuration:

```bash
$ csrutil status
System Integrity Protection status: enabled (Custom Configuration).

Configuration:
	Apple Internal: disabled
	Kext Signing: enabled
	Filesystem Protections: enabled
	Debugging Restrictions: enabled
	DTrace Restrictions: disabled
	NVRAM Protections: enabled
	BaseSystem Verification: enabled
```
* A very important security aspect of DTrace on MacOS Sierra is that __*even with DTrace restrictions disabled, we still won't be able to trace system binaries*__. More on this below.

## Examples

The examples above are adapted for MacOS Sierra from [The Mac Hacker's Handbook  (2009)](https://www.amazon.co.uk/Mac-Hackers-Handbook-Charlie-Miller/dp/0470395362/).

### 1. Hello World!

```c
BEGIN
{
    printf("Hello world");
}
```

```bash
$ sudo dtrace -s hello.d
dtrace: script 'hello.d' matched 1 probe
CPU     ID                    FUNCTION:NAME
  0      1                           :BEGIN Hello world
```

### 2. File monitoring

The following script traces all executables to find out who opens a specific file. DTrace doesn't support conditional constructs so we need a workaround to check the name of the file being opened:

```c
syscall::open:entry
{
    found = copyinstr(arg0) == "/tmp/secret" ? 1 : 0;
    printf("Found: [%d] File: %s Exe: %s", found,  copyinstr(arg0), execname);
}
```

Run it and ```grep``` the output for matches:

```bash
$ sudo dtrace -s filefind.d | grep "\[1\]"
dtrace: script 'filefind.d' matched 1 probe
  1    157                       open:entry Found: [1] File: /tmp/secret Exe: vim
  0    157                       open:entry Found: [1] File: /tmp/secret Exe: cat
```
  
We could easily add a predicate to the script above to monitor _**all files opened by a specifc PID**_:

```c
syscall::open:entry
/pid == $1 /
{
    printf("%s(%s)", probefunc, copyinstr(arg0));
}
```

### 3. Trace memory allocations

The script below watches for memory allocations performed by ```malloc```, ```valloc``` (_which allocates aligned memory, as I've just found out_), ```calloc``` and ```realloc```. We'll compute the size of the chunk being allocated for each of these function separately, depending on their definitions:

```
  void* malloc (size_t size);
  void* valloc(size_t size);
  void* realloc(void *ptr, size_t size);
  void* calloc(size_t nmemb, size_t size);
```

And the script:

```c
pid$target::malloc:entry,
pid$target::valloc:entry
{
    allocation = arg0;
}

pid$target::realloc:entry
{
    allocation = arg1;
}

pid$target::calloc:entry
{
    allocation = arg0 * arg1;
}

pid$target::calloc:return,
pid$target::malloc:return,
pid$target::valloc:return,
pid$target::realloc:return
/allocation > 300 && allocation < 9000/
{
    printf("Address:0x%x Size:%d bytes\n", arg1, allocation);
    mallocs[arg1] = allocation;
}
```

The PID traced below is a iTerm process:

```bash
$ sudo dtrace -s memalloc.d -p 601
dtrace: script 'memalloc.d' matched 16 probes
CPU     ID                    FUNCTION:NAME
  1  78995                    malloc:return Address:0x7fab6840aea0 Size:320 bytes
  1  78995                    malloc:return Address:0x7fab6840aea0 Size:320 bytes
  1  78995                    malloc:return Address:0x7fab68801000 Size:1024 bytes
```

### 4. Trace a system binary

If we attempt the previous script and try to trace memory allocations done by a system binary, let's say Safari, we have the following error, _**even with DTrace restrictions disabled**_:

```bash
$ sudo dtrace -s memalloc.d -p 585
dtrace: failed to grab pid 585: the current security restriction (system integrity protection enabled) prevents dtrace from attaching to an executable not signed with the [com.apple.security.get-task-allow] entitlement
```

_We need to *__disable SIP completely to be able to execute the above script on system binaries__*, like the Apple Safari application above!_


## References

* [Enable SIP with dtrace](https://apple.stackexchange.com/questions/208762/now-that-el-capitan-is-rootless-is-there-any-way-to-get-dtrace-working/)
* [DTrace Book](http://www.brendangregg.com/dtracebook/index.html)
* [The DTrace Cheatsheet](http://www.brendangregg.com/DTrace/DTrace-cheatsheet.pdf)
* [Top 10 DTrace scripts for Mac OS X](http://dtrace.org/blogs/brendan/2011/10/10/top-10-dtrace-scripts-for-mac-os-x)
