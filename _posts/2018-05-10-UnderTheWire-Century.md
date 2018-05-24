---
title:  "[CTF] Under the Wire 1 - Century"
categories: [CTF, UnderTheWire]
---

![Logo](/assets/images/hammer0.png)

[UnderTheWire](http://underthewire.tech/index.htm) is an awesome website that hosts a number of PowerShell-based wargames meant to help Infosecurity people, either get started with or improve their PowerShell skills. I believe challenges and wargames like this one are a great way to learn *by doing* as they often cover rare and less known situations and involve problem solving. Other very interesting wargames I've written about are [OverTheWire](http://craftware.xyz/blog/categories/#OverTheWire), [Nebula](http://craftware.xyz/ctf/2012/07/21/Nebula-wargame-walkthrough.html), [Binar Master](http://craftware.xyz/blog/categories/#Binary-Master). 

The UnderTheWire wargames could be described as designed for Windows security professionals, Blue Team members or security tools designers. Currently there are 5 sets of levels of increasing difficulty. 

In this post I'll go through my solutions to the first batch of 15 levels - [Century](http://underthewire.tech/century/century.htm). This is the first and most basic one and focuses on parsing files, usage of PowerShell operators, file searches and general navigation techniques in a Windows environment. 

For the solutions to the other games check:
* [Level 2 - Cyborg]({{ site.baseurl }}{% post_url 2018-05-12-UnderTheWire-Cyborg %})
* [Level 3 - Groot]({{ site.baseurl }}{% post_url 2018-05-14-UnderTheWire-Groot %})
* [Level 4 - Oracle]({{ site.baseurl }}{% post_url 2018-05-16-UnderTheWire-Oracle %})
* [Level 5 - Trebek]({{ site.baseurl }}{% post_url 2018-05-18-UnderTheWire-Trebek %}) 

Before starting, I wanted to say a huge thank you to the creators of these games for the effort of designing and hosting them, and making them available for free for everyone!

## Century 1

<blockquote>
  <p>The password for Century2 is the build version of the instance of PowerShell installed on this system.</p>
</blockquote>

We connect to **Century1** with ```century1/century1```. To get the build version is as simple as:

```posh

PS C:\Users\century15> $PSVersionTable

Name                           Value
----                           -----
PSVersion                      5.1.14409.1012
PSEdition                      Desktop
PSCompatibleVersions           {1.0, 2.0, 3.0, 4.0...}
BuildVersion                   10.0.14409.1012
CLRVersion                     4.0.30319.42000
WSManStackVersion              3.0
PSRemotingProtocolVersion      2.3
SerializationVersion           1.1.0.1
```

So the password for level 2 is: ```10.0.14409.1012```.

## Century 2

<blockquote>
  <p>The password for Century3 is the name of the built-in cmdlet that performs the wget like function within PowerShell PLUS the name of the file on the desktop.</p>
</blockquote>

To find the command behind an alias use the **Get-Alias** cmdlet:

```posh
PS C:\Users\century2\Documents> Get-Alias wget

CommandType     Name                                               Version    Source
-----------     ----                                               -------    ------
Alias           wget -> Invoke-WebRequest
```

Let's also get the name of the file on the desktop:

```posh
PS C:\Users\century2\Documents> ls ..\Desktop

    Directory: C:\Users\century2\Desktop

Mode                LastWriteTime         Length Name
----                -------------         ------ ----
-a----         6/8/2017   4:05 PM              0 80
```

So the password for level 3 is: ```invoke-webrequest80```.

## Century 3

<blockquote>
  <p>The password for Century4 is the number of files on the desktop.</p>
</blockquote>

This is another simple one that introduces new operators:

```posh
PS C:\Users\century3\Documents> (Get-ChildItem -File ..\Desktop | Measure-Object).Count
517
```

So the password for level 4 is: ```517```

## Century 4

<blockquote>
  <p>The password for Century5 is the name of the file within a directory on the desktop that has spaces in its name.</p>
</blockquote>

This level is about parsing folders containing spaces in their names. This reminded me about an old social engineering trick used to hide the real extension of a file by adding a big number of spaces before it. This works because Windows Explorer would show only the name before spaces followed by three dots, which most often go unnoticed.

```posh
PS C:\Users\century4\Documents> ls '..\Desktop\500                                                                                                                         501'

    Directory: C:\Users\century4\Desktop\500                                                                                                                         501

Mode                LastWriteTime         Length Name
----                -------------         ------ ----
-a----         6/8/2017   4:19 PM              0 65536
```

So we get the password for level 5: ```65536```.

## Century 5

<blockquote>
  <p>The password for Century6 is the short name of the domain in which this system resides in PLUS the name of the file on the desktop.</p>
</blockquote>

Let's first get the file on the Desktop:

```posh
PS C:\Users\century5\Documents> ls ..\Desktop

    Directory: C:\Users\century5\Desktop

Mode                LastWriteTime         Length Name
----                -------------         ------ ----
-a----         6/8/2017   4:20 PM              0 _4321
```

And the domain:

```posh
PS C:\Users\century5\Documents> Get-WmiObject Win32_ComputerSystem

Domain              : UNDERTHEWIRE.TECH
Manufacturer        : Microsoft Corporation
Model               : Virtual Machine
Name                : CENTURY
PrimaryOwnerName    : Windows User
TotalPhysicalMemory : 5239771136
```

Or even simpler:

```posh
PS C:\Users\century5\Documents> echo $env:USERDOMAIN
UNDERTHEWIRE
```

And we have the password for level 6: ```underthewire_4321```.

## Century 6

<blockquote>
  <p>The password for Century7 is the number of folders on the desktop.</p>
</blockquote>

This level introduces counting mechanisms:

```posh
PS C:\Users\century6\Documents> (Get-ChildItem -Directory ..\Desktop | Measure-Object).Count
416
```

The password for the 7th level is thus: ```416```.

## Century 7

<blockquote>
  <p>The password for Century8 is in a readme file somewhere within the contacts, desktop, documents, downloads, favorites, music, or videos folder in the user's profile. 
</p>
</blockquote>

For this level we need to work out searching and filtering operations:

```posh
PS C:\Users\century7> Get-Childitem –Path . -Include *readme* -File -Recurse -ErrorAction SilentlyContinue

    Directory: C:\Users\century7\Downloads

Mode                LastWriteTime         Length Name
----                -------------         ------ ----
-a----         6/8/2017   4:37 PM             21 README.txt

PS C:\Users\century7> cat .\Downloads\README.txt
human_versus_computer
```

Or we could have done it in one go:

```posh
PS C:\Users\century7> (Get-Childitem –Path . -Include *readme* -File -Recurse -ErrorAction SilentlyContinue) | cat
human_versus_computer
```

And we got the password for level 8: ```human_versus_computer```.

## Century 8

<blockquote>
  <p>The password for Century9 is the number of unique entries within the file on the desktop.</p>
</blockquote>

In this level we need to do a bit of file parsing:

```posh
PS C:\Users\century8\Documents> (cat ..\Desktop\Unique.txt | sort | Get-Unique).count
511
```

And we have our password for next level: ```511```.

## Century 9

<blockquote>
  <p>The password for Century10 is the 161st element within the file on the desktop.</p>
</blockquote>

More file parsing kung-fu:

```posh
PS C:\Users\century9\Documents> (cat ..\Desktop\words.txt).count
7916

PS C:\Users\century9\Documents> (Get-Content ..\Desktop\words.txt)[161]
shark
```

So our password for the 10th level is: ```shark```.

## Century 10

<blockquote>
  <p>The password for Century11 is the 10th and 8th word of the Windows Update service description combined PLUS the name of the file on the desktop.</p>
</blockquote>

First let's get the file on the desktop:

```posh
PS C:\Users\century10\Documents> ls ..\Desktop\

    Directory: C:\Users\century10\Desktop

Mode                LastWriteTime         Length Name
----                -------------         ------ ----
-a----         6/8/2017   4:57 PM              0 _4u
```

To solve this level we need to query Windows services:

```posh
PS C:\Users\century10\Documents> Get-Service -DisplayName *update*

Status   Name               DisplayName
------   ----               -----------
Stopped  wuauserv           Windows Update

PS C:\Users\century10\Documents> Get-Service -Name "Windows Update" | Select-Object *

Name                : wuauserv
RequiredServices    : {rpcss}
CanPauseAndContinue : False
CanShutdown         : False
CanStop             : False
DisplayName         : Windows Update
DependentServices   : {}
MachineName         : .
ServiceName         : wuauserv
ServicesDependedOn  : {rpcss}
ServiceHandle       :
Status              : Stopped
ServiceType         : Win32ShareProcess
StartType           : Manual
Site                :
Container           :

PS C:\Users\century10\Documents> Get-WMIObject -Class Win32_Service -Filter  "Name='wuauserv'"  | Select-Object *

PSComputerName          : CENTURY
Name                    : wuauserv
Status                  : OK
ExitCode                : 0
DesktopInteract         : False
ErrorControl            : Normal
PathName                : C:\Windows\system32\svchost.exe -k netsvcs
ServiceType             : Share Process
StartMode               : Manual
[..]
Description             : Enables the detection, download, and installation of updates for Windows and other programs. If this service is
                          disabled, users of this computer will not be able to use Windows Update or its automatic updating feature, and programs
                          will not be able to use the Windows Update Agent (WUA) API.
DisplayName             : Windows Update
[..]
```

Based on the above description, the passowrd for the next level is: ```windowsupdates_4u```.

## Century 11

<blockquote>
  <p>The password for Century12 is the name of the hidden file within the contacts, desktop, documents, downloads, favorites, music, or videos folder in the user's profile.</p>
</blockquote>

To solve this level again we need to do a bit of filtering based on file paths, names and attributes:

```posh
PS C:\Users\century11> Get-Childitem –Path Contacts,Desktop,Documents,Downloads,Favorites,Music,Videos -File -Attributes !D+H -Exclude desktop.ini -
Recurse -ErrorAction SilentlyContinue

    Directory: C:\Users\century11\Desktop

Mode                LastWriteTime         Length Name
----                -------------         ------ ----
-a-h--         6/8/2017   4:59 PM              0 secret_sauce
```

<div class="box-note">
  <b>!D</b> is used here to exclude directories and <b>+H</b> is used to include hidden files.
</div>

The password for level 12 is: ```secret_sauce```.

## Century 12

<blockquote>
  <p>The password for Century13 is the description of the computer designated as a Domain Controller within this domain PLUS the name of the file on the desktop.</p>
</blockquote>

Let's get the easy bit first - the file on the Desktop:

```posh
PS C:\Users\century12> ls .\Desktop

    Directory: C:\Users\century12\Desktop

Mode                LastWriteTime         Length Name
----                -------------         ------ ----
-a----         6/8/2017   5:09 PM              0 _things
```

Then use the next cmdlet to find out the name of the computer who is the Domain Controller using **Get-ADDomainController**:

```posh
PS C:\Users\century12> Get-ADDomainController

ComputerObjectDN           : CN=CENTURY,OU=Domain Controllers,DC=UNDERTHEWIRE,DC=TECH
DefaultPartition           : DC=UNDERTHEWIRE,DC=TECH
Domain                     : UNDERTHEWIRE.TECH
Enabled                    : True
Forest                     : UNDERTHEWIRE.TECH
HostName                   : Century.UNDERTHEWIRE.TECH
InvocationId               : 8e3c06c8-3e99-4b88-8a69-dcb87617de2f
IPv4Address                : 10.30.1.21
IPv6Address                : ::1
IsGlobalCatalog            : True
IsReadOnly                 : False
LdapPort                   : 389
Name                       : CENTURY
NTDSSettingsObjectDN       : CN=NTDS Settings,CN=CENTURY,CN=Servers,CN=Default-First-Site-Name,CN=Sites,CN=Configuration,DC=UNDERTHEWIRE,DC=TECH
OperatingSystem            : Windows Server 2012 R2 Datacenter Evaluation
[..]
```

Based on its name, **Get-ADComputer** provides additional information:

```posh
PS C:\Users\century12> Get-ADComputer -Filter {Name -Eq "CENTURY"} -Properties description

Description       : i_authenticate
DistinguishedName : CN=CENTURY,OU=Domain Controllers,DC=UNDERTHEWIRE,DC=TECH
DNSHostName       : Century.UNDERTHEWIRE.TECH
Enabled           : True
Name              : CENTURY
ObjectClass       : computer
ObjectGUID        : e1248e0f-ed89-42a4-86ef-687303e886a5
SamAccountName    : CENTURY$
SID               : S-1-5-21-3968311752-1263969649-2303472966-1002
UserPrincipalName :
```

<div class="box-note">
  Note that the <i>Description</i> field is not displayed by default, that's why we need to specify it manually using the <b>-Properties</b> flag.
</div>

And we have the password for the next level: ```i_authenticate_things```.

## Century 13

<blockquote>
  <p>The password for Century14 is the number of words within the file on the desktop.</p>
</blockquote>

We're getting closer to the final level with more file parsing:

```posh
PS C:\Users\century13> Get-Content .\Desktop\words.txt | Measure-Object –Word

Lines  Words Characters Property
-----  ----- ---------- --------
      475361
```

The password for level 14 is: ```475361```.

## Century 14

<blockquote>
  <p>The password for Century15 is the number of times the word "polo" appears within the file on the desktop.</p>
</blockquote>

The last level is very simple as well and teaches us pattern matching:

```posh
PS C:\Users\century14> (Get-Content .\Desktop\stuff.txt | Select-String -Pattern "polo" -AllMatches).length
10
```

The final password is: ```10```.

This was the last level fron the first set of challenges. Looking forward to do the next ones!
