---
title: Monitor Filesystem Changes
layout: tip
date: 2017-08-19
---

## Overview

Let's say we want to know what files get modified when we perform a particular operation, like changing the screen saver, or customising the desktop background. Or, for the security-minded, we want to check what files/folders are created when we run an unknown application. 

[fswatch](https://emcrisostomo.github.io/fswatch/) is a small program that uses the Mac OS X FSEvents API to monitor a directory. When an event about any change to that directory is received, it will print the name of the affected file. We can easily pipe that to a shell command, or execute a script for every notification.

## Installation
```bash
$ brew update
$ brew install fswatch
```

## Usage

```bash
$ fswatch -h
fswatch 1.11.2

Usage:
fswatch [OPTION] ... path ...

Options:
 -0, --print0          Use the ASCII NUL character (0) as line separator.
 -1, --one-event       Exit fswatch after the first set of events is received.
     --allow-overflow  Allow a monitor to overflow and report it as a change event.
     --batch-marker    Print a marker at the end of every batch.
 -a, --access          Watch file accesses.
 -d, --directories     Watch directories only.
 -e, --exclude=REGEX   Exclude paths matching REGEX.
 -E, --extended        Use extended regular expressions.
     --filter-from=FILE
                       Load filters from file.
     --format=FORMAT   Use the specified record format.
 -f, --format-time     Print the event time using the specified format.
     --fire-idle-event Fire idle events.
 -h, --help            Show this message.
 -i, --include=REGEX   Include paths matching REGEX.
 -I, --insensitive     Use case insensitive regular expressions.
 -l, --latency=DOUBLE  Set the latency.
 -L, --follow-links    Follow symbolic links.
 -M, --list-monitors   List the available monitors.
 -m, --monitor=NAME    Use the specified monitor.
     --monitor-property name=value
                       Define the specified property.
 -n, --numeric         Print a numeric event mask.
 -o, --one-per-batch   Print a single message with the number of change events.
 -r, --recursive       Recurse subdirectories.
 -t, --timestamp       Print the event timestamp.
 -u, --utc-time        Print the event time as UTC time.
 -x, --event-flags     Print the event flags.
     --event=TYPE      Filter the event by the specified type.
     --event-flag-separator=STRING
                       Print event flags using the specified separator.
 -v, --verbose         Print verbose output.
     --version         Print the version of fswatch and exit.

Available monitors in this platform:

  fsevents_monitor
  kqueue_monitor
  poll_monitor
```

Back to our initial scenario, let's check what happens when we change the desktop background. Start monitoring before changing  the wallpaper:

```bash
$ sudo fswatch /
Password:
/Users/[..]/Library/Saved Application State/com.googlecode.iterm2.savedState/windows.plist
/Users/[..]/Library/Saved Application State/com.googlecode.iterm2.savedState/window_2.data
/Users/[..]/Library/Application Support/Dock/desktoppicture.db-journal
[..]
$ file ~/Library/Application\ Support/Dock/desktoppicture.db
/Users/[..]/Library/Application Support/Dock/desktoppicture.db: SQLite 3.x database, last written using SQLite version 3016000
```
So the *__~/Library/Application\ Support/Dock/desktoppicture.db__* contains the desktop background settings and it's a SQLite database. If you're curious you can open it using [SQLiteBrowser](http://sqlitebrowser.org/)

## References
[How to Use fswatch](https://github.com/emcrisostomo/fswatch/wiki/How-to-Use-fswatch)
