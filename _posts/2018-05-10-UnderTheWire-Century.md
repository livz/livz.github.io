---
title:  "[CTF] Under the Wire - Century Wargame"
categories: [CTF, UnderTheWire]
---

![Logo](/assets/images/hammer0.png)

[UnderTheWire](http://underthewire.tech/index.htm) is an awesome website that hosts a number of PowerShell-based wargames meant to help Infosecurity people, either get started with or improve their PowerShell skills. I believe challenges and wargames like this one are a great way to learn *by doing* as they often cover rare and less known situations and involve problem solving. Other very interesting wargames I've written about are [OverTheWire](http://craftware.xyz/blog/categories/#OverTheWire), [Nebula](http://craftware.xyz/ctf/2012/07/21/Nebula-wargame-walkthrough.html), [Binar Master](http://craftware.xyz/blog/categories/#Binary-Master). 

The UnderTheWire wargames could be described as designed for Windows security professionals, Blue Team members or security tools designers. Currently there are 5 sets of levels of increasing difficulty. 

In this post I'll go through my solutions to the first batch of 15 levels - [Century](http://underthewire.tech/century/century.htm). This is the first and most basic one and focuses on parsing files, usage of PowerShell operators and general navigation techniques in a Windows environment. 

For the solutions to the other games check:
* [Cyborg]()
* [Groot]()
* [Oracle]()
* [Trebek]()

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

To find the command behind an alias use the cmdlet below:

```posh
PS C:\Users\century2\Documents> Get-Alias wget

CommandType     Name                                               Version    Source
-----------     ----                                               -------    ------
Alias           wget -> Invoke-WebRequest
```

Let's also get the file on the desktop:

```bash
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
  <p>The password for Century5 is the name of the file within a directory on the desktop that has spaces in its name. 
</p>
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

PS C:\Users\century5\Documents> ls ..\Desktop


    Directory: C:\Users\century5\Desktop


Mode                LastWriteTime         Length Name
----                -------------         ------ ----
-a----         6/8/2017   4:20 PM              0 _4321

PS C:\Users\century5\Documents> Get-WmiObject Win32_ComputerSystem


Domain              : UNDERTHEWIRE.TECH
Manufacturer        : Microsoft Corporation
Model               : Virtual Machine
Name                : CENTURY
PrimaryOwnerName    : Windows User
TotalPhysicalMemory : 5239771136

PS C:\Users\century5\Documents> echo $env:USERDOMAIN
UNDERTHEWIRE

~ ssh century6@century.underthewire.tech -p 6009
century6@century.underthewire.tech's password: underthewire_4321
Windows PowerShell
Copyright (C) 2016 Microsoft Corporation. All rights reserved.

## Century 6

PS C:\Users\century6\Documents> (Get-ChildItem -Directory ..\Desktop | Measure-Object).Count
416

~ ssh century7@century.underthewire.tech -p 6009
century7@century.underthewire.tech's password: 416
Windows PowerShell

## Century 7

PS C:\Users\century7> Get-Childitem –Path . -Include *readme* -File -Recurse -ErrorAction SilentlyContinue


    Directory: C:\Users\century7\Downloads


Mode                LastWriteTime         Length Name
----                -------------         ------ ----
-a----         6/8/2017   4:37 PM             21 README.txt

PS C:\Users\century7> cat .\Downloads\README.txt
human_versus_computer

PS C:\Users\century7> (Get-Childitem –Path . -Include *readme* -File -Recurse -ErrorAction SilentlyContinue) | cat
human_versus_computer

~ ssh century8@century.underthewire.tech -p 6009
century8@century.underthewire.tech's password: human_versus_computer
Windows PowerShell

## Century 8

PS C:\Users\century8\Documents> (cat ..\Desktop\Unique.txt | sort | Get-Unique).count
511

~ ssh century9@century.underthewire.tech -p 6009
century9@century.underthewire.tech's password: 511
Windows PowerShell
Copyright (C) 2016 Microsoft Corporation. All rights reserved.

## Century 9

PS C:\Users\century9\Documents> (cat ..\Desktop\words.txt).count
7916

PS C:\Users\century9\Documents> (Get-Content ..\Desktop\words.txt)[161]
shark

[14:52] ~ ssh century10@century.underthewire.tech -p 6009
century10@century.underthewire.tech's password: shark
Windows PowerShell

## Century 10

PS C:\Users\century10\Documents> ls ..\Desktop\


    Directory: C:\Users\century10\Desktop


Mode                LastWriteTime         Length Name
----                -------------         ------ ----
-a----         6/8/2017   4:57 PM              0 _4u


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
__GENUS                 : 2
__CLASS                 : Win32_Service
__SUPERCLASS            : Win32_BaseService
__DYNASTY               : CIM_ManagedSystemElement
__RELPATH               : Win32_Service.Name="wuauserv"
__PROPERTY_COUNT        : 25
__DERIVATION            : {Win32_BaseService, CIM_Service, CIM_LogicalElement, CIM_ManagedSystemElement}
__SERVER                : CENTURY
__NAMESPACE             : root\cimv2
__PATH                  : \\CENTURY\root\cimv2:Win32_Service.Name="wuauserv"
AcceptPause             : False
AcceptStop              : False
Caption                 : Windows Update
CheckPoint              : 0
CreationClassName       : Win32_Service
Description             : Enables the detection, download, and installation of updates for Windows and other programs. If this service is
                          disabled, users of this computer will not be able to use Windows Update or its automatic updating feature, and programs
                          will not be able to use the Windows Update Agent (WUA) API.
DisplayName             : Windows Update
InstallDate             :
ProcessId               : 0
ServiceSpecificExitCode : 0
Started                 : False
StartName               : LocalSystem
State                   : Stopped
SystemCreationClassName : Win32_ComputerSystem
SystemName              : CENTURY
TagId                   : 0
WaitHint                : 0
Scope                   : System.Management.ManagementScope
Path                    : \\CENTURY\root\cimv2:Win32_Service.Name="wuauserv"
Options                 : System.Management.ObjectGetOptions
ClassPath               : \\CENTURY\root\cimv2:Win32_Service
Properties              : {AcceptPause, AcceptStop, Caption, CheckPoint...}
SystemProperties        : {__GENUS, __CLASS, __SUPERCLASS, __DYNASTY...}
Qualifiers              : {dynamic, Locale, provider, UUID}
Site                    :
Container               :

~ ssh century11@century.underthewire.tech -p 6009
century11@century.underthewire.tech's password: windowsupdates_4u
Windows PowerShell
Copyright (C) 2016 Microsoft Corporation. All rights reserved.

## Century 11

PS C:\Users\century11> Get-Childitem –Path Contacts,Desktop,Documents,Downloads,Favorites,Music,Videos -File -Attributes !D+H -Exclude desktop.ini -
Recurse -ErrorAction SilentlyContinue


    Directory: C:\Users\century11\Desktop


Mode                LastWriteTime         Length Name
----                -------------         ------ ----
-a-h--         6/8/2017   4:59 PM              0 secret_sauce

!D is used to exclude directories and +H is used to include hidden files.


~ ssh century12@century.underthewire.tech -p 6009
century12@century.underthewire.tech's password: secret_sauce
Windows PowerShell
Copyright (C) 2016 Microsoft Corporation. All rights reserved.

## Century 12

PS C:\Users\century12> ls .\Desktop


    Directory: C:\Users\century12\Desktop


Mode                LastWriteTime         Length Name
----                -------------         ------ ----
-a----         6/8/2017   5:09 PM              0 _things

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
OperatingSystemHotfix      :
OperatingSystemServicePack :
OperatingSystemVersion     : 6.3 (9600)
OperationMasterRoles       : {SchemaMaster, DomainNamingMaster, PDCEmulator, RIDMaster...}
Partitions                 : {DC=ForestDnsZones,DC=UNDERTHEWIRE,DC=TECH, DC=DomainDnsZones,DC=UNDERTHEWIRE,DC=TECH,
                             CN=Schema,CN=Configuration,DC=UNDERTHEWIRE,DC=TECH, CN=Configuration,DC=UNDERTHEWIRE,DC=TECH...}
ServerObjectDN             : CN=CENTURY,CN=Servers,CN=Default-First-Site-Name,CN=Sites,CN=Configuration,DC=UNDERTHEWIRE,DC=TECH
ServerObjectGuid           : d620fa0f-e9cb-4f97-9004-b5b5cc75be02
Site                       : Default-First-Site-Name
SslPort                    : 636

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

ssh century13@century.underthewire.tech -p 6009
century13@century.underthewire.tech's password: i_authenticate_things
Windows PowerShell
Copyright (C) 2016 Microsoft Corporation. All rights reserved.

Under the Wire... PowerShell Training for The People!

## Century 13

PS C:\Users\century13> Get-Content .\Desktop\words.txt | Measure-Object –Word

Lines  Words Characters Property
-----  ----- ---------- --------
      475361


PS C:\Users\century13> exit
Connection to century.underthewire.tech closed.
[18:05] ~ ssh century14@century.underthewire.tech -p 6009
century14@century.underthewire.tech's password: 475361

## Century 14

PS C:\Users\century14> (Get-Content .\Desktop\stuff.txt | Select-String -Pattern "polo" -AllMatches).length
10

[18:10] ~ ssh century15@century.underthewire.tech -p 6009
century15@century.underthewire.tech's password: 10
Windows PowerShell
Copyright (C) 2016 Microsoft Corporation. All rights reserved.
