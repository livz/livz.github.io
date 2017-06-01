![Logo](/assets/images/cloacked-pixel/logo.png)

This is not a new topic and there are many Windows applications out there that implement different steganographic
techniques to hide data within least significant parts of different media, be it music, video or pictures.
In this post we'll see how to do this ourselves step by step, using the mighty Python. 
We'll cover how to **encrypt and embed data**, the **extraction** and also basic **detection techniques**.

I assume that since you're on this page you know what steganography is 
and have probably experimented different techniques and tools. 
If not, dont worry, Internet is full of resources. 
The project below is simple and extensible and should serve as 
a starting step for anyone wanting to understand and expand on the LSB steganography area.

## Description

I won't cover the LSB insertion technique in depth here. In a nutshell, this allows us to 
**use the least significant bits of every colour of every pixel** to embed our own message. 
Nice, isn't it? 
For 24-bit images, every pixel is represented by the tuple of colours (R, G, B), 
each one being 8 bits in size. By modifying the last bit of every colour we can hide 3 bits in every pixel. 
For a typical medium size picture of 640x480 pixels at 24-bit of colour, we have a space of 115k for our payload.

```bash
$ python lsb.py 
LSB steganogprahy. Hide files within least significant bits of images.

Usage:
  lsb.py hide <img_file> <payload_file> <password>
  lsb.py extract <stego_file> <out_file> <password>
  lsb.py analyse <stego_file>
```

## Hiding data

All data will be encrypted before being embedded into a picture. Encryption is not optional. 
Two consequences of this are that:
* The payload will be slightly larger.
* The encrypted payload will have a high entropy and will be similar to random data.

Because of the second property, the frequency of 0s and 1s in the LSB position should be around 0.5. 
In many cases, real images don't have this propriety and this can help someone distinguish
between unaltered images and the ones containing embedded data. More about this later

```bash
$ python lsb.py hide samples/orig.jpg secret.zip p@$5w0rD
[*] Input image size: 640x425 pixels.
[*] Usable payload size: 99.61 KB.
[+] Payload size: 74.636 KB 
[+] Encrypted payload size: 74.676 KB 
[+] samples/secret.zip embedded successfully!
```

Compare the original and modified images below:

![Original image](/assets/images/cloacked-pixel/orig.jpg)

![Stego image](/assets/images/cloacked-pixel/stego.jpg)
 

 
## Extraction 

```bash
$ python lsb.py extract samples/by-wlodek.jpg-stego.png out p@$5w0rD 
[+] Image size: 640x425 pixels.
[+] Written extracted data to out.

$ file out 
out: Zip archive data, at least v1.0 to extract
```

## Detection

A simple way to detect tampering with least significant bits of images is based on the observation above.
The regions containing embedded data within the tampered images will have the average of LSBs around 0.5, 
because the LSBs contain encrypted data, which is similar in structure with random data. 
So in order to analyse an image, we can split it into blocks, and for each block calculate the average of LSBs. 

Let's analyse the image below, before and after the insertion.

![Castle](/assets/images/cloacked-pixel/castle.jpg)

For the original version, we have:

```bash
$ python lsb.py analyse samples/castle.jpg
```

![Analysis original](/assets/images/cloacked-pixel/analysis-orig.png)

and now for the one containing  our payload:

```bash
$ python lsb.py analyse samples/castle.jpg-stego.png
```

![Analysis stego](/assets/images/cloacked-pixel/analysis-stego.png)

We can clearly see the difference. On the portion of the image containing our embedded payload 
the average value of LSBs is very close to 0.5.

## Notes

It is entirely possible to have images with the mean of LSBs already very close to 0.5. 
In this case, this method will produce false positives.

More elaborate theoretical methods also exist, mostly based on statistics. 
However, false positives and false negatives cannot be completely eliminated.

## Conclusions

* You can find the complete source code at the [cloacked-pixel github project](https://github.com/livz/cloacked-pixel).
* This is just the beginning. If youre interested in steganography there are a lot of useful resources out there. 
A good starting point is 
[Hiding in Plain Sight: Steganography and the Art of Covert Communication](https://www.amazon.co.uk/Hiding-Plain-Sight-Steganography-Communication/dp/0471444499).
* All the images used in this article and for the testing phase were taken from [Pixabay](https://pixabay.com/), 
a great resource of copyright free images.
* If you've reached this far, there is actually one more thing to discover 
(**Hint:** the featured image of the article may have something to say)
