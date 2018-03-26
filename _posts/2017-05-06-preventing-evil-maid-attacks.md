---
published: true
categories: [SecurityBricks]
---

![Logo](/assets/images/maid12.png)

This post is part of the **Security Bricks tutorials** - simple methods and habits
to build a deliberately secure operational environment, for personal and business use. The other parts below:

* [Part 1 - Physical OPSEC basics]({{ site.baseurl }}{% post_url 2017-07-02-physical-OPSEC-basics %})
* [Part 3 - KeePass password manager with 2FA]({{ site.baseurl }}{% post_url 2017-07-09-keepass-password-manager-with-2fa %})
* [Part 4 - Using tokens in Ubuntu with PGP]({{ site.baseurl }}{% post_url 2017-07-17-using-tokens-in-Ubuntu-with-pgp %})
* [Part 5 - Token-based authentication for SSH]({{ site.baseurl }}{% post_url 2017-07-25-token-based-authentication-for-ssh %})
* [Part 6 - Use a Bluetooth device for better security]({{ site.baseurl }}{% post_url 2017-08-02-use-Bluetooth-device-for-better-security %})

## 1. Context

["Evil Maid"](https://www.schneier.com/blog/archives/2009/10/evil_maid_attac.html) is an attack on systems 
using encrypted hard drives. The attack happens like this:
* An attacker gains physical access to a shut-down computer.
* The boot partition and boot loader need to be stored somewhere unencrypted. 
* They are typically stored on a separate partition on the same hard drive.
* Attacker boots the machine from live USB. 
* He overwrites the bootloader with a rigged one that can capture the disk decryption key or install a backdoor.
* (Optional) Attacker gains physical access again to the machine and retrieves the captured key and restores the original bootloader, thus erasing his tracks.

As written by Bruce Schneier, there is a reason why it's called "evil maid":
> [...] a likely scenario is that you leave your encrypted computer in your hotel room when you go out to dinner, and the maid sneaks in and installs the hacked bootloader. The same maid could even sneak back the next night and erase any traces of her actions.

Hopefully most of us will not be visited by the "evil maid" but the attack is real not just theoretical. 
The following applies to Linux-based operating operating systems using Full Disk Encryption (not using FDE defeats the whole purpose and opens the door to many simpler attacks). It has been successfully tested un Ubuntu 14.04.5 LTS and 16.04.2 LTS. 

## 2. Approaches

### Keep the bootloader on a USB key

Basically if you don't like having the /boot partition unencrypted on the same machine, you could store it on a USB key, which you can keep separate from the system. Remember you need to have the key inserted when booting and upgrading the kernel. If /boot partition is currently on the same hard disk, it's easy to move it to a USB thumb drive:

* Identify the USB disk (**/dev/sdd1** in my case) and launch **gksudo gparted**
* Delete any existing patition, create an **ext4** partition, apply the changes and close **gparted**
* As root, copy the original boot files to the new partition:
```bash
# mkdir /media/newboot
# mount /dev/sdd1 /media/newboot
# cd /boot
# cp -ax . /media/newboot
```
* Update ```/etc/fstab``` with the UUID of the new partition:
```bash
# blkid /dev/sdd1
# vim /etc/fstab 
```
Comment the existing line indicating the UUID of **/boot** and add the following:
```
# /boot on /dev/sdd1
UUID=...  /boot ext4 errors=remount-ro  0  1
```

* Update the bootloader and restart:
```bash
# update-grub
```

### Password protect the BIOS

Remove the option to boot from other media and password protect the BIOS. This would prevent the attacker from actually booting from a live CD/USB and modify the /boot partition.

### Detect tampering with the laptop

One could leave the machine turned on with a screen lock while in a hotel room. If anyone tries to reboot it and replace files on the /boot partition, he won't be able to boot it and start the screeen lock again.

### Detect tampering with the hard drive

The "evil maid" could remove the drive from the laptop and modify anything on the boot partition, since it is on the same disk. To identify this, one could apply tamper-evident seals over the hard disk to detect removal. This sounds good in theory but probably it would be very difficult to check for the tampering of the seal every time the machine is booted. 
