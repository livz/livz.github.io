---
title: Check Audit Logs
layout: tip
date: 2017-10-07
---

## Overview

* MacOS implements the Basic Security Module (BSM) auditing subsystem, originally introduced in Solaris.
* This subsystem is useful for tracking user sessions, authentications and process actions.

## Work with audit logs

#### Check/modify settings
The configuration for the of ```auditd (8)``` is stored in ```/etc/security/audit_control``` file:

```bash
$ cat /etc/security/audit_control
#
# $P4: //depot/projects/trustedbsd/openbsm/etc/audit_control#8 $
#
dir:/var/audit
flags:lo,aa
minfree:5
naflags:lo,aa
policy:cnt,argv
filesz:2M
expire-after:10M
superuser-set-sflags-mask:has_authenticated,has_console_access
superuser-clear-sflags-mask:has_authenticated,has_console_access
member-set-sflags-mask:
member-clear-sflags-mask:has_authenticated
```

#### Logs storage

The ```dir``` field above specifies the folder where logs will be created. The naming convention for the log files is ```start_time.stop_time``` with the timestamps accurate to the second. The latest log has ```stop_time``` value of ```not_terminated```:

```bash
$ ls -al /var/audit
total 1008
drwx------  24 root  wheel    816 15 Mar 23:49 .
drwxr-xr-x  25 root  wheel    850 22 Sep 10:28 ..
[..]
-r--r-----   1 root  wheel   9738 15 Mar 23:45 20180315215409.crash_recovery
-r--r-----   1 root  wheel  44944 19 Mar 22:00 20180315234914.not_terminated
lrwxr-xr-x   1 root  wheel     40 15 Mar 23:49 current -> /var/audit/20180315234914.not_terminated
```

#### Parsing

Since the audit logs are stored in a binary format, we need a tool to parse them. ```praudit (1)``` with the ```-x``` for XML output is very handy. Below we see that a session termination was recorded, followed by user authentication:

```bash
$ sudo praudit -x /var/audit/current
[..]
<record version="11" event="session end" modifier="0" time="Sun Mar 18 22:56:54 2018" msec=" + 523 msec" >
  <argument arg-num="1" value="0x0" desc="sflags" />
  <argument arg-num="2" value="0x0" desc="am_success" />
  <argument arg-num="3" value="0x0" desc="am_failure" />
  <subject audit-uid="-1" uid="root" gid="wheel" ruid="root" rgid="wheel" pid="0" sid="100100" tid="0 0.0.0.0" />
  <return errval="success" retval="0" />
</record>

<record version="11" event="user authentication" modifier="0" time="Sun Mar 18 22:56:54 2018" msec=" + 682 msec" >
  <subject audit-uid="m" uid="m" gid="staff" ruid="m" rgid="staff" pid="1148" sid="100007" tid="1149 0.0.0.0" />
  <text>Verify password for record type Users "m" node "/Local/Default"</text>
  <return errval="failure: Unknown error: 255" retval="5000" />
</record>
[..]
```

Since logs are cycled frequently, the special character device ```/dev/auditpipe``` allowa user-mode programs to access the audit records in real time. This is very useful if we need to pipe the events to a shell script for example:

```bash
$ sudo  praudit /dev/auditpipe | ./pareEvent.sh
```

## References

[OpenBSM auditing on Mac OS X](https://derflounder.wordpress.com/2012/01/30/openbsm-auditing-on-mac-os-x/)
