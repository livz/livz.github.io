---
title:  "[CTF] OverTheWire Vortex Level 2"
---

![Logo](/assets/images/vortex2.png)

## Context
The binary from [level 2](http://overthewire.org/wargames/vortex/vortex2.html) creates a _special file_, one whose name contains _**$$**_: _ownership.$$.tar_. As detailed in the [bash manual](https://www.gnu.org/software/bash/manual/html_node/Special-Parameters.html#Special-Parameters), the $ variable:
> Expands to the process ID of the shell. In a () subshell, it expands to the process ID of the invoking shell, not the subshell.

This binary file has permissions to read the password file from the next level, so what we have to do is archive the password file, and then read it, taking into account the special file name.

First, to create the archive:
```bash
vortex2@melissa:/etc/vortex_pass$ /vortex/vortex2 vortex3 vortex3 vortex3
vortex2@melissa:/etc/vortex_pass$ ls -alh '/tmp/ownership.$$.tar'
-rw-r--r-- 1 vortex3 vortex2 10K 2012-09-06 23:19 /tmp/ownership.$$.tar
```

File created. Now to untar and read the content: 

### Method 1

We cannot untar it there, so the **-O** option (output to _`STDOUT`_) is very useful :
```bash
vortex2@melissa:/etc/vortex_pass$ tar xf '/tmp/ownership.$$.tar' -O
*****
```

### Method 2

We could copy it locally with _`scp`_ and untar it. I had a little problem with the file name passed forward by scp, which can be seen and adapted with verbose mode, then check the transmitted file name and adjust it:
```bash
scp -v vortex2@vortex.labs.overthewire.org:'test$$' .
[..]
debug1: Sending command: scp -v -f test$$
scp: test415: No such file or directory
```

We see that **$$** is transmitted,  and will be interpreted, so it should be correctly escaped. Copy archive locally:
```bash
# scp vortex2@vortex.labs.overthewire.org:'/tmp/ownership.\$\$.tar' .
```

### Method 3
The _`tar`_ command from the binary does not use compression, so the content of the archive can be viewed: 
```bash
vortex2@melissa:/etc/vortex_pass$ cat '/tmp/ownership.$$.tar'
[..]
*****
```
