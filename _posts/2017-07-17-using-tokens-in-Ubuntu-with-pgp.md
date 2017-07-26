![Logo](/assets/images/token-pgp/key-logo.png)

In this tutorial we'll see how to use an eToken in Ubuntu with PGP for signing documents and also encryption/decryption. 
We'll use the [*Aladdin eToken Pro*](https://github.com/OpenSC/OpenSC/wiki/Aladdin-eToken-PRO), a very popular token with good support for Linux. Our goal is to be able to correctly initialise the token, generate key pairs and certificates and integrate the token with GPG and PKCS11.

While these instructions should work with other Linux distributions as well, *your mileage may very*. I did spend a good amount of times earching for fixes and workarounds. It was successfully tested on the following versions:
* Token version: 4.28.1.1 2.7.195
* Ubuntu: 14.04.5 x86_64
* gpg (GnuPG) 2.0.22
* SafenetAuthenticationClient 9.0.43
* gnupg-pkcs11-scd 0.7.3-1
* libengine-pkcs11-openssl 0.1.8-3  

![Aladdin](/assets/images/token-pgp/etoken-pro.png)

## 1. Configuration
* First install all package requirements:
```bash
$ sudo apt-get install opensc libpcsclite1 pcsc-tools pcscd
$ sudo apt-get install libengine-pkcs11-openssl
$ sudo apt-get install gnupg-pkcs11-scd 
$ sudo apt-get install gnupg2
```

* Install HAL:
```bash
$ sudo add-apt-repository ppa:mjblenner/ppa-hal
$ sudo apt-get update
$ sudo apt-get install libhal1 libhal-storage1
```

* Install SafeNet client:
```bash
$ sudo dpkg -i SafenetAuthenticationClient-9.0.43-0_amd64.deb
```

* Verify that you can access the token:
```bash
$ pkcs11-tool --module /usr/lib/libeTPkcs11.so --show-info
Cryptoki version 2.20
Manufacturer     SafeNet, Inc.
Library          SafeNet eToken PKCS#11 (ver 9.0)
Using slot 0 with a present token (0x0) 
```
```bash
$ pkcs11-tool --module /usr/lib/libeTPkcs11.so --list-slots
Available slots:
Slot 0 (0x0): AKS ifdh 00 00
  token label        : mytoken3
  token manufacturer : SafeNet, Inc.
  token model        : eToken
  token flags        : rng, login required, PIN initialized, token initialized, other flags=0x500200
  hardware version   : 4.28
  firmware version   : 2.7
  serial num         : 00373fad
```

## 2. Token initialisation
* Create Security Office (SO) PIN (PUK):
```bash
$ pkcs11-tool --module /usr/lib/libeToken.so --init-token --label mytoken3
```

* Create a user PIN:
```bash
$ pkcs11-tool --module /usr/lib/libeToken.so --init-pin --login
```

> **Note!** For both PUK and PIN, no comlexity requirements are enforced, allowing for weak pins. 
The only requirement is that its length should be greater than 3. 
Supposedly brute-forcing the token should be impossible.

* To change the current user PIN:
```bash
$ pkcs11-tool --module /usr/lib/libeToken.so --change-pin
```

* Create an RSA publicn and private key pair. This will be generated on the token and will not leave the device:
```bash
$ pkcs11-tool --module /usr/lib/libeToken.so --login --keypairgen --key-type RSA:2048 --id 1 --label "john@snow.com"
```

* Verify that the key was correctly generated. You should see two key objects, public and private:
```bash
$ pkcs11-tool --module /usr/lib/libeToken.so --login --list-objects
Using slot 0 with a present token (0x0)
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
```  

* To delete objects from the token, we need their type and id:
```bash
$ pkcs11-tool --module /usr/lib/libeToken.so --login --delete-object --type pubkey --id 1
$ pkcs11-tool --module /usr/lib/libeToken.so --login --delete-object --type cert --id 2
```

* Create an X509 certificate

   Next, you’ll need to create a self-signed x509 certificate, since this is needed for most applications to recognise the keypair+certificate. Make sure you specify the key id you used to create the RSA keypair (-key). The certificate will be created in PEM format by default. Since the eToken only accepts certificates in DER format, you’ll need to convert it as well:

