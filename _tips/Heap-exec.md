---
title: Test Code Execution On The Heap
layout: tip
date: 2017-11-28
categories: [Internals, Security]
---

## Overview

In these four short posts we'll test a few traditional anti-exploitation measures. The experiments below are inspired from the great book [The Mac Hacker's Handbook](https://www.amazon.co.uk/Mac-Hackers-Handbook-Charlie-Miller/dp/0470395362) and are done on a _macOS Sierra_.

To check the other tests, see the links below:
* [Test Stack Smashing Protection](http://craftware.xyz/tips/Stack-police.html)
* [Test ASLR (Address space layout randomization)](http://craftware.xyz/tips/Test-ASLR.html)
* [Test code execution on the stack](http://craftware.xyz/tips/Stack-exec.html)

#### Test Code Execution On The Heap

The following snippet creates a short shellcode and copies it into a _**heap allocated variable**_. It then casts that variable to a function and attempts to execute it:

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// Infinite loop shellcode
char shellcode[] = "\xeb\xfe";

typedef int (*funcPtr)();

int main(int argc, char *argv[]){
    int (*f)();             // Function pointer
    char *x = malloc(2);    // Heap variable
   
    // Copy shellcode on the heap
    memcpy(x, shellcode, sizeof(shellcode));
    
    // Cast to function pointer and execute
    f = (funcPtr)x;
    (*f)();
}
```

As before, let's see what happens:
```bash
$ gcc execHeap.c -o execHeap
$ ./execHeap
zsh: bus error  ./execHeap
```

We see a similar issue as we've seen when trying to execue code from the heap. A ```EXC_BAD_ACCESS``` error is generated when the program attempts to jump to the shellcode _on the heap_ and execute it:

```bash
$ lldb ./execHeap
(lldb) target create "./execHeap"
Current executable set to './execHeap' (x86_64).

(lldb) breakpoint set --name main
Breakpoint 1: where = execHeap`main, address = 0x0000000100000f20

(lldb) run
Process 680 launched: './execHeap' (x86_64)
Process 680 stopped
* thread #1, queue = 'com.apple.main-thread', stop reason = breakpoint 1.1
    frame #0: 0x0000000100000f20 execHeap`main
execHeap`main:
->  0x100000f20 <+0>: pushq  %rbp
    0x100000f21 <+1>: movq   %rsp, %rbp
    0x100000f24 <+4>: subq   $0x30, %rsp
    0x100000f28 <+8>: movl   $0x2, %eax
Target 0: (execHeap) stopped.

(lldb) continue
Process 680 resuming
Process 680 stopped
* thread #1, queue = 'com.apple.main-thread', stop reason = EXC_BAD_ACCESS (code=2, address=0x100200000)
    frame #0: 0x0000000100200000
->  0x100200000: jmp    0x100200000
    0x100200002: addb   %al, (%rax)
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
    int (*f)();             // Function pointer
    void *x = malloc(2);    // Heap variable
    
    int page_size;
    unsigned long page_start; 
    int ret;

    page_size = sysconf(_SC_PAGE_SIZE);    
    if (page_size == -1)
       perror("[-] sysconf failed");
    else
        printf("[*] page size: %d\n", page_size);
   
    printf("[*] size of pointer: %lu\n", sizeof(void*));
    printf("[*] size of int: %lu\n", sizeof(unsigned int));
    printf("[*] size of long: %lu\n", sizeof(unsigned long));
 
    page_start = ((unsigned long) x) & 0xfffffffffffff000;
    printf("[*] page start: 0x%016lx\n", page_start);
    printf("[*] buff start: 0x%016lx\n", (unsigned long) x);

    ret = mprotect((void *) page_start, page_size, PROT_READ | PROT_WRITE | PROT_EXEC);
    if(ret<0){ 
        perror("[-] mprotect failed"); 
    }
    
    // Copy shellcode on the heap
    memcpy(x, shellcode, sizeof(shellcode));
    
    // Cast to function pointer and execute
    f = (funcPtr)x;
    (*f)();
}
```

The program is now in an _infinite loop_, executing the shellcode:

```bash
$ ./execHeap2
[*] page size: 4096
[*] size of pointer: 8
[*] size of int: 4
[*] size of long: 8
[*] page start: 0x00007fa622c02000
[*] buff start: 0x00007fa622c025d0
```

## Conclusion

By default, _**code execution on the heap is prevented!**_ It considerably more difficult to inject code via the heap and execute it, but not impossible. So this technique is adding another defense layer!
