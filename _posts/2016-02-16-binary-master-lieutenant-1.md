![Logo](/assets/images/belts-red.png)


In this post we'll continue with the first level from the [Lieutenant](https://www.certifiedsecure.com/certification/view/37) set of challenges from **Certified Secure Binary Mastery**.
More buffer overflows on the horizon, but now a new protection mechanism is introduced: the non-executable (**NX**) bit. 
The method used here is called is called **ret2libc** (return to libc) and allows us go around the fact that the stack is not executable.

In the previous levels we exploited similar stack-based buffer overflows by overwriting past the buffer limits, 
until we reached the saved return address, where we wrote an address we controlled. 
We placed the shellcode either in the buffer itself or in environment variables, which both end up on the stack.
Now because the stack is NOT executable, the program would just crash. So we need a way to get past this. 
One known trick is to return insted to the standard library function **system()** which accepts an argument to execute.

To review the previous levels, check the links below:
* [Binary Master: Ensign - Level 1](https://livz.github.io/2016/01/07/binary-master-ensign-1.html)
* [Binary Master: Ensign - Level 2](https://livz.github.io/2016/01/14/binary-master-ensign-2.html)
* [Binary Master: Ensign - Level 3](https://livz.github.io/2016/01/21/binary-master-ensign-3.html)
* [Binary Master: Ensign - Level 4](https://livz.github.io/2016/01/28/binary-master-ensign-4.html)
* [Binary Master: Ensign - Level 5](https://livz.github.io/2016/02/09/binary-master-ensign-5.html)

If you want to know more about the techniques to bypass the NX bit, make usre to check the following great resources:
* [Bypassing NX bit using return-to-libc](https://sploitfun.wordpress.com/2015/05/08/bypassing-nx-bit-using-return-to-libc/)
* [Bypassing NX bit using chained return-to-libc](https://sploitfun.wordpress.com/2015/05/08/bypassing-nx-bit-using-chained-return-to-libc/)

## 0 - Discovery
