---
title: Check Audit Logs
layout: tip
date: 2017-10-07
---

## Overview

$ sudo praudit /var/audit/current | less

Because logs are cycled so frequently, a special character device, /dev/auditpipe , exists to allow user-mode programs to access the audit records in real time: praudit /dev/auditpipe.
Logs in /var/audit
