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
* [Level 4 - Oracle]()

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

## Trebek 3

<blockquote>
  <p>The password for trebek4 is the IP that the user Yoda last logged in from as depicted in the event logs on the desktop PLUS the name of the text file on the user's desktop.</p>
</blockquote>

## Trebek 4

<blockquote>
  <p>The password for trebek5 is the last execution date of Microsoft Access.</p>
</blockquote>

## Trebek 5

<blockquote>
  <p>The password for trebek6 is the suspicious program set to run at startup PLUS the name of the file on the desktop.</p>
</blockquote>

## Trebek 6

<blockquote>
  <p>The password for trebek7 is the total number of DLLs within the "C:\program files (x86)\adobe\" folder and it's subfolders.</p>
</blockquote>

## Trebek 7

<blockquote>
  <p>The password for trebek8 is the name of the program set to run prior to login if sticky keys is activated PLUS the name of the file on the desktop.</p>
</blockquote>

## Trebek 8

<blockquote>
  <p>The password for trebek9 the first 8 bytes of the file located on the desktop. Combine the answer together with NO spaces.</p>
</blockquote>

## Trebek 9

<blockquote>
  <p>The password for trebek10 is the name of the potentially rogue share on the system PLUS the name of the file on the desktop. If the share name is "share$" and the file on the desktop is named "_today", the password would be "share$_today".</p>
</blockquote>

## Trebek 10

<blockquote>
  <p>The password for trebek11 is the last name of the user who enabled Oni-Wan Kenobi's account as depicted in the event logs on the desktop PLUS the name of the file on the desktop.</p>
</blockquote>

## Trebek 11

<blockquote>
  <p>The password for trebek12 is the username of the user who was created on 11 May 17 at 6:26 PM, as depicted in the event logs on the desktop PLUS the name of the file on the desktop.</p>
</blockquote>

## Trebek 12

<blockquote>
  <p>The password for trebek13 is the username of the user who created the user Lor San Tekka as depicted in the event logs on the desktop PLUS the name of the file on the desktop.</p>
</blockquote>

## Trebek 13

<blockquote>
  <p>The password for trebek14 is the last name of the user who has an encoded powershell command in their City property PLUS the name of the file on the desktop.</p>
</blockquote>

## Trebek 14

<blockquote>
  <p>The password for trebek15 is the output from decoding the powershell found in the account properties of the user account from the previous level PLUS the name of the file on the desktop.</p>
</blockquote>
