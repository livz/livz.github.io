---
title:  "[CTF] Under the Wire 2 - Cyborg"
categories: [CTF, UnderTheWire]
---

![Logo](/assets/images/hammer1.png)

[UnderTheWire](http://underthewire.tech/index.htm) is an awesome website that hosts a number of PowerShell-based wargames meant to help Infosecurity people, either get started with or improve their PowerShell skills. I believe challenges and wargames like this one are a great way to learn *by doing* as they often cover rare and less known situations and involve problem solving. Other very interesting wargames I've written about are [OverTheWire](http://craftware.xyz/blog/categories/#OverTheWire), [Nebula](http://craftware.xyz/ctf/2012/07/21/Nebula-wargame-walkthrough.html), [Binar Master](http://craftware.xyz/blog/categories/#Binary-Master). 

The UnderTheWire wargames could be described as designed for Windows security professionals, Blue Team members or security tools designers. Currently there are 5 sets of levels of increasing difficulty. 

In this post I'll go through my solutions to the second batch of 15 levels - [Cyborg](http://underthewire.tech/cyborg/cyborg.htm). These cover a bit more advanced topics like working Active Directory, AppLocker policies, Alternate Data Streams and auto-start items. 

For the solutions to the other games check:
* [Level 1 - Century]({{ site.baseurl }}{% post_url 2018-05-10-UnderTheWire-Century %})
* [Level 3 - Groot]({{ site.baseurl }}{% post_url 2018-05-14-UnderTheWire-Groot %})
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

The password for level 6 is ```rowray_timer```.

## Cyborg 6

<blockquote>
  <p>The password for cyborg7 is the decoded text of the string within the file on the desktop.</p>
</blockquote>

Here we have to do some simple base64 encoding:

```posh
PS C:\Users\cyborg6\Documents> $m = Get-Content ..\Desktop\cypher.txt
PS C:\Users\cyborg6\Documents> [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($m))
The password is cybergeddon
```

Very straighforward - the password for level 7 is ```cybergeddon```.

## Cyborg 7

<blockquote>
  <p>The password for cyborg8 is the executable name of a program that will start automatically when cyborg7 logs in.</p>
</blockquote>

I found the solution from a very good [article]((https://blogs.technet.microsoft.com/heyscriptingguy/2014/09/09/use-powershell-to-provide-startup-information/)) on how to use PowerShell to get xtartup Information:

```posh
PS C:\Users\cyborg7\Documents> Get-WmiObject Win32_StartupCommand | Select-Object Name, command, Location, User  | Format-List

Name     : SKYNET
command  : C:\Program Files\Cyberdyne Systems\Skynet.exe
Location : HKU\S-1-5-21-1013972110-1198539618-3084840507-2108\SOFTWARE\Microsoft\Windows\CurrentVersion\Run
User     : UNDERTHEWIRE\cyborg7
```

So the password for level 8 is ```skynet```.

## Cyborg 8

<blockquote>
  <p>The password for cyborg9 is the Internet zone that the picture on the desktop was downloaded from.</p>
</blockquote>

Zone information is recorded in the **Zone.Identifier** data stream. We can easily view all [Alternate Data Streams](https://blogs.technet.microsoft.com/askcore/2013/03/24/alternate-data-streams-in-ntfs/) for a file using PowerShell:

```posh
PS C:\Users\cyborg8\Documents> Get-Item ..\Desktop\picture1.jpg -Stream *

PSPath        : Microsoft.PowerShell.Core\FileSystem::C:\Users\cyborg8\Desktop\picture1.jpg::$DATA
PSParentPath  : Microsoft.PowerShell.Core\FileSystem::C:\Users\cyborg8\Desktop
PSChildName   : picture1.jpg::$DATA
PSDrive       : C
PSProvider    : Microsoft.PowerShell.Core\FileSystem
PSIsContainer : False
FileName      : C:\Users\cyborg8\Desktop\picture1.jpg
Stream        : :$DATA
Length        : 224398

PSPath        : Microsoft.PowerShell.Core\FileSystem::C:\Users\cyborg8\Desktop\picture1.jpg:Zone.Identifier
PSParentPath  : Microsoft.PowerShell.Core\FileSystem::C:\Users\cyborg8\Desktop
PSChildName   : picture1.jpg:Zone.Identifier
PSDrive       : C
PSProvider    : Microsoft.PowerShell.Core\FileSystem
PSIsContainer : False
FileName      : C:\Users\cyborg8\Desktop\picture1.jpg
Stream        : Zone.Identifier
Length        : 26
```

To view a specific stream we have the __*-Stream*__ option for **Get-Content** cmdlet:

```posh
PS C:\Users\cyborg8\Documents> Get-Content -Path ..\Desktop\picture1.jpg -Stream Zone.Identifier
[ZoneTransfer]
ZoneId=4
```

So the password for level 9 is: ```4```.

## Cyborg 9

<blockquote>
  <p>The password for cyborg10 is the first name of the user with the phone number of 867-5309 listed in Active Directory PLUS the name of the file on the desktop.</p>
</blockquote>

First the file on the Desktop:

```posh
PS C:\Users\cyborg9\Documents> ls ..\Desktop

    Directory: C:\Users\cyborg9\Desktop

Mode                LastWriteTime         Length Name
----                -------------         ------ ----
-a----         6/7/2017   4:39 PM              0 72
```

And some more Active Directory filtering, this time for [Telephone-Number attribute](https://msdn.microsoft.com/en-us/library/ms680027(v=vs.85).aspx):

```posh
PS C:\Users\cyborg9\Documents> Get-ADUser -Filter 'telephoneNumber -like "*5309*"'  -Properties telephoneNumber

DistinguishedName : CN=Conner\, John,OU=Northside,OU=Cyborg,DC=UNDERTHEWIRE,DC=TECH
Enabled           : False
GivenName         : John
Name              : Conner, John
ObjectClass       : user
ObjectGUID        : 61af13ae-3258-4661-b5a3-dee78ac6f659
SamAccountName    : john.conner
SID               : S-1-5-21-1013972110-1198539618-3084840507-2119
Surname           : Conner
telephoneNumber   : 867-5309
UserPrincipalName : john.conner@UNDERTHEWIRE.TECH
```

The password for the 10th level is: ```john72```.

## Cyborg 10

<blockquote>
  <p>The password for cyborg11 is the description of the Applocker Executable deny policy for ill_be_back.exe PLUS the name of the file on the desktop.</p>
</blockquote>

The file on the Desktop:

```posh
PS C:\Users\cyborg10\Documents> ls ..\Desktop

    Directory: C:\Users\cyborg10\Desktop

Mode                LastWriteTime         Length Name
----                -------------         ------ ----
-a----         6/7/2017   4:34 PM              0 99
```

To work with AppLocker policies from PowerShell, we have the very useful **[Get-AppLockerPolicy](https://docs.microsoft.com/en-us/powershell/module/applocker/get-applockerpolicy?view=win10-ps)** cmdlet:

```posh
PS C:\Users\cyborg10\Documents>Get-AppLockerPolicy -Effective -Xml

[..]
<FileHashRule Id="5d6eb575-3e78-4cc1-a6
ac-38260a101d8d" Name="ill_be_back.exe" Description="terminated!" UserOrGroupSid="S-1-1-0" Action="Deny">
[..]
```

Sifting through the output we get the password for level 11: ```terminated!99```.

<div class="box-note">
  Note that the <b>Effective</b> flag shows all the policies effective on the local machine - the merge of the local AppLocker policy and any applied AppLocker domain policies on the local computer.
</div>

## Cyborg 11

<blockquote>
  <p>The password for cyborg12 is located in the IIS log. The password is not Mozilla or Opera.</p>
</blockquote>

First we need to know the location of IIS logs. In this case is one of the default locations - *c:\inetpub\logs\LogFiles*. We could solve this quickly using [findstr](https://docs.microsoft.com/en-us/windows-server/administration/windows-commands/findstr) with the **/V** flag, but it's more interesting to do it in PowerShell using **Select-String** and a regular expressions pattern:

```posh
PS C:\Users\cyborg11\Documents> Get-Content -Path ..\..\..\inetpub\logs\LogFiles\W3SVC1\u_ex160413.log | Select-String -NotMatch -Pattern "Mozilla|Opera"

#Software: Microsoft Internet Information Services 8.5
#Version: 1.0
#Date: 2016-04-13 04:14:01
#Fields: date time s-sitename s-computername s-ip cs-method cs-uri-stem cs-uri-query s-port cs-username c-ip cs-version cs(User-Agent) cs(Cookie)
cs(Referer) cs-host sc-status sc-substatus sc-win32-status sc-bytes cs-bytes time-taken
2016-04-13 04:14:12 W3SVC1 Century 172.31.45.65 GET / - 80 - 172.31.45.65 HTTP/1.1 LordHelmet/5.0+(CombTheDesert)+Password+is:spaceballs - -
century.underthewire.tech 200 0 0 925 118 0
```

The next password is: ```spaceballs```.

## Cyborg 12

<blockquote>
  <p>The password for cyborg13 is the first four characters of the base64 encoded fullpath to the file that started the i_heart_robots service PLUS the name of the file on the desktop.</p>
</blockquote>

The file on the Desktop:

```posh
PS C:\Users\cyborg12\Documents> ls ..\Desktop

    Directory: C:\Users\cyborg12\Desktop

Mode                LastWriteTime         Length Name
----                -------------         ------ ----
-a----         6/7/2017   4:58 PM              0 _heart
```

The best way I found to get extended details about a service is the **Get-WmiObject** cmdlet with a filter for *Win32_Service* classes:

```posh
PS C:\Users\cyborg12\Documents> Get-WmiObject -Class Win32_Service -Filter "Name='i_heart_robots'" | Select-Object *

PSComputerName          : CYBORG
Name                    : i_heart_robots
Status                  : OK
ExitCode                : 1077
DesktopInteract         : False
ErrorControl            : Normal
PathName                : C:\windows\system32\abc.exe
ServiceType             : Own Process
[..]

PS C:\Users\cyborg12\Documents> $path = (Get-WmiObject -Class Win32_Service -Filter "Name='i_heart_robots'").PathName
PS C:\Users\cyborg12\Documents> $bytes = [System.Text.Encoding]::UTF8.GetBytes($path)
PS C:\Users\cyborg12\Documents> $enc =[Convert]::ToBase64String($bytes)
PS C:\Users\cyborg12\Documents> $enc
Qzpcd2luZG93c1xzeXN0ZW0zMlxhYmMuZXhl
```

Copncatenating the two items together we have the password for level 13: ```qzpc_heart```.

## Cyborg 13

<blockquote>
  <p>The password cyborg14 is the number of days the refresh interval is set to for DNS aging for the underthewire.tech zone PLUS the name of the file on the desktop.</p>
</blockquote>

The file on the Desktop:

```posh
PS C:\Users\cyborg13\Documents> ls ..\Desktop

    Directory: C:\Users\cyborg13\Desktop

Mode                LastWriteTime         Length Name
----                -------------         ------ ----
-a----        6/12/2017   7:59 PM              0 _days
```

And for the refresh interval we have the convenient **DNSServerZoneAging** command:

```posh
PS C:\Users\cyborg13\Documents> $domain = "underthewire.tech"
PS C:\Users\cyborg13\Documents> Get-DNSServerZoneAging -Name $domain

ZoneName             : underthewire.tech
AgingEnabled         : False
AvailForScavengeTime :
RefreshInterval      : 16.00:00:00
NoRefreshInterval    : 16.00:00:00
ScavengeServers      :
```

The password for level 15 is ```16_days```.

## Cyborg 14

<blockquote>
  <p>The password for cyborg15 is the caption for the DCOM application setting for application ID {59B8AFA0-229E-46D9-B980-DDA2C817EC7E} PLUS the name of the file on the desktop.</p>
</blockquote>

The first bit, the file on the Desktop:

```posh
PS C:\Users\cyborg14\Documents> ls ..\Desktop

    Directory: C:\Users\cyborg14\Desktop

Mode                LastWriteTime         Length Name
----                -------------         ------ ----
-a----        6/12/2017   8:03 PM              0 _objects
```

To get information about DCOM applications we can use again the **Get-WmiObject** cmdlet and filter for *Win32_DCOMApplication* classes:

```posh
PS C:\Users\cyborg14\Documents> (Get-WmiObject -Class "Win32_DCOMApplication" -Filter "AppId='{59B8AFA0-229E-46D9-B980-DDA2C817EC7E}'" ).Caption
propshts
```

The final password is: ```propshts_objects```.

