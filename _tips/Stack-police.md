---
title: Test Stack Smashing Protection
layout: tip
date: 2017-11-25
categories: [Internals, Security]
---

## Overview

In these four short posts we'll test a few traditional anti-exploitation measures. The experiments below are inspired from the great book [The Mac Hacker's Handbook](https://www.amazon.co.uk/Mac-Hackers-Handbook-Charlie-Miller/dp/0470395362) and are done on a _macOS Sierra_.

To check the other tests, see the links below:
* [Test ASLR (Address space layout randomization)]()
* [Test code execution on the stack]()
* [Test code execution on the heap]()

#### Stack smashing protection

Start with this typical buffer overflow example:

```c
int main(int argc, char *argv[]){
    char buf[16];
    strcpy(buf, argv[1]);
}
```

Disabling stack smashing protection is a bit tricky. Let's try the traditional ```gcc``` option ```-fno-stack-protector``` and see what happens:

```bash
$ lldb ./stack_police $(python -c 'print "A" * 30')
(lldb) target create "./stack_police"
Current executable set to './stack_police' (x86_64).
(lldb) settings set -- target.run-args  "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"

(lldb) run
Process 5428 launched: './stack_police' (x86_64)
2018-03-21 10:55:18.812671+0000 stack_police[5428:247259] detected buffer overflow
Process 5428 stopped
* thread #1, queue = 'com.apple.main-thread', stop reason = signal SIGABRT
    frame #0: 0x00007fffe3402d42 libsystem_kernel.dylib`__pthread_kill + 10
libsystem_kernel.dylib`__pthread_kill:
->  0x7fffe3402d42 <+10>: jae    0x7fffe3402d4c            ; <+20>
    0x7fffe3402d44 <+12>: movq   %rax, %rdi
    0x7fffe3402d47 <+15>: jmp    0x7fffe33fbcaf            ; cerror_nocancel
    0x7fffe3402d4c <+20>: retq
Target 0: (stack_police) stopped.
```

So a buffer overflow is _still detected_. To understand why, just step through the short code of ```main``` function, until we see this:

```bash
(lldb) breakpoint set --name main
Breakpoint 2: where = stack_police`main, address = 0x0000000100000f50

(lldb) run
There is a running process, kill it and restart?: [Y/n] y
Process 5437 exited with status = 9 (0x00000009)
Process 5442 launched: './stack_police' (x86_64)
Process 5442 stopped
* thread #1, queue = 'com.apple.main-thread', stop reason = breakpoint 2.1
    frame #0: 0x0000000100000f50 stack_police`main
stack_police`main:
->  0x100000f50 <+0>: pushq  %rbp
    0x100000f51 <+1>: movq   %rsp, %rbp
    0x100000f54 <+4>: subq   $0x30, %rsp
    0x100000f58 <+8>: movl   $0x10, %eax
Target 0: (stack_police) stopped.

[..]
->  0x100000f6e <+30>: movq   0x8(%rsi), %rsi
    0x100000f72 <+34>: movq   %rcx, %rdi
    0x100000f75 <+37>: callq  0x100000f8a               ; symbol stub for: __strcpy_chk
    0x100000f7a <+42>: xorl   %r8d, %r8d
```

Which leads us to the [```__strcpy_chk```](http://refspecs.linuxbase.org/LSB_4.1.0/LSB-Core-generic/LSB-Core-generic/libc---strcpy-chk-1.html) function, which is basically the same as ```strcpy``` but with buffer overflow checking. 

A bit of online research reveals that this additional check was added by the ```FORTIFY_SOURCE``` flag enabled by default, so in order to compile a vulnerable program to play with, we would need the following options:

```bash
$ gcc  -fno-stack-protector -D_FORTIFY_SOURCE=0 stack_police.c -o stack_police
$ otool -Iv stack_police | grep _chk
```

## Conlcusion

By default, both the **_stack smashing protection_** and **```FORTIFY_SOURCE```** are enabled. With ```FORTIFY_SOURCE```, GCC uses replacement functions for ```strcpy```, ```memcpy``` and ```memset``` which account for the destination buffer length, in order to prevents buffer overflow attacks:

```bash
$ gcc  stack_police.c -o stack_police

$ otool -Iv stack_police | grep _chk
0x0000000100000f80     2 ___stack_chk_fail
0x0000000100000f86     4 ___strcpy_chk
0x0000000100001010     3 ___stack_chk_guard
0x0000000100001018     2 ___stack_chk_fail
0x0000000100001020     4 ___strcpy_chk
```

## References
* [FORTIFY_SOURCRE](https://idea.popcount.org/2013-08-15-fortify_source/)
* [LLDB Cheat Sheet](https://www.nesono.com/sites/default/files/lldb%20cheat%20sheet.pdf)
