---
title:  "[CTF] Under the Wire 5 - Trebek"
categories: [CTF, UnderTheWire]
---

![Logo](/assets/images/hammer4.png)

[UnderTheWire](http://underthewire.tech/index.htm) is an awesome website that hosts a number of PowerShell-based wargames meant to help Infosecurity people, either get started with or improve their PowerShell skills. I believe challenges and wargames like this one are a great way to learn *by doing* as they often cover rare and less known situations and involve problem solving. Other very interesting wargames I've written about are [OverTheWire](http://craftware.xyz/blog/categories/#OverTheWire), [Nebula](http://craftware.xyz/ctf/2012/07/21/Nebula-wargame-walkthrough.html), [Binar Master](http://craftware.xyz/blog/categories/#Binary-Master). 

The UnderTheWire wargames could be described as designed for Windows security professionals, Blue Team members or security tools designers. Currently there are 5 sets of levels of increasing difficulty. 

In this post I'll go through my solutions to the last batch of 15 levels - [Trebek](http://underthewire.tech/trebek/trebek.htm). This level is definitely more interesting and covers topics like working with Windows scheduled tasks, event logs parsing (*a lot of!*) and more auto-run tricks.

For the solutions to the other games check:
* [Level 1 - Century]({{ site.baseurl }}{% post_url 2018-05-10-UnderTheWire-Century %})
* [Level 2 - Cyborg]({{ site.baseurl }}{% post_url 2018-05-12-UnderTheWire-Cyborg %})
* [Level 3 - Groot]({{ site.baseurl }}{% post_url 2018-05-14-UnderTheWire-Groot %})
* [Level 4 - Oracle]({{ site.baseurl }}{% post_url 2018-05-16-UnderTheWire-Oracle %})

Before starting, I wanted to say a huge thank you to the creators of these games for the effort of designing and hosting them, and making them available for free for everyone!

## Trebek 1

<blockquote>
  <p>The password for trebek2 is the name of the script referenced in a deleted task as depicted in the event logs on the desktop PLUS the name of the text file on the user's desktop.</p>
</blockquote>

Connect to the first level by SSHing to *trebek.underthewire.tech*, on port *6001*. The credentials for the first level are ```trebek1/trebek1```.

First the file on the Desktop:

```posh
PS C:\Users\trebek1.UNDERTHEWIRE\Documents> ls ..\Desktop

    Directory: C:\Users\trebek1.UNDERTHEWIRE\Desktop

Mode                LastWriteTime         Length Name
----                -------------         ------ ----
-a----        5/13/2017   6:46 PM              0 994
```

Next we'll list all the events for deleted tasks and grep through the output for the commands being executed:

```posh
PS C:\Users\trebek1.UNDERTHEWIRE\Desktop> Get-WinEvent -Path ..\Desktop\Security.evtx | Where {$_.Message -Like "*task was deleted*"} | Format-List -Property Message | Out-String -Stream | Select-String -Pattern "Command" -Context 1,2
      <Exec>
        <Command>C:\Program Files\Bitvise SSH Server\BssCtrl.exe</Command>
        <Arguments>-startMinimized</Arguments>
      </Exec>
[..]
      <Exec>
        <Command>C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe</Command>
        <Arguments>-NonInteractive -NoLogo -NoProfile -File 'c:\users\trebek1\mess_cleaner.ps1'</Arguments>
      </Exec>
```

<div class="box-note">
Note that <a href="https://docs.microsoft.com/en-us/powershell/module/microsoft.powershell.utility/out-string?view=powershell-6" target="_blank">Out-String -Stream</a> is very important here. This is needed to be able to use <b>Select-String</b> and grep through the output!
</div>

So the password for level 2 is: ```mess_cleaner994```.

## Trebek 2

<blockquote>
  <p>The password for trebek3 is the name of the executable associated with the C-3PO service PLUS the name of the file on the user's desktop.</p>
</blockquote>

First the file on the Desktop:

```posh
PS C:\Users\trebek2\Documents> ls ..\Desktop

    Directory: C:\Users\trebek2\Desktop

Mode                LastWriteTime         Length Name
----                -------------         ------ ----
-a----        5/13/2017   6:50 PM              0 823
```

If we list the *C-3PO* service, there is no entry for its executable. The *PathName* field is empty:

```posh
PS C:\Users\trebek2\Documents>  Get-WmiObject -Class Win32_Service -Filter "Name='C-3PO'"  | Select-Object *

PSComputerName          : TREBEK
Name                    : C-3PO
Status                  : UNKNOWN
ExitCode                : 0
DesktopInteract         :
ErrorControl            : Unknown
PathName                :
[..]
```

We can, however, retrieve more information about services from the Windows registry:

```posh
PS C:\Users\trebek2> cd HKLM:\System\CurrentControlSet\Services\C-3PO
PS HKLM:\System\CurrentControlSet\Services\C-3PO> Get-ItemProperty -Path .

Type         : 16
Start        : 2
ErrorControl : 1
ImagePath    : C:\windows\system32\droid.exe
ObjectName   : LocalSystem
[..]
```

So the password for level 3 is: ```droid823```.

## Trebek 3

<blockquote>
  <p>The password for trebek4 is the IP that the user Yoda last logged in from as depicted in the event logs on the desktop PLUS the name of the text file on the user's desktop.</p>
</blockquote>

The file on the Desktop:

```posh
PS C:\Users\trebek3\Documents> ls ..\Desktop

    Directory: C:\Users\trebek3\Desktop

Mode                LastWriteTime         Length Name
----                -------------         ------ ----
d-----        5/14/2017   2:48 AM                Logs
-a----        5/13/2017   6:50 PM              0 address
```

To solve this we need to filter for [**user successfully logged on events**](https://www.manageengine.com/products/active-directory-audit/kb/windows-security-log-event-id-4624.html) (ID 4624). To get all the IP addresses that the user *yoda* logged in from:

```posh
PS C:\Users\trebek3\Documents> Get-WinEvent -Path ..\Desktop\Logs\Security.evtx | where {$_.Id -Eq 4624} | Format-List -Property Message | Out-String -Stream | Select-String "yoda" -Context 2,15 | Out-String -Stream | select-string "network address"

        Source Network Address: 10.30.1.18
        Source Network Address: 10.30.1.18
        [..]
```

So the password for the next level is: ```10.30.1.18address```.

## Trebek 4

<blockquote>
  <p>The password for trebek5 is the last execution date of Microsoft Access.</p>
</blockquote>

Some of the places that record program execution within the Windows Registry, as described in the [article](https://www.fireeye.com/blog/threat-research/2013/08/execute.html) suggested by the hint, are:
* ShimCache
* MUICache
* UserAssist

After thorough checks, there was no mention of *MSAccess* in the accessible registry places. However, another valuable resource for tracking executed applications are the [prefetch](({{ site.baseurl }}{% post_url 2017-06-29-exploring-prefetch-part-1 %})) [files]({{ site.baseurl }}{% post_url 2017-08-09-exploring-prefetch-part-2 %}):

```posh
PS C:\Windows\Prefetch> Get-ChildItem | Out-String -Stream | Select-String -Pattern "access"

-ar---         1/5/2017   9:12 PM          65058 MSACCESS.EXE-EF45328A.pf
```

The last execution date is reflected in the modified date of the prefetch file. And we have the password for level 5: ```01/05/2017```.

## Trebek 5

<blockquote>
  <p>The password for trebek6 is the suspicious program set to run at startup PLUS the name of the file on the desktop.</p>
</blockquote>

First the file on the Desktop:

```posh
PS C:\Users\trebek5\Documents> ls ..\Desktop

    Directory: C:\Users\trebek5\Desktop

Mode                LastWriteTime         Length Name
----                -------------         ------ ----
-a----        5/14/2017   2:50 AM              0 4444
```


[Win32_StartupCommand WMI class](https://msdn.microsoft.com/en-us/library/aa394464(v=vs.85).aspx) provides immensely helpful information about startup items:

```posh
PS C:\Users\trebek5\Documents> Get-WmiObject Win32_StartupCommand | Select-Object Name, command, Location, User  | Format-List

Name     : R2-D2_backdoor.exe
command  :
Location : HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Run
User     : Public
```

And we quickly have the suspicious program and the password for level 6 is: ```r2-d2_backdoor4444```.

## Trebek 6

<blockquote>
  <p>The password for trebek7 is the total number of DLLs within the "C:\program files (x86)\adobe\" folder and it's subfolders.</p>
</blockquote>

And a quick one:

```posh
PS C:\Program Files (x86)\Adobe> Get-ChildItem -Recurse | Out-String -Stream | Select-String ".dll" | Measure-Object -Line

Lines Words Characters Property
----- ----- ---------- --------
   40
```

The password for level 7: ```40```.

## Trebek 7

<blockquote>
  <p>The password for trebek8 is the name of the program set to run prior to login if sticky keys is activated PLUS the name of the file on the desktop.</p>
</blockquote>

First the file on the Desktop:

```posh
PS C:\Users\trebek7\Documents> ls ..\Desktop

    Directory: C:\Users\trebek7\Desktop

Mode                LastWriteTime         Length Name
----                -------------         ------ ----
-a----        5/14/2017   2:54 AM              0 99
```

For an introduction to Image File Execution Options and how it is used by analysts and malware authors, check <a href="https://blog.malwarebytes.com/101/2015/12/an-introduction-to-image-file-execution-options" target="_blank">this article</a>.

```
PS > cd 'HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Image File Execution Options\sethc.exe'
PS > Get-ItemProperty -Path .

Debugger     : han_solo.exe
PSPath       : Microsoft.PowerShell.Core\Registry::HKEY_LOCAL_MACHINE\SOFTWARE\
               Microsoft\Windows NT\CurrentVersion\Image File Execution
               Options\sethc.exe
PSParentPath : Microsoft.PowerShell.Core\Registry::HKEY_LOCAL_MACHINE\SOFTWARE\
               Microsoft\Windows NT\CurrentVersion\Image File Execution Options
PSChildName  : sethc.exe
PSDrive      : HKLM
PSProvider   : Microsoft.PowerShell.Core\Registry
```

The password for level 8 is: ```han_solo99```.

## Trebek 8

<blockquote>
  <p>The password for trebek9 the first 8 bytes of the file located on the desktop. Combine the answer together with NO spaces.</p>
</blockquote>

Another short one. We can get the value of the first 8 bytes with the **Get-Content** cmdlet:

```posh
PS C:\Users\trebek8\Documents> (Get-Content -Path ..\Desktop\Clone_Trooper_data.pdf -Encoding Byte)[0..7] -join
" "
77 90 144 0 3 0 0 0
```

For the password for level 9 we combine the integer values: ```779014403000```.

## Trebek 9

<blockquote>
  <p>The password for trebek10 is the name of the potentially rogue share on the system PLUS the name of the file on the desktop. If the share name is "share$" and the file on the desktop is named "_today", the password would be "share$_today".</p>
</blockquote>

First, the file on the Desktop:

```posh
PS C:\Users\trebek9\Documents> ls ..\Desktop

    Directory: C:\Users\trebek9\Desktop

Mode                LastWriteTime         Length Name
----                -------------         ------ ----
-a----        5/11/2017  11:46 PM              0 _hideout
```

And then the suspicious SMB share:

```posh
PS C:\Users\trebek9\Documents> Get-SmbShare

Name           ScopeName Path Description
----           --------- ---- -----------
ADMIN$         *              Remote Admin
C$             *              Default share
IPC$           *              Remote IPC
NETLOGON       *              Logon server share
shoretroopers$ *              It's a SECRET!!!!!
SYSVOL         *              Logon server share
```

The next password is: ```shoretroopers$_hideout```.

## Trebek 10

<blockquote>
  <p>The password for trebek11 is the last name of the user who enabled Oni-Wan Kenobi's account as depicted in the event logs on the desktop PLUS the name of the file on the desktop.</p>
</blockquote>

First, the file on the Desktop:

```posh
PS C:\Users\trebek10\Documents> ls ..\Desktop

    Directory: C:\Users\trebek10\Desktop

Mode                LastWriteTime         Length Name
----                -------------         ------ ----
d-----        5/11/2017   9:05 PM                Logs
-a----        5/14/2017   3:00 AM              0 2121
```

Then more Active Directory filtering. This time we're looking for the <a href="https://www.ultimatewindowssecurity.com/securitylog/encyclopedia/event.aspx?eventID=4722" target="_blank">Windows Security Log Event ID 4722: A user account was enabled</a> event.

```posh
PS C:\Users\trebek10\Documents> Get-WinEvent -Path ..\Desktop\Logs\Security.evtx | where {$_.Id -Eq 4722} | Format-List -Property Message | Out-String -Stream | Select-String "kenobi" -Context 8,1

Subject:
    Security ID:            S-1-5-21-3968311752-1263969649-2303472966-1153
    Account Name:           admiral.ackbar
    Account Domain:         UNDERTHEWIRE
    Logon ID:               0x12CEFCA

Target Account:
    Security ID:            S-1-5-21-3968311752-1263969649-2303472966-1154
    Account Name:           obi-wan.kenobi
    Account Domain:         UNDERTHEWIRE
```

Then obtain the last name from the username:

```
PS C:\Users\trebek10\Documents> Get-ADUser -Filter 'Name -like "*ackbar*"'

    DistinguishedName : CN=Ackbar\, Admiral,OU=X-Wing,OU=trebek,DC=underthewire,DC=tech
    Enabled           : False
    GivenName         : admiral
    Name              : Ackbar, Admiral
    ObjectClass       : user
    ObjectGUID        : 8bf9d142-3c12-468a-bded-f77dc6a4e38c
    SamAccountName    : admiral.ackbar
    SID               : S-1-5-21-3968311752-1263969649-2303472966-1153
    Surname           : Ackbar
    UserPrincipalName : admiral.ackbar@underthewire.tech
```

The password for level 11 is: ```ackbar2121```.

## Trebek 11

<blockquote>
  <p>The password for trebek12 is the username of the user who was created on 11 May 17 at 6:26 PM, as depicted in the event logs on the desktop PLUS the name of the file on the desktop.</p>
</blockquote>

The file on the Desktop:

```posh
PS C:\Users\trebek11\Documents> ls ..\Desktop

    Directory: C:\Users\trebek11\Desktop

Mode                LastWriteTime         Length Name
----                -------------         ------ ----
d-----        5/14/2017   4:12 AM                Logs
-a----        5/14/2017   3:02 AM              0 100
```

Similar with the previous level, but this time we need to search for <a href="https://www.ultimatewindowssecurity.com/securitylog/encyclopedia/event.aspx?eventid=4720" target="_blank">Windows Security Log Event ID 4720: A user account was created</a> events.

This time we have to apply a filter on the *TimeCreated* field, which is of type **_DateTime_**:

```posh
PS > Get-WinEvent -Path ..\Desktop\Logs\Security.evtx | where {$_.Id -Eq 4720} | ForEach-Object {echo $_.TimeCreated.GetType()}

IsPublic IsSerial Name                                     BaseType
-------- -------- ----                                     --------
True     True     DateTime                                 System.ValueType
[..]
```

To get all the *'user created'* events on 11 May 17 at 6:26 PM:

```posh
PS > $startDate = Get-Date -Year 2017 -Month 5 -Day 11 -Hour 18 -Minute 26 -Second 0
PS > Get-WinEvent -Path ..\Desktop\Logs\Security.evtx | where {$_.Id -Eq 4720 -AND $_.TimeCreated -ge $startDate -AND $_.TimeCreated -lt $startDate.AddMinutes(1)}

   ProviderName: Microsoft-Windows-Security-Auditing

TimeCreated                     Id LevelDisplayName Message
-----------                     -- ---------------- -------
5/11/2017 6:26:08 PM          4720 Information      A user account was created....
```

Next, let's see the full message corresponding to the event:

```posh
PS C:\Users\trebek11\Documents> Get-WinEvent -Path ..\Desktop\Logs\Security.evtx | where {$_.Id -Eq 4720 -AND $_.TimeCreated -ge $startDate -AND $_.TimeCreated -lt $startDate.AddMinutes(1)} | Format-List -Property Message

Message : A user account was created.

  Subject:
        Security ID:            S-1-5-21-3968311752-1263969649-2303472966-1150
        Account Name:           poe.dameron
        Account Domain:         UNDERTHEWIRE
        Logon ID:               0x1235812

  New Account:
        Security ID:            S-1-5-21-3968311752-1263969649-2303472966-1152
        Account Name:           general.hux
        Account Domain:         UNDERTHEWIRE

  Attributes:
        SAM Account Name:       general.hux
        Display Name:           Hux, General
        User Principal Name:    general.hux@underthewire.tech
        Home Directory:         -
        Home Drive:             -
        Script Path:            -
        Profile Path:           -
        User Workstations:      -
        Password Last Set:      <never>
[..]
```

So the password for level 12: ```general.hux100```.

## Trebek 12

<blockquote>
  <p>The password for trebek13 is the username of the user who created the user Lor San Tekka as depicted in the event logs on the desktop PLUS the name of the file on the desktop.</p>
</blockquote>

The straighforward bit first, the file on the Desktop:

```posh
PS C:\Users\trebek12\Documents> ls ..\Desktop

    Directory: C:\Users\trebek12\Desktop

Mode                LastWriteTime         Length Name
----                -------------         ------ ----
d-----        5/14/2017   4:12 AM                Logs
-a----        5/14/2017   3:04 AM              0 53
```

Similarly with the previous level, we need to filter for *4720* events:

```posh
PS C:\Users\trebek12\Documents> Get-WinEvent -Path ..\Desktop\Logs\Security.evtx | where {$_.Id -Eq 4720} | Format-List -Property Message | Out-String -Stream | Select-String "tekka" -Context 8,1

            Subject:
                Security ID:            S-1-5-21-3968311752-1263969649-2303472966-1150
                Account Name:           poe.dameron
                Account Domain:         UNDERTHEWIRE
                Logon ID:               0x1235812

            New Account:
                Security ID:            S-1-5-21-3968311752-1263969649-2303472966-1151
                Account Name:           lor.tekka
                Account Domain:         UNDERTHEWIRE
```

The next password is: ```poe.dameron53```.

## Trebek 13

<blockquote>
  <p>The password for trebek14 is the last name of the user who has an encoded powershell command in their City property PLUS the name of the file on the desktop.</p>
</blockquote>

The file on the Desktop:

```posh
PS C:\Users\trebek13\Documents> ls ..\Desktop

    Directory: C:\Users\trebek13\Desktop

Mode                LastWriteTime         Length Name
----                -------------         ------ ----
-a----        5/14/2017   3:04 AM              0 3003
```

The <a href="http://www.computerperformance.co.uk/Logon/LDAP_attributes_active_directory.htm" target="_blank">LDAP city attribute</a> is represented in the field named **l (lowercase 'L')**. There's only one user with this attribute set:

```posh
PS C:\Users\trebek13\Documents> Get-ADUser -Filter 'l -like "*"'

DistinguishedName : CN=Prindel\, Bollie,OU=X-Wing,OU=trebek,DC=underthewire,DC=tech
Enabled           : False
GivenName         : Bollie
Name              : Prindel, Bollie
ObjectClass       : user
ObjectGUID        : 9085d24b-4dbc-47cc-855c-6fef0d06aae3
SamAccountName    : bollie.prindel
SID               : S-1-5-21-3968311752-1263969649-2303472966-2154
Surname           : Prindel
UserPrincipalName : bollie.prindel@underthewire.tech
```

So the password for the last level is: ```prindel3003```.

## Trebek 14

<blockquote>
  <p>The password for trebek15 is the output from decoding the powershell found in the account properties of the user account from the previous level PLUS the name of the file on the desktop.</p>
</blockquote>

First, the file on the Desktop:

```posh
PS C:\Users\trebek14\Documents> ls ..\Desktop

    Directory: C:\Users\trebek14\Desktop

Mode                LastWriteTime         Length Name
----                -------------         ------ ----
-a----        5/14/2017   3:05 AM              0 _today
```

Next, the value of the City attribute:

```posh
PS > Get-ADUser -Filter 'l -like "*"' -Properties l

DistinguishedName : CN=Prindel\, Bollie,OU=X-Wing,OU=trebek,DC=underthewire,DC=tech
Enabled           : False
GivenName         : Bollie
l                 : agBvAGkAbgBfAHQAaABlAF8AcgBlAGIAZQBsAHMA
Name              : Prindel, Bollie
[..]

PS > [System.Text.Encoding]::Unicode.GetString([System.Convert]::FromBase64String("agBvAGkAbgBfAHQAaABlAF8AcgBlAGIAZQBsAHMA"))
join_the_rebels
```

And the final password is: ```join_the_rebels_today```.

## Trebek 15

A message from the authors is hidden on the Desktop folder for the last level:

```posh
PS C:\Users\trebek15\Documents> cat ..\Desktop\15.txt
@"

           Garfield says PowerShell is awesome!

                   #####
                  #######      #**#!!###
                 #**#!!!!##   #****#!!!!#
                #****###!!!#  #*****#!!!!#
                #*******#!!!# #******#!!!!#
                #*********#!###!*!*!*#!!!!!#        --
                #!*!*!*!*!*!#!##########!!!!#      /_
                ###########!##!!!!!!!!!!#!!!#     //__
             ###!!!!!!!!!!!#!!!!!!!!!!!!!#!!!####///  \
   \       ##!#!!!!!!!!!!!#!!!!!!!!!!!!!!!#!!!!!!!#
   _\    ##!!#!!!!!!!!!!!#!!!!!!!!!!!######!!!!!!!*#
    \\  ##!!#!!!!!!!!!!!!#!!!!#######     #!!!!!!***#
  ___\\#!!!###################*****       #...!!*****#
 /   \#!!!.#       ***** #     ***        #....*******#
     #*....#        ***   #              #.......*****#
    #**.....##          *****          ##........!!****#
    #!........##       *******#########......#...!!!!!*#
   #!...........#######.*****...............#.#..!!!!**#
  #*.....##.............#..#...............#...#.!!****#
  #*....#.#............#....#............##......!*****#
  #*.......##.......###......###........#.......!!!****#
  #*.........#######......!!....########.......!!!!!***#
   #!!!.................!!!!!!!!.............!!!*******#
    #!!!!............!!!!!!!!!!!!!!!!!!!!!!!!!!!******#
     #*******!!!!!!!!!!!!!!!!!!!!!!!!!!!!***!!!!*****#
      #******!!!!!!!!!!!!!!!!!!!!!!!!!********!!****#
       ##*****!!!!!!!!!!!!!!!!!!!!!#*************###
         ##****!!!!!!!!!!!!!!!!!!!!!###******####
           ####!!!!!!!!!!!!!!!!!!!!!!!!######!#
               #!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!*#
               #!!!!!!!!!!!!!!!!!!!!!!!!!!!!!***##
              #!!!!!!!!!!!!!!!!!!!!!!!!!!!!!******#
             #!!!!!!!!!!!!!!!!!!!!!!!!!!!!!*******#
            #!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!*****#
           #!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!**#
          #!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!##
         #!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!*##
        #!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!***#
        #!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!####!!!!!!****##
       #!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!###****##!!!!******##
       #!!!!!!!!!!!!!!!!!!!!!!!!!!!!!##**!!*****#!!!********#
       #!!!!!!!!#!!!!!!!!!!!#!!!!!!!#***!!!!***!!!!**********#
      #!!!!!!!!!!#!!!!!!!!!#!!!!!!!#****!!!!!*!!!!!!!!!!*****#
      #!!!!!!!!!!!#!!!!!!!#!!!!!!!#*!!***!!!!!!!!!!!!!!!!!***#
      #!!!!!!!!!!!!#!!!!!!#!!!!!!#*!!!!!*!!!!!!!!!!!!!!!*****#
      #!!!!!!!!!!!!#!!!!!!#!!!!!#***!!!!!!!!!!!!!!!!!********#
     #!!!!!!!!!!!!!#!!!!!!#!!!!!#****!!!!!!!!!!!!!!**********#
     #!!!!!!!!!!!!!#!!!!!!#!!!!!#*****!!!!!!!!!!!!!!*********#
     #!!!!!!!!!!!!!#!!!!!!#!!!!!#***!!!!!!!!!!!!!!!!!********##
    ##!!!!!!!!!!!!!#!!!!!!#!!!!!#*!!!!!!!!!!!!!!!!!!!!!*****#!*##
   #!#!!!!!!!!######!!!!!!#!!!!!#**!!!!!!!!!!#########!!!!*#!!**##
  #!#!#!!!!!!#!!!!!!!!!!!!#!!!!!#***!!!!!####******!!!#######!!**#
 #!#!!##!!!!#!!!!!!!!!!!############*!!!#********!!!!!!!!!!!!!!!**#
 #!#!!#!#!!#!!!#!!!!!!!#!!!!!!!!!!!!!!!#***********!!!!!!!!!!!!!!!#
 #!#!!!#!#!#!!#!!!!!!!#!!!!#!!!!#!!!!!#**********!!!!!!!!!!!!!!!**#
 #!!#!!!#!##!!#!!!!!!#!!!!#!!!!#!!!!!!#************!!!!!!!!!!****#
  ######### ##########!!!!#!!!!#!!!!!!#**********!!!!!!!!!!!!***#
                      #################************!!!!!!!!!!**#
                                      #**********!!!!!#########
                                       ###############
"@
```

All the levels were very educative! Huge thanks to the authors.
