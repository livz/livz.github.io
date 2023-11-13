---
title:  "[CTF] Untraceable (PTRACE_TRACEME anti-anti-debug)"
categories: [CTF, HTB, Reverse]
---

## Understanding the challenge

This is a simple challenge but has interesting lessons to teach us. It starts with a a binary that is asking for a password:

```bash
$ ./untraceable 
What is the password to the archive? HelloWorld
Intruder detected!
```

If we look at the Ghidra’s decompiled code, we note a few interesting things:

```c
undefined8 main(void)
{
  int iVar1;
  long lVar2;
  size_t sVar3;
  undefined8 uStack_60;
  undefined8 local_58;
  undefined8 local_50;
  undefined8 local_48;
  undefined8 local_40;
  undefined8 local_38;
  undefined8 local_30;
  undefined8 local_28;
  undefined4 local_20;
  undefined2 local_1c;
  undefined local_1a;
  uint local_c;
  
  local_38 = 0x6365537265707553;
  local_30 = 0x7773736150746572;
  local_28 = 0x6f4e6f442d64726f;
  local_20 = 0x61655274;
  local_1c = 0x2164;
  local_1a = 0;
  local_58 = 0;
  local_50 = 0;
  local_48 = 0;
  local_40 = 0;
  uStack_60 = 0x101217;
 lVar2 = ptrace(PTRACE_TRACEME);
  if (lVar2 == -1) {
    uStack_60 = 0x101229;
    puts("Tampering detected!");
    uStack_60 = 0x101233;
    exit(-1);
  }
  uStack_60 = 0x101244;
  printf("What is the password to the archive? ");
  uStack_60 = 0x10125c;
  fgets((char *)&local_58,0x20,stdin);
  if ((char)local_58 != '\0') {
    uStack_60 = 0x101273;
    sVar3 = strlen((char *)&local_58);
    *(undefined *)((long)&uStack_60 + sVar3 + 7) = 0;
  }
  uStack_60 = 0x101294;
  iVar1 = strncmp((char *)&local_38,(char *)&local_58,0x1f);
  if (iVar1 == 0) {
  for (local_c = 0; local_c < 0x1d; local_c = local_c + 1) {
      uStack_60 = 0x1012ca;
      putchar((int)*(char *)((long)&local_38 + (long)(int)local_c) ^
              (uint)(byte)(&DAT_00104070)[(int)local_c]);
    }
    uStack_60 = 0x1012e2;
    puts("");
  }
  else {
    uStack_60 = 0x1012f0;
    puts("Intruder detected!");
  }
  return 0;
}
```

Observations at first sight:

* There are a few interesting variables on the stack that seem to contain ASCII values.
* The binary is using the `ptrace(PTRACE_TRACEME)` anti-debugging technique.
* Towards the end of the program there is a XOR (possibly decryption) loop.

Each of these observation will lead to a separete method to solve the challenge.

## Solutions

### Method 1 - Hardcoded password 

The variables on the stack represent the password required to “unlock the archive”. After converting from hex to ASCII, we get the following very well hidden password: ***SuperSecretPassword-DoNotRead!** *With this, it’s very easy to get the flag:

```bash
./untraceable
What is the password to the archive? SuperSecretPassword-DoNotRead!
HTB{0ld3st_tr1ck_1n_th3_b00k}
```

### Method 2 - Bypass PTRACE anti-debugging

The idea behind the `PTRACE` anti-debugging trick is that a process can only be traced by one other process. If we call `ptrace` ourselves, other programs cannot debug through `ptrace` or inject code into our program. If the program is currently being debugged by `gdb`, the `ptrace` function will return an error, which indicates that the debugger is detected.

A quick way to workaround this trick is to create a library with a custom `ptrace` function, then use the `LD_PRELOAD` environment variable to point the executable to our own custom `ptrace` function. The C code looks like this:

```c
// gcc -shared ptrace.c -o ptrace.so

#include <stdio.h>

int ptrace(int i, int j, int k, int l) {
    printf(" PTRACE CALLED!\n");
}
```

Compile, set the environment variable in GDB and happy debugging!

```bash
$ gcc -shared ptrace.c -o ptrace.so

$ gdb ./untraceable

gef➤  set environment LD_PRELOAD ./ptrace.so

gef➤  r
Starting program: /mnt/hgfs/CTF-apr-23/rev_untraceable/untraceable 
[Thread debugging using libthread_db enabled]
Using host libthread_db library "/lib/x86_64-linux-gnu/libthread_db.so.1".
 PTRACE CALLED!
What is the password to the archive?  
```

Now that we’re able to debug our program, we can simply set a breakpoint before the comparison of the provided password with the hardcoded value (the `strncmp` call):
![GDB](/assets/images/Untraceable/gdb.png)

### Method 3 - XOR decryption

The third method to solve this challenge is based on the decryption loop, which we can easily reproduce in a separate Python script, after extracting the encrypted flag from `DAT_00104070` location:

```python
enc = [
    0x1b, 0x21, 0x32, 0x1e, 0x42, 0x3f, 0x01, 0x50,
    0x01, 0x11, 0x2b, 0x24, 0x13, 0x42, 0x10, 0x1c,
    0x30, 0x43, 0x0a, 0x72, 0x30, 0x07, 0x7d, 0x30, 
    0x16, 0x62, 0x55, 0x0a, 0x19
] 

password = "SuperSecretPassword-DoNotRead!"

print("[*] Encrypted data length: %d (0x%02x)" % (len(enc), len(enc)))

dec = "".join([chr(enc[i] ^ ord(password[i])) for i in range(len(enc))])
print (dec)
```

And get the flag:

```bash
$ python solve.py 
[*] Encrypted data length: 29 (0x1d)
HTB{0ld3st_tr1ck_1n_th3_b00k}                                  
```

## References

* [Detecting Debugging Bypassing](https://ctf-wiki.mahaloz.re/reverse/linux/detect-dbg/)
