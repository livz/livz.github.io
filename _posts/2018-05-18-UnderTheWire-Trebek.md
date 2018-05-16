---
title:  "[CTF] Under the Wire 5 - Trebek"
categories: [CTF, UnderTheWire]
---

![Logo](/assets/images/hammer4.png)

[UnderTheWire](http://underthewire.tech/index.htm) is an awesome website that hosts a number of PowerShell-based wargames meant to help Infosecurity people, either get started with or improve their PowerShell skills. I believe challenges and wargames like this one are a great way to learn *by doing* as they often cover rare and less known situations and involve problem solving. Other very interesting wargames I've written about are [OverTheWire](http://craftware.xyz/blog/categories/#OverTheWire), [Nebula](http://craftware.xyz/ctf/2012/07/21/Nebula-wargame-walkthrough.html), [Binar Master](http://craftware.xyz/blog/categories/#Binary-Master). 

The UnderTheWire wargames could be described as designed for Windows security professionals, Blue Team members or security tools designers. Currently there are 5 sets of levels of increasing difficulty. 

In this post I'll go through my solutions to the last batch of 15 levels - [Trebek](http://underthewire.tech/trebek/trebek.htm). This level is definitely more interesting and covers topics like working with Windows tasks, event logs parsing (*a lot of!*) and more auto-run tricks.

For the solutions to the other games check:
* [Level 1 - Century]({{ site.baseurl }}{% post_url 2018-05-10-UnderTheWire-Century %})
* [Level 2 - Cyborg]({{ site.baseurl }}{% post_url 2018-05-12-UnderTheWire-Cyborg %})
* [Level 3 - Groot]({{ site.baseurl }}{% post_url 2018-05-14-UnderTheWire-Groot %})
* [Level 4 - Oracle]()

Before starting, I wanted to say a huge thank you to the creators of these games for the effort of designing and hosting them, and making them available for free for everyone!

## Trebek 1

<blockquote>
  <p>The password for groot2 is the last five digits of the MD5 hash of this system's hosts file.</p>
</blockquote>

We connect to **Groot** with ```groot1/groot1```. 

In this first level we learn about the **Get-FileHash** cmdlet:

```posh
PS C:\Users\groot1\Documents> Get-FileHash -Path C:\Windows\System32\drivers\etc\hosts -Algorithm MD5

Algorithm       Hash                                     Path
---------       ----                                     ----
MD5             FFEB2134EF23012F8B838C89C9404            C:\Windows\System32\drivers\etc\hosts
```

So the password for level 2 is: ```049f3```.
