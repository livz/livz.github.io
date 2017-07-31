![Logo](/assets/images/token-ssh/smart-card.png)

This is a short step-by-step tutorial for how to get an [Aladdin eToken PRO](https://github.com/OpenSC/OpenSC/wiki/Aladdin-eToken-PRO)
to work for public-key authentication with [OpenSSH](https://www.openssh.com/) through [PKCS11](https://en.wikipedia.org/wiki/PKCS_11).
An Aladdin Pro token is needed (obviously!) with drivers and necessary libraries installed. 
Check the [previous guide](https://livz.github.io/2017/07/17/using-tokens-in-Ubuntu-with-pgp.html) for details.

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
* **Export the public key**  - Download the RSA public key from the token, in a format recognised by OpenSSH:
```bash
$ ssh-keygen -D /usr/lib/libeToken.so
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQCGJ/[...]1kf
```

* **Add the key to ```autorized_keys``` file**
```bash
$ ssh-keygen -D /usr/lib/libeToken.so >> ~/.ssh/authorized_keys
```
