---
title:  "[CTF] Three Keys (AES decryption)"
categories: [CTF, HTB, Reverse]
---

## Understanding the challenge

If we try to run the binary provided, we might initially get an error regarding a missing `libcrypto` library:

```bash
$ ./threekeys 
./threekeys: error while loading shared libraries: libcrypto.so.1.1: cannot open shared object file: No such file or directory
```

`libcrypto` is part of `libssl` package, which on newer Kali/Ubuntu distributions, it as at version 3:

```bash
$ dpkg --list | grep -i libssl 
ii  libssl-dev:amd64      3.0.11-1  amd64   Secure Sockets Layer toolkit - development files
ii  libssl3:amd64         3.0.11-1  amd64   Secure Sockets Layer toolkit - shared libraries
```

We don’t want to overwrite that, but we could instead download and compile the old version into a separate folder, by following [these instructions](https://stackoverflow.com/questions/76877144/voxel51-fiftyone-error-while-loading-shared-libraries-libcrypto-so-1-1-cann) for example:

```bash
$ mkdir -p $HOME/Software/openssl_1.1 && cd $HOME/Software/openssl_1.1
$ wget https://www.openssl.org/source/openssl-1.1.1o.tar.gz
$ tar -zxvf openssl-1.1.1o.tar.gz
$ cd openssl-1.1.1o
$ ./config && make && make test
```

Then we can run our binary as follows:

```bash
$ export LD_LIBRARY_PATH=$HOME/Software/openssl_1.1/openssl-1.1.1o
$ ./threekeys 
[*] Insert the three keys to claim your prize!
[*] Just be careful to insert them in the right order...
[*] Your prize is: ...something's wrong                                    
```

Having gone past this initial hurdle, let’s check the decompiled code in Ghidra:

```c
undefined8 main(void)
{
  int iVar1;
  undefined8 *ctx;
  char *out;
  uchar *puVar2;
  size_t in_R8;
  
  ctx = (undefined8 *)malloc(0x20);
  out = (char *)malloc(0x20);
  *ctx = 0xa646484365c8eb8c;
  ctx[1] = 0x9f803f2f42e80598;
  ctx[2] = 0x3ed81a287db3c9a8;
  ctx[3] = 0x6cb78fe92b1abaaa;
  puts("[*] Insert the three keys to claim your prize!");
  puts("[*] Just be careful to insert them in the right order...");
  puVar2 = (uchar *)the_third_key();
  decrypt((EVP_PKEY_CTX *)ctx,(uchar *)out,(size_t *)0x2,puVar2,in_R8);
  memcpy(ctx,out,0x20);
  puVar2 = (uchar *)the_second_key();
  decrypt((EVP_PKEY_CTX *)ctx,(uchar *)out,(size_t *)0x2,puVar2,in_R8);
  memcpy(ctx,out,0x20);
  puVar2 = (uchar *)the_first_key();
  decrypt((EVP_PKEY_CTX *)ctx,(uchar *)out,(size_t *)0x2,puVar2,in_R8);
  memcpy(ctx,out,0x20);
  iVar1 = memcmp(out,&DAT_00102071,3);
  if (iVar1 != 0) {
    out = "...something\'s wrong";
  }
  printf("[*] Your prize is: %s\n",out);
  return 0;
}
```

A blob of bytes is being decrypted 3 times, with a different key every time. We know that the order of the keys is not correct. We don’t even have to brute-force all the possible combinations for the 3 keys, because we get a hint from the names and logic of the functions that set up the keys. The decryption is done using AES but this is not very relevant:

```c
AES_KEY * the_third_key(void)
{
  AES_KEY *key;
  
  key = (AES_KEY *)malloc(0xf4);
 AES_set_decrypt_key(KEY1, 0x80, key);
  return key;
}
```

So we can probably guess that `KEY1` should be used last and `KEY3` should be used first.

## Solution

With this in mind, rather then re-implementing the decryption ourselves with the keys in the correct order, we can simply swap `KEY1` and `KEY3` while debugging:
![GDB](/assets/images/ThreeKeys/gdb.png)
The final comparison will succeed and we’ll get the flag:

```bash
[*] Your prize is: HTB{l3t_th3_hun7_b3g1n!}
```

## References

* [Missing libcrypto.so.1.1](https://stackoverflow.com/questions/76877144/voxel51-fiftyone-error-while-loading-shared-libraries-libcrypto-so-1-1-cann)
* [AES_ENCRYPT/AES_DECRYPT man page](https://man.openbsd.org/AES_encrypt.3)
