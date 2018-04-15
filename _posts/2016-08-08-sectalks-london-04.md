---
title:  "[CTF] Sectalks London - 04"
categories: [CTF, SecTalks]
---

![Logo](/assets/images/sectalks4-0.jpg)

A while ago I've attended another London SecTalks event. Since I had proposed the current challenge there was nothing to solve, so I've pulled down another challenge from the archives. Below is a write-up of my solution. If you plan to solve it yourself, download the files: [mail](/files/mail) and the [128 bytes key](/files/key) and stop reading right now (and start working)!

## Stage 0

This challenge revolves around a secret encrypted message sent from NSA to BoozeAlien. Let's have a look:

```bash
Return-Path: <bobloblaw@nsa.gov>                                                      
Delivered-To: jeremyl@boozealien.com
Received: (qmail 16641 invoked by uid 1000); 24 Apr 2014 07:37:19 -0000
Date: Thu, 18 Apr 2014 15:37:17 +0800
From: Bob <bobloblaw@nsa.gov>
To: jeremyl@boozealien.com
Subject: Re: Check this out
Message-ID: <20140424073714.GA16315@mail.nsa.gov>
MIME-Version: 1.0
Content-Type: multipart/mixed; boundary="32u276st3Jlj2kUU"
Content-Disposition: inline
User-Agent: Mutt/1.5.21 (2010-09-15)
X-Cipher: aes-128-cbc


Salted__^X}Á<9f><95><82><87>:j4^ZFE&^OÏò^Q¼<82>Í<80>ÌáÃj^S¯ÓKqEö ³ç}H<86>Ü^?É<8d>lõ<97><93>^^i<÷<89>ÁèU

[...]
```
A quick search reveals we're dealing with something encrypted in [OpenSSL salted format](http://justsolve.archiveteam.org/wiki/OpenSSL_salted_format). First we need to extract the encrypted binary data out of the email file:

```bash
~ cat mail | sed -n -e '/Salted__/,$p' > mail.bin
```

## Stage 1

Now that we have the encrypted file and the key, we need to figure out the correct parameters to instruct OpenSSL to perform the decryption. OpenSSL's documentation is far from ideal, but after some frenetic online searching, I've found out the right parameters. Remember we already know the cipher, the block size and the mode of operation from the **X-Cipher** email header:

```
~ openssl aes-128-cbc -d -kfile key -in mail.bin -out mail.out                          
```

<div class="box-note">
  OpenSSL's man page <i>does not</i> mention the essential <b>-kfile</b> parameter. For that we'd have to consult the man page of symmetric cipher routines: <i>man 1 enc</i>
</div>

Anyways, here's the decrypted email:

```
--32u276st3Jlj2kUU                                                                    
Content-Type: text/plain; charset=us-ascii
Content-Disposition: inline

I keep telling you to ditch that office and work from home. Wouldn't
want you to miss out in the meantime, so see attached :P

On April 18, 2014 at 13:16 Jeremy wrote:
> You should have sent it to me at the START of the week. Management
> just implemented the first phase of their new productivity
> initiative, which includes a filter on youtube traffic. fml.
> 
> On April 18, 2014 at 10:22 Bob wrote:
> > This is the funniest thing I've seen all week!
> > http://youtube.com/watch?v=W1EBFwEcSaQ


--32u276st3Jlj2kUU
Content-Type: application/octet-stream
Content-Disposition: attachment; filename="W1EBFwEcSaQ.mp4"
Content-Transfer-Encoding: base64
```

Notice the base64 encoded attachment: **W1EBFwEcSaQ.mp4**

## Stage 2

Let's take a few seconds to understand the story. From previous emails in the thread we learn that Bob (NSA) sent the funniest video to Jeremy (BoozeAlien), however Jeremy couldn't watch it due to new Youtube filtering in place, just implemented by the management in an attempt to increase productivity. In the last email, Bob attaches the video. Let's see if there's something more to it!

```bash
~ cat mail.b64 | base64 -d > W1EBFwEcSaQ.mp4 
```

The video plays just fine and although we have a flag, it's obvious we've been rick-rolled. Let's dig deeper.

<img src="/assets/images/sectalks4-1.png" alt="RickRolled" class="figure-body">

I remember about a very interesting and cool way to [hide TrueCrypt containers inside mp4 videos](https://keyj.emphy.de/real-steganography-with-truecrypt/) using steganography. In this case however the anser is simpler. We're dealing with _an archive appended to the mp4 movie_:

```bash
~ strings -n 10  W1EBFwEcSaQ.mp4 
~ ls -l W1EBFwEcSaQ.mp4 
-rw-rw-r-- 1 liv liv 2961460 May  6 21:56 W1EBFwEcSaQ.mp4
~ unzip -l W1EBFwEcSaQ.mp4 
Archive:  W1EBFwEcSaQ.mp4
warning [W1EBFwEcSaQ.mp4]:  2916594 extra bytes at beginning or within zipfile
  (attempting to process anyway)
  Length      Date    Time    Name
---------  ---------- -----   ----
        0  2014-04-24 14:42   verax/
        0  2014-04-24 13:41   verax/ops/
[...]
~ unzip W1EBFwEcSaQ.mp4
```

Notice the extra bytes at beginning of the archive. More like extra bytes at the end of the movie!

## Stage 3

Again let's take a few minutes to browse through the files in the newly discovered archive. Out of all the stuff in there, the archive deliver.zip looks particularly interesting. The final goal seems to be to locate Snowden's address. We have a map in there, but it's just a sketch without too many details:

<img src="/assets/images/sectalks4-2.jpg" alt="Map" class="figure-body">

There are a few photos but one of them has GPS coordinates, which presumably Snowden forgot to strip :confused:

```bash
 ~ exiftool mugshot.jpg
ExifTool Version Number         : 10.10
File Name                       : mugshot.jpg
Directory                       : .
File Size                       : 12 kB
File Modification Date/Time     : 2014:04:24 13:39:10+01:00
File Access Date/Time           : 2014:04:24 13:39:10+01:00
File Inode Change Date/Time     : 2017:05:06 22:33:22+01:00
[...]
GPS Latitude                    : 55 deg 50' 55.79" N
GPS Longitude                   : 37 deg 29' 17.46" E
GPS Position                    : 55 deg 50' 55.79" N, 37 deg 29' 17.46" E
```
To search on Google Maps based on GPS coordinates, use the following query: **55°50'55.79"N 37°29'17.46"E**. There he is, in the location precisely and artistically drawn on the map above:

<img src="/assets/images/sectalks4-3.png" alt="Coordinates" class="figure-body">

## References

[Real Steganography with TrueCrypt](https://keyj.emphy.de/real-steganography-with-truecrypt/)
