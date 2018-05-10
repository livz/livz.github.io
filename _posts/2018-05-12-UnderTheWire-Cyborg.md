---
title:  "[CTF] Under the Wire - Cyborg"
categories: [CTF, UnderTheWire]
---

![Logo](/assets/images/hammer1.png)

[UnderTheWire](http://underthewire.tech/index.htm) is an awesome website that hosts a number of PowerShell-based wargames meant to help Infosecurity people, either get started with or improve their PowerShell skills. I believe challenges and wargames like this one are a great way to learn *by doing* as they often cover rare and less known situations and involve problem solving. Other very interesting wargames I've written about are [OverTheWire](http://craftware.xyz/blog/categories/#OverTheWire), [Nebula](http://craftware.xyz/ctf/2012/07/21/Nebula-wargame-walkthrough.html), [Binar Master](http://craftware.xyz/blog/categories/#Binary-Master). 

The UnderTheWire wargames could be described as designed for Windows security professionals, Blue Team members or security tools designers. Currently there are 5 sets of levels of increasing difficulty. 

In this post I'll go through my solutions to the second batch of 15 levels - [Cyborg](http://underthewire.tech/cyborg/cyborg.htm). These cover a bit more advanced topics like working Active Directory, AppLocker policies, Alternate Data Streams and auto-start items. 

For the solutions to the other games check:
* [Level 1 - Century]({{ site.baseurl }}{% post_url 2018-05-10-UnderTheWire-Century %})
* [Level 3 - Groot]()
* [Level 4 - Oracle]()
* [Level 5 - Trebek]()

Before starting, I wanted to say a huge thank you to the creators of these games for the effort of designing and hosting them, and making them available for free for everyone!

## Cyborg 1

<blockquote>
  <p>The password for cyborg2 is the state that the user Chris Rogers is from as stated within Active Directory.</p>
</blockquote>

We connect to **Cyborg1** with ```cyborg1/cyborg1```. 

[Microsoft documentation](https://msdn.microsoft.com/en-us/library/ms679880(v=vs.85).aspx) tells us that the *State-Or-Province-Name* attribute is stored in a field named *__st__*. Knowing this, the password for level 2 is easy to find: ```kansas```.

```posh
PS C:\Users\cyborg1\Documents> Get-ADUser -Filter 'Name -like "*rogers*"' -Properties st


DistinguishedName : CN=Rogers\, Chris,OU=Southside,OU=Cyborg,DC=UNDERTHEWIRE,DC=TECH
Enabled           : False
GivenName         : Rogers
Name              : Rogers, Chris
ObjectClass       : user
ObjectGUID        : 3251b635-dac5-47c1-b8b9-bb7ee058cde7
SamAccountName    : chris.rogers
SID               : S-1-5-21-1013972110-1198539618-3084840507-2117
st                : kansas
Surname           : Chris
UserPrincipalName : chris.rogers@UNDERTHEWIRE.TECH
```

<div class="box-note">
  By default the <b>Get-ADUser</b> cmdlet retrieves only a default set of user object properties. To retrieve additional properties we need to use the <i>Properties</i> parameter. 
</div>

## Cyborg 2

<blockquote>
  <p>The password for Century3 is the name of the built-in cmdlet that performs the wget like function within PowerShell PLUS the name of the file on the desktop.</p>
</blockquote>

## Cyborg 3

<blockquote>
  <p>The password for Century4 is the number of files on the desktop.</p>
</blockquote>


## Cyborg 4

<blockquote>
  <p>The password for Century5 is the name of the file within a directory on the desktop that has spaces in its name.</p>
</blockquote>

## Cyborg 5

<blockquote>
  <p>The password for Century6 is the short name of the domain in which this system resides in PLUS the name of the file on the desktop.</p>
</blockquote>

## Cyborg 6

<blockquote>
  <p>The password for Century7 is the number of folders on the desktop.</p>
</blockquote>

## Cyborg 7

<blockquote>
  <p>The password for Century8 is in a readme file somewhere within the contacts, desktop, documents, downloads, favorites, music, or videos folder in the user's profile. 
</p>
</blockquote>

## Cyborg 8

<blockquote>
  <p>The password for Century9 is the number of unique entries within the file on the desktop.</p>
</blockquote>

## Century 9

<blockquote>
  <p>The password for Century10 is the 161st element within the file on the desktop.</p>
</blockquote>

## Century 10

<blockquote>
  <p>The password for Century11 is the 10th and 8th word of the Windows Update service description combined PLUS the name of the file on the desktop.</p>
</blockquote>

## Century 11

<blockquote>
  <p>The password for Century12 is the name of the hidden file within the contacts, desktop, documents, downloads, favorites, music, or videos folder in the user's profile.</p>
</blockquote>

## Century 12

<blockquote>
  <p>The password for Century13 is the description of the computer designated as a Domain Controller within this domain PLUS the name of the file on the desktop.</p>
</blockquote>

## Century 13

<blockquote>
  <p>The password for Century14 is the number of words within the file on the desktop.</p>
</blockquote>

## Century 14

<blockquote>
  <p>The password for Century15 is the number of times the word "polo" appears within the file on the desktop.</p>
</blockquote>
