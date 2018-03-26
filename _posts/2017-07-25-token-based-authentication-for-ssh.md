---
title:  "Token-based Authentication for SSH"
published: true
categories: [SecurityBricks]
---


![Logo](/assets/images/token-ssh/smart-card.png)

This is a short step-by-step tutorial for how to get an [Aladdin eToken PRO](https://github.com/OpenSC/OpenSC/wiki/Aladdin-eToken-PRO)
to work for public-key authentication with [OpenSSH](https://www.openssh.com/) through [PKCS11](https://en.wikipedia.org/wiki/PKCS_11).
An Aladdin Pro token is needed (obviously!) with drivers and necessary libraries installed. 
Check the [previous guide](https://livz.github.io/2017/07/17/using-tokens-in-Ubuntu-with-pgp.html) for details.

This post is part of the **Security Bricks tutorials** - simple methods and habits
to build a deliberately secure operational environment, for personal and business use. The other parts below:

* [Part 1 - Physical OPSEC basics]({{ site.baseurl }}{% post_url 2017-07-02-physical-OPSEC-basics %})
* [Part 2 - Preventing evil maid attacks]({{ site.baseurl }}{% post_url 2017-05-06-preventing-evil-maid-attacks %})
* [Part 3 - KeePass password manager with 2FA]({{ site.baseurl }}{% post_url 2017-07-09-keepass-password-manager-with-2fa %})
* [Part 4 - Using tokens in Ubuntu with PGP]({{ site.baseurl }}{% post_url 2017-07-17-using-tokens-in-Ubuntu-with-pgp %})
* [Part 6 - Use a Bluetooth device for better security]({{ site.baseurl }}{% post_url 2017-08-02-use-Bluetooth-device-for-better-security %})

## Steps
* **Check the objects on the token** - Notice the two public/private key objects, 
[generated previously](https://livz.github.io/2017/07/17/using-tokens-in-Ubuntu-with-pgp.html):
```
$ pkcs11-tool --module /usr/lib/libeTPkcs11.so --slot 0 --login --list-objects
Logging in to "mytoken3".
Please enter User PIN: 
Public Key Object; RSA 2048 bits
  label:      john@snow.com
  ID:         01
  Usage:      encrypt, verify, wrap
Private Key Object; RSA 
  label:      john@snow.com
  ID:         01 
  Usage:      decrypt, sign, unwrap
Certificate Object, type = X.509 cert
  label:      john@snow.com
  ID:         01
```
* **Export the public key** - Download the RSA public key from the token, in a format recognised by OpenSSH:
```bash
$ ssh-keygen -D /usr/lib/libeToken.so
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQCGJ/[...]
```

* **Add the key to ```autorized_keys``` file**
```bash
$ ssh-keygen -D /usr/lib/libeToken.so >> ~/.ssh/authorized_keys
```

* **Login using the private key** - Connect to the server using the token to provide the private key. The PIN will be requested to access it:
```
$ ssh -I /usr/lib/libeToken.so m@192.168.X.X   
Enter PIN for 'mytoken3': 
Welcome to Ubuntu 14.04.5 LTS (GNU/Linux 3.19.0-66-generic x86_64)
[...] 
```
