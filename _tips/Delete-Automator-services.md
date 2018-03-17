---
title: Delete Automator Services
layout: tip
date: 2017-01-22
---

## Overview

Automator is a default application pre-installed on MacOS. if you've never used it, you could search online for ideas of things to automate. 

When you create services using Automator, there is no option to choose the location of the service and also its location is not specified. So this tip is about how to delete or temporary disable a service created using Automator.


When adding a custom service via Automator, OS X doesn’t clue the user in as to the location of said service. In fact, the save dialogue is about as ambiguous as it gets.

## Delete a service

To access the Services folder, open the following location in Finder or Terminal and delete the desired service:
```
~/Library/Services
```

## Disable a service

If you want a temporary approach, services created with Automator can simply be disabled by de-selecting them in the _System preferences → Keyboard → Shortcuts → Services_