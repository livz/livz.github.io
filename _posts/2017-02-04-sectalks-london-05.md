![Logo](/assets/images/sectalks5-0.jpg)

Last week I've been to the 5th SecTalks London meetup and I'm proud to say I've learnt something that evening and wanted to say Thank you to the creator of the night's challenge - @leigh.  I'll definitely be going again.


BelowLogo write-up 
of my0sjoution. Hopefully by now the details of the challenge are made public so if people are still working on this I won't spoil anyone's fun by publishing this.

## Stage 0
The challenge is Christmas themed and  starts at the North Pole: 178.62.xx.xx/1.html

> 'While taking a well earned break at the Pole Star Tavern, you overhear a couple of the local elves talking about some of the security improvements they've made to Santa's distribution infrastructure this year.
Of particular interest to you is the digitisation of the naughty and nice lists, you know you haven't exactly been on your best behaviour this year, perhaps there is something you can do about that.
You snap out of your daydream to find them picking up the papers they've been glossing over and making for the door. One of them drops something. When nobody is looking you head over and pick it up.
It's a Christmas card with some writing on the front.
The writing looks like it's in some sort of code: 4cf2af119d84f698585ebf494c6ca6321d72eb211d44a49344f4f7393ca73194
There must be some more clues on the card!'

![Christmas card](/assets/images/sectalks5-1.png)

## Stage 1
The hint for this stage for "Simple stego". I've first opened the image in Gimp and noticed there was an alpha channel.  Unfortunately nothing really obvious here. Then I thought about varying colour intensity, a method used to enhance black and white images.

In Gimp it is quite easy to vary the threshold: Colours -> Threshold. And TA DA !
