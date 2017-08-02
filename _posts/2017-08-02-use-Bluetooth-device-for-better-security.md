![Logo](/assets/images/bluetooth/bluetooth-icon.png)

We worry about 0day exploits but a lot of times in any organisation there's somebody who just doesn't like to 
lock the screen, or use a screen saver, and even go as far as simulate activity in order to bypass a group policy 
for locking the workstation. 

BlueProximity is a very useful program created by [Lars Friedrichs](mailto:larsfriedrichs@gmx.de) that can set up the computer 
to execute different actions when a specific bluetooth device is in or out of range. We could use it for all sorts of things
like stopping the playback in [cmus](cmus.github.io), changing the status in Pidgin , turning the monitor ON or OFF, etc. 
In particular, we're interested now in locking the workstation. Although it is possible to also unlock it 
[_without a password_](http://www.mljenkins.com/2016/01/24/blueproximity-on-ubuntu-14-04-lts/), 
I wouldn't recommend going that route. So this covers the setup for Ubuntu 16.04, and a few tips and tricks 
to get the setup working quickly and smoothly. 

This post is part of the **Security Bricks tutorials** - simple methods and habits
to build a deliberately secure MO, for personal and business use. The other parts below:

* [Part 1 - Physical OPSEC basics](https://livz.github.io/2017/07/02/physical-OPSEC-basics.html)
* [Part 2 - Preventing evil maid attacks](https://livz.github.io/2017/05/06/preventing-evil-maid-attacks.html)
* [Part 3 - KeePass password manager with 2FA](https://livz.github.io/2017/07/09/keepass-password-manager-with-2fa.html)
* [Part 4 - Using tokens in Ubuntu with PGP](https://livz.github.io/2017/07/17/using-tokens-in-Ubuntu-with-pgp.html)
* [Part 5 - Token-based authentication for SSH](https://livz.github.io/2017/07/25/token-based-authentication-for-ssh.html)

## 1. Setup
If your computer doesn't have Bluetooth support already don't worry, you can get an external Bluetooth adapter. 
Connect it and check if it's recognised correctly:
```
~ dmesg | tail
[92804.787813] usb 3-6: new full-speed USB device number 12 using xhci_hcd
[92804.924114] usb 3-6: New USB device found, idVendor=1131, idProduct=1004
[92804.924121] usb 3-6: New USB device strings: Mfr=1, Product=2, SerialNumber=0
[92804.924126] usb 3-6: Product: ISSCEDRBTA
[92804.924129] usb 3-6: Manufacturer: ISSC
```

Next, you should see a new local Bluetooth device:

```
~ hcitool dev
Devices:
        hci0    00:11:67:C4:9D:21
```

For more details and statistics, you can also use ```hciconfig```:
```
~ hciconfig    
hci0:   Type: BR/EDR  Bus: USB
        BD Address: 00:11:67:C4:9D:21  ACL MTU: 1021:4  SCO MTU: 48:10
        UP RUNNING 
        RX bytes:1132593 acl:20240 sco:0 events:51387 errors:0
        TX bytes:483873 acl:20256 sco:0 commands:16273 errors:0
```

If you have any issues, also make sure that the _bluetooth_ service is up and running:
```

~ service bluetooth status
● bluetooth.service - Bluetooth service
   Loaded: loaded (/lib/systemd/system/bluetooth.service; enabled; vendor preset: enabled)
   Active: active (running) since Mon 2017-07-31 17:39:55 BST; 18h ago
     Docs: man:bluetoothd(8)
 Main PID: 29577
   Status: "Running"
    Tasks: 1
   Memory: 1.4M
      CPU: 10ms
   CGroup: /system.slice/bluetooth.service
           └─29577 n/a
```

## 2. Establish connectivity

For the purpose of this post I'll use the mobile phone as the device that will lock the workstation when out of range. 
You could use any device for this purpose. Let's begin by scanning for neighbouring Bluetooth devices. So I've activated Bluetooth and performed a scan:
```
~ hcitool scan                   
Scanning ...
        28:ED:6A:82:33:BF       iPhone
        78:AB:BB:9B:3C:56       TVBluetooth
```
Surprise surprise! By default, my Android S5 is not discoverable, even if the Bluetooth is activated. After a bit of checking through the options, I've noticed the following message:
> _"[..] is visible to nearby devices while Bluetooh settings is open"_

Now let's do the scan again, this time having the settings window open on the mobile phone:
```
 ~ hcitool scan
Scanning ...
        E0:CB:EE:13:4D:21       SS5   <--- my phone
```

Perfect! Now we have the device's MAC address, which we'll use in _blueproximity_

## 3. Set up blueproximity

* **Device detection** - We'd have the same issue as above when scanning for new devices in Blueproximity **(1)**.  
So we'll introduce the MAC address manually in the form **(2)**:
![Blueproximity form](/assets/images/bluetooth/blueprox.png)
* **Channel scan** - Use the _Scan channels_ button **(3)** to go through the ports and find an usable one. 
At this point we'll have to accept the pairing on the device. After the scan ends, select an usable channel from the list **(4)**.
* **Configure the locking command** - In the _Locking_ tab, add any script to be run in the _Locking command_ field. I'm using ```~/scripts/screenlock.sh```, with the following content (I'm using [i3 window manager](https://i3wm.org/)):
```bash
#!/usr/bin/env bash
i3lock --image ~/Documents/wallpapers/dark-earth.png --tiling
```
> Adjust any locking parameters (e.g. distance, duration) in the _Proximity details_ tab. 
* **Verify** - You can check the icon and tooltip of Blueproximity to see its status.
   ![Tooltips](/assets/images/bluetooth/blueprox-rundisc.png)

   You can also enable logging to a file:
```
~ tail -f ~/blueproximity.log
Tue Aug  1 14:28:22 2017 blueproximity: screen is locked
Tue Aug  1 14:34:56 2017 blueproximity: screen is unlocked
Tue Aug  1 14:35:59 2017 blueproximity: screen is locked
Tue Aug  1 14:36:15 2017 blueproximity: screen is unlocked
```
