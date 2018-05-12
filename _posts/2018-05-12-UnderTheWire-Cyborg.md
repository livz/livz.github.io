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
  <p>The password for cyborg3 is the host A record IP address for CYBORG713W104N PLUS the name of the file on the desktop.</p>
</blockquote>

First let's get the file on the Desktop:

```posh
PS C:\Users\cyborg2\Documents> ls ..\Desktop

    Directory: C:\Users\cyborg2\Desktop

Mode                LastWriteTime         Length Name
----                -------------         ------ ----
-a----         6/7/2017  11:07 AM              0 _ipv4
```

To resolve a hostname we'll use the **Resolve-DnsName** cmdlet:

```posh
PS C:\Users\cyborg2\Documents> Resolve-DnsName CYBORG713W104N

Name                                           Type   TTL   Section    IPAddress
----                                           ----   ---   -------    ---------
CYBORG713W104N.UNDERTHEWIRE.TECH               A      3600  Answer     172.31.45.167
```

So the password for level 3 is: ```172.31.45.167_ipv4```.

## Cyborg 3

<blockquote>
  <p>The password for cyborg4 is the number of users in the Cyborg group within Active Directory PLUS the name of the file on the desktop.</p>
</blockquote>

Again, first the file on the Desktop:

```posh
PS C:\Users\cyborg3\Documents> ls ..\Desktop

    Directory: C:\Users\cyborg3\Desktop

Mode                LastWriteTime         Length Name
----                -------------         ------ ----
-a----         6/7/2017  11:10 AM              0 _objects
```

To get members of an Active Directory group we have the **Get-ADGroupMember** cmdlet:

```posh
PS C:\Users\cyborg3\Documents> (Get-ADGroupMember -Identity Cyborg).Count
88
```

So the password for level 4 is ```88_objects```.

## Cyborg 4

<blockquote>
  <p>The password for cyborg5 is the PowerShell module name with a version number of 8.9.8.9 PLUS the name of the file on the desktop. 
</p>
</blockquote>

The file on the Desktop:
```posh
PS C:\Users\cyborg4\Documents> ls ..\Desktop

    Directory: C:\Users\cyborg4\Desktop

Mode                LastWriteTime         Length Name
----                -------------         ------ ----
-a----         6/7/2017  11:23 AM              0 _eggs
```

To list information about available PowerShell modules there is the **Get-Module** cmdlet:

```posh
PS C:\Users\cyborg4\Documents> Get-Module –ListAvailable | Where {$_.Version -Like "*8.9.8.9*"}

    Directory: C:\Windows\system32\WindowsPowerShell\v1.0\Modules

ModuleType Version    Name                                ExportedCommands
---------- -------    ----                                ----------------
Manifest   8.9.8.9    Grits                               Get-grits
```

After applying some filtering we get the password for the 5th level: ```grits_eggs```.

## Cyborg 5

<blockquote>
  <p>The password for cyborg6 is the last name of the user who has logon hours set on their account PLUS the name of the file on the desktop.</p>
</blockquote>

The file on the Deaktop:

```posh
PS C:\Users\cyborg5> ls .\Desktop\

    Directory: C:\Users\cyborg5\Desktop

Mode                LastWriteTime         Length Name
----                -------------         ------ ----
-a----         6/7/2017  11:13 AM              0 _timer
```

For the logon hours there is the [Logon-Hours](https://msdn.microsoft.com/en-us/library/ms676846(v=vs.85).aspx) Active Directory attribute. Its display name is **logonHours**, which we'll use for filtering:

```posh
PS C:\Users\cyborg5> Get-ADUser -Filter 'logonHours -like "*"' -Properties logonHours

DistinguishedName : CN=Rowray\, Benny  \ ,OU=Southside,OU=Cyborg,DC=UNDERTHEWIRE,DC=TECH
Enabled           : False
GivenName         : Benny
logonHours        : {255, 255, 255, 255...}
Name              : Rowray, Benny
ObjectClass       : user
ObjectGUID        : 23501b6d-a0ec-4048-bd51-82f84c7945d3
SamAccountName    : Benny.Rowray
SID               : S-1-5-21-1013972110-1198539618-3084840507-1978
Surname           : Rowray
UserPrincipalName : Benny.Rowray
```

The password for level 6 is then ```rowray_timer```.

## Cyborg 6

<blockquote>
  <p></p>
</blockquote>

## Cyborg 7

<blockquote>
  <p></p>
</blockquote>

## Cyborg 8

<blockquote>
  <p></p>
</blockquote>

## Century 9

<blockquote>
  <p></p>
</blockquote>

## Century 10

<blockquote>
  <p></p>
</blockquote>

## Century 11

<blockquote>
  <p></p>
</blockquote>

## Century 12

<blockquote>
  <p></p>
</blockquote>

## Century 13

<blockquote>
  <p></p>
</blockquote>

## Century 14

<blockquote>
  <p></p>
</blockquote>
