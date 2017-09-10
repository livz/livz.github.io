---
title:  "Serene Binary Analysis with Angr"
---

![Logo](/assets/images/angr/get-angr.png)

## Context

Recently I have found out about the [angr](http://angr.io) framework for binary analysis. 
According to the official website its capabilities are very exciting: _symbolic execution_, 
_automatic ROP chain building_, _automatic exploit generation_. But what impressed me even more was the amount of
[documentation](https://docs.angr.io/) available, both for installing and getting started with real projects. 
It looks like a lot of work has been put into this project. The people behind it are security researchers from 
[Computer Security Lab at UC Santa Barbara](http://seclab.cs.ucsb.edu) with a long tradition of winning CTFs.

I've decided I wanted to learn how to use. Because most of the examples available out there deal with various CTF challenges, 
which are not exactly the most approachable problems, I chose a challange a bit more difficult than the 
one in the official docs - [fauxware](https://github.com/angr/angr-doc/tree/master/examples/fauxware) 
but not exaclty DEFCON CTF. 

So **_angr_** is:
* _a multi-architecture binary analysis toolkit, with the capability to perform dynamic symbolic execution_
* _a user-friendly binary analysis suite, allowing a user to simply start up iPython and easily perform intensive binary analyses with a couple of commands_
* _[..] binary analysis is complex, which makes angr complex_ - No surprise here! _No pain, no gain!_

Don't get discouraged by the apparent steep learning curve. The book covers everything to get going.

## Installation 

The [installation procedure](https://docs.angr.io/INSTALL.html) covers mostly everything.  
I will mention only a few bits and workarounds I needed on my Ubuntu 16.04 box. 
To avoid messing up with your system's libraries, the authors highly recommend a python virtual environment
to install and use angr. This will be an isolated Python work environment, complete with an interpreter and 
site-packages  directory. Very useful.

* Install first the necessary packages for creating virtual environments:

```bash
$ sudo apt-get install python-dev libffi-dev build-essential virtualenvwrapper
```
* Create a virtual environment and install ```angr``` in it:

```bash
$ mkvirtualenv angr && pip install angr
```
* To avoid import errors later, install [Capstone disassembly framework](http://www.capstone-engine.org/)
and [monkeyhex](https://pypi.python.org/pypi/monkeyhex/1.3) **_inside_** your virtual environment:

```bash
(angr) $ pip install -I --no-binary :all:  capstone
(angr) $ pip install -I monkeyhex
```

## Symbolic variables and state solvers
angr's power comes not from it being an emulator, but from being able to execute with what we call symbolic variables
https://docs.angr.io/docs/solver.html

**The program we emulated took data from standard input, which angr treats as an infinite stream of symbolic data by default.


he most important control interface in angr is the SimulationManager, which allows you to control symbolic execution over groups of states simultaneously, (https://docs.angr.io/docs/pathgroups.html)


## Play time
Fauxware -> straight forward, no for loops

Up the difficulty a bit.
Solve a simple crackme exercise
Show ida 
Even with source code it’s still difficult to get the flag
Need to add a constraint for 10 chars length
https://github.com/angr/angr-doc/blob/master/examples/csaw_wyvern/solve.py  works fine for length = 3
Dump input: good_state.posix.dumps(1)


Conclusions
Very useful to know, especially if you’re not doing CTFs.
