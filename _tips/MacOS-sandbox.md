---
title: Test The MacOS Sandbox
layout: tip
date: 2017-12-02
published: false
---

## Overview
From the [official documentation](https://developer.apple.com/library/content/documentation/Security/Conceptual/AppSandboxDesignGuide/AboutAppSandbox/AboutAppSandbox.html):

> App Sandbox is an access control technology provided in macOS, enforced at the kernel level. It is designed to contain damage to the system and the user’s data if an app becomes compromised. Apps distributed through the Mac App Store must adopt App Sandbox. Apps signed and distributed outside of the Mac App Store with Developer ID can (and in most cases should) use App Sandbox as well.

This means that, by using the sandbox, we can _restrict the level of access an application has to operating system resources like filesystem or network, permissions to spawn other executables_ and so on. There are two ways to use sandboxing:
* One is to use the sandboxing library from the source code of an application.
* The other way is to force an untrusted arbitrary application to run within the sandbox.

The heart of the Apple Sandbox framework is the ```Sandbox.kext``` kernel extension:
```bash
$ kextstat | grep -i sandbox
   26    1 0xffffff7f80f2d000 0x20000    0x20000    com.apple.security.sandbox (300.0) BBF405A2-CD8D-39C2-B577-251BE0978774 <25 22 16 7 6 5 4 3 2 1>
```

Below we'll test a few basic examples of restrictions we can apply to an unterusted app. Basically, sandboxing is done using the ```sandbox-exec``` utility, which is wrapper that calls ```sandbox_init (3)``` before a ```fork``` and ```exec```. 

For in-depth information, the referenced baper by Dionysus Blazakis, although from 2011, does an excellent job of describing the sandboxing process from a reverse engineer's perspective.

#### Deny writing

Let's add the following rules to a profile named ```deny-write.sb```, which should block all filesystem write access:

```
(version 1) 
(allow default)

(deny file-write*)
```

And the rule in action:

```bash
$ cat write.sh
#!/bin/bash

echo hello > out

$ chmod +x write.sh
$ ./write.sh
$ cat out
hello
$ rm out

$ sandbox-exec -f deny-write.sb ./write.sh
./write.sh: line 3: out: Operation not permitted

$ cat out
cat: out: No such file or directory
```

#### Deny networking

Let's add the following to a profile named ```deny-net.sb```:
```
(version 1)
(allow default)

(deny network*)
```

Now let's see what happens when we try to execute a program that uses network connectivity:

```bash
$ sandbox-exec -f deny-net.sb ping 8.8.8.8
PING 8.8.8.8 (8.8.8.8): 56 data bytes
ping: sendto: Operation not permitted
```

#### Deny process execution

The short snippet below blocks execution of binaries named ```curl```, matched using _regular expressions_:
```(version 1)
(allow default)

(deny process-exec
    (regex #"curl")
)
```

Let's test:

```bash
$ sandbox-exec -f deny-exec.sb curl attacker.com
sandbox-exec: execvp() of 'curl' failed: Operation not permitted
```
## References
* [The Apple Sandbox](https://www.exploit-db.com/docs/english/16031-the-apple-sandbox.pdf) - Dionysus Blazakis
