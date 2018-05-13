---
title:  "[CTF] Under the Wire 3 - Groot"
categories: [CTF, UnderTheWire]
---

![Logo](/assets/images/hammer2.png)

[UnderTheWire](http://underthewire.tech/index.htm) is an awesome website that hosts a number of PowerShell-based wargames meant to help Infosecurity people, either get started with or improve their PowerShell skills. I believe challenges and wargames like this one are a great way to learn *by doing* as they often cover rare and less known situations and involve problem solving. Other very interesting wargames I've written about are [OverTheWire](http://craftware.xyz/blog/categories/#OverTheWire), [Nebula](http://craftware.xyz/ctf/2012/07/21/Nebula-wargame-walkthrough.html), [Binar Master](http://craftware.xyz/blog/categories/#Binary-Master). 

The UnderTheWire wargames could be described as designed for Windows security professionals, Blue Team members or security tools designers. Currently there are 5 sets of levels of increasing difficulty. 

In this post I'll go through my solutions to the third batch of 15 levels - [Groot](http://underthewire.tech/groot/groot.htm). These are very instructive and cover a wide range of topics like:
* File hashing
* Working with Windows registry
* More Active Directory related tasks
* Getting information about filesystems
* Managing firewall rules
* Diffing files
* Working with SMB shares
* Getting BIOS info

For the solutions to the other games check:
* [Level 1 - Century]({{ site.baseurl }}{% post_url 2018-05-10-UnderTheWire-Century %})
* [Level 2 - Cyborg]({{ site.baseurl }}{% post_url 2018-05-12-UnderTheWire-Cyborg %})
* [Level 4 - Oracle]()
* [Level 5 - Trebek]()

Before starting, I wanted to say a huge thank you to the creators of these games for the effort of designing and hosting them, and making them available for free for everyone!

## Groot 1

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

## Groot 2

<blockquote>
  <p>The password for groot3 is the word that is made up from the letters in the range of 1,481,110 to 1,481,117 within the file on the desktop.</p>
</blockquote>

Nothing difficult here either:

```posh
PS C:\Users\groot2\Documents> (Get-Content -Path ..\Desktop\elements.txt)[1481111..1481117] -join ""
hiding
```

And we have the password for level 3: ```hiding```.

## Groot 3

<blockquote>
  <p>The password for groot4 is the number of times the word "beetle" is listed in the file on the desktop.</p>
</blockquote>

This task is very similar with [Century14](http://underthewire.tech/century/century14.htm) but with a catch. In this case the file is just one huge line with multiple occurrences of the pattern word:

```posh
PS C:\Users\groot3> (Get-Content -Path .\Desktop\words.txt | Measure-Object -Line).Lines
1
PS C:\Users\groot3> $a = Get-Content -Path .\Desktop\words.txt | Select-String -Pattern beetle  -AllMatches
PS C:\Users\groot3> $a.Matches.Count
5
```

The password for level 4 is simply: ```5```.

## Groot 4

<blockquote>
  <p>The password for groot5 is the name of the Drax subkey within the HKEY_CURRENT_USER (HKCU) registry hive.</p>
</blockquote>

Working with Windows Registry is very easy - we can browse it the same way we browse the file system. First we'll search for the *Drax* subkey then list its properties:

```posh
PS HKCU:\> Get-ChildItem -Path hkcu:\ -Recurse | Select-String drax

HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Telephony\Drax
HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Telephony\Drax\destroyer

PS C:\Users\groot4\Documents> Get-ChildItem  -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Telephony\Drax"

    Hive: HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Telephony\Drax

Name                           Property
----                           --------
destroyer
```

The password for level 5 is: ```destroyer```.

## Groot 5

<blockquote>
  <p>The password for groot6 is the name of workstation that user with a username of baby.groot can log into as depicted in Active Directory PLUS the name of the file on the desktop.</p>
</blockquote>

First the file on the Desktop:

```posh
PS C:\Users\groot5\Documents> ls ..\Desktop

    Directory: C:\Users\groot5\Desktop

Mode                LastWriteTime         Length Name
----                -------------         ------ ----
-a----        6/16/2017  11:02 PM              0 _local
```

Then we need to filter for the [User-Workstations](https://msdn.microsoft.com/en-us/library/ms680868(v=vs.85).aspx) attribute:

```posh
PS C:\Users\groot5\Documents> (Get-ADUser baby.groot -Properties *).userWorkstations
wk11
```

So the password for level 6 is: ```wk11_local```.

## Groot 6

<blockquote>
  <p>The password for groot7 is the name of program that is set to start when this user logs in.</p>
</blockquote>

Very Similar with [Cyborg 7](http://underthewire.tech/cyborg/cyborg7.htm):

```posh
PS C:\Users\groot6\Documents> Get-WmiObject Win32_StartupCommand | Select-Object Name, command, Location, User  | Format-List

Name     : Star-Lord
command  : c:\windows\star-lord_rules.exe
Location : HKU\S-1-5-21-3968311752-1263969649-2303472966-1111\SOFTWARE\Microsoft\Windows\CurrentVersion\Run
User     : UNDERTHEWIRE\groot6
```

The password for level 7 is the name of the executable, without the extension: ```star-lord_rules```.

The article mentioned in the *Hintt* section is not needed to solve this but it's a good read: [Windows Registry Persistence, Part 2: The Run Keys and Search-Order](https://blog.cylance.com/windows-registry-persistence-part-2-the-run-keys-and-search-order)

## Groot 7

<blockquote>
  <p>The password for groot8 is the filesystem label name of the media in the cd-rom PLUS the name of the file on the desktop.</p>
</blockquote>

## Groot 8

<blockquote>
  <p>The password for groot9 is the name of the firewall rule blocking MySQL.</p>
</blockquote>

## Groot 9

<blockquote>
  <p>The password for groot10 is the last date that Rocket Raccoon's password was changed PLUS the name of the file on the desktop.</p>
</blockquote>

## Groot 10

<blockquote>
  <p>The password for groot11 is the one word that makes the two files on the desktop different.</p>
</blockquote>

## Groot 11

<blockquote>
  <p>The password for groot12 is within an alternate data stream (ADS) somewhere on the desktop.</p>
</blockquote>

## Groot 12

<blockquote>
  <p>The password for groot13 is the owner of the Nine Realms folder on the desktop.</p>
</blockquote>

## Groot 13

<blockquote>
  <p>The password for groot14 is the last six numbers of the system's BIOS serial number PLUS the name of the file on the desktop.</p>
</blockquote>

## Groot 14

<blockquote>
  <p>The password for groot15 is the description of the share whose name contains "tasks" in it PLUS the name of the file on the desktop.</p>
</blockquote>
