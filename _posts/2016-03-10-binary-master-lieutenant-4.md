![Logo](/assets/images/belts-black.png)


We're finally getting closer to the end of the [Lieutenant](https://www.certifiedsecure.com/certification/view/37) set of challenges from **Certified Secure Binary Mastery**. This time we'll analyse another classic vulnerability - **Time of check to time of use (TOCTOU)**. At its roots, the vulnerability is a class of [race condition](https://en.wikipedia.org/wiki/Race_condition). As the [Wikipedia article](https://en.wikipedia.org/wiki/Time_of_check_to_time_of_use) states:
> **TOCTOU**, pronounced "TOCK too" is a class of software bug caused by changes in a system between the checking of a condition (such as a security credential) and the use of the results of that check.

The vulnerability in this level is actually pretty straight-forward to spot. Although some race-conditions are difficult to exploit reliably, in this case things are easier, as we'll see.

To review the previous levels, check the links below:
* [Binary Master: Ensign - Level 1](https://livz.github.io/2016/01/07/binary-master-ensign-1.html)
* [Binary Master: Ensign - Level 2](https://livz.github.io/2016/01/14/binary-master-ensign-2.html)
* [Binary Master: Ensign - Level 3](https://livz.github.io/2016/01/21/binary-master-ensign-3.html)
* [Binary Master: Ensign - Level 4](https://livz.github.io/2016/01/28/binary-master-ensign-4.html)
* [Binary Master: Ensign - Level 5](https://livz.github.io/2016/02/09/binary-master-ensign-5.html)
* [Binary Master: Lieutenant - Level 1](https://livz.github.io/2016/02/16/binary-master-lieutenant-1.html)
* [Binary Master: Lieutenant - Level 2](https://livz.github.io/2016/02/23/binary-master-lieutenant-2.html)
* [Binary Master: Lieutenant - Level 3](https://livz.github.io/2016/03/02/binary-master-lieutenant-3.html)

## 0 - Discovery
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
	
	seteuid(getuid());
	fp = fopen(argv[1], "r");
	
	if (fp == NULL) {
		char error[50];
		snprintf(error, 49, "Error opening file %s\n", argv[1]);
		fprintf(stderr, "%s", error);       
 
		return -1;
	}
	
	fclose(fp);
	seteuid(1006);
	
	for (;;) {
		fp = fopen(argv[1], "rb");

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

