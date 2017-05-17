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
```bas
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
                strncpy(buf3, a, sizeof(buf3));


                if (strlen(b) <= strlen(buf3)) {
                        strcpy(buf1, b);
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

In this case 
