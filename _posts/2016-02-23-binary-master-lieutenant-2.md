![Logo](/assets/images/belts-purple.png)


In this post we'll continue with the second level from the [Lieutenant](https://www.certifiedsecure.com/certification/view/37) set of challenges from **Certified Secure Binary Mastery**.
Another buffer overflow, similar mitigatiopn techniques as we've seen in the previous level (non-executable stack), 
but this time we have another flow, a little more subtle: _integer signedness error_.

To review the previous levels, check the links below:
* [Binary Master: Ensign - Level 1](https://livz.github.io/2016/01/07/binary-master-ensign-1.html)
* [Binary Master: Ensign - Level 2](https://livz.github.io/2016/01/14/binary-master-ensign-2.html)
* [Binary Master: Ensign - Level 3](https://livz.github.io/2016/01/21/binary-master-ensign-3.html)
* [Binary Master: Ensign - Level 4](https://livz.github.io/2016/01/28/binary-master-ensign-4.html)
* [Binary Master: Ensign - Level 5](https://livz.github.io/2016/02/09/binary-master-ensign-5.html)
* [Binary Master: Lieutenant - Level 1](https://livz.github.io/2016/02/16/binary-master-lieutenant-1.html)

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

```bash
$ cat  /proc/sys/kernel/randomize_va_space
0
```

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
	
	if (len > 255) {                       [1]
		printf("You are insane!\n");
		return;
	}

	int fp = open(filename, O_RDONLY);

	if (fp == 0) {                         [2]
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

First let's understand what is the purpose of this program and how it works. In this case it is pretty straight forward:
* Its first parameter represents a number of lines to be read from the filename specified in the second command line parameter.
* A first sanity check is implemented at **[1]**: if the length is greater than 255 bytes, the program will terminate.
* A second check at **[2]** after the _open_ call probably intends to termiante the program if file cannot be opened successfully.
* Finally,the _read_ call at **[3]** copies maximum _len_ characters into the buffer _buf_, whose size is 256 bytes, thus avoiding the overflow.

Now let's see if we can break it:
* Let's notice that the check at **[2]** is actually not effective because, according to its [man page](http://man7.org/linux/man-pages/man2/open.2.html), _open_ will return -1 in case of error. This means that the program will have unpredictable output for non-existent files.
* The check at **[1]** poses, however, a more serious risk: as we can see from the definition of the function, _len_ is actually a signed integer. This means that passing any negative value will successfulyl bypass the check, overflow the buffer and everything beyond, including the return address from function _head_.

## 2 - Exploit 

