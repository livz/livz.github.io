![Logo](/assets/images/belts-blue.png)


In this post we'll continue with level5, the last one from **Certified Secure Binary Mastery**, [Ensign](https://www.certifiedsecure.com/certification/view/37). 
This time we will be dealing again with more buffer overflow issues but we'll have to defeat a homemade implementation of buffer overflow detection. This is the most interesting one and it hides yet another logical vulnerability that will allow us to defeat the random stack canary.

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
        fread(&canary, 4, 1, fp);                                [1]+-        
}

void hello(char* name) {
        int cookie = canary;
        int i = 0x12345;
        char* msg = malloc(128);
        char buf[12];

        strcpy(buf, name);
        sprintf(msg, "%s, it's good to see you!\n", buf);

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

Now let's see how we can break it:
* 
