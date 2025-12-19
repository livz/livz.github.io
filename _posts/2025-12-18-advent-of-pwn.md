---
title:  "[CTF] PWN.COLLEGE - Advent of Pwn."
categories: [CTF, pwn.college]
---

![Logo](/assets/images/santa-cyber.png)

[Advent of Pwn](https://pwn.college/advent-of-pwn/) is an Advent CTF created by the awesome team at [ASU](https://www.asu.edu) behind [pwn.college](http://pwn.college/). This year was its first edtion. In this post I'll go through my solutions and share some of the things I've learnt along the way. Having time available mostly at odd evening hours, I finished only 9/12 challenges during the CTF and worked on the rest of them later. If you haven't stumbled upon [other](https://www.feyrer.de/CTF/CTF-Writeup-pwn.college-AdventOfPwn2025/) [solutions](https://jia.je/ctf-writeups/2025-12-01-advent-of-pwn-2025/) [already](https://github.com/hidehiroanto/ctf-writeups/tree/main/advent-of-pwn/2025) before landing on this page, please do check them out as you might find some more elegant ideas from seasoned CTF players. Especially for levels 5, which was a bit trickier, and 6 which had multiple solutions.  

Before going into the technical solutions, a few words about LLMs, which seem to be the theme nowadays. During the CTF I relied on LLMs for a couple of tasks which I believe they proved really useful at:
* Making sense of large amounts of code, high level or disassembly.
* Getting started with complicated subjects (e.g. understanding a custom blockchain).
* Repetitive tasks when speed or code quality is not a concern.

Multiple friends I've talked to during the CTF were skeptic about using LLMs and I definitely understand why. Some drawbacks I've experienced _continously_, not just during this CTF but in general:
* It's really easy to get directed to rabbit holes or ideas that don't lead anywhere.
* Very often they miss good ideas.
* They suggest paths which appear correct and seem to make sense, but are either very inefficient or simply wrong.
* On advanced topics, or things for which simply there's not much information available (for example level 5 shellcode for `io_uring` async I/O here), no amount of vibe-researching will get you to the solution.
* Again, not much chance against esoteric topics like pwn.college's [The Art of the Shell](https://pwn.college/shell-lin-do~148f65dd/) or [Linux Lunacy](https://pwn.college/linux-lunacy~9b739db1/) modules, which are awesome BTW.

Last but definitely not least, huge thanks to the creators of these challenges for the effort of designing and making them available for everyone!

Solutions and all challenge files to follow along are also on [GitHub](https://github.com/livz/advent-of-pwn). Challenge descriptions were fun to read but I think they didn't add much useful information towards solving them. So, for brevity I'm ommiting them here. 

## Day 1 - Warm-up gatekeeper

### Description
In this challenge we're dealing with an ELF 😛 file that performs some checks on its input:

```bash
$ file /challenge/check-list
/challenge/check-list: setuid ELF 64-bit LSB executable, x86-64, version 1 (SYSV), statically linked, BuildID[sha1]=de16e5b4aea576aabe09d12729be47c53ff6e586, stripped

$ pwn checksec /challenge/check-list
[*] '/challenge/check-list'
    Arch:       amd64-64-little
    RELRO:      No RELRO
    Stack:      No canary found
    NX:         NX unknown - GNU_STACK missing
    PIE:        No PIE (0x400000)
    Stack:      Executable
```

The code is really massive (1M+ lines of disassembly in Ghidra) but quite eays to understand. We're dealing with a large array of input bytes:
```asm
.text:0000000000401000                 mov     rbp, rsp
.text:0000000000401003                 sub     rsp, 500h
.text:000000000040100A                 mov     eax, 0
.text:000000000040100F                 mov     edi, 0          ; fd
.text:0000000000401014                 lea     rsi, [rbp+var_400] ; buf
.text:000000000040101B                 mov     edx, 400h       ; count
.text:0000000000401020                 syscall                 ; LINUX - sys_read
```

And thousands of basic operations (`sub` and `add`) applied on each element. Towards the end there are some checks on each array element. If we pass all the checks we get the flag:
```asm
.text:0000000000AA401C                 jnz     wrong_byte
.text:0000000000AA4022                 cmp     [rbp+var_1], 7Dh ; '}'
.text:0000000000AA4026                 jnz     wrong_byte
.text:0000000000AA402C                 mov     rax, 1
.text:0000000000AA4033                 mov     rdi, 1          ; fd
.text:0000000000AA403A                 lea     rsi, bufCorrectStart ; buf
.text:0000000000AA4041                 mov     rdx, 31h ; '1'  ; count
.text:0000000000AA4048                 syscall                 ; LINUX - sys_write
.text:0000000000AA404A                 mov     eax, 2
.text:0000000000AA404F                 lea     rdi, filename   ; Open flag
.text:0000000000AA4056                 mov     esi, 0          ; flags
.text:0000000000AA405B                 mov     edx, 0          ; mode
.text:0000000000AA4060                 syscall                 ; LINUX - sys_open
.text:0000000000AA4062                 cmp     rax, 0
.text:0000000000AA4066                 jl      short loc_AA40B6
.text:0000000000AA4068                 mov     r12, rax
.text:0000000000AA406B                 mov     eax, 0
.text:0000000000AA4070                 mov     rdi, r12        ; fd
.text:0000000000AA4073                 lea     rsi, [rbp+var_500] ; buf
.text:0000000000AA407A                 mov     edx, 100h       ; count
.text:0000000000AA407F                 syscall                 ; LINUX - sys_read
.text:0000000000AA4081                 cmp     rax, 0
.text:0000000000AA4085                 jle     short loc_AA40B6
.text:0000000000AA4087                 mov     rcx, rax
.text:0000000000AA408A                 mov     rax, 1
.text:0000000000AA4091                 mov     rdi, 1          ; fd
.text:0000000000AA4098                 lea     rsi, [rbp+var_500] ; buf
.text:0000000000AA409F                 mov     rdx, rcx        ; count
.text:0000000000AA40A2                 syscall                 ; LINUX - sys_write
.text:0000000000AA40A4                 cmp     rax, 0
.text:0000000000AA40A8                 jl      short loc_AA40B6
.text:0000000000AA40AA                 mov     eax, 3Ch ; '<'
.text:0000000000AA40AF                 mov     edi, 0          ; error_code
.text:0000000000AA40B4                 syscall                 ; LINUX - sys_exit
```

For this level, once you understand what's happening a simple Python script can parse all the code, extract the operations and final value for each array element and reverse them to get the expected input key:
```python
 ➤ python3 day-01-reconstruct-key.py
--- Key Reconstruction Complete ---
Key length: 1024 bytes

Successfully wrote the reconstructed key to 'reconstructed_key.bin' (binary format).
➤ ✔ scp reconstructed_key.bin hacker@dojo.pwn.college:/home/hacker
reconstructed_key.bin
```

Then get the flag:
```bash
$ /challenge/check-list < reconstructed_key.bin
✨ Correct: you checked it twice, and it shows!
pwn.college{cqFsdOJjQoO-immwxNL7kN4DOFJ.QX4UDOxIDLzQDMyQzW}
```

## Day 2 - Dumpable SUID binary


### Description

<blockquote>
  <p>The password for trebek2 is the name of the script referenced in a deleted task as depicted in the event logs on the desktop PLUS the name of the text file on the user's desktop.</p>
</blockquote>

<div class="box-note">
Note that <a href="https://docs.microsoft.com/en-us/powershell/module/microsoft.powershell.utility/out-string?view=powershell-6" target="_blank">Out-String -Stream</a> is very important here. This is needed to be able to use <b>Select-String</b> and grep through the output!
</div>


All the levels were very educative! Huge thanks to the authors.
