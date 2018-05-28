---
title: Test Code Execution On The Stack
layout: tip
date: 2017-11-27
categories: [Internals, Security]
---

## Overview

In these four short posts we'll test a few traditional anti-exploitation measures. The experiments below are inspired from the great book [The Mac Hacker's Handbook](https://www.amazon.co.uk/Mac-Hackers-Handbook-Charlie-Miller/dp/0470395362) and are done on a _macOS Sierra_.

To check the other tests, see the links below:
* [Test Stack Smashing Protection]()
* [Test ASLR (Address space layout randomization)]()
* [Test Code Execution On The Heap]()

#### Test Code Execution On The Stack

The following snippet creates a short shellcode and copies it into a _**stack allocated variable**_. It then casts that variable to a function and attempts to execute it:

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// Infinite loop shellcode
char shellcode[] = "\xeb\xfe";

typedef int (*funcPtr)();

int main(int argc, char *argv[]){
    int (*f)();		// Function pointer
    char x[4];		// Stack variable

    // Copy shellcode on the stack
    memcpy(x, shellcode, sizeof(shellcode));

    // Cast to function pointer and execute
    f = (funcPtr)x;
    (*f)();
}
```

Let's see what happens:

```bash
$ gcc execStack.c -o execStack

$ ./execStack
zsh: segmentation fault ./execStack
```

```LLDB``` can be used to investigate the point of the crash. A ```EXC_BAD_ACCESS``` error is generated when the program attempts to jump to the shellcode _on the stack_ and execute it:

```bash
$ lldb ./execStack
(lldb) target create "./execStack"
Current executable set to './execStack' (x86_64).

(lldb) breakpoint set --name main
Breakpoint 1: where = execStack`main, address = 0x0000000100000f70

(lldb) run
Process 615 launched: './execStack' (x86_64)
Process 615 stopped
* thread #1, queue = 'com.apple.main-thread', stop reason = breakpoint 1.1
    frame #0: 0x0000000100000f70 execStack`main
execStack`main:
->  0x100000f70 <+0>: pushq  %rbp
    0x100000f71 <+1>: movq   %rsp, %rbp
    0x100000f74 <+4>: subq   $0x20, %rsp
    0x100000f78 <+8>: leaq   -0x1c(%rbp), %rax
Target 0: (execStack) stopped.

(lldb) continue
Process 615 resuming
Process 615 stopped
* thread #1, queue = 'com.apple.main-thread', stop reason = EXC_BAD_ACCESS (code=2, address=0x7fff5fbffa14)
    frame #0: 0x00007fff5fbffa14
->  0x7fff5fbffa14: jmp    0x7fff5fbffa14
    0x7fff5fbffa16: addb   %al, (%rax)
    0x7fff5fbffa18: adcb   $-0x6, %al
    0x7fff5fbffa1a: movl   $0x7fff5f, %edi           ; imm = 0x7FFF5F
```

To address this, let's change the _permissions of the memory page containing the buffer_ and redo the test. 

```c
#include <sys/mman.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

// Infinite loop shellcode
char shellcode[] = "\xeb\xfe";

typedef int (*funcPtr)();

int main(int argc, char *argv[]){
    int (*f)();		// Function pointer
    char x[4];		// Stack variable

    unsigned long page_start;
    int ret;
    int page_size;

    page_size = sysconf(_SC_PAGE_SIZE);
    page_start = ((unsigned long) x) & 0xfffffffffffff000;
    printf("[*] page start: 0x%016lx\n", page_start);
    printf("[*] buff start: 0x%016lx\n", (unsigned long) x);

    ret = mprotect((void *) page_start, page_size, PROT_READ | PROT_WRITE | PROT_EXEC);
    if(ret<0){
        perror("[-] mprotect failed");
    }

    // Copy shellcode on the stack
    memcpy(x, shellcode, sizeof(shellcode));

    // Cast to function pointer and execute
    f = (funcPtr)x;
    (*f)();
}
```

The program is now in an _infinite loop_, executing the shellcode:

```bash
$ ./execStack2
[*] page start: 0x00007fff556d9000
[*] buff start: 0x00007fff556d99f4
```

## Conclusion

By default, _**code execution on the stack is prevented!**_ This is a good thing since there are very few legitimate usages of this technique, outside of the exploitation realm.
