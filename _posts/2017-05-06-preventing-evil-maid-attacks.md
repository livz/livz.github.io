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

Open a terminal. CtrlAltT.

Identify the usb-stick, suppose is /dev/sdc1, umount it:

sudo -i
fdisk -l
umount /dev/sdc1

Load gparted

gparted

Delete a patition, create an ext4 partition, apply the changes and close gparted

You must mount the new /boot partition, suppose is new ext4 /dev/sdc1 on a temporary directory, suppose is /media/newboot to copy files to it the original /boot.

Run it:

You create the temporary directory

 mkdir /media/newboot

Umount and mount partition

umount /dev/sdc1 
mount /dev/sdc1 /media/newboot

To copy files:

cd /boot
cp -ax . /media/newboot

This last line is the only one used to clone, attention "." the end.

Now mount the new /boot previous rename the /boot partition.

cd /
mv /boot /boot.old
mkdir /boot
umount /dev/sdc1
mount /dev/sdc1 /boot

Now you have to find the UUID of the partition and edit the /etc/fstab file to mount the partition at startup.

blkid /dev/sdc1
nano /etc/fstab

And you add these lines at the end with that reported blkid UUID.

# /dev/sdc1 was /boot
UUID=c676ae51-cb6f-4c0e-b4a9-76850aafa1d6  /boot ext4 errors=remount-ro  0  1

Ctrl + O, save file. Ctrl + X, close nano.

update-grub

Restarting have everything working exactly the same, but with other partitions.

Once everything is working well, delete the /boot.old and /media/newboot

sudo -i
rm /boot.old
rm /media/newboot

Note:You should be aware that without the usb-stick the system will be unusable.
