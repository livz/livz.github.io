## 1. Context

["Evil Maid"](https://www.schneier.com/blog/archives/2009/10/evil_maid_attac.html) is an attack on systems 
using encrypted hard drives. The attack happens like this:
* An attacker gains physical access to a shut-down computer.
* The boot partition and boot loader need to be stored somewhere unencrypted. 
* They are typically stored on a separate partition on the same hard drive.
* Attacker boots the machine from live USB. 
* He overwrites the bootloader with a rigged one that can capture the disk decryption key or install a backdoor
* (Optional) Attacker gains physical access to the machine and retrieves the key and restores the original bootloader, thus erasing his tracks

As written by Bruce Schneier, there is a reason why it's called "evil maid":
> [...] a likely scenario is that you leave your encrypted computer in your hotel room when you go out to dinner, and the maid sneaks in and installs the hacked bootloader. The same maid could even sneak back the next night and erase any traces of her actions.


The following applies to Linux-based operating operating systems using Full Disk Encryption (not using FDE defeats the whole purpose and opens the door to many simpler attacks). It has been successfully tested un Ubuntu 14.04.5 LTS and 16.04.2 LTS but should be 


## 2. Approach

### Keep the bootloader on a USB key

Basically if you don't like having the /boot partition unencrypted on the same machine, you could store is on a USB key, which you can keep separate from the system. Remember you need to have the key when booting and upgrading the kernel. If /boot partition is currently on the same hard disk, it's easy to move it to a USB thumb drive:

* Identify the USB disk (```/dev/sdd1``` in my case) and launch ```gksudo gparted```
* Delete any existing patition, create an ext4 partition, apply the changes and close gparted
* Copy the original boot files to the new partition:
```bash
# mkdir /media/newboot
# mount /dev/sdd1 /media/newboot
# cd /boot
# cp -ax . /media/newboot
```
* Update ```/etc/fstab``` with the UUID of the new partition
```bash
# blkid /dev/sdd1
# vim /etc/fstab
```
Comment the previous line indicating the UUID of ```/boot``` and add the following:
```
# /boot on /dev/sdd1
UUID=...  /boot ext4 errors=remount-ro  0  1
```

* Update the bootloader and restart
```bash
# update-grub
```
