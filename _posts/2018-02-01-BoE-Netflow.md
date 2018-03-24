---
title: "[CTF] BoE 2 - \"Go with the (net)flow\""
layout: post
date: 2018-02-10
published: true
---

![Logo](/assets/images/vault2.png)

## Overview

Recently **Bank of England** published a series of challenges on the [CyberSecurityChallenge UK website](https://pod.cybersecuritychallenge.org.uk). The first two of them are more interesting and realistic. I'll post the description and short answers below. Please avoid looking at the solutions and first analyse the artefacts and find the clues yourself!

* **First challenge** -  [_"I smell a rat"_](http://craftware.xyz/2018/02/10/BoE-I-smell-a-rat.html)

## Scenario

_A third party claims to have observed communication from your network to a known Command and Control server. Use your traffic analysis skills to determine if a web server on your network has been compromised._

_You work in the security team for an Internet hosting company, offering colocation services for customers to install their own devices in your data centre._

_You receive notification that following an Interpol operation to takedown a C2 server based in Eastern Europe, an IP address within a range allocated to one such customer has been observed in the C2 server’s log files._

_The IP address in the logs (```104.40.215.237```) is allocated to a single customer’s server in the data centre. It is not under your direct control, and as such system logs are not available. However, PCAP data from network taps is available._

_The C2 server’s address was not disclosed, but the notification states that traffic is now being blackholed. The takedown occurred just before ```1300 GMT on February 13th 2018```._

Traffic capture: [csc_quali.zip](/assets/misc/csc_quali.zip)

## Analysis

### Question 1

What evidence exists to confirm C2 communication took place?

* There is no evidence of C2 communication.
* Multiple inbound connections from a common source.
* Multiple outbound sessions to a common destination.
* Foreign IP addresses accessing the server

#### Answer 

<div class="hint">
Multiple outbound sessions to a common destination 
</div>
<br>

### Question 2

How was the host initially compromised?

* Default passwords were not changed.
* A web root kit has been deployed.
* Remote Desktop Services were exploited.
* SSH service was bruteforced.

#### Answer 

<div class="hint">
SSH service was bruteforced 
</div>
<br>

### Question 3

Once the attackers gain access, what happens next?

* A well known web server exploit.
* Unexpected outbound HTTP GET request.
* DoS attack resulting in kernel panic.
* Use of sudo –i command to escalate privilege.

#### Answer 

<div class="hint">
Unexpected outbound HTTP GET request
</div>
<br>

### Question 4

What can you determine about the file downloaded to the web server?

* The filename is “svchostt.exe”.
* The file is obfuscated to evade anti-virus.
* The file is a 32-bit binary executable.
* The filename is “netcatt.sh”.

#### Answer 

<div class="hint">
The filename is “netcatt.sh”
</div>
<br>

### Question 5

To what extent is the host compromised?

* The host has vulnerable UDP interfaces.
* The host can be accessed from the internet.
* The host has been used to upload confidential data.
* The host can be controlled by the attacker.

#### Answer 

<div class="hint">
The host can be controlled by the attacker 
</div>
<br>

### Question 6

What is your recommended next step?

* Restore configuration from backup.
* Install a firewall at the network boundary.
* Run an anti-virus scan.
* Reset all administrator accounts.
* Isolate the device.

#### Answer 

<div class="hint">
Isolate the device 
</div>
<br>
