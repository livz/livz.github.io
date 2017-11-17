---
title:  "Coursera Malicious Software RE challenge"
---

![Logo](/assets/images/underground.png)

## Onverview

[Malicious Software](https://www.coursera.org/learn/malsoftware) course, from Coursera, presented ways malware use to avoid detection and being reverse engineered, and also methods to detect and analyse them. Very interesting, especially the bonus challenge which is a small Linux binary, with some obfuscations protecting a secret. Kind of like a _binary bomb_. Now that the course has finished, I can safely share the solution for the Reverse Engineering bonus challenge.
 
## Intro

The binary has all symbols stripped out and also has some basic anti-debugging techniques in place. 
```bash
~ file bonus_reverse-challenge
bonus_reverse-challenge: ELF 32-bit LSB executable, Intel 80386, version 1 (SYSV), dynamically linked (uses shared libs), for GNU/Linux 2.6.24, BuildID[sha1]=0x2fe5f1647532449ffeef36a7fa31ae8319c8818d, stripped
```

The _`strings`_ command reveals some interesting stuff: 
```bash
$ strings bonus_reverse-challenge
[..]
socket
fflush
exit
htons
connect
puts
printf
mkstemp
read
stdout
inet_addr
close
sleep
write
/tmp
/bti
... 
xKZl_^_XCY^CIE
woot!
127.0.0.1
Dude, no debugging ;-)
Are you feeling lucky today?
[+] WooT!: %s
[~] Maybe.
[-] Nope.
```

Some socket operations and file manipulation. Also an ASCII string with some XOR characters (**^**) in it (hint ?!). Interesting. We can brute force it quickly to see if we get something meaningful out of it: 
```python
enc = "xKZl_^_XCY^CIE"
for key in range(0, 127):
    print "".join([chr(ord(c)^key) for c in enc])
```

Running the brute-force script yields some interesting results, but we'll still continue with the analysis
```bash
$ ./decr.py
[..]
RapFuturistico
```

## Analysis

If we start the application, we get a prompt and no hints about what to do next: 
```bash
$ ./bonus_reverse-challenge
Are you feeling lucky today?
```
The _Yes_ answer is not accepted by the application :) If we try to analyse it in _`gdb`_, we encounter another error: 
```bash
$ gdb ./bonus_reverse-challenge
Reading symbols from /home/liv/buffer/coursera/Malicious software/Week3/bonus-challenge/bonus_reverse-challenge...(no debugging symbols found)...done.
(gdb) run
Starting program: /home/liv/buffer/coursera/Malicious software/Week3/bonus-challenge/bonus_reverse-challenge
Dude, no debugging ;-)
```

Also if we use the _`strace`_ tool (which uses same technique as gdb to attach to processes) we see exactly what happens: 
```bash
$ strace ./bonus_reverse-challenge
[..]
ptrace(PTRACE_TRACEME, 3215099972, 0xbfa287d4, 0) = -1 EPERM (Operation not permitted)
fstat64(1, {st_mode=S_IFCHR|0620, st_rdev=makedev(136, 1), ...}) = 0
mmap2(NULL, 4096, PROT_READ|PROT_WRITE, MAP_PRIVATE|MAP_ANONYMOUS, -1, 0) = 0xb76fa000
write(1, "Dude, no debugging ;-)\n", 23Dude, no debugging ;-)
```

So the process tries to allow tracing, but as it is already traced (by strace) the _`ptrace`_ system call returns -1. This is a classic anti-debugging technique which can by bypassed in multiple ways.

## Reverse engineering

First we have to get rid of the anti-ptrace protection. If we set a breakpoint in _`gdb`_ at _`__libc_start_main`_ and we step through some instructions, we find the code responsible for the _`ptrace`_ system call: 
```bash
EBX:  0x00000000 ; Type of request. 0 means PTRACE_TRACEME
=>    0x8048938: mov al,0x1a ; sys_ptrace syscall
      0x804893a: int 0x80    ; interrupt to execute syscall
```

I chose to do a binary patching at this point, as there are only a few instructions which have to be removed to get rid of the ptrace syscall. In assembly the instructions look like this: 
```c
8048938:    b0 1a                    mov al, 0x1a
804893a:    cd 80                    int 0x80
```

We can get the dump of the whole file with 
```bash
$ objdump -M intel -d bonus_reverse-challenge
```

And then we'll overwrite the instructions above with nops: 
```c
(gdb) set *(unsigned long*)0x8048938 = 0x90909090
```

After some more browsing we find the code responsible with parsing the input from the user. It seems to be a case which calls a function then displays a message based on the first letter of the input string. And there are 3 possibilities: 
```c
0x8048a18:    movzx  eax,BYTE PTR [esp+0x20] ; input string
0x8048a1d:    movsx  eax,al              ; first letter !
0x8048a20:    cmp    eax,0x42
0x8048a23:    je     0x8048a3c
0x8048a25:    cmp    eax,0x43
0x8048a28:    je     0x8048a49
0x8048a2a:    cmp    eax,0x41
0x8048a2d:    jne    0x8048a56
0x8048a2f:    mov    DWORD PTR [esp+0x22c],0x804872b ; check function for A..
0x8048a3a:    jmp    0x8048a58
0x8048a3c:    mov    DWORD PTR [esp+0x22c],0x8048644 ; check function for B..
0x8048a47:    jmp    0x8048a58
0x8048a49:    mov    DWORD PTR [esp+0x22c],0x80486ca ; check function for C..
0x8048a54:    jmp    0x8048a58
```

We test this manually: 
```bash
$ ./bonus_reverse-challenge
Are you feeling lucky today? A
[~] Maybe.
$ ./bonus_reverse-challenge
Are you feeling lucky today? B
[-] Nope.
$ ./bonus_reverse-challenge
Are you feeling lucky today? C
[~] Maybe.
```

If we were to believe the developer, we should go for *__Asomething__* or *__Csomething__* and further analyse. Let's try *__Bsomething__* variant (A is interesting also but doesn't get us to the key). We quickly find references to the encrypted string found initially and a comparing routine, which computes a key and applies XOR to the input string using that key: 
```c
0x8048664:    mov    DWORD PTR [ebp-0x10],0xfa ; key
0x804866b:    pop    eax                       ; input string address
0x804866c:    jmp    0x8048685
0x804866e:    mov    eax,DWORD PTR [ebp-0xc]   ; first char of input string
0x8048671:    movzx  eax,BYTE PTR [eax]
0x8048674:    mov    edx,DWORD PTR [ebp-0x10]
0x8048677:    and    edx,0x2b                  ;  key becomes 0x2A
0x804867a:    xor    edx,eax
0x804867c:    mov    eax,DWORD PTR [ebp-0xc]
0x804867f:    mov    BYTE PTR [eax],dl
0x8048681:    add    DWORD PTR [ebp-0xc],0x1
0x8048685:    mov    eax,DWORD PTR [ebp-0xc]
0x8048688:    movzx  eax,BYTE PTR [eax]
0x804868b:    test   al,al
0x804868d:    jne    0x804866e                  ; loop
0x804868f:    mov    eax,DWORD PTR [ebp+0x8]
0x8048692:    mov    edx,eax
0x8048694:    mov    eax,0x8048bc0              ; "xKZl_^_XCY^CIE"
0x8048699:    mov    ecx,0xf 
0x804869e:    mov    esi,edx
0x80486a0:    mov    edi,eax
0x80486a2:    repz cmps BYTE PTR ds:[esi],BYTE PTR es:[edi]
```

In pseudo-code, we have:
```
E(M, K) = "xKZl_^_XCY^CIE"
Where:
  E - XOR encoding
  M - Input message after 'B' character
  K - Computed key: 0xFA && 0x2B = 0x2A  
```

We reverse the algorithm and get the input message we need: 
```python
~ python -c 'print "".join([chr(ord(c)^0x2a) for c in "xKZl_^_XCY^CIE"])'
RapFuturistico
```

So if the input string encodes to the string we found initially, the function returns 1 and we get a nice message: 
```bash
~ ./bonus_reverse-challenge
Are you feeling lucky today? BRapFuturistico
[+] WooT!: xKZl_^_XCY^CIE
```

*__Nice! Many thanks to the authors for putting together the course and the challenge.__*
 
## References

[Linux Anti-Debugging](http://www.julioauto.com/rants/anti_ptrace.htm)
[Linux Syscall reference](http://syscalls.kernelgrok.com/)
[Executable patching with GDB](http://my.opera.com/taviso/blog/show.dml/248232)
Posted by Liviu at 11:39 PM     
Email This
BlogThis!
Share to Twitter
Share to Facebook
Share to Pinterest

Labels: coursera, engineering, malicious, reverse, software
Reactions: 	
8 comments:
