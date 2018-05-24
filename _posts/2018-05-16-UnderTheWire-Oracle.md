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

To solve this level we need to filter for [events with id 1102](https://www.ultimatewindowssecurity.com/securitylog/encyclopedia/event.aspx?eventID=1102) - *The audit log was cleared*. The corresponding event for Windows 2003 would be [517](https://www.ultimatewindowssecurity.com/securitylog/encyclopedia/event.aspx?eventid=517).

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

The file on the Desktop:

```posh
PS C:\Users\oracle4\Documents> ls ..\Desktop

    Directory: C:\Users\oracle4\Desktop

Mode                LastWriteTime         Length Name
----                -------------         ------ ----
-a----         5/9/2017   5:03 AM              0 83
```

To sift through group policies (*GPOs*) there is the **Get-GPO** cmdlet:

```posh
PS C:\Users\oracle4\Documents> $startDate = Get-Date -Year 2017 -Month 4 -Day 5 -Hour 0 -Minute 0 -Second 0
PS C:\Users\oracle4\Documents> Get-GPO -all| where { $_.CreationTime -ge $startDate -AND $_.CreationTime -lt $startDate.AddDays(1) }

DisplayName      : Boom
DomainName       : UNDERTHEWIRE.TECH
Owner            : UNDERTHEWIRE\Domain Admins
Id               : e19b0c64-216a-4a8b-bf02-0f5ec3a57d36
GpoStatus        : AllSettingsEnabled
Description      : Everything is awesome!
[..]
```

The password for level 5 is: ```boom83```.

## Oracle 5

<blockquote>
  <p>The password for oracle6 is the name of the GPO that contains a description of "I_AM_GROOT" PLUS the name of the file on the user's desktop.</p>
</blockquote>

The file on the Desktop:

```posh
PS C:\Users\oracle5\Documents> ls ..\Desktop

    Directory: C:\Users\oracle5\Desktop

Mode                LastWriteTime         Length Name
----                -------------         ------ ----
-a----         5/9/2017   5:03 AM              0 25
```

And the required group policy:

```posh
PS C:\Users\oracle5\Documents> Get-GPO -all| where { $_.Description -Like "*I_AM_GROOT*"}

DisplayName      : Charlie
DomainName       : UNDERTHEWIRE.TECH
Owner            : UNDERTHEWIRE\Domain Admins
Id               : 15135a78-1e2a-43c3-8098-7e059807af17
GpoStatus        : AllSettingsEnabled
Description      : I_AM_GROOT
[..]
```

And the password for level 6 is: ```charlie25```.

## Oracle 6

<blockquote>
  <p>The password for oracle7 is the name of the OU that doesn't have a GPO linked to it PLUS the name of the file on the user's desktop.</p>
</blockquote>

The file on the Desktop:

```posh
PS C:\Users\oracle6\Documents> ls ..\Desktop

    Directory: C:\Users\oracle6\Desktop

Mode                LastWriteTime         Length Name
----                -------------         ------ ----
-a----         5/9/2017   5:04 AM              0 97
```

Then we need to filter for the organizational units that *don't* have a linked group policy. More specifically, we need only the results where the collection *LinkedGroupPolicyObjects* is enmty. After some attemtps with other operators, I found [this](https://jdhitsolutions.com/blog/powershell/1580/filtering-empty-values-in-powershell/) very good article on filtering for empty values in PowerShell. The final command is:

```posh
PS C:\Users\oracle6\Documents> Get-ADOrganizationalUnit -Filter * | Where {-Not $_.LinkedGroupPolicyObjects}

City                     :
Country                  :
DistinguishedName        : OU=Xandar,DC=UNDERTHEWIRE,DC=TECH
LinkedGroupPolicyObjects : {}
ManagedBy                :
Name                     : Xandar
ObjectClass              : organizationalUnit
[..]
```

And we have the password for level 7: ```xandar97```.

## Oracle 7

<blockquote>
  <p>The password for oracle8 is the name of the domain that a trust is built with PLUS the name of the file on the user's desktop.</p>
</blockquote>

The file on the Desktop:

```posh
PS C:\Users\oracle7\Documents> ls ..\Desktop

    Directory: C:\Users\oracle7\Desktop

Mode                LastWriteTime         Length Name
----                -------------         ------ ----
-a----         5/9/2017   5:04 AM              0 111
```

Once you understand what the requirement is, this level is very simple:

```posh
PS C:\Users\oracle7\Documents> Get-ADTrust -Filter *

Direction               : BiDirectional
DisallowTransivity      : True
DistinguishedName       : CN=multiverse,CN=System,DC=UNDERTHEWIRE,DC=TECH
ForestTransitive        : False
IntraForest             : False
IsTreeParent            : False
IsTreeRoot              : False
Name                    : multiverse
ObjectClass             : trustedDomain
[..]
```

Which provides the password for the next level: ```multiverse111```.

## Oracle 8

<blockquote>
  <p>The password for oracle9 is the name of the file in the GET Request from www.guardian.galaxy.com within the log file on the desktop.</p>
</blockquote>

Another short one that requires some strings filtering:

```posh
PS C:\Users\oracle8\Documents> cat ..\Desktop\Logs.txt |  Out-String -Stream | Select-String -Pattern "guardian"

guardian.galaxy.com - - [28/Jul/1995:13:03:55 -0400] "GET /images/star-lord.gif HTTP/1.0" 200 786
```

On to level 9: ```star-lord```.

## Oracle 9

<blockquote>
  <p>The password for oracle10 is the computername of the DNS record of the mail server listed in the UnderTheWire.tech zone PLUS the name of the file on the user's desktop.</p>
</blockquote>

The file on the Desktop:

```posh
PS C:\Users\oracle9\Documents> ls ..\Desktop

    Directory: C:\Users\oracle9\Desktop

Mode                LastWriteTime         Length Name
----                -------------         ------ ----
-a----         5/9/2017   5:04 AM              0 40
```

The DNS records for a specific zone will reveal the mail server in the *__MX__* record:

```posh
PS C:\Users\oracle9\Documents> DnsServerResourceRecord -ZoneName UNDERTHEWIRE.TECH | where {$_.RecordType -Like "MX"}

HostName                  RecordType Timestamp            TimeToLive      RecordData
--------                  ---------- ---------            ----------      ----------
exch_serv                 MX         0                    01:00:00        [10][exch_serv.underthewire.tech.]
```

The password for level 10 is: ```exch_serv40```.

## Oracle 10

<blockquote>
  <p>The password for oracle11 is the .biz site the user has previously navigated to.</p>
</blockquote>

[TypedURLs registry key](http://sketchymoose.blogspot.co.uk/2014/02/typedurls-registry-key.html) stores Internet Explorer's cached history and is very valuable in a forensic investigation. Let's retrieve the *.biz* URL:

```posh
PS C:\Users\oracle10\Documents> cd "HKCU:\Software\Microsoft\Internet Explorer\TypedURLs"
PS HKCU:\Software\Microsoft\Internet Explorer\TypedURLs> Get-ItemProperty -path .

url1         : http://go.microsoft.com/fwlink/p/?LinkId=255141
url2         : http://google.com
url3         : http://underthewire.tech
url4         : http://bimmerfest.com
url5         : http://nba.com
url6         : http://yondu.biz
[..]
```

The password for level 11 is: ```yondu```.

## Oracle 11

<blockquote>
  <p>The password for oracle12 is the drive letter associated with the mapped drive of this user.</p>
</blockquote>

Another (*very*) short level:

```posh
PS C:\Users\oracle11\Documents> Get-PSDrive -PSProvider FileSystem

Name    Used (GB)     Free (GB) Provider      Root   CurrentLocation
----    ---------     --------- --------      ----   ---------------
C                               FileSystem    C:\    Users\oracle11\Documents
D                               FileSystem    D:\
M                               FileSystem    \\127.0.0.1\WsusContent
```

The next password is also short: ```m```.

## Oracle 12

<blockquote>
  <p>The password for oracle13 is the IP of the system that this user has previously established a remote desktop with.</p>
</blockquote>

Once we know where the RDP connections are [stored](http://woshub.com/how-to-clear-rdp-connections-history) within the Windows registry, this is almost too easy:

```posh
PS C:\Users\oracle12\Documents> cd "HKCU:\Software\Microsoft\Terminal Server Client"
PS HKCU:\Software\Microsoft\Terminal Server Client> Get-ChildItem

    Hive: HKEY_CURRENT_USER\Software\Microsoft\Terminal Server Client

Name                           Property
----                           --------
192.168.2.3                    UsernameHint : MyServer\raccoon
```

The IP address is the next level password: ```192.168.2.3```.

## Oracle 13

<blockquote>
  <p>The password for oracle14 is the name of the user who created the Galaxy security group as depicted in the event logs on the desktop PLUS the name of the text file on the user's desktop.</p>
</blockquote>

The file on the Desktop:

```posh
PS C:\Users\oracle13\Documents> ls ..\Desktop

    Directory: C:\Users\oracle13\Desktop

Mode                LastWriteTime         Length Name
----                -------------         ------ ----
-a----         5/9/2017   9:44 PM              0 88
-a----        5/19/2017   1:22 AM        2166784 security.evtx
```

We can solve this level quickly, without knowing the event ID for creation of security groups, with a string filter based on the message:

```posh
PS C:\Users\oracle13\Documents> Get-WinEvent -Path ..\Desktop\Security.evtx | where {$_.Message -Like "*group*created*"}

   ProviderName: Microsoft-Windows-Security-Auditing

TimeCreated                     Id LevelDisplayName Message
-----------                     -- ---------------- -------
5/19/2017 1:18:26 AM          4727 Information      A security-enabled global group was created....
5/19/2017 1:16:17 AM          4727 Information      A security-enabled global group was created....
```

A more elegant approach makes use of the event IDs for creating security enabled local ([635](https://www.ultimatewindowssecurity.com/securitylog/encyclopedia/event.aspx?eventid=635) and [4731](https://www.ultimatewindowssecurity.com/securitylog/encyclopedia/event.aspx?eventID=4731)), global ([631](https://www.ultimatewindowssecurity.com/securitylog/encyclopedia/event.aspx?eventid=631), [4727](https://www.ultimatewindowssecurity.com/securitylog/encyclopedia/event.aspx?eventid=4727) and universal ([658](https://www.ultimatewindowssecurity.com/securitylog/encyclopedia/event.aspx?eventid=658), [4727](https://www.ultimatewindowssecurity.com/securitylog/encyclopedia/event.aspx?eventid=4754) groups:

```posh
PS C:\Users\oracle13\Documents> Get-WinEvent -Path ..\Desktop\Security.evtx | where {$_.Id -Eq 631 -OR $_.Id -Eq 635 -OR $_.Id -Eq 658 -OR $_.Id -Eq 4727 -OR $_.Id -Eq 4731 -OR $_.Id -Eq 4754}

   ProviderName: Microsoft-Windows-Security-Auditing

TimeCreated                     Id LevelDisplayName Message
-----------                     -- ---------------- -------
5/19/2017 1:18:26 AM          4727 Information      A security-enabled global group was created....
5/19/2017 1:16:17 AM          4727 Information      A security-enabled global group was created....

PS C:\Users\oracle13\Documents> Get-WinEvent -Path ..\Desktop\Security.evtx | where {$_.Id -Eq 631 -OR $_.Id -Eq 635 -OR $_.Id -Eq 658 -OR $_.Id -Eq 4727 -OR $_.Id -Eq 4731 -OR $_.Id -Eq 4754} | Format-List -Property Message

Message : A security-enabled global group was created.

          Subject:
                Security ID:            S-1-5-21-2268727836-2773903800-2952248001-1621
                Account Name:           gamora
                Account Domain:         UNDERTHEWIRE
                Logon ID:               0xBC24FF

          New Group:
                Security ID:            S-1-5-21-2268727836-2773903800-2952248001-1626
                Group Name:             Galaxy
                Group Domain:           UNDERTHEWIRE
[..]
```

Almost at the end. The next password id: ```gamora88```.

## Oracle 14

<blockquote>
  <p>The password for oracle15 is the name of the user who added the user Bereet to the Guardian security group as depicted in the event logs on the desktop PLUS the name of the text file on the user's desktop.</p>
</blockquote>

The file on the Desktop:

```posh
PS C:\Users\oracle14\Documents> ls ..\Desktop

    Directory: C:\Users\oracle14\Desktop

Mode                LastWriteTime         Length Name
----                -------------         ------ ----
-a----         5/9/2017   9:45 PM              0 2112
-a----        5/19/2017   1:22 AM        2166784 security.evtx
```

In this case we have the follwing events when a user is added to a security group: [632](https://www.ultimatewindowssecurity.com/securitylog/encyclopedia/event.aspx?eventid=632) and [4728](https://www.ultimatewindowssecurity.com/securitylog/encyclopedia/event.aspx?eventID=4728).

```posh
PS C:\Users\oracle14\Documents> Get-WinEvent -Path ..\Desktop\Security.evtx | where {$_.Id -Eq 632 -OR $_.Id -Eq 4728} | Format-List -Property
Message | Out-String -Stream | Select-String -Pattern "Bereet" -Context 8,1

            Subject:
                Security ID:            S-1-5-21-2268727836-2773903800-2952248001-1622
                Account Name:           nebula
                Account Domain:         UNDERTHEWIRE
                Logon ID:               0xBD8CC7

            Member:
                Security ID:            S-1-5-21-2268727836-2773903800-2952248001-1623
                Account Name:           CN=Bereet,OU=Morag,DC=UNDERTHEWIRE,DC=TECH
```

The final password is ```nebula2112```. One more set of levels to go!
