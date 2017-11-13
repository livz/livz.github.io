---
title:  "[CTF] OverTheWire Vortex Level 1"
---

![Logo](/assets/images/vortex1.png)

## Context
The level can be found [here](http://overthewire.org/wargames/vortex/vortex1.html). After analyzing the C source code, we understand the flow and information needed to exploit:
* There's a 512 bytes buffer and a pointer _`ptr`_ that initially points in the middle of the buffer.
* For every **\** character read, the pointer is decremented.
* For every character read which is different than **\n** and **\** we have the possibility to set a byte in _`ptr`_: 
> ptr++[0] = x;
* The _`e()`_ macro spawns an [interactive bash shell](http://www.gnu.org/software/bash/manual/bashref.html#Interactive-Shells) (**-i** parameter) and also replaces the image of the current process with _`/bin/sh`_, through [_`execlp`_](http://linux.die.net/man/2/execve) function. Very important to remember, from here: 
> By default, file descriptors remain open across an execve()
* The condition to trigger shell execution can be easily accomplished, given the third point.

Taken these into account, let's try to launch a shell and execute a command:
```bash
$ python -c 'print "\\"*257 + "\xca" + "A" + "\nwhoami"' | ./vortex1
```

The shell exits immediately, without executing the command. Now it's time to check what happens, how bash handles _`EOF`_.

### Method 1
We can actually find a very detailed explanation in this [blog post](http://byteninja.blogspot.ro/2011/09/overthewireorg-vortex-level1.html). The idea is that  when _`execlp`_ is executed, the image of the current process is replaced with  _`/bin/sh`_. But _`execlp`_ doesn't clear STDIN.  So the unparsed input it's still there. The shell is exiting immediately, because it receives an EOF. To overcome this, something in the bash manual comes to help: 
> When invoked as an interactive shell with the name sh, bash looks for  the variable  ENV,  expands  its value if it is defined, and uses the expanded value as the name of a file to read and execute.

So we create a new file containing our commands, set the _`ENV`_ variable before and get the password:
```bash
$ vi /tmp/cmd2
cat /etc/vortex_pass/vortex2
 
$ python -c 'print "\\"*257 + "\xca" + "A"' | env ENV=/tmp/cmd2 /vortex/vortex1
```

### Method 2

Some solutions report that a long string before the command causes the command to be actually executed, without an apparent explanation, like this for example:
```bash
$ python -c 'print  "\\"*0x101+"\xcaA\n"+"A"*4000+"\nwhoami\ncat /etc/vortex_pass/vortex2"' |/vortex/vortex1
$ sh: AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA: not found
$ vortex2
******
```


To understand this, the following [article](http://www.pixelbeat.org/programming/stdio_buffering/) explains the **_buffering applied to standard streams_**, with an example with two processes forked  by bash with a pipe between them, very similar with our case:
```bash
$ command1 | command2
```
The idea is that the kernel uses 4096 bytes circular buffers (for stdin, stdout, and pipe). Being circular, the 4000 characters together with the existent content fill the buffer, and the next part of input does not contain an EOF and commands are executed. Actually, instead of the 4000 "A"s, we just need 4096-257-2-1=3836 extra characters:
```bash
$ python -c 'print  "\\"*0x101+"\xcaA\n"+"A"*3836+"\nwhoami\ncat /etc/vortex_pass/vortex2"' |/vortex/vortex1
$ $ vortex2
$ ******
```
