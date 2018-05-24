---
title:  "[CTF] Under the Wire 4 - Oracle"
categories: [CTF, UnderTheWire]
---

![Logo](/assets/images/hammer3.png)

[UnderTheWire](http://underthewire.tech/index.htm) is an awesome website that hosts a number of PowerShell-based wargames meant to help Infosecurity people, either get started with or improve their PowerShell skills. I believe challenges and wargames like this one are a great way to learn *by doing* as they often cover rare and less known situations and involve problem solving. Other very interesting wargames I've written about are [OverTheWire](http://craftware.xyz/blog/categories/#OverTheWire), [Nebula](http://craftware.xyz/ctf/2012/07/21/Nebula-wargame-walkthrough.html), [Binar Master](http://craftware.xyz/blog/categories/#Binary-Master). 

The UnderTheWire wargames could be described as designed for Windows security professionals, Blue Team members or security tools designers. Currently there are 5 sets of levels of increasing difficulty. 

In this post I'll go through my solutions to the forth batch of 15 levels - [Oracle](http://underthewire.tech/oracle/oracle.htm). New topics covered in this set are:
* Working with files (looping, hashing, etc.)
* Filtering through Windows event logs
* Group policies
* Extracting recently visited websites from Windows registry
* Extracting remote desktop sessions from Windows registry

For the solutions to the other games check:
* [Level 1 - Century]({{ site.baseurl }}{% post_url 2018-05-10-UnderTheWire-Century %})
* [Level 2 - Cyborg]({{ site.baseurl }}{% post_url 2018-05-12-UnderTheWire-Cyborg %})
* [Level 3 - Groot]({{ site.baseurl }}{% post_url 2018-05-14-UnderTheWire-Groot %})
* [Level 5 - Trebek]({{ site.baseurl }}{% post_url 2018-05-18-UnderTheWire-Trebek %}) 

Before starting, I wanted to say a huge thank you to the creators of these games for the effort of designing and hosting them, and making them available for free for everyone!

## Oracle 1

<blockquote>
  <p>The password for oracle2 is the timezone in which this system is set to.</p>
</blockquote>

Connect to the first level by SSHing to *oracle.underthewire.tech*, on port 6003. The credentials for the first level are ```oracle1/oracle1```.

There is a straightforward cmdlet to get the timezone of the system:

```posh
PS C:\Users\oracle1\Documents> Get-TimeZone

Id                         : UTC
DisplayName                : (UTC) Coordinated Universal Time
StandardName               : Coordinated Universal Time
DaylightName               : Coordinated Universal Time
BaseUtcOffset              : 00:00:00
SupportsDaylightSavingTime : False
```

The password for level 2 is: ```utc```.

## Oracle 2

<blockquote>
  <p>The password for oracle3 is the last five digits of the MD5 hash, from the hashes of files on the destop, that appears twice.</p>
</blockquote>

The two files with the same hash are evident if we list all the hashes sorted:

```posh
PS C:\Users\oracle2\Desktop> Get-ChildItem | ForEach-Object {Get-FileHash -Algorithm MD5 $_.name} | Sort-Object -Property Hash

Algorithm       Hash                                                                   Path
---------       ----                                                                   ----
[..]
MD5             41E65125606DE228B94CC2C97B401C1A                                       C:\Users\oracle2\Desktop\file20.txt
MD5             4A22F5027B6E3C09C9743DB955B6878A                                       C:\Users\oracle2\Desktop\file2.txt
MD5             4CEB4AAE0231B53834280CC5314FB932                                       C:\Users\oracle2\Desktop\file1.txt
MD5             5BE11FF0037EED156F77213658C2F5C4                                       C:\Users\oracle2\Desktop\file16.txt
MD5             5BE11FF0037EED156F77213658C2F5C4                                       C:\Users\oracle2\Desktop\file.txt
[..]
```

So the password for level 3 is: ```2f5c4```.

## Oracle 3

<blockquote>
  <p>The password for oracle4 is the date the system logs were last wiped as depicted in the event logs on the desktop.</p>
</blockquote>

To solve this level we need to filter for [event with id 1102](https://www.ultimatewindowssecurity.com/securitylog/encyclopedia/event.aspx?eventID=1102) - *The audit log was cleared*. The corresponding event for Windows 2003 is [517](https://www.ultimatewindowssecurity.com/securitylog/encyclopedia/event.aspx?eventid=517).

<div class="box-note">
Note that event 1102 is logged whenever the Security log is cleared, <b><i>REGARDLESS of the status of the Audit System Events audit policy</i></b>. 
</div>

```posh
PS C:\Users\oracle3\Documents>  Get-WinEvent -Path ..\Desktop\Security.evtx | where {$_.Id -Eq 1102}

   ProviderName: Microsoft-Windows-Eventlog

TimeCreated                     Id LevelDisplayName Message
-----------                     -- ---------------- -------
5/9/2017 11:36:05 PM          1102 Information      The audit log was cleared....
```

And the password for level 4 is: ```05/09/2017```.

## Oracle 4

<blockquote>
  <p>The password for oracle5 is the name of the GPO created on April 5, 2017 PLUS the name of the file on the user's desktop.</p>
</blockquote>

## Oracle 5

<blockquote>
  <p>The password for oracle6 is the name of the GPO that contains a description of "I_AM_GROOT" PLUS the name of the file on the user's desktop.</p>
</blockquote>

## Oracle 6

<blockquote>
  <p>The password for oracle7 is the name of the OU that doesn't have a GPO linked to it PLUS the name of the file on the user's desktop.</p>
</blockquote>

## Oracle 7

<blockquote>
  <p>The password for oracle8 is the name of the domain that a trust is built with PLUS the name of the file on the user's desktop.</p>
</blockquote>

## Oracle 8

<blockquote>
  <p>The password for oracle9 is the name of the file in the GET Request from www.guardian.galaxy.com within the log file on the desktop.</p>
</blockquote>

## Oracle 9

<blockquote>
  <p>The password for oracle10 is the computername of the DNS record of the mail server listed in the UnderTheWire.tech zone PLUS the name of the file on the user's desktop.</p>
</blockquote>

## Oracle 10

<blockquote>
  <p>The password for oracle11 is the .biz site the user has previously navigated to.</p>
</blockquote>

## Oracle 11

<blockquote>
  <p>The password for oracle12 is the drive letter associated with the mapped drive of this user.</p>
</blockquote>

## Oracle 12

<blockquote>
  <p>The password for oracle13 is the IP of the system that this user has previously established a remote desktop with.</p>
</blockquote>

## Oracle 13

<blockquote>
  <p>The password for oracle14 is the name of the user who created the Galaxy security group as depicted in the event logs on the desktop PLUS the name of the text file on the user's desktop.</p>
</blockquote>

## Oracle 14

<blockquote>
  <p>The password for oracle15 is the name of the user who added the user Bereet to the Guardian security group as depicted in the event logs on the desktop PLUS the name of the text file on the user's desktop.</p>
</blockquote>

