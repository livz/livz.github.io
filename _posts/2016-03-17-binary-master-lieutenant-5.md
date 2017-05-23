![Logo](/assets/images/belts-black-plus.png)


We're finally reached the last level of [Lieutenant](https://www.certifiedsecure.com/certification/view/37) set of challenges from **Certified Secure Binary Mastery**. Before diving in, a huge thank you goes to the challenge writer for creating this learning oppurtunity!

In this post we'll analyse an encrypted communication protocol based on [Diffie-Hellman key exchange](https://en.wikipedia.org/wiki/Diffie%E2%80%93Hellman_key_exchange). If you're not familiar with the protocol, please study it beforehand since it is very important in general, not only for solving challenges. In a nutshell, **_DH key exchange is a method of securely exchanging cryptographic keys over an insecure channel_**. And that's exactly what's happening here: Alice and Bob first establis ha secret key, which Alice then uses it to send the final password to Bob,

To review the previous levels, check the links below:
* [Binary Master: Ensign - Level 1](https://livz.github.io/2016/01/07/binary-master-ensign-1.html)
* [Binary Master: Ensign - Level 2](https://livz.github.io/2016/01/14/binary-master-ensign-2.html)
* [Binary Master: Ensign - Level 3](https://livz.github.io/2016/01/21/binary-master-ensign-3.html)
* [Binary Master: Ensign - Level 4](https://livz.github.io/2016/01/28/binary-master-ensign-4.html)
* [Binary Master: Ensign - Level 5](https://livz.github.io/2016/02/09/binary-master-ensign-5.html)
* [Binary Master: Lieutenant - Level 1](https://livz.github.io/2016/02/16/binary-master-lieutenant-1.html)
* [Binary Master: Lieutenant - Level 2](https://livz.github.io/2016/02/23/binary-master-lieutenant-2.html)
* [Binary Master: Lieutenant - Level 3](https://livz.github.io/2016/03/02/binary-master-lieutenant-3.html)
* [Binary Master: Lieutenant - Level 4](https://livz.github.io/2016/03/10/binary-master-lieutenant-4.html)


## 0 - Discovery

To understand what's happening in this level, let's analyse the two Python scripts corresponding to the two participants to the exchange (Comments have been added to clarify the DH interaction).

**level5a.py - Alice**
```python
#!/usr/bin/env python

import SocketServer
import sys
import threading
import os

f = open('/levels/level5_passwords.txt', 'r')
AUTH = f.readline()
LEVEL6_PASSWORD = f.readline()
f.close()

# Modulus p
p = 0x85e99842bf55f81044e281004808b209a516bd029c32672df1971a73f2537809bd6c1729ead34ebc26622b0ed41eded76b27c3a87015a2c14adbe0b413491ce14a7e871e33509e70c344e59b002ba9a9f4b0dddde452fa544ffe38914632c45c78070efe79b8175b4fd18ccbf671548aa8064b6c6c5652c5c3a7d866dc5ef9b1

# Base g
g = 0x85bfc96a010f43e355adda5fee6ec9be46af6a4a010840a6867943354e8e4d316215c18d60a3b62d3a1bdfe50e4a14906799fee3d577089cc8792004b2cc5c672083316f538553de12b36c468d951b0f9bac0668426d6f62033d13509a72ad3108a2459e351a9c52aa3d05bc1e26d1c74708ffbeeeb2e7c9036f6f7b2b0d338c

# Convert binary string to int
def bintoint(s):
	return sum(ord(c) << (8 * i) for i, c in enumerate(s))

# Convert int to binary string
def inttobin(n, ln):
	return ''.join(chr((n >> (8 * i)) & 0xff) for i in range(ln))

# Calculate random number < n
def random(n):
	return bintoint(os.urandom(len("%x" % n))) % n

class AliceTCPHandler(SocketServer.BaseRequestHandler):

    def handle(self):
        # First setup a secure session key
        
        # Chose secret integer a
        a = random(p)

        # Send to Bob A = g^a mod p
        A = pow(g, a, p)

        # Send modulus p and base g to Bob
        self.request.sendall(inttobin(p, 128))
        self.request.sendall(inttobin(g, 128))

        # Send A to Bob
        self.request.sendall(inttobin(A, 128))
        
        # Receive B from Bob
        B = bintoint(self.request.recv(1024))

        # Compute shared secret key as key = B^a mod p
        key = pow(B, a, p)

        # We now have a secure session key, lets see if the user can authenticate
        auth_enc = self.request.recv(128)

        if auth_enc == inttobin(pow(bintoint(AUTH), key, p), 128):
            # We have a session key and the user is authenticated
            # Lets send him the level 6 password
            lvl6_enc = pow(bintoint(LEVEL6_PASSWORD), key, p)
            self.request.sendall(inttobin(lvl6_enc, 128))

class ThreadedTCPServer(SocketServer.ThreadingMixIn, SocketServer.TCPServer):
    pass

if __name__ == '__main__':
    HOST, PORT = "localhost", 5550

    server = ThreadedTCPServer((HOST, PORT), AliceTCPHandler)

    server.serve_forever()
```

So what's happening here:
* Alice listens on port 5550 for incoming connections from Bob
* Upon receiving a connection, it sends the public modulus (**p**) and the public base (**g**)
* It then computes and sends its public key A = g<sup>a</sup> mod p
* Receives Bob public key
* Computes the shared key as key = B <sup>a</sup> mod p  (Bob will do the same so both will reach the same secret key)
* The agreed key is then used to decrypt an authentication password sent from B
* The decrypted password is compared against the first line read from the level5_passwords.txt file
* if the passwords match, Alice will send Bob the final password, read from the second line of the same file

**level5b.py - Bob**
```python
#!/usr/bin/env python

import os
import SocketServer
import sys
import threading

f = open('passwords.txt', 'r')
AUTH = f.readline()
f.close()

# Convert binary string to int
def bintoint(s):
	return sum(ord(c) << (8 * i) for i, c in enumerate(s))

# Convert int to binary string
def inttobin(n, ln):
	return ''.join(chr((n >> (8 * i)) & 0xff) for i in range(ln))

# Calculate random number < n
def random(n):
	return bintoint(os.urandom(len("%x" % n))) % n

class BobTCPHandler(SocketServer.BaseRequestHandler):

    def handle(self):
        # Lets generate a secure session key	

        # Receive modulus p and base g from Alice
        p = bintoint(self.request.recv(1024))
        g = bintoint(self.request.recv(1024))

        # Receive A from Alice
        A = bintoint(self.request.recv(1024))

        # Chose secret integer b
        b = random(p)

        # Compute B = g^b mod p and send to Alice
        B = pow(g, b, p)
        B = self.request.sendall(inttobin(B, 128))

        # Compute shared secret key as key = A^b mod p
        key = pow(A, b, p)

        # Now we have a secure session key, lets authenticate
        auth_enc = inttobin(pow(bintoint(AUTH), key, p), 128)
        self.request.sendall(auth_enc)

        # We should now get the encrypted level 6 password
        level6_password_enc = self.request.recv(1024)

class ThreadedTCPServer(SocketServer.ThreadingMixIn, SocketServer.TCPServer):
        pass

if __name__ == '__main__':
	HOST, PORT = "localhost", 5551

	server = ThreadedTCPServer((HOST, PORT), BobTCPHandler)

	server.serve_forever()
```

Here things are pretty similar. Bob will have to reach the same value of the shared key, based on the public information exchanged with Alice:
* Receive modulus p and base g, the public parameters sent by Alice
* Receive Alice's public key A
* Compute and send its own public key B = g<sup>b</sup> mod p
*  Computes the shared key as key = A <sup>b</sup> mod p  (Alice will have done the same so both will reach the same secret key)
* Read the password from the first line of level5_passwords.txt file, encrypt it with the shared key and send it to Alice
* Alice will validate it and send back the level6 password in case in validates successfully.



We can also see the two processes listening on the corresponding ports, 5550 (Alice) and 5551 (Bob):
```bash
level5@shellbinarylieutenant:~$ netstat -antp | grep 555
(No info could be read for "-p": geteuid()=1006 but you should be root.)
tcp        0      0 127.0.0.1:5550          0.0.0.0:*               LISTEN
tcp        0      0 127.0.0.1:5551          0.0.0.0:*               LISTEN
```

## 1 - Vulnerability

If we think a little bit about this scenario, this is a classic Man-in-the-Middle scenario. As it is the case most of the times, cryptographic protocols are quite solid but implementations are flawed. Although Alice would send strong values for the modulus _p_ and base _g_, an attacker can send anything to Bob and force him  to use those parameters in the encryption process. Same is true for Bob.

## 2 - Exploit

So let's see how to exploit this. The idea is like this:  we'll first exploit Bob and make him reveal the authentication password, then use the authentication password with Alice and make her reveal the level6 password.

### Exploiting Bob
* We'll impersonate Alice and send simple values for p, base and A to Bob:
    * p = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF - We know that the length of the file containing the 2 passwords is 31 bytes so We want the modulus to cover as many charaters as possible. If this is not clear why, check how the _bintoint_ function converts a string to an integer. The AUTH message will be raised to the key power and the result modulo p, so we want to make sure the modulus is large enough.
    * g = 42 - It doesn't actually matter
    * A = 1 - This will force the shared key to 1 (key = A<sup>b</sup> mod p) 
* By forcing Bob to generate a secret key of 1, Alice will receive the plain text authentication password, computed as AUTH<sup>key</sup> mod p

**exploitBob.py:**
```python
import socket
import os

# Convert binary string to int
def bintoint(s):
    return sum(ord(c) << (8 * i) for i, c in enumerate(s))

# Convert int to binary string
def inttobin(n, ln):
    return ''.join(chr((n >> (8 * i)) & 0xff) for i in range(ln))

# Calculate random number < n
def random(n):
    return bintoint(os.urandom(len("%x" % n))) % n

# Choose simple values for modulus, base and A
# Cover a maximum length of 30 characters for the key 
p = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF
g = 42      # Not needed when exploiting Bob
A = 1       # Force key to 1 

sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
sock.connect(("127.0.0.1", 5551))

try:
    sock.sendall(inttobin(p, 128))      # Send modulus
    sock.sendall(inttobin(g, 128))      # Send base
    sock.sendall(inttobin(A, 128))      # Send A

    # Receive B and auth_enc, both on 128 bytes

    # Random big number modulo p
    B = sock.recv(128)
    print bintoint(B)

    # Since we forced key to 1, auth_enc will be the AUTH code
    auth_enc = sock.recv(128)
    print auth_enc

finally:
    sock.close()
```

### Exploiting Alice

* Similarly, after finding out the authentication password, we'll impersonate Bob in a conversation with Alice.
* This time We'll send B = 1 in order to force Alice generate a secret key of 1 (key = B<sup>a</sup> mod p). That's all that matters now.
* This secret key will first be used to decrpt the AUTH code (we have this already).
* Alice will then encrypt level6 password using this key - 1. Quite convenient!

**exploitAlice.py:**
```python
import socket
import os

# Convert binary string to int
def bintoint(s):
    return sum(ord(c) << (8 * i) for i, c in enumerate(s))

# Convert int to binary string
def inttobin(n, ln):
    return ''.join(chr((n >> (8 * i)) & 0xff) for i in range(ln))

# Calculate random number < n
def random(n):
    return bintoint(os.urandom(len("%x" % n))) % n

sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
sock.connect(("127.0.0.1", 5550))

B = 1   # Force key to 1
AUTH = "authmeplease" + "\n"

try:
    p = bintoint(sock.recv(128))        # Receive p
    print "[*] Modulus: ", p

    g = bintoint(sock.recv(128))        # Receive base
    print "[*] Base: ", g

    A = bintoint(sock.recv(128))        # Receive A (not needed)
    print "[*] A: ", A

    sock.sendall(inttobin(B, 1024))     # Send B
    a = random(p)
    key = pow(B, a, p)
    print "[*] Key (as it should be computed by Alice:", key

    auth_enc = inttobin(pow(bintoint(AUTH), key, p), 128)
    sock.sendall(auth_enc)              # Send AUTH

    # Authentification should be successful
    # Receive level6 password
    level6_password = sock.recv(128)
    print level6_password

finally:

    sock.close()
```

## 3 - Profit

```bash
$ python /tmp/exploitBob.py
1135050613066351938996128187609084917667954771081760028676542617316484297
auth[REDATCTED]

$ python /tmp/exploitAlice.py
[*] Modulus:  94036541088007532117237349784325499358080484245677783121388832947785590561593774054117855836823963885982261840092324642595749124538079817962452026746551707650235480341764537958005589852739842720793564647966636204280443512652681597985063506592530474633376408733471734903422282232774180983629067993567524223409
[*] Base:  93921859164902573079669888843088339307803777066656981727897952092833904006839152747201730977630557189966505074968648865000429550487008802035657277197051629935633369605051629810126774537805833883230162607490044044835284512024077374902992864225251758306584776295565801404718638962414009425671687476441974125452
[*] A:  67822532937672403341133500344662694313100688943009465570368871195094638682198921320122360558606976847691444030865164117689804840177358778671136035631030768734493075317491984663789698285991290859575819343388739148987231447904568337380980789800692490340141178255466207869636147193673919982118380272726613835839
[*] Key (as it should be computed by Alice: 1
youmade[REDACTED]
```
We can then use the level6 password to login and get the expected sweet message:
```
level6@shellbinarylieutenant:~$ ./victory
   ___  _                      __  ___         __
  / _ )(_)__  ___ _______ __  /  |/  /__ ____ / /____ ______ __
 / _  / / _ \/ _ `/ __/ // / / /|_/ / _ `(_-</ __/ -_) __/ // /
/____/_/_//_/\_,_/_/  \_, / /_/  /_/\_,_/___/\__/\__/_/  \_, /
                     /___/                              /___/
                ___           __                   __
               / (_)___ __ __/ /____ ___ ___ ____ / /_
              / / // -_) // / __/ -_) _ | _ `/ _ | __/
             /_/_/ \__/\_,_/\__/\__/_//_|_,_/_//_|__/

Subject: Victory!

Congrats, you have solved the last level!. To update your score,
send an e-mail to unlock@certifiedsecure.com and include:
   * your CS-ID
   * which level you solved (level5 @ binary mastery lieutenant)
   * the exploit
```

This concludesthe Binary Mastery challenges. I hope this was a good learning opportunity and thanks again to the challenge creators!

