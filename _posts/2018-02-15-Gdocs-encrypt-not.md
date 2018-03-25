---
title: "How (Not) To Encrypt Google Docs"
layout: post
date: 2018-02-15
published: true
---

![Logo](/assets/images/crypto-fail.jpg)

## Overview

The other day I was searching online for ways to encrypt a spreadsheet in Google Drive and apparently **_there is no straight forward way to do this without 3rd party applications, scripts and workarounds_**. While the reasons why Google doesn't provide this feature are somewhat understandable, I was more interested in the other _solutions_ which popped out in the search results. [One of them](http://www.skipser.com/p/2/p/password-protect-google-drive-document.html) is by far the most popular and has been picked up and recommended by many technical guides websites like [Lifehacker](https://lifehacker.com/5994296/password-protect-a-google-drive-spreadsheet-with-this-script), [Quora](https://www.quora.com/Is-it-possible-to-create-a-password-protected-Google-doc), [Addictivetips](https://www.addictivetips.com/web/how-to-password-protect-spreadsheets-in-google-drive/) and others.

Curious, I decided to read more. Then I noticed the _Step 8_ of the guide above states that after setting a password and encrypting the spreadsheet:

> _Now your data is fully password protected and nobody can read it without having the password you have set._

## Observations

Unfortunately it didn't take much to see the _encryption_ was way to easy to bypass. Let's start with a simple message and see what happens when we enable encryption:

```
Some secret message
```

Gets encrypted to:

```
Zvtl'zljyl 'tlzzhnl
```

Just by trying to encrypt a short text a few times with different keys we, a few facts were clear:
* The script **_accepts any password_** (_even blank!_).
* The *__ciphertext is not dependent on the password__*. 
* Moreover, it looks like a **_simple mono-alphabetic substitution cipher_**. The same letters get encrypted to the same value, on all the positions they appear.

### Attacks

Although probably other attacks are possible, three are straight forward to do:

* **Chosen plaintext attack** - An attacker has the ability to obtain the ciphertext for his chosen plaintext. Entirely possible here since the encrypted text doesn't depend on the password. An attacker needs just to encrypt the whole alpha-numeric range and he'll be able to map any plaintext characters to the corresponding values.

```
abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ 0123456789
```

Encrypts to:
```
hijklmnopqrstuvwxyz !"#$%&HIJKLMNOPQRSTUVWXYZ[\]^_`a'789:;<=>?@
```
* **Frequency analysis attack** - This is a classic attack based on the fact that, in any given language, certain letters and combinations of letters occur with varying frequencies. If an attacker has access to enough ciphertext material, it's very easy to derive the substitution map and then be able to decrypt anything.
* **Source code review** - The code responsible for the encryption of the spreadsheet can be accessed by navigating to _Tools → Script Editor_. Have fun reversing it if you're interested!

## (Instead of) Conclusions

* If the goal is to prevent an attacker with access to the spreadsheet to read the content, than this method is totally unsuitable!

_In some ways, cryptography is like pharmaceuticals. Its integrity may be absolutely crucial. But bad penicillin looks the same as good penicillin_ - **Philip Zimmermann**
