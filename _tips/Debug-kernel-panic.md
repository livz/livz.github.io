---
title: Debugging A Kernel Panic
layout: tip
date: 2018-01-06
---

## Overview

This post goes step by step through the process of _**debugging a kernel panic on MacOS Sierra**_ across a network connection. The general process is described at length for different configurations in [Technical Note TN2118](https://developer.apple.com/library/content/technotes/tn2004/tn2118.html). We'll use a MacOS host to act as the _**core dump server**_  and a MacOS guest virtual machine client - _**the debugee**_.

For building and loading a kernel extension, check the [previous tip](http://craftware.xyz/tips/Building-kernel-extension.html). 

## Walkthrough

#### Configure the dump server

* The first step in collecting kernel core dumps is to set up a kernel core dump server. We'll use a MacOS Sierra.
* A typical size for kernel dumps is 200-500 MB and can vary dependng on the physical memory size and usage patterns.
* The server needs to be accessible from the client over the network. 
* On the server we need a directory where the cores will be dropped, which needs to be writable by _the program dumping the cores_. According to the official guide, the following settings will do:

```bash
$ sudo mkdir /PanicDumps
$ sudo chown root:wheel /PanicDumps
$ sudo chmod 1777 /PanicDumps
```
* Next step is to *__activate kdumpd__* (the kernel dump server process). _Note that by default this will try to dump the cores to the ```/PanicDumps``` folder. If you've use a different folder name in the previous step, update its ```.plist``` property file._

```bash
$ sudo launchctl load -w /System/Library/LaunchDaemons/com.apple.kdumpd.plist
```
* Next, check that the dump server was started correctly:

```bash
$ sudo launchctl list | grep kdump
-	0	com.apple.kdumpd
```
* The default port, also defined in the ```com.apple.kdumpd.plist``` file is 1069. Just to make sure, we can verify the port is open:

```bash
$ netstat  -an  | grep 1069
udp4       0      0  *.1069                 *.*
udp6       0      0  *.1069                 *.*
```

#### Configure the client (the target machine)

On the client machine we need to modify the NVRAM boot-args to inclunde two arguments:
* The debug flag, which must be set to a combination of the flags described [here](https://developer.apple.com/library/content/technotes/tn2004/tn2118.html#SECDEBUGFLAGS). We'll use ```0x444```, which is equivalent to ```DB_KERN_DUMP_ON_PANIC|DB_ARP|DB_NMI```.
* The IP address of the dump server in the ```_panicd_ip``` variable.
* Let's set both using the ```nvram``` command:

```bash
$ sudo nvram boot-args='debug=0x444 _panicd_ip=192.168.136.1'
```
* A restart is needed, since we've modified boot arguments. 

```bash
$ sudo reboot
```
* After the reboot, verify the parameters have been set correctly;

```bash
$ sysctl kern.bootargs
kern.bootargs: debug=0x444 _panicd_ip=192.168.136.1
```
* Trigger a kernel panic on the client using the following ```dtrace``` trick. Note that [_SIP needs to be disabled_](http://craftware.xyz/tips/Disable-rootless.html) for this to work:

```bash
$ sudo dtrace -w -n "BEGIN{ panic(); }"
```

* If everything went all, a panic dump should start to be transferred to the dump server. Wait until the ```.gz``` file is written completely:

```bash
$ ls -alh /PanicDumps
[..]
-rw-rw----   1 nobody  wheel   126M 21 Mar 23:59 core-xnu-3789.72.11-192.168.136.130-a5001516.gz
```

#### Analyse the core dump

* We can analyse the core dump using ```lldb```:

```bash
$ gunzip core-xnu-3789.72.11-192.168.136.130-a5001516.gz

$ file core-xnu-3789.72.11-192.168.136.130-a5001516
core-xnu-3789.72.11-192.168.136.130-a5001516: Mach-O 64-bit core x86_64

$ lldb -c core-xnu-3789.72.11-192.168.136.130-a5001516
(lldb) target create --core "core-xnu-3789.72.11-192.168.136.130-a5001516"
Kernel UUID: B814CFE3-B6F6-304F-BFB9-C22EFC948A53
Load Address: 0xffffff8017400000
WARNING: Unable to locate kernel binary on the debugger system.
Core file '/PanicDumps/core-xnu-3789.72.11-192.168.136.130-a5001516' (x86_64) was loaded.
```

* As hinted in the warning message, to get access to symbols and lldbmacros, we would also need the kernel from the KDK.

#### Housekeeping

* Remove the folder containing the dunps when the analysis is done.
* Disable the dump server:

```bash
$ sudo launchctl unload -w /System/Library/LaunchDaemons/com.apple.kdumpd.plist
```
* If you've disabled the firewall to allow communication between the server and the client, or added any permissive rules, make sure to remove them and re-enable the firewall.
* Re-enable System Integrity Protection on the client machine.

## References
[Technical Note TN2118 - Kernel Core Dumps](https://developer.apple.com/library/content/technotes/tn2004/tn2118.html)
