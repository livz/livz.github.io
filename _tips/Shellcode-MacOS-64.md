---
title: Fun With Shellcode On MacOS x86_64
layout: tip
date: 2017-10-28
---

## Overview and historic info

Before diving into building a test 64-bit shellcode on _MacOS Sierra_, some historic information will help to understand the context:

* The stack of applications is marked as *__non-executable by default__* to prevent code injection and stack-based buffer overflows.
* The heap is [_**not executable by default**_](http://craftware.xyz/tips/Heap-exec.html), although it is considerably harder (although not impossible) to inject code via the heap.
* On previoud MacOS versions, both these settings could be changed system-wide using ```sysctl (8)``` command and setting the ```vm.allow_stack_exec``` and ```vm.allow_heap_exec``` variables to ```1```. This is no longer possible in Sierra:

```bash
$ sysctl -a | grep exec
security.mac.qtn.user_approved_exec: 1

$ sysctl -w vm.allow_stack_exec = 1
sysctl: unknown oid 'vm.allow_stack_exec'

$ sysctl -w vm.allow_heap_exec = 1
sysctl: unknown oid 'vm.allow_heap_exec'
```
* For iOS, by default neither heap nor stack are executable.

## Building shellcode

To start with, we need a simple x86-64 assembly source code. The one from [here](https://dotdideriksen.blogspot.co.uk/2016/06/osx8664-hello-world-shellcode.html) looks good:

```c
section .data
hello_world     db "Hello World!", 0x0a

section .text
global start

start:
mov rax, 0x2000004   ; System call write = 4
mov rdi, 1           ; Write to standard out = 1
mov rsi, hello_world ; The address of hello_world string
mov rdx, 14          ; The size to write
syscall              ; Invoke the kernel
mov rax, 0x2000001   ; System call number for exit = 1
mov rdi, 0           ; Exit success = 0
syscall              ; Invoke the kernel
```

Next, compile the assembly, link the object to a binary and test it. A newer version of ```nasm``` is needed since the default one in Sierra doesn't suport ```macho64``` objects:

```bash
$ nasm -v
NASM version 2.13.03 compiled on Feb  8 2018

$ brew install nasm
$ ln -s /usr/local/Cellar/nasm/2.13.03/bin/nasm myNasm

$ ./myNasm -v
NASM version 2.13.03 compiled on Feb  8 2018

$ ./myNasm -f macho64 hello-simple.s
$ ld hello-simple.o -o hello-simple
$ ./hello-simple
Hello World!
```

OK, it works. Next, to obtain a shellcode from the binary, extract the code bytes of the text section:
```bash
$ objdump -d hello-simple

hello-simple:	file format Mach-O 64-bit x86-64

Disassembly of section __TEXT,__text:
__text:
    1fd9:	b8 04 00 00 02 	movl	$33554436, %eax
    1fde:	bf 01 00 00 00 	movl	$1, %edi
    1fe3:	48 be 00 20 00 00 00 00 00 00 	movabsq	$8192, %rsi
    1fed:	ba 0e 00 00 00 	movl	$14, %edx
    1ff2:	0f 05 	syscall
    1ff4:	b8 01 00 00 02 	movl	$33554433, %eax
    1ff9:	bf 00 00 00 00 	movl	$0, %edi
    1ffe:	0f 05 	syscall

start:
    1fd9:	b8 04 00 00 02 	movl	$33554436, %eax
    1fde:	bf 01 00 00 00 	movl	$1, %edi
    1fe3:	48 be 00 20 00 00 00 00 00 00 	movabsq	$8192, %rsi
    1fed:	ba 0e 00 00 00 	movl	$14, %edx
    1ff2:	0f 05 	syscall
    1ff4:	b8 01 00 00 02 	movl	$33554433, %eax
    1ff9:	bf 00 00 00 00 	movl	$0, %edi
    1ffe:	0f 05 	syscall

$ otool -t hello-simple
hello-simple:
Contents of (__TEXT,__text) section
0000000000001fd9	b8 04 00 00 02 bf 01 00 00 00 48 be 00 20 00 00
0000000000001fe9	00 00 00 00 ba 0e 00 00 00 0f 05 b8 01 00 00 02
0000000000001ff9	bf 00 00 00 00 0f 05
```

Next, we need to plug this shellcode into a template ```c``` code that will execute it. We need to make sure that the shellcode will be in an executable memory section. By default, a string we define would reside in the ```.data``` section. To be safe, we'll move it to the ```.text``` section, which contains code and is executable:

```c
const char sc[] __attribute__((section("__TEXT,__text"))) = "\xb8\x04\x00\x00\x02\xbf\x01\x00\x00\x00\x48\xbe\x00\x20\x00\x00\x00\x00\x00\x00\xba\x0e\x00\x00\x00\x0f\x05\xb8\x01\x00\x00\x02\xbf\x00\x00\x00\x00\x0f\x05";

typedef int (*funcPtr)();
int main(int argc, char **argv)
{
    funcPtr func = (funcPtr) sc;
    (*func)();

    return 0;
}
```

Let's test:
```bash
$ clang  hello.c -o hello2
$ ./hello2
```

No message. Apparently nothign happens. Time to bring up ```lldb```. As a side-note, if you're not familiar with ```lldb``` there is a nice cheatsheet mapping [GDB to LLDB commands](https://lldb.llvm.org/lldb-gdb.html). Fire up ```lldb``` and start analysing:

```bash
$ lldb ./hello2
(lldb) target create "./hello2"
Current executable set to './hello2' (x86_64).
(lldb) breakpoint set --name main
Breakpoint 1: where = hello2`main, address = 0x0000000100000f50
(lldb) r
Process 4650 launched: './hello2' (x86_64)
Process 4650 stopped
* thread #1, queue = 'com.apple.main-thread', stop reason = breakpoint 1.1
    frame #0: 0x0000000100000f50 hello2`main
hello2`main:
->  0x100000f50 <+0>: pushq  %rbp
    0x100000f51 <+1>: movq   %rsp, %rbp
    0x100000f54 <+4>: subq   $0x20, %rsp
    0x100000f58 <+8>: leaq   0x31(%rip), %rax          ; sc
[..]
```

Step into the call running the shellcode and notice the point where the message string gets moved into ```rsi```:
```bash
->  0x100000f9a <+10>: movabsq $0x2000, %rsi             ; imm = 0x2000
    0x100000fa4 <+20>: movl   $0xe, %edx
    0x100000fa9 <+25>: syscall
    0x100000fab <+27>: movl   $0x2000001, %eax          ; imm = 0x2000001
Target 0: (hello2) stopped.
(lldb) x/s 0x2000
error: failed to read memory from 0x2000.
```

The problem is that code needs to be _**position independent**_, and in this case clearly it's not since the initial binary was reading the string from the ```.data``` section. This is a well-known issue, not specific to OSX or 64-bit so I won't insist on it. The solution is also well-known:

```bash
section .data
; Not relevant; just to avoid 'dyld: no writable segment' error
hello   db  "empty!"

section .text

global start

start:
    jmp trick

continue:
    pop rsi              ; Pop string ddress into rsi
    mov rax, 0x2000004   ; System call write = 4
    mov rdi, 1           ; Write to standard out = 1
    mov rdx, 14          ; The size to write
    syscall              ; Invoke the kernel
    mov rax, 0x2000001   ; System call number for exit = 1
    mov rdi, 0           ; Exit success = 0
    syscall              ; Invoke the kernel

trick:
    call continue
    db "Hello World!", 0x0d, 0x0a
```

Let's see if it works now:

```bash
$ ./myNasm -f macho64 hello.s
$ ld hello.o -o hello

$ ./hello
Hello World!

$ otool -t hello
hello:
Contents of (__TEXT,__text) section
0000000000001fcd	eb 1e 5e b8 04 00 00 02 bf 01 00 00 00 ba 0e 00
0000000000001fdd	00 00 0f 05 b8 01 00 00 02 bf 00 00 00 00 0f 05
0000000000001fed	e8 dd ff ff ff 48 65 6c 6c 6f 20 57 6f 72 6c 64
0000000000001ffd	21 0d 0a

$ clang  hello.c -o hello3

$ ./hello3
Hello World!
```

_There are still more steps to do, like removing null-bytes for example, but it's a good start!_
