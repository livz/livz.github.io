![Logo](/assets/images/bluetooth/bluetooth-icon.png)

We worry about 0day exploits but a lot of times in any organisation there's somebody who just doesn't like to 
lock the screen, or use a screen saver, and even go as far as simulate activity in order to bypass a group policy 
for locking the workstation. 

BlueProximity is a very useful program created by [Lars Friedrichs](mailto:larsfriedrichs@gmx.de) that can set up the computer 
to execute different actions when a specific bluetooth device is in or out of range. We could use it for all sorts of things
like stopping the playback in [cmus](cmus.github.io), changing the status in Pidgin , turning the monitor ON or OFF, etc. 
In particular, we're interested now in locking the workstation. Although it is possible to also unlock it 
[without a password](http://www.mljenkins.com/2016/01/24/blueproximity-on-ubuntu-14-04-lts/), 
I wouldn't recommend going that route. So this covers the setup for Ubuntu 16.04, and a few tips and tricks 
to get the setup working quickly and smoothly. 

This post is part of the **Security Bricks tutorials** - simple methods and habits
to build a deliberately secure MO, for personal and business use. The other parts below:

* [Part 1 - Physical OPSEC basics](https://livz.github.io/2017/07/02/physical-OPSEC-basics.html)
* [Part 2 - Preventing evil maid attacks](https://livz.github.io/2017/05/06/preventing-evil-maid-attacks.html)
* [Part 3 - KeePass password manager with 2FA](https://livz.github.io/2017/07/09/keepass-password-manager-with-2fa.html)
* [Part 4 - Using tokens in Ubuntu with PGP](https://livz.github.io/2017/07/17/using-tokens-in-Ubuntu-with-pgp.html)
* [Part 5 - Token-based authentication for SSH](https://livz.github.io/2017/07/25/token-based-authentication-for-ssh.html)
