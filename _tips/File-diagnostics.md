---
title: File diagnostics
layout: tip
date: 2017-10-14
---

## File system diagnostics with ```fs_usage```, ```lsof``` and ```fuser```

These utilities are very useful for debugging activities, whether you're tracing an unknown error or you want to watch and analyse a susicious application. They can be useful to observe behaviour of applications  without having to run an actual debugger.

#### ```fs_usage```

```fs_usage (1)``` can be used to display **system calls activity in real-tine**. It can filter events related to _network_, _filesystem_, _exec and spawn_. It can display calls performed system-wide or for a specific process. For example:

Check who is modifying the shell history file:

```bash
$ sudo fs_usage -f filesys  | grep history
22:36:27  lstat64           /Users/m/.zsh_history                           0.000022   fseventsd
22:36:27  lstat64           /Users/m/.zsh_history.LOCK                      0.000023   fseventsd
22:36:50  fsgetpath         /Users/m/.bash_history                          0.000004   Finder
22:36:50  fsgetpath         /Users/m/.zsh_history                           0.000003   Finder
22:37:28  open              /Users/m/.zsh_history                           0.000005   cat
[..]
```

Check what files are being read by a specific process:

```bash
$ sudo fs_usage -f pathanme pid 3094 | grep access
22:50:26  access            private/etc/passwd                              0.000005   zsh
22:50:27  access            pathanme                                        0.000002   zsh
22:50:27  access            pid                                             0.000002   zsh
22:50:27  access            3094                                            0.000002   zsh
22:50:27  access            passwd                                          0.000002   zsh
22:50:46  access            private/etc/passwd22                            0.000004   zsh
```

#### ```lsof```

While ```fs_usage``` sees file and network operations in real-time, ```lsof (1)``` displays a **mapping of all file descriptors and sockets** owned by one or more processes. Without any parameters, ```lsof``` displays information for _all the processes_ on the machine.

List all files opened by a specific process:
```
$ lsof -p 3094
COMMAND  PID USER   FD   TYPE DEVICE  SIZE/OFF   NODE NAME
zsh     3094    m  cwd    DIR    1,2      1292 443362 /Users/m
zsh     3094    m  txt    REG    1,2    613392 863163 /usr/local/Cellar/zsh/5.4.2_1/bin/zsh
[..]
```

List all processes that opened a specifc file:

```bash
$ lsof /Users/m/.secretmessage.txt.swp
COMMAND  PID USER   FD   TYPE DEVICE SIZE/OFF   NODE NAME
vim     3266    m    4u   REG    1,2    12288 938070 /Users/m/.secretmessage.txt.swp
```

*__Note:__* even if ```vim``` opened th file above for editing, it might not actually hold a file descriptor to it because it's actually editing a temporary file, that will overwrite the original when saving.

List all network connections for a specific process:
```bash
$ lsof -i -a -n -p 845
COMMAND   PID USER   FD   TYPE             DEVICE SIZE/OFF NODE NAME
Google    845  m     98u  IPv4 0x9ad845238b184eb3      0t0  TCP 192.168.0.6:60228->54.88.217.173:https (ESTABLISHED)
Google    845  m     99u  IPv4 0x9ad845238b16db8b      0t0  TCP 192.168.0.6:59854->74.125.71.188:5228 (ESTABLISHED)
[..]
```


#### ```fuser```

```fuser(1)``` provides a **reverse mapping from the file name to the process** owning it. It's used mainly to identify processes that hold a lock to a specific file _or mount point_, which might prevent unmounting. For example:

```bash
$ fuser -cu /dev
/dev: 94(m) 240(m) 243(m) 245(m) [..]
```

## References
[15 Linux lsof Command Examples](https://www.thegeekstuff.com/2012/08/lsof-command-examples/)
