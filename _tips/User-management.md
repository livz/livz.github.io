---
title: User Management
layout: tip
date: 2017-09-02
---

## Overview

Unlike the UNIX approach that relies on ```/etc/passwd``` and ```/etc/shadow``` files, MacOS has its own directory service: ``` DirectoryService (8)``` (renamed to ```opendirectoryd(8)``` as of Lion). The two traditional files are still present, but deprecated. As its name suggests, the daemon is an implementation of the OpenLDAP project. 

The directory service maintains the users and groups and also holds many other system configuration settings. Let's play around with it. To interface with the daemon, OS X supplies a command line utility ```dscl (8)```.

## How to use

* List users:

```bash
$ dscl . list /Users
```

This is equivalent with:
```bash
dscl /Local/Default list /Users
```
* Get information about a specific user:

```bash
$ dscl . -read /Users/`whoami`
[..]
NFSHomeDirectory: /Users/m
Password: ********
Picture:
 /Library/User Pictures/Sports/Soccer.png
PrimaryGroupID: 20
RealName: M
RecordName: m
RecordType: dsRecTypeStandard:Users
UniqueID: 501
UserShell: /usr/local/bin/zsh
```
* Add a new user:

The following script (taken from [Mac OS X and iOS Internals: To the Apple's Core](http://www.wrox.com/WileyCDA/WroxTitle/Mac-OS-X-and-iOS-Internals-To-the-Apple-s-Core.productCd-1118057651.html)) can be used to create a new user and assign groups, password, home directory, etc.

```bash
#!/bin/bash

# Get username, ID and full name field as arguments from command line
USER=$1
ID=$2
FULLNAME=$3      

# Create the user node
dscl . -create /Users/$USER

# Set default shell to zsh
dscl . -create /Users/$USER UserShell /bin/zsh

# Set GECOS (full name for finger)
dscl . -create /Users/$USER RealName "$FULLNAME”
dscl . -create /Users/$USER UniqueID $ID

# Assign user to gid of localaccounts
dscl . -create /Users/$USER PrimaryGroupID 61

# Set home dir (∼$USER)
dscl . -create /Users/$USER NFSHomeDirectory /Users/$USER

# Make sure home directory is valid, and owned by the user
mkdir /Users/$USER
chown $USER /Users/$USER

# Optional: Set the password.
dscl . -passwd /Users/$USER "changeme”

# Optional: Add to admin group
dscl . -append /Groups/admin GroupMembership $USER
```
* Delete existing user:
```bash
$ dscl . -search /Users name <username>

$ sudo dscl . -delete "/Users/<username>"
```
