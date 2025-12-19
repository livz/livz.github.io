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
Basically the challenge loads a BPF filter from a compiled object file - `tracker.bpf.o` (No source code available this time), locates a BPF program (`handle_do_linkat`) and attaches a probe to it then gets a handle to a `success` map. It then continously checks for the presence of a first element in it with a value different than 0. To get an idea about the compiled eBPF filter, list all the sections:

```bash
(List all sections)
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
llvm-objdump -d -j kprobe/__x64_sys_linkat /challenge/tracker.bpf.o
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

The disassembly is quite large but repetitive. At this point I used an LLM to do a first pass thrugh the decompiled code with mixed results. What I got was that the binary running as SUID _will broadcast the flag when an unprivileged process executes the linkat system call, and the newpath argument must point to a string that exactly matches: "prancer"_. Although this wasn't correct, it was a very good starting point. 

Before recovering all the expected arguments to `linkat` from the disassembly, I wanted to understand a bit more the eBPF filter, so I recompiled the binary with soem debug information. To do this, we need `libbpf` and some includes:

```bash
LIBBPF_ROOT=/nix/store/b9zasiadhppl3kbn3jlfvvssc35hhavq-libbpf-1.5.0

# Execute the final compilation command
sudo gcc -o northpole -Wall -g northpole.c \
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

The first one is used to track the progress from one link to another, almost like a state machine. That's why the order of the link operations matter. The second one is the one checked by the C program for success. We can also dump the maps with `bpftool`:
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
Or even manually set values for elements, to confirm the uderstanding of the code is correct:
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


<div class="box-note">
Note that <a href="https://docs.microsoft.com/en-us/powershell/module/microsoft.powershell.utility/out-string?view=powershell-6" target="_blank">Out-String -Stream</a> is very important here. This is needed to be able to use <b>Select-String</b> and grep through the output!
</div>

## Day 5 - 

All the levels were very educative! Huge thanks to the authors.
