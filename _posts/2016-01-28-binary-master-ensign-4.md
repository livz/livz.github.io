![Logo](/assets/images/belts-green.png)

In this post we'll continue with level4 of the **Certified Secure Binary Mastery**, [Ensign](https://www.certifiedsecure.com/certification/view/37). 
This time we will be dealing with another buffer overflow issue but now we'll have to exploit the application over the network.
On top of that, there is a logical error which leads to a subtle input validation error. 

To review the previous levels, check the link below:
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

Let's see if we have any mitigation techniques using [checksec.sh](http://www.trapkit.de/tools/checksec.html), downloaded and run locally :
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
* The **handle_client** function first reads maximum 256 bytes from the user into variable **name** (**[3]**)
* If the supplied password is correct (first 8 characters of the name), it will copy the name into the **result** array (**[4]**), which is also 256 bytes in size.
* But that's where the problem lies, because it will copy the name after the welcome message, basically writing past the boundaries of **result** variable and smashing the stack.

To understand exactly how many bytes we need in order to overwrite the return address, take a look at the stack layout of **handle_client** function:

![Stack layout](/assets/images/bm4-1.png)

The layout and the following observations will help in constructing the proper payload that can overwrite EIP:
* The return address to be overwritten is located at address 256 + 16 + 4 = 276 bytes. 
* The length of the welcome message, excluding the name, is 33 characters.
* The first 8 need to represent a static password

So our payload will be:
