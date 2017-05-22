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

If you want to know more about the techniques to bypass the NX bit, make usre to check the following great resources:
* [Bypassing NX bit using return-to-libc](https://sploitfun.wordpress.com/2015/05/08/bypassing-nx-bit-using-return-to-libc/)
* [Bypassing NX bit using chained return-to-libc](https://sploitfun.wordpress.com/2015/05/08/bypassing-nx-bit-using-chained-return-to-libc/)

## 0 - Discovery
Let's connect to the server and check the binary we're dealing with:
```
$ ssh level5@hacking.certifiedsecure.com -p 8266
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
$ checksec.sh --file level1
RELRO           STACK CANARY      NX            PIE             RPATH      RUNPATH      FILE                       
Partial RELRO   No canary found   NX enabled    No PIE          No RPATH   No RUNPATH   level1

```

There is no stack canary but the stack is **not** executable. What about the state of ASLR on the system? Good news this time: there is [no ASLR](https://askubuntu.com/questions/318315/how-can-i-temporarily-disable-aslr-address-space-layout-randomization), everything is static:

```bash
$ cat  /proc/sys/kernel/randomize_va_space
0
```

## 1 - Vulnerability
