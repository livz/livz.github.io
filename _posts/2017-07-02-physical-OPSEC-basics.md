---
title:  "Physical OPSEC Basics"
---

![Logo](/assets/images/opsec-basics/loose-lips.png)

**Operations Security** is sometimes about simple things. Things we do in a certain way every day, without realising it. It is also a mindset, is about doing things right, over and over again until it becomes internalised. Wikipedia defines [OPSEC](https://en.wikipedia.org/wiki/Operations_security) as:

> [..] a term originating in U.S. military jargon, as a process that identifies critical information to determine if friendly actions can be observed by enemy intelligence, determines if information obtained by adversaries could be interpreted to be useful to them, and then executes selected measures that eliminate or reduce adversary exploitation of friendly critical information.

This post is part of the **Security Bricks tutorials** - simple methods and habits
to build a deliberately secure operational environment, for personal and business use. The other parts below:

* [Part 2 - Preventing evil maid attacks]({{ site.baseurl }}{% post_url 2017-05-06-preventing-evil-maid-attacks %})
* [Part 3 - KeePass password manager with 2FA]({{ site.baseurl }}{% post_url 2017-07-09-keepass-password-manager-with-2fa %})
* [Part 4 - Using tokens in Ubuntu with PGP]({{ site.baseurl }}{% post_url 2017-07-17-using-tokens-in-Ubuntu-with-pgp %})
* [Part 5 - Token-based authentication for SSH]({{ site.baseurl }}{% post_url 2017-07-25-token-based-authentication-for-ssh %})
* [Part 6 - Use a Bluetooth device for better security]({{ site.baseurl }}{% post_url 2017-08-02-use-Bluetooth-device-for-better-security %})

Let’s dissect that a bit. So **OPSEC** addresses the following key points:

* Can friendly actions or information be observed by an adversary?
* Can this observed information be interpreted to be useful to them?
* How to eliminate or reduce adversary exploitation of friendly information?

Strongly related to the concept of OPSEC is the idea of **_aggregation_**: grouping individual pieces of not necessarily related information in order to obtain a bigger picture.

Enough talking! Let’s see a few quick ways to improve our daily OPSEC:

## Camera cover
Reliable webcam covers should be applied whenever necessary: phone, laptop, external USB camera. There are a variety of model out there, ranging in price, but most very cheap. To chose a good cover and avoid having to buy it again in 2 months:

* Make sure it is robust and easy to cover/uncover the lens.
* Avoid fancy stickers applied on the camera lens because you will need to take them off from time to time.
* A lot of companies offer promotional webcam covers with their logo. From experience, most of them are of poor quality. 

A very simple one, suitable for phones, tablets and laptops alike:

![Camera cover](/assets/images/opsec-basics/webcam_cover.png)

## Privacy screen 
A privacy screen for mobile phones is absolutely necessary. For laptops it can be a bit inconvenient to work with the screen on, but luckily most of them can be taken off easily and fitted back when needed.

![Privacy screen](/assets/images/opsec-basics/privacy_screen.png)

## Laptop lock
Maybe having your laptop stolen is not something that happens every day, but it only needs to happen once. These locks come in [different](https://www.laptopmag.com/articles/best-laptop-locks) [models](https://www.kensington.com/en/gb/4480/security) (combination locks, keyed locks, etc). The most important thing is to do your research before buying one. 

There are ways to bypass these locks, ranging from industrial wire cutters to clever lock picking techniques, however It's like locking your front door. Anyone can kick it in, but better than just leaving it open.

![Laptop lock](/assets/images/opsec-basics/kensington_lock.png)

## Encrypted USBs
As with the laptop locks, do your research before buying one. Historically there have been some problems in the past with software based encrypted USBs, however, the security of hardware based encrypted USB devices is pretty solid.  So a few tips:

* Go for hardware encryption, even if they are a bit more expensive. 
* Actually start using it!
* Beware that if you go the corner shop to print your CV from it, encryption will not prevent malware from infecting it!

![Encrypted USB](/assets/images/opsec-basics/enc_usb.png)

**Update 01/08/17**: In the following Google research, the authors divided the attackers into hobbyists, professionals, and nation states then went on to search for vulnerabilities in a number of different encrypted USB devices. Very impressive what they've found. A lot of failures on the hardware level, for example in the TEMPEST extraction prevention measures or epoxy security. A lot of these devices share the same microcontroller and implicitely the same bugs. 

[Attacking encrypted USB keys the hard(ware) way](https://cdn.elie.net/talks/analyzing-secure-usb-the-hardware-way-slides.pdf) - Jean-Michel Picod, Remi Audebert, Sven Blumenstein, Elie Bursztein

## Disable microphone
Malware that [eavesdrops via computer microphones](http://inhomelandsecurity.com/malware-that-eavesdrops-via-computer-microphones-is-stealing-hundreds-of-gigs-of-data) is far from just a theoretical problem. Metasploit incorporated plugins for [recording webcam and microphone](https://null-byte.wonderhowto.com/how-to/hack-like-pro-remotely-record-listen-microphone-anyones-computer-0143966/) long long time ago. It’s effortless and straightforward for anyone now to become the next Bond with these tools a bit of social engineering. 

Disabling the microphone is quick and easy and can be very useful. A lot of laptops come with a button on the keyboard to disable it and a visual indicator for assurance. No need to have the mic on while you’re not using it.

![Disable mic](/assets/images/opsec-basics/disable_mic.png)


## Visual surveillance
If you’ve watched [Citizenfour](http://www.imdb.com/title/tt4044364/) maybe you remember the scene when Edward Snowden was introducing his password under a blanket, supposedly to mitigate any _visual surveillance_ or possible _hidden cameras_. No need to be paranoid but it’s good to be aware of your surroundings and adversary surveillance capabilities.

![Enter password under blanket](/assets/images/opsec-basics/snowden.png)


##

That’s it for now! Stay safe. And a piece of advice from an anonymous wise man:

**_"Amateurs practice until they get it right. Professionals practice until they can’t get it wrong."_**
