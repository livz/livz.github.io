![Logo](/assets/images/hkl/logo.png)

## Context
While going through some old folders I found source code and 
other files related to a previous incident involving a hardware keylogger (I'll use the term _HKL_ in the rest of the post 
since the model of the device is not really relevant here) for which I was doing the forensic analysis. 
Since I have some spare time and because I was suspecting a few possible issues with the HKL, I decided now it's the time to 
dig a bit deeper.

The  device was found by a customer on his premises and retrieved for analysis, pressumably after a few days of being planted.
Hardware keyloggers are used to record computer user’s keystrokes. This often includes sensitive information, like passwords 
and confidential emails. The device is mounted inline between the keyboard and the PC and records everything 
without any advance pre-configuration, making it ideal for a non-technical attacker.

![keylogger](/assets/images/hkl/hkl-out.png)

And if you're curious here's what's under the hood:

![keylogger inside](/assets/images/hkl/hkl-in.jpg)

Let's go a bit deeper and use a microscope to see what chips we have here inside. Some NXP chip:

[![](/assets/images/hkl/hkl-in1-small.jpg)](/assets/images/hkl/hkl-in1.jpg)

The we have a [Winbod 25Q128FV](https://cdn.hackaday.io/files/7758331918272/W25Q128F.pdf) serial flash memory:

[![](/assets/images/hkl/hkl-in2-small.jpg)](/assets/images/hkl/hkl-in2.jpg)

An Atmel ARM microcontroller - [AT91SAM7S64](http://www.keil.com/dd/docs/datashts/atmel/at91sam7s64_ds.pdf):

[![](/assets/images/hkl/hkl-in3-small.jpg)](/assets/images/hkl/hkl-in3.jpg)

And an [HC4066](https://assets.nexperia.com/documents/data-sheet/74HC_HCT4066.pdf) (_analog switch?_):

[![](/assets/images/hkl/hkl-in4-small.jpg)](/assets/images/hkl/hkl-in4.jpg)

## Findings
### How it works
The way this keylogger works is quite clever. It stays inline between the keyboard and the computer and is **_completely
invisible_** to the operating until a correct 3-key combination is entered. The first screenshot below shows connected 
USB devices _before_ inserting the keylogger:

![USB devices](/assets/images/hkl/usb-devices-before.PNG)

That doesn't change at all after we insert the keylogger. There's no new USB device. But aftter we enter the correct 
combination (_read below how to recover this password_) we see a new mass storage device:

![USB devices](/assets/images/hkl/usb-devices-after-pw.PNG)

The LOG.TXT file on the root of the newly revealed partition contains the logged keystrokes for all the session captured 
by the device. The sessions are separrated by a **[PWR]** entry. Special keys are logged as well. The image below shows 
the user entering his login credentials after _Ctrl-Alt-Del_:

![USB devices](/assets/images/hkl/creds.png)

Funny enough, in this case there was even a session recorded most probably on the attacker's machine while he was testing 
the device. Nothing incriminating unfortunately.

### Brute force the password

Before starting, let's mention that the HKL has a **_default 3-key combination password_**, the same for all devices out of the factory.
It can be configured later very easily, and the steps are clearly described in its manual, but some people don't bother. 
More importantly, it also had a 3-key combination **_kill switch_**, which is meant to prevent brute-force attacks. 
If you try to brute-force the password and hit that combination, the device will erase itself, _or so it should..._
This is not specified in the manual and it's supposed to be secret. 
Also it is not configurable but it is the same for all devices.

To find the 3-key combination password, my idea was to use a Teensy USB development board in order to simulate all the keystroke combinations.
I went for this [Teensy 3.1](https://www.pjrc.com/store/teensy31.html). Getting started with Ubuntu and Arduino went smoothly,
following the official [guides](https://www.pjrc.com/teensy/tutorial.html). If you're anxious to see the code, it's quite simple:
```c
/* USB Keyboard brute forcer for key loggers that require a 3 letter combination
    in sequence to mount the hidden files
*/

// Subroutine addresses for a safe restart of the teensy 3.1
#define RESTART_ADDR       0xE000ED0C
#define READ_RESTART()     (*(volatile uint32_t *)RESTART_ADDR)
#define WRITE_RESTART(val) ((*(volatile uint32_t *)RESTART_ADDR) = (val))

// Led pin number
const int ledPin = 13;   // Teensy 2.0 = Pin 11, Teensy++ 2.0 = Pin 6

// Char array
int const key_codes_alpha[] = { KEY_Q, KEY_W, KEY_E, KEY_R, KEY_T, KEY_Y, KEY_U,
	      KEY_I, KEY_O, KEY_P, KEY_A, KEY_S, KEY_D, KEY_F, KEY_G, KEY_H, KEY_J, 
	      KEY_K, KEY_L, KEY_Z, KEY_X, KEY_C, KEY_V, KEY_B, KEY_M, KEY_N, KEY_1};

int x, y, z;

void loop() {
  digitalWrite(ledPin, HIGH);
  
  Keyboard.set_key1(0);
  Keyboard.set_key2(0);
  Keyboard.set_key3(0);
  Keyboard.send_now();
  
  x = y = z = 0;

  for (int x = 0; x<27; x++)
  {  
    Keyboard.set_key1(key_codes_alpha[x]);
    Keyboard.send_now();
    delay(10);
    
    for (int y = x+1; y<27; y++)
    {
      Keyboard.set_key2(key_codes_alpha[y]);
      Keyboard.send_now();
      delay(10);
      
      for (int z = y+1; z<27; z++)
      {
        if ( (x == 9 ) && (y == 11) && (z == 25) ) continue;
        Keyboard.set_key3(key_codes_alpha[z]);
        Keyboard.send_now();
        delay(10);   
      }
    }
  }

  delay(5000);
  
  digitalWrite(ledPin, LOW);
  
  WRITE_RESTART(0x5FA0004);
}
```

So using the code above I've found out the combination which, no surprise here, was the same as the default one:

![Logo](/assets/images/hkl/combo.png)


- recover conf file
- files not deleted 

## Miscellaneous technical bits

### Use USB HID devices in a virtual machine in VMWare
* Select the virtual machine and go to VM > Settings.
* On the Hardware tab, select USB Controller.
* Select _Show all USB input devices_. This option will enable the usage of USB HIDs inside the virtual machine.
* Click OK to save your changes and power on the VM.

### Create an image of a USB drive
* Check first that is indeed the right device you want to image:
```bash
$ sudo fdisk -l /dev/sdc
```
* Do a bit-by-bit copy using _dd_:
```bash
$ sudo dd if=/dev/sdc of=./USB_image status=progress
```

## Conclusion
- Very fun project working with Teensy board and arduino
- Vulnerabilities to discover, but should report them to vendor?

### Summary of vulns
1. Vuln #1 - Default 3-key combo password
2. Vuln #3 - Security by obscurity - secret kill-switch combo
3. Vuln #2 - Default 3-key combo kill switch


Recover default password fro mconfig files ⇒ usb not wiped
Test with a larger log file ⇒ reat succes
