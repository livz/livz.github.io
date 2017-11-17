---
title:  "[CTF] Difusing a (binary) bomb"
---

![Logo](/assets/images/bomb.png)

## Overview
This very good [Intro to X86 Assembly](http://opensecuritytraining.info/IntroX86.html) course has a nice final exercise which is a task to **_defuse  a binary bomb_** - an [executable](http://csapp.cs.cmu.edu/public/1e/bomb.tar), without source code, with more phases, each one needing a password.

I understand that there are many variants of this bomb, so my answer won't fit every bomb, but anyway, spoilers ahead, be aware! Each level introduces a programming construct (simple string manipulations, array, functions, cases, linked lists, trees, etc.) so it's very interesting to actually reverse engineer them and understand them. The long version of the solutions is [here](https://github.com/livz/binary-bomb).  The short version below. 

## Phase 1

I've created a file with commands for easy debugging, and started the bomb like this:
```bash
$ gdb -q -x commands bomb
(gdb) run bomb-answers.txt
```

In the first phase there's a simple string comparison in place. Very straight-forward. The first string being compared is our input:
```bash
(gdb) x /x $ebp+0x8
0xbffff440: 0x0804b680
(gdb) x /s 0x0804b680
0x804b680 <input_strings>: "test"
```

And second one is the password for phase_1:
```bash
(gdb) x/s 0x80497c0
0x80497c0:    "Public speaking is very easy."
```

## Phase 2

Now 6 numbers are read from into an array, and an algorithm is applied. After reverse engineering, it looks as follows: 
```c
v[0] = 1
v[i] = (i+i) * v[i-1]
```

So we find the solution of phase 2: _**1 2 6 24 120 720**_

## Phase 3

This expects as input a number, a character and another number:
```bash
0x08048bb1 <+25>: push   0x80497de --> the format string for sscanf, "%d %c %d"
0x08048bb6 <+30>: push   edx
0x08048bb7 <+31>: call   0x8048860 <sscanf@plt>
```

The rest of the disassembled instructions are a _`case`_ structure, which checks the letter and the second number based on the first value. For step by step guidance, check the [phase3.txt](https://github.com/livz/binary-bomb/blob/master/phase3.txt) file.

## Phase 4

This phase is more interesting. It introduces a recursive function! The disassembled code looks like this:
```c
Dump of assembler code for function func4:
   0x08048ca0 <+0>:	push   ebp
   0x08048ca1 <+1>:	mov    ebp,esp
   0x08048ca3 <+3>:	sub    esp,0x10
   0x08048ca6 <+6>:	push   esi
   0x08048ca7 <+7>:	push   ebx
   0x08048ca8 <+8>:	mov    ebx,DWORD PTR [ebp+0x8]
   0x08048cab <+11>:	cmp    ebx,0x1
   0x08048cae <+14>:	jle    0x8048cd0 <func4+48>
   0x08048cb0 <+16>:	add    esp,0xfffffff4
   0x08048cb3 <+19>:	lea    eax,[ebx-0x1]
   0x08048cb6 <+22>:	push   eax
   0x08048cb7 <+23>:	call   0x8048ca0 <func4>
   0x08048cbc <+28>:	mov    esi,eax
   0x08048cbe <+30>:	add    esp,0xfffffff4
   0x08048cc1 <+33>:	lea    eax,[ebx-0x2]
   0x08048cc4 <+36>:	push   eax
   0x08048cc5 <+37>:	call   0x8048ca0 <func4>
   0x08048cca <+42>:	add    eax,esi
   0x08048ccc <+44>:	jmp    0x8048cd5 <func4+53>
   0x08048cce <+46>:	mov    esi,esi
   0x08048cd0 <+48>:	mov    eax,0x1
   0x08048cd5 <+53>:	lea    esp,[ebp-0x18]
   0x08048cd8 <+56>:	pop    ebx
   0x08048cd9 <+57>:	pop    esi
   0x08048cda <+58>:	mov    esp,ebp
   0x08048cdc <+60>:	pop    ebp
   0x08048cdd <+61>:	ret    
End of assembler dump.
```

After a bit of playing around, the purpose of the code becomes obvious. It's the Fibonacci function, implemented recursively:
```c
func4(x):
	if x <= 1 :
		return 1
	else :
		y = func4(x-1)
		z = func4(x-2)
		return y + z
```

## Phase 5

In this phase, the input password string is parsed character by character, and each parsed character gives an index into an input string. This way, the final password is constructed gradually, without the need to store it in plain.

We have to form the password **giants** from the source string _**isrveawhobpnutfg**_:
```c
   [..]
   0x08048d4d <+33>:	xor    edx,edx
   0x08048d4f <+35>:	lea    ecx,[ebp-0x8]
   0x08048d52 <+38>:	mov    esi,0x804b220		--> "isrveawhobpnutfg\260\001"
   0x08048d57 <+43>:	mov    al,BYTE PTR [edx+ebx*1]
   0x08048d5a <+46>:	and    al,0xf
   0x08048d5c <+48>:	movsx  eax,al
   0x08048d5f <+51>:	mov    al,BYTE PTR [eax+esi*1]
   0x08048d62 <+54>:	mov    BYTE PTR [edx+ecx*1],al
   0x08048d65 <+57>:	inc    edx
   0x08048d66 <+58>:	cmp    edx,0x5
   0x08048d69 <+61>:	jle    0x8048d57 <phase_5+43>
   0x08048d6b <+63>:	mov    BYTE PTR [ebp-0x2],0x0
   0x08048d6f <+67>:	add    esp,0xfffffff8
   0x08048d72 <+70>:	push   0x804980b		-->  "giants"
   0x08048d77 <+75>:	lea    eax,[ebp-0x8]
   0x08048d7a <+78>:	push   eax
   0x08048d7b <+79>:	call   0x8049030 <strings_not_equal>
   [..]
```   

After reversing, phase_5 function should be something like:
```c
phase_5(s) {
 src = "isrveawhobpnutfg";
 dest = "12345";
  
 for (i=0; i&lt;=5; ++i) {
  idx = s[i] && 0xf; // cuts the most significant hex digit
  dest[i] = src[idx];
 }
}
```

So the first hex digit of the password represents the index. We need the following indexes: 15 (0xf), 0, 5, 11 (0xb), 13 (0xd) and 1. A possible password is be: o (0x6f) p (0x70) u (0x75) k (0x6b) m (0x6d) q (0x71).

Passphrase for next level: **opukmq**

## Phase 6

This was the most difficult to figure out from the assembly code, as it's split into more sub-stages, and involves *__linked lists structures__*. Complete details are in [here](https://github.com/livz/binary-bomb/blob/master/phase6.txt). 

First 6 numbers are read. There is a predefined linked list also. Another important variable used is an array containing addresses of list elements. 
* stage1: check that all 6 numbers read are between [1,..,6] and all different
* stage2: builds and arranges a second array with pointers to list elements
* stage3: fixes the links between elements from the input list to match the array constructed in stage2
* stage4: checks that the elements of the linked list are in reverse sorted order. 

The second stage is the most important: we have to arrange the values of the list elements, so that we can pass stage 4 check (should be in reverse order).  Current order : 
```c
(gdb) printf "%08x %08x %08x %08x %08x %08x \n", *0x0804b26c, *0x0804b260, *0x0804b254, *0x0804b248, *0x0804b23c, *0x0804b230
000000fd 000002d5 0000012d 000003e5 000000d4 000001b0 
```

The pseudo-code for this step could be something like: 
```c
   // 2nd stage
   i = 0
   ecx = v[0]
   eax = v2
   y = v2
   
   while i<=5 : 
       elem = list_head
       elem = head
       j = 1
       edx = i
     
       if ( j < v[i] ):
           do {
               elem = elem.next
               j++
           } while (j < v[i])
       v2[i] = elem
       i++
``` 
 
This stage builds a list of pointers to elements, which is used in stage 3 and 4. Using the previously deduced agorithm, the input numbers (which mean how much we move an element, to have them in reverse order), should be:
* pos 1: 3 (head->next->next->next which is the biggest num)
* pos 2: 1 (head->next, which is the second biggest )
* .. and so on.

Because of the advancing algorithm, we add 1 to the previous, and get the solution: __*4 2 6 3 1 5*__

## Secret Phase 

In the phase_difused function, we have another function called __*secret_phase*__, activated only after first stages are difused: 
```bash
0x08049533 <+7>:  cmp    DWORD PTR ds:0x804b480,0x6    
0x0804953a <+14>: jne    0x804959f <phase_defused+115> 
```

The passphrase from phase 4 is parsed again, now looking for a string. As we see below, we can get that string and advance:
```c
0x08049544 <+24>: push   0x8049d03   --> "%d %s"   
0x08049549 <+29>: push   0x804b770   --> "9"  this is the input from phase_4    
0x0804954e <+34>: call   0x8048860 <sscanf@plt>    
0x08049553 <+39>: add    esp,0x10    
0x08049556 <+42>: cmp    eax,0x2    
0x08049559 <+45>: jne    0x8049592 <phase_defused+102>    
0x0804955b <+47>: add    esp,0xfffffff8    
0x0804955e <+50>: push   0x8049d09  --> "austinpowers"
0x08049563 <+55>: push   ebx    
0x08049564 <+56>: call   0x8049030 <strings_not_equal> 
```

We add the password *__austinpowers__* and get the following 2 messages printed: 
> Curses, you've found the secret phase! 

> But finding it and solving it are quite different...   

The secret_phase function calls another function, _`fun7`_ (very fun:) with an address and our input as a second parameter. After digging into the disassebly, the last fun7 is something like this: 
```c
int fun7(int *adr, int x) {
	if(adr == NULL) {
		ret = -1; 	// 0xffffffff
		goto exit;
	}
	if (x >= *adr) {
		if (x == *adr) {
			ret = 0
		} else {
			ret = fun7(*(adr+8), x)
			ret *= 2;
			ret ++;
		}
	} else {
		ret = fun7(*(adr+4), x)
		ret *= 2		
	}

exit:	
	return ret;
}	
```

Initial address passed to the function is 0x804b320. At this address there is a tree with 4 levels, as below. We navigate to the left or right branch depending on the input value.  If input x is equal to value in branch, we return 0.
```
0x24
0x8 0x32 
0x6 0x16 0x2d 0x6b 
................................. 0x3e9
```

We want fun7() to return 7. 7 = 2*3+1 = 2*(2*1+1)+1. 
According to the tree and deduced algorothm, we have:
```
f(0x24) = 0 
f(0x32) = 2*f(0x24)+1 = 1 
f(0x6b) = 2*f(0x32)+1 = 3 
f(0x3e9) = 2*f(0x6b)+1 = 7 
```

0x3e9 is 1001 decimal, and is accepted by the first check (param-1 <= 1000).

 --=End=--
 
# ./bomb bomb-answers.txt 

```
Welcome to my fiendish little bomb. You have 6 phases with which to blow yourself up. Have a nice day! 
Phase 1 defused. How about the next one? 
That's number 2. Keep going! 
Halfway there! 
So you got that one. Try this one. 
Good work! On to the next... 
Curses, you've found the secret phase! 
But finding it and solving it are quite different... 
Wow! You've defused the secret stage! 
Congratulations! You've defused the bomb!_
```

Many thanks to the guys at [Open Security Trainings](http://opensecuritytraining.info/) for this and all the other interesting materials there! 
