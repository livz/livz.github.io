---
title:  "[CTF] Repeated Maleficence (XOR known plaintext)"
categories: [CTF, HTB, Crypto]
---

## Understanding the challenge

The challenge presents a short text we have to decrypt:

```bash
$ xxd -g 1 encrypted.txt 
00000000: 37 32 30 63 34 31 30 33 38 38 30 61 32 61 35 63  720c4103880a2a5c
00000010: 34 39 61 33 36 35 32 66 33 30 34 63 39 62 36 35  49a3652f304c9b65
00000020: 32 66 33 32 34 64 39 38 36 35 33 33 36 64 34 38  2f324d9865336d48
00000030: 38 37 35 34 30 37 37 33 34 39 63 34 30 62 33 36  8754077349c40b36
00000040: 33 36 34 62 38 38 30 66 32 35                    364b880f25
                                                          
```

Based on this, we can speculate a few things:

* Based on its length, it is not using a block encryption.
* Based on the characters frequency, this does not appear random at all. Possibly XOR encryption?
* Based on the challenge title, *repeated* maleficence, we might be dealing with a *XOR encryption with a repeated key*.

## Solution

We know that the decrypted text, if it’s a flag, will start with **HTB{** and end with **}**. Based on this, we can try to find the length of the encryption key. Notice that with a repeated key of length 5, the last character always decrypts to **}**. S we quickly found our key length. From here it’s a quick to brute-force the 5th character of the key, keeping in mind that the plaintext should contain only ASCII:

```python
def xor(msg, key):

    xored = b''
    for i in range(len(msg)):
        xored += bytes([msg[i] ^ key[i % len(key)]])
    return xored
          
if __name__ == '__main__':

    enc = bytes.fromhex(open('encrypted.txt', 'r').readline())
    print("[*] Length of the encrypted text: %d" % len(enc))
    
    for i in range(255):        
        flag = b'HTB{' +  bytes([i])
        key = xor(enc, flag)[:5]
        dec = xor(enc, key)
        if(dec.isascii()):
            print(dec)
```

Looking at the possible decryptions, we can quickly spot the correct one:

```bash
$ python sol.py
[*] Length of the encrypted text: 37
b'HTB{\x000r_1+_w34\x13_w15\x10_kn0\x0fn_p1L1n53\x005}'
b'HTB{\x010r_1*_w34\x12_w15\x11_kn0\x0en_p1M1n53\x015}'
b'HTB{\x020r_1)_w34\x11_w15\x12_kn0\rn_p1N1n53\x025}'
b'HTB{\x030r_1(_w34\x10_w15\x13_kn0\x0cn_p1O1n53\x035}'
...
b'HTB{U0r_1~_w34F_w15E_kn0Zn_p1\x191n53U5}'
b'HTB{V0r_1}_w34E_w15F_kn0Yn_p1\x1a1n53V5}'
b'HTB{W0r_1|_w34D_w15G_kn0Xn_p1\x1b1n53W5}'
b'HTB{X0r_1s_w34K_w15H_kn0Wn_p1\x141n53X5}'
b'HTB{Y0r_1r_w34J_w15I_kn0Vn_p1\x151n53Y5}'
b'HTB{Z0r_1q_w34I_w15J_kn0Un_p1\x161n53Z5}'
...
b'HTB{v0r_1]_w34e_w15f_kn0yn_p1:1n53v5}'
b'HTB{w0r_1\\_w34d_w15g_kn0xn_p1;1n53w5}'
b'HTB{x0r_1S_w34k_w15h_kn0wn_p141n53x5}'
b'HTB{y0r_1R_w34j_w15i_kn0vn_p151n53y5}'
```

XOR is indeed week with plaintext partially known!
