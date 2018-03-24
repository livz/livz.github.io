---
title: CTF] BoE 1 - "I smell a rat" 
layout: post
date: 2018-02-10
published: false
---

![Logo](/assets/images/vault1.png)

## Overview

Recently Bank of England published a series of challenges on the [CyberSecurityChallenge UK website](https://pod.cybersecuritychallenge.org.uk). The first two of them are more interesting and realistic. I'll post the description and short answers below. Please avoid looking at the solutions and first analyse the artefacts and find the clues!

## Scenario

_You are an employee for the PiCharts Global Analytics company Security Operations Centre (SOC). A fellow incident responder just received a phone call from a user working in the Web Design team to report the following: "Following a device restart to complete a tool installation on my device, I logged on with my usual credentials and I was briefly presented with a console window that closed immediately. The laptop is working alright, but I thought this was slightly weird. I am assuming this is you guys pushing an update, right?"._

_Your colleagues thought this was indeed weird and as such they compiled and left you a number of files containing logs from the host in the timeframe before and after the restart, to enable you to look into this further and determine whether the host is compromised or not. Below find a brief description of the log files available to you:_


* *__AutorunsDeep.csv__* - Contains the output from the Sysinternals Autorunsc.exe utility, which pulls information about many well-known Auto-Start Extension Points from Windows systems.
* *__SvcAll.csv__* - Contains information about all Windows services run at start-up and otherwise.
* *__ProcsWMI.csv__* - Contains details about running processes, including number of handles opened, md5 hashes etc.
* *__Tasklist.csv__* - Contains the output of tasklist.exe which displays a list of applications and services with their Process ID (PID) for all tasks running at the remote computer.
* *__Handle.csv__* - Contains the output from the Sysinternals Handle.exe utility, which pulls information about open handles for any process in the system. You can use it to see the programs that have a file open, or to see the object types and names of all the handles of a program.
* *__ProcmonPreRestart.csv__* - Contains the output of the advanced monitoring tool for Windows that shows real-time file system, registry and process/thread activity on the host pre-restart.
* *__ProcmonPostRestart.csv__* - Contains the output of the advanced monitoring tool for Windows that shows real-time file system, registry and process/thread activity on the host post-restart.


Artefacts from the infected machine: [artefacts.zip](/assets/misc/artefacts.zip)

## Analysis 

### Question 1

Since the user reported the weird activity happening at start up before they had time to do anything else, you decide to prioritise the logs that are most relevant to system start up first. In one of those, you notice something unusual. What is that? 


* Accessibility processes were spawned shortly after the usual start up processes.
* A service with a suspicious name was launched at start up.
* A registry key associated with start up was set to refer to an unusual file. 
* A WMI event consumer was created to match a given Windows Event.

#### Answer

We can find a very unusual startup item just by searching in the traditional preferred location "CurrentVersion\Run":

```bash
$ grep -r -i "currentversion\\\\run" * --color=auto
AutorunscDeep.csv
05/02/2018 16:47,HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\Run,(Default),enabled,Logon,PCWIN101337\developer,,,,c:\users\developer\appdata\local\21b5e0f\1aa2e00.bat,,"""C:\Users\developer\AppData\Local\21b5e0f\1aa2e00.bat""",1A28ACE2EC2D7832D62836CE30F9C13A,AB7609CB27956D0B23EAD90B8196335DAF0220C7,AB7609CB27956D0B23EAD90B8196335DAF0220C7,1B9FF2BE1BF969CFFF6BF04A905DF9496957E9B3B6927296785365F589D36943,1B9FF2BE1BF969CFFF6BF04A905DF9496957E9B3B6927296785365F589D36943,,1A28ACE2EC2D7832D62836CE30F9C13A,02/05/2018 16:47,5.179215826,73,PCWIN101337,32215833-8848-496c-bc78-53ee82512e99,TRUE
```

We have found our malicious script - **```c:\users\developer\appdata\local\21b5e0f\1aa2e00.bat```**.

### Question 2

What gave it away? Provide a brief explanation of how you arrived at your answer to Question 1

### Question 3

Moving on, you decide to continue your analysis by reviewing the handles.csv file. Within that file, you identify a process that acts in a very suspicious way. What is the name of that process?

### Question 4

What gave it away? Provide a brief explanation below on how you arrived to your answer to Question 3.

### Question 5

The process you have previously identified can be spotted attempting a number of network connections. Which ports does it attempt to connect to? Write those in numerical order from smaller to larger.

### Question 6

Which data source(s) did you use to come to your answer? Write the name of the file(s) below.

### Question 7

Trace back the initiation of the process you identified in Question 5 (make sure this is the same process). Which is the parent process? What is its process id? Give your answer in the following form: process.exe,process_id.

### Question 8

What gave it away? Provide a brief explanation of how you arrived to the answer you gave to Question 7.

### Question 9

The parent process you identified in Question 7 was also initiated in an unexpected way. A variable was abused to make that happen. Give the name of that variable below. 

### Question 10

Provide a brief explanation of how you arrived to the answer you gave to Question 9.

### Question 11

Based on all of the above which of the following best describes the state of the host?

* The host has most likely been infected by ransomware.
* The host is not infected. It was just receiving an update.
* The host has been infected by a piece of malware that attempts to live off the land.
* The host has most likely been compromised and is used for the mining of cryptocurrencies.
* The host has most likely been infected by a piece of malware exploiting a vulnerability in the Microsoft Windows Domain Name System DNSAPI.dll (see CVE-2017-11779)


## References
* [Untangling Kovter’s persistence methods](https://blog.malwarebytes.com/threat-analysis/2016/07/untangling-kovter/)
* [Fileless Malware – A Behavioural Analysis Of Kovter Persistence](http://blog.airbuscybersecurity.com/post/2016/03/FILELESS-MALWARE-%E2%80%93-A-BEHAVIOURAL-ANALYSIS-OF-KOVTER-PERSISTENCE)
