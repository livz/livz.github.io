---
title: Building A Humidity Temperature Rig With Arduino
layout: post
date: 2017-12-01
published: true
categories: [Hardware]
---

![Logo](/assets/images/tips/arduino/logo.jpg)

## Motivation

I'm always very interested in finding out how things work on a lower level and since I had a few spare days I've decided to play around with some sensors and an Arduino board I've been using for random projects. After all, there are many mechatronics tutorials online, so _how hard can it be_?

It turned out that a lot of tutorials implicitely assume many prerequisites. Also they didn't match exactly the electronic pieces I had already ordered (_and waited for almost a month to be shipped from overseas!_). But overall it was a good learning experience. So in this post I'll go through all the steps and include fixes for some issues I've encountered along the way. Hopefully this will be useful for somebody in a same position as I was a few days ago.  Let's begin!

## Hardware components

I've experimented with a bunch of different components and in the end stuck with the ones below (click on the images below to expand). I got most of them from [DealExtreme](http://www.dx.com) but you can probably find them in many other online shops.

* __Arduino Uno R3 Rev3 ATMEGA328P Board__:

<a href="/assets/images/tips/arduino/uno-large.jpg">
<img alt="Arduino Uno R3" src="/assets/images/tips/arduino/uno-small.jpg" class="figure-body">
</a>

* __SYB-120 Breadboard with Jump Wires__:

<a href="/assets/images/tips/arduino/breadboard-large.jpg">
<img alt="SYB-120" src="/assets/images/tips/arduino/breadboard-small.jpg" class="figure-body">
</a>

* __DHT22 2302 Digital Temperature and Humidity Sensor Module__:

<a href="/assets/images/tips/arduino/dht22-large.jpg">
<img alt="DHT22" src="/assets/images/tips/arduino/dht22-small.jpg" class="figure-body">
</a>

* __0.96 128x64 I2C Blue Color OLED Display Module__:

<a href="/assets/images/tips/arduino/oled-front-large.jpg">
<img alt="OLED Front" src="/assets/images/tips/arduino/oled-front-small.jpg" class="figure-body">
</a>

<a href="/assets/images/tips/arduino/oled-back-large.jpg">
<img alt="OLED Back" src="/assets/images/tips/arduino/oled-back-small.jpg" class="figure-body">
</a>

### _Issue #1 - Cables_

My work machine is an Ubuntu 16.04 box. After having no luck to automatically detect the Arduino board, I found the following solution: _unplug the arduino, unload the ```cdc_acm``` module and reload it_.

```bash
$ sudo rmmod cdc_acm
$ sudo modprobe cdc_acm
```

Still not detected. Then I realised the problem was much simpler. _**The USB printer cable that came with the board was faulty**_. Not a very common thing but something to be aware of.

After replacing the cable, the board was detected on **ttyUSB0** (```ch341-uart``` is the Serial-to-USB converter on the board):

```bash
$ dmesg
[23461.758957] usb 1-1.1: new full-speed USB device number 24 using ehci-pci
[23461.852789] usb 1-1.1: New USB device found, idVendor=1a86, idProduct=7523
[23461.852799] usb 1-1.1: New USB device strings: Mfr=0, Product=2, SerialNumber=0
[23461.852804] usb 1-1.1: Product: USB2.0-Serial
[23461.854322] ch341 1-1.1:1.0: ch341-uart converter detected
[23461.858347] usb 1-1.1: ch341-uart converter now attached to ttyUSB0
```

### _Issue #2 - Breadboard_

Something I didn't notice from the start which was confusing is that the SYB-120 Breadboard **has two gaps in each distribution strip**: the distribution strips are split into three pieces, instead of running along the board from one end to another, as you would expect from other boards. You can easily notice this if you remove the back cover of the board:

<a href="/assets/images/tips/arduino/breadboard-back-large.jpg">
<img alt="Breadboard back" src="/assets/images/tips/arduino/breadboard-back-small.jpg" class="figure-body">
</a>

## Software

I've used the following software and libraries:

* [Arduino IDE](https://www.arduino.cc/en/Main/Software). Very easy to [set up on Ubuntu](https://www.arduino.cc/en/Guide/Linux). Read the whole guide, especially the section named _Please Read_ :)
* [cactus.io DHT22 Library](http://static.cactus.io/downloads/library/dht22/cactus_io_DHT22.zip). To install a new library from a ZIP file in Arduino IDE, navigate to _Sketch →  Include Library →  Add .ZIP Library_. 
* [SSD1306 Driver Library](https://github.com/adafruit/Adafruit_SSD1306/archive/master.zip)
* [GFX Library](https://github.com/adafruit/Adafruit-GFX-Library/archive/master.zip)

### _Issue #3 - Arduino IDE upload error_

When trying to upload the compiled hex file to the board I got the following pemission error:
```
avrdude: ser_open(): can't open device "/dev/ttyACM0": Permission denied
ioctl("TIOCMGET"): Inappropriate ioctl for device
```

If you read the whole guide above, the fix is already discussed there:
```bash
$ sudo usermod -a -G dialout `whoami`
$ sudo chmod a+rw /dev/ttyACM0
```

## Wiring

### Humidity/Temperature sensor

To connect and play with the humidity/tempratature sensor, I've found an [awesome blog](http://cactus.io/hookups/sensors/temperature-humidity/dht22/hookup-arduino-to-dht22-temp-humidity-sensor) that explained everything:

<img src="/assets/images/tips/arduino/dht22-schemtics.png" alt="screenshots" class="figure-body">

Two things were different in my setup:
* First, my sensor came out mounted on a breakout board, so it didn't require the 10K pull up resistor. 
* The pins for my mounted sensor were different than the ones in the image above. The mapping is as follows: **+ → VCC**, **-  → GND**, **OUT → DATA**.

### I2C OLED Display

I've found the instructions to hook the OLED display [here](https://startingelectronics.org/tutorials/arduino/modules/OLED-128x64-I2C-display/).  The PIN from the OLED maps to the Arduino Uno as follows:
* OLED GND – Arduino GND
* OLED VCC – Arduino 5V
* OLED SCL – Arduino Uno A5
* OLED SDA – Arduino Uno A4

<img src="/assets/images/tips/arduino/hook-oled.png" alt="screenshots" class="figure-body">

If you're going through the article, one important section is _Modifying the SSD1306 Driver_. Don't skip it! After connecting everything, my board looks like this (all connections are visible, click to expand):

<a href="/assets/images/tips/arduino/final-large.jpg">
<img alt="Final board" src="/assets/images/tips/arduino/final-small.jpg" class="figure-body">
</a>

## Coding

Finally, let's do some coding. After putting the board together, I've tested separately the OLED and the DHT22 sensor. All good. The _**ssd1306_128x64_i2c**_ sketch example (_File → Examples → Adafruit SSD1306_) demoes all the functionality of the GFX library and is a good starting point for working with the OLED.


### _Issues #4 - Generate a custom ```PROGMEM``` bitmap_

The example from the [Adafruit GFX Graphics Library](https://learn.adafruit.com/adafruit-gfx-graphics-library/graphics-primitives) draws the Adafruit logo using a 16x16 bitmap. I wanted to replace the logo with something else. Although this can be done manually as well, [this site](http://javl.github.io/image2cpp) converts an image into a ```PROGMEM``` bitmap and has a lot of options as well.

The final code:

```c
#include <cactus_io_DHT22.h>

// what pin on the arduino is the DHT22 data line connected to
#define DHT22_PIN 2     

// Initialize DHT sensor for normal 16mhz Arduino. 
DHT22 dht(DHT22_PIN);

#include <SPI.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

#define OLED_RESET 4
Adafruit_SSD1306 display(OLED_RESET);

// 64x64px Apple logo
const unsigned char PROGMEM logo[]  = {  
  0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 
  0xff, 0xff, 0xff, 0xff, 0xff, 0x87, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xfe, 0x07, 0xff, 0xff, 
  0xff, 0xff, 0xff, 0xff, 0xf8, 0x07, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xf0, 0x0f, 0xff, 0xff, 
  0xff, 0xff, 0xff, 0xff, 0xe0, 0x0f, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xc0, 0x0f, 0xff, 0xff, 
  0xff, 0xff, 0xff, 0xff, 0xc0, 0x1f, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0x80, 0x1f, 0xff, 0xff, 
  0xff, 0xff, 0xff, 0xff, 0x80, 0x3f, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0x00, 0x7f, 0xff, 0xff, 
  0xff, 0xff, 0xff, 0xff, 0x00, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0x01, 0xff, 0xff, 0xff, 
  0xff, 0xff, 0xff, 0xff, 0x03, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0x1f, 0xff, 0xff, 0xff, 
  0xff, 0xff, 0xe0, 0x7f, 0xff, 0x00, 0xff, 0xff, 0xff, 0xff, 0x00, 0x0f, 0xf8, 0x00, 0x1f, 0xff, 
  0xff, 0xfc, 0x00, 0x01, 0xc0, 0x00, 0x0f, 0xff, 0xff, 0xf8, 0x00, 0x00, 0x00, 0x00, 0x03, 0xff, 
  0xff, 0xf0, 0x00, 0x00, 0x00, 0x00, 0x01, 0xff, 0xff, 0xe0, 0x00, 0x00, 0x00, 0x00, 0x00, 0xff, 
  0xff, 0xc0, 0x00, 0x00, 0x00, 0x00, 0x01, 0xff, 0xff, 0x80, 0x00, 0x00, 0x00, 0x00, 0x03, 0xff, 
  0xff, 0x80, 0x00, 0x00, 0x00, 0x00, 0x07, 0xff, 0xff, 0x00, 0x00, 0x00, 0x00, 0x00, 0x0f, 0xff, 
  0xff, 0x00, 0x00, 0x00, 0x00, 0x00, 0x1f, 0xff, 0xfe, 0x00, 0x00, 0x00, 0x00, 0x00, 0x1f, 0xff, 
  0xfe, 0x00, 0x00, 0x00, 0x00, 0x00, 0x3f, 0xff, 0xfe, 0x00, 0x00, 0x00, 0x00, 0x00, 0x3f, 0xff, 
  0xfe, 0x00, 0x00, 0x00, 0x00, 0x00, 0x3f, 0xff, 0xfe, 0x00, 0x00, 0x00, 0x00, 0x00, 0x7f, 0xff, 
  0xfc, 0x00, 0x00, 0x00, 0x00, 0x00, 0x7f, 0xff, 0xfc, 0x00, 0x00, 0x00, 0x00, 0x00, 0x7f, 0xff, 
  0xfc, 0x00, 0x00, 0x00, 0x00, 0x00, 0x7f, 0xff, 0xfc, 0x00, 0x00, 0x00, 0x00, 0x00, 0x7f, 0xff, 
  0xfc, 0x00, 0x00, 0x00, 0x00, 0x00, 0x3f, 0xff, 0xfe, 0x00, 0x00, 0x00, 0x00, 0x00, 0x3f, 0xff, 
  0xfe, 0x00, 0x00, 0x00, 0x00, 0x00, 0x3f, 0xff, 0xfe, 0x00, 0x00, 0x00, 0x00, 0x00, 0x3f, 0xff, 
  0xfe, 0x00, 0x00, 0x00, 0x00, 0x00, 0x1f, 0xff, 0xfe, 0x00, 0x00, 0x00, 0x00, 0x00, 0x0f, 0xff, 
  0xfe, 0x00, 0x00, 0x00, 0x00, 0x00, 0x07, 0xff, 0xff, 0x00, 0x00, 0x00, 0x00, 0x00, 0x03, 0xff, 
  0xff, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0xff, 0xff, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xff, 
  0xff, 0x80, 0x00, 0x00, 0x00, 0x00, 0x00, 0x3f, 0xff, 0x80, 0x00, 0x00, 0x00, 0x00, 0x00, 0x7f, 
  0xff, 0x80, 0x00, 0x00, 0x00, 0x00, 0x00, 0x7f, 0xff, 0xc0, 0x00, 0x00, 0x00, 0x00, 0x00, 0xff, 
  0xff, 0xc0, 0x00, 0x00, 0x00, 0x00, 0x00, 0xff, 0xff, 0xe0, 0x00, 0x00, 0x00, 0x00, 0x01, 0xff, 
  0xff, 0xe0, 0x00, 0x00, 0x00, 0x00, 0x01, 0xff, 0xff, 0xf0, 0x00, 0x00, 0x00, 0x00, 0x03, 0xff, 
  0xff, 0xf8, 0x00, 0x00, 0x00, 0x00, 0x03, 0xff, 0xff, 0xfc, 0x00, 0x00, 0x00, 0x00, 0x07, 0xff, 
  0xff, 0xfc, 0x00, 0x00, 0x00, 0x00, 0x0f, 0xff, 0xff, 0xfe, 0x00, 0x00, 0x00, 0x00, 0x1f, 0xff, 
  0xff, 0xff, 0x00, 0x00, 0x00, 0x00, 0x1f, 0xff, 0xff, 0xff, 0x80, 0x00, 0x00, 0x00, 0x3f, 0xff, 
  0xff, 0xff, 0xc0, 0x03, 0xf0, 0x00, 0x7f, 0xff, 0xff, 0xff, 0xe0, 0x1f, 0xfe, 0x01, 0xff, 0xff, 
  0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 
};

#if (SSD1306_LCDHEIGHT != 64)
#error("Height incorrect, please fix Adafruit_SSD1306.h!");
#endif

void setup()   {
  // Initialise serial (print stats and debug info)           
  Serial.begin(9600);

  // Initialise DHT library
  dht.begin();
  
  // initialize with the I2C addr 0x3C (Hint: Use I2C Scanner)
  display.begin(SSD1306_SWITCHCAPVCC, 0x3C);  

  // Clear the buffer containing defualt Ada splashscreen
  display.clearDisplay();

  // Display logo
  display.drawBitmap(30, 0,  logo, 64, 64, 1);
  display.display();
  delay(3000);
}


void loop() {
  static char buf[15];
  
  // Reading temperature or humidity takes about 250 milliseconds!
  // Sensor readings may also be up to 2 seconds 'old' (its a very slow sensor)
  dht.readHumidity();
  dht.readTemperature();
  
  // Check if any reads failed and exit early (to try again).
  if (isnan(dht.humidity) || isnan(dht.temperature_C)) {
    Serial.println("DHT sensor read failure!");
    return;
  }
 
  Serial.print(dht.humidity); Serial.print(" %\t\t");
  Serial.print(dht.temperature_C); Serial.print(" *C\n");

  // Print relative humidity and temperature
  display.setTextSize(2);
  display.setTextColor(WHITE);
  display.setCursor(0,0);
  display.clearDisplay();
  display.println("RH - Temp");
 
  display.setCursor(0,25);
  dtostrf(dht.humidity,5, 2, buf);
  display.print(buf);
  display.println(" %");
  
  display.setCursor(0, 50);
  dtostrf(dht.temperature_C,5, 2, buf);
  display.print(buf);
  display.println(" *C");

  // Actually print stuff!
  display.display();
  
  // Wait a few seconds between measurements. The DHT22 should not be read at a higher frequency of
  // about once every 2 seconds. So we add a 3 second delay to cover this.
  delay(3000);
}

```

## Demo

<video controls="controls" width="640" height="360" name="Arduino Demo" src="../../../../assets/images/tips/arduino/video.mov" class="figure-body">
Your browser does not support the video element.
</video>

## References
* [Anatomy of a breadboard](https://learn.sparkfun.com/tutorials/how-to-use-a-breadboard/anatomy-of-a-breadboard)
* [How to Hookup DHT22 Temperature Sensor to Arduino Board](http://cactus.io/hookups/sensors/temperature-humidity/dht22/hookup-arduino-to-dht22-temp-humidity-sensor)
* [OLED I2C Display Arduino Tutorial](https://startingelectronics.org/tutorials/arduino/modules/OLED-128x64-I2C-display)
* [Adafruit GFX Graphics Library](https://learn.adafruit.com/adafruit-gfx-graphics-library/graphics-primitives)
