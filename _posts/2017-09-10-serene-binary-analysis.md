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

I decided I need to learn how to use it. Because most of the examples available out there deal with various CTF challenges, 
which are not exactly the most approachable problems, I chose a challange a bit more difficult than the 
one in the official docs ([fauxware](https://github.com/angr/angr-doc/tree/master/examples/fauxware)) 
but not exaclty DEFCON material. 

So **_angr_** is:
* _"a multi-architecture binary analysis toolkit, with the capability to perform dynamic symbolic execution"_
* _"a user-friendly binary analysis suite, allowing a user to simply start up iPython and easily perform intensive binary analyses with a couple of commands"_
* _"[..] binary analysis is complex, which makes angr complex"_ - No surprise here! _No pain, no gain!_

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

Enough talking. Let's see angr in action. The test subject for today is a simple crackme exercise,
which expects a 6 characters password. Going beyond the simple _strcmp_ in the fauxware, now we have a routine
that derives a password from  our input and compares that with a hard-coded value. A sort of dumb hash if you want, 
but will force us to not limit ourselves to the [_fauxware_](https://github.com/angr/angr-doc/tree/master/examples/fauxware) example.
Source code is below:
```c
#include <stdio.h>
#include <string.h>

char password[] = "a0dfbc";

char flag[6] = {0};

typedef struct myNode{
  char idx;
  struct myNode *ptr;
} myNode;

myNode v[10] = {
	{'a', &v[6]}, /* v[0] */
	{'0', &v[3]}, /* v[1] */
	{'d', &v[1]}, /* v[2] */
	{'f', &v[7]}, /* v[3] */
	{'b', &v[2]}, /* v[4] */
	{'c', &v[4]}, /* v[5] */
	{'8', &v[0]}, /* v[6] */
	{'3', &v[5]}, /* v[7] */
	{'7', &v[9]}, /* v[8] */
	{'e', &v[8]}  /* v[9] */
};

char str[10] = {0};

int main( void )
{
	int i;
	int pos;

	printf("[*] Hello! Please enter the password: ");
	scanf("%6s", flag);
	
	for( i = 0; i < 6; i++ ) {		
		myNode *n;
		
		pos = flag[i] - '0';		
		if (pos<0 || pos>9)
			continue;
			
		n = v[pos].ptr;
		str[i] = (*n).idx;
	}
	
	if(!strcmp(str, password)){
		printf("[*] Congratulations! You have found the flag.\n");
	} else {
		printf("[-] Invalid flag! Try again...\n");
	}	
}
```

Spend a few minutes by yourself and try to work out what the expected flag is. 
Notice that even with source code in front of us, it’s still we still need to do a bit of 
manual analysis to get the flag.

Of course there are other approaches to solve this crackme, like just patching the binary for example. 
Or work out what is the expected password by reversing the _hashing_ procedure. 
For my current purpose I'll execute it [with symbolic variables](https://docs.angr.io/docs/solver.html). 
In this case where the binary takes the password from standard input, and _stdin_ will be treated as 
a stream of symbolic data, for which we will be able to impose various constraints and solve problems based on it. 
All this is controlled through the [_SimulationManager_](https://docs.angr.io/docs/pathgroups.html). 

The solver takes about 10 minutes for a 6-characters password. 
It could probably be improved by adding more constraints, but it's out of scope for now.

```python
import angr 

p = angr.Project('crackme2')
st = p.factory.entry_state()

# Constraints for the letters in the password
for i in range(6):
    k = st.posix.files[0].read_from(1)
    st.se.add(k != 0)
    st.se.add(k != 10)
    st.se.add(k > 31)
    st.se.add(k < 127)

# Constraint that last character should be a newline
k = st.posix.files[0].read_from(1)
st.se.add(k == 10)

# Reset symbolic state of stdin
st.posix.files[0].seek(0)
st.posix.files[0].length = 7

# Construct a SimulationManager to perform symbolic execution
sm = p.factory.simgr(st)

# Run until there's nothing left to be stepped
sm.run()

# Check the stdout of every path that terminated
for s in sm.deadended:
    out = s.posix.dumps(1)
    if 'Congratulations' in out:
        print "Message: ", out
        print "Input password: ", s.posix.dumps(0)
```

And the results:
```
(angr) ~ time python angr_solver.py
Message:  [*] Hello! Please enter the password: [*] Congratulations! You have found the flag.
Input password:  624157

python angr_sol.py  600.32s user 9.14s system 99% cpu 10:10.03 total

```

## Conclusions
I believe angr_ is very useful to know framework, _especially if you’re not doing CTFs_. 
If you are, you probably know more about it and use it already but if you don't, 
then you're missing out on a cool tool.
