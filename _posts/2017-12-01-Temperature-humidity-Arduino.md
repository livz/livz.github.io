---
title: Building A Humidity Temperature Rig With Arduino
layout: post
date: 2017-12-01
published: true
---

![Logo](/assets/images/tips/arduino/logo.png)

## Motivation

I'm always very interested in finding out how things work on a lower level and since I had a few spare days I've decided to play around with some sensors and an Arduino board I've been using for random projects. After all, there are many mechatronics tutorials online, so _how hard can it be_?

It turned out that a lot of tutorials implicitely assume many prerequisites. Also didn't match exactly the electronic pieces I had already ordered (and waited for almost a month to be shipped from overseas). But overall it was a good learning experience. So in this post I'll go through all the steps and include fixes for some issues I've encountered. Hopefully this will be useful for somebody in a same position as I was a few days ago.  Let's begin!

## Hardware components

I've experimented with a bunch of different components and in the end stuck with the ones below (click on the images below to expand). I got most of them from [DealExtreme](http://www.dx.com) but you can probably find them in many other online shops.

* Arduino Uno R3 Rev3 ATMEGA328P Board:

[![](/assets/images/tips/arduino/uno-small.jpg)](/assets/images/tips/arduino/uno-large.jpg)
* SYB-120 Breadboard with Jump Wires:

[![](/assets/images/tips/arduino/breadboard-small.jpg)](/assets/images/tips/arduino/breadboard-large.jpg)
* DHT22 2302 Digital Temperature and Humidity Sensor Module:

[![](/assets/images/tips/arduino/dht22-small.jpg)](/assets/images/tips/arduino/dht22-large.jpg)
* 0.96 128x64 I2C Blue Color OLED Display Module:
[![](/assets/images/tips/arduino/oled-front-small.jpg)](/assets/images/tips/arduino/oled-front-large.jpg)
[![](/assets/images/tips/arduino/oled-back-small.jpg)](/assets/images/tips/arduino/oled-back-large.jpg)

breadboard issue
cable issue

## Software
arduino ide
linux drivers + usermod hacks

dmesg;
[23461.758957] usb 1-1.1: new full-speed USB device number 24 using ehci-pci
[23461.852789] usb 1-1.1: New USB device found, idVendor=1a86, idProduct=7523
[23461.852799] usb 1-1.1: New USB device strings: Mfr=0, Product=2, SerialNumber=0
[23461.852804] usb 1-1.1: Product: USB2.0-Serial
[23461.854322] ch341 1-1.1:1.0: ch341-uart converter detected
[23461.858347] usb 1-1.1: ch341-uart converter now attached to ttyUSB0

dht libraries
ada oled libs *2

## Wiring

## Coding
- bitmap trick

## References
Anatomy of a breadboard
https://learn.sparkfun.com/tutorials/how-to-use-a-breadboard/anatomy-of-a-breadboard
https://electronics.stackexchange.com/questions/64802/breadboard-confusion

Set up Arduino on Ubuntu
https://askubuntu.com/questions/786367/setting-up-arduino-one-ubuntu

Use Arduino 2560 MEGA on Arduino IDE
https://www.arduino.cc/en/Guide/ArduinoMega2560#toc3
https://askubuntu.com/questions/337479/how-do-i-communicate-with-arduino-mega-2560-r3

Check that the board is working + role of PIN 13 (L)
https://arduino.stackexchange.com/questions/153/how-to-check-my-arduino-board-is-working-or-dead
https://arduino.stackexchange.com/questions/3269/what-purpose-does-the-yellow-and-green-leds-have-on-the-arduino/3275

Arduino ide upload error:
avrdude: ser_open(): can't open device "/dev/ttyACM0": Permission denied
ioctl("TIOCMGET"): Inappropriate ioctl for device

To fix it, enter the command:
$ sudo usermod -a -G dialout <username>
$ sudo chmod a+rw /dev/ttyACM0
https://arduino.stackexchange.com/questions/21215/first-time-set-up-permission-denied-to-usb-port-ubuntu-14-04


Arduino + LCD + potentiometer:
https://howtomechatronics.com/tutorials/arduino/lcd-tutorial/
https://www.youtube.com/watch?v=dZZynJLmTn8
http://www.circuitbasics.com/how-to-set-up-an-lcd-display-on-an-arduino/

How to check LCD
http://www.microcontroller4beginners.com/2013/10/how-to-check-whether-16x2-lcd-working.html

DHT22
http://cactus.io/hookups/sensors/temperature-humidity/dht22/hookup-arduino-to-dht22-temp-humidity-sensor
https://howtomechatronics.com/tutorials/arduino/dht11-dht22-sensors-temperature-and-humidity-tutorial-using-arduino/

0.96 128x64 I2C OLED
https://startingelectronics.org/tutorials/arduino/modules/OLED-128x64-I2C-display/
http://www.instructables.com/id/Monochrome-096-i2c-OLED-display-with-arduino-SSD13/
https://learn.adafruit.com/adafruit-gfx-graphics-library/graphics-primitives
http://javl.github.io/image2cpp/

