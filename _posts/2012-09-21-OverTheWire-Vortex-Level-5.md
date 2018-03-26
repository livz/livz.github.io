---
title:  "[CTF] OverTheWire Vortex Level 5"
categories: [CTF, OverTheWire]
---

![Logo](/assets/images/vortex5.png)

## Solution
[This level](http://overthewire.org/wargames/vortex/vortex5.html) is basically a brute-force over a 5 chars MD5 hash. We get the hash from the source code - it is **155fb95d04287b757c996d77b5ea51f7**, and with a quick search online, we get the corresponding plain text - _rlTf6_.

There are lots of online services to crack md5, and there's also [Project RainbowCrack](http://project-rainbowcrack.com/) which uses the Time-Memory trade-off. After getting the plain text we can get to the shell:
```bash
vortex5@melissa:/vortex$ ./vortex5
Password: 
..
You got the right password, congrats!
$ cat /etc/vortex_pass/vortex6
*****
```
