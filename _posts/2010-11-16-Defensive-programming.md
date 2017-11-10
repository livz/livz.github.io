---
title:  "Defensive Programming"
---

![Logo](/assets/images/debugging.png)

## Overview

Defensive Programming is a technique where you assume the worst from all input. Why?
* The biggest danger to your application is user input: it's *uncontrolled, unexpected and unpredictable.*
* The input sent to your application could be malicious. Or it could just be something you never expected.
* Debugging for unpredicted situations takes a lot of time!
 

### First Rule - **_Never Assume Anything!_**

Programmers usually make two kinds of assumptions: 

1. *About the expected input* - Data from the user cannot be trusted. As such, all input must be validated. For each input: 
  * Define the set of all legal input values.
  * When receiving input, validate against this set.
  * Determine the behavior when input is incorrect: Terminate, Retry or Warning
2. *About a programming language*
  * Some primitive data types have different sizes depending on the operating system and the hardware platform. For example, integers can be 8, 16, 32 or 64 bits. *Assuming the size of a data type can be disastrous when working on different platform*.
  * In C, the size of data types are defined in the ```limits.h``` file. In addition, C has the **sizeof** operator which will calculate the size of a variable.
  * Coders need to be especially careful with integer operation. Will *x* overflow given the code below?
  ```c
  short x = 10000 * 10
  ```

#### Testing

* Just testing that it works is not good enough.
* Error cases need to be tested, to see that the application reacts accordingly. Add tests should be made for different kinds of input:
  * Illogical scenarios
  * Strange ASCII characters
  * Numerical/non-numerical
  * Positive/negative/0
  * Values too large/small
  * Input only composed of numbers/letters
  * Border values
* Ask other people to test your application 
  * First start with the technical testers
  * The asks non-technical people

### Second Rule - **Use standards!**

Proper coding standards address weaknesses in the language standard and/or compiler design. They define a format or "style" used for writing code. Every software development team should have an agreed-upon and formally documented coding standard. Coding standards *make code more coherent and easier to read, thus reduce the likelihood of bugs*. They cover a wide range of topics:
* Variable naming
* Indentation
* Position of brackets
* Content of header files
* Function declaration
* Use of constants/magic numbers
* Macro definitions

A good reference for C++ is [Google C++ Style Guide](https://google.github.io/styleguide/cppguide.html)

### Third Rule - **Keep code as simple as possible!**

* Complexity breeds bugs. 
* Software should only contain the features it needs.
* Proper planning is key to keeping you application simple.
* Functions should be seen as a contract:
  * Given input, they execute a specific task.
  * They should not do anything other than that specific task.
  * If they cannot execute that task, they should have some kind of indicator so that the callee can detect the error. eiter throw an exception, set a global error value or return an invalid value.
* *__Refactoring__* is not a bug-fixing technique. Is a good technique to battle feature creep: 
  * Features are often added during development
  * These features are more often the source of problems
* Refactoring forces the programmer to reevaluate the structure of his/her program.
* __*Third-party libraries*__. Code reuse is not just a smart-choice, it's a safe choice. Odds are that a specific library has proven itself and is much more stable than anything you could build short-term. Although code reuse is highly recommended, many questions must be addressed before using someone else's code: 
  * Do this do exactly what I need?
  * How much will I need to change my design?
  * How stable is it? What reputation does it have?
  * How old is the code?
  * Who built it?
  * Are people still using it? Can I get help?
  * How much documentation is there?

## Case study 
1. **Initial version** - _PF_SafeStrCpy_ function:
```c
/* 
** This function copies the null terminated string str2 to str1. 
** Str1 is truncated, if the the length of str2 is greater than or equal 
** the length of str1. The parameter len1 must conatin the length value 
** of str1 (sizeof).
*/
/* this function replaces the system one due to QAC */
IM_string PF_SafeStrCpy (IM_string str1, 
IM_cstring str2, 
IM_word len1)
{
 IM_word len2;
 /* strlen returns the length without the terminating '\0' -> + 1 */
 len2 = strlen(str2) + 1; 
 if (len2 > len1)
 {
  str1[len1 - 1] = '\0';
  return strncpy(str1, str2, len1 - 1);
 }
 else
 {
  str1[len2] = '\0';
  return strncpy(str1, str2, len2);
 }
}
```
2. **Problem discovered** - A simple test proves that this function is not so safe though. The call to _PF_SafeStrCpy (str1, str2, 100);_ goes through the _else_ branch and writes past the end of _str1_:
```c
char str1 [100]; 
char str2 [100]; /* strlen (str2) == 99 */
```
3. **Corrected version**:
```c
/**
* \see PF_Basic.h 
* corrected version of PF_SafeStrCpy; the origin is from project SAR 
*/
char* PF_SafeStrCpy (char* str1, const char* str2, IM_word len)
{
 if ( 0 == len ) {
  return NULL;
 }
 else {
  char* cptr = strncpy(str1, str2, len);
  str1[len-1] = '\0';
  return cptr;
 }
}
```
4. **Attack possibilities**:
* Pass *NULL* as source or destination can easily cause the program to terminate, thereby creating a DoS attack.
* Abuse the length parameter to cause buffer overflow problems.

5. **General solution**:
As a rule of thumb, the return string buffer must be at least large enough to hold the specified maximum number of characters, not bytes, plus the NULL character. Moreover, these rules are needed for safe use of _strncpy()_:
* Verify that src and dest are not NULL.
* Null terminate the final character of dest.
* Use _strncpy(dest, src, sizeof(dest)/sizeof(dest[0]))_.
* If the final character (i.e., _sizeof(dest) - 1_) of dest is no longer null, then the buffer was overrun.

6. **Observations**
  * **strlen() vs sizeof()** - The code below prints *Size of string: 6. String length: 5*:
  ```c
char String[]="Hello";
printf("\n Size of string: %d. String length: %d.\n", sizeof(String), strlen(String) );
```
  * **Non NULL-terminated strings** - The code below prints: *Size of string: 5. String length: 19*. String length is unknown. The function _strlen()_ searches until it finds a NULL terminator:
  ```c
char String[5] = { 'H', 'e', 'l', 'l', 'o' };
printf("\n Size of string: %d. String length: %d.\n", sizeof(String), strlen(String) );
  ```
  * **strlen() with pointers** - The code below prints: *For ptr: sizeof = 4, strlen = 5*. _ptr_ is a pointer, so _sizeof(ptr)_ is the size of the pointer, in this case 4 bytes:
  ```c
char *ptr = "Hello";
printf("For ptr: sizeof = %u, strlen = %u.\n", sizeof ptr, strlen(ptr));
  ```
  * __*strlen()* is NOT safe to call!__ - Unless you positively know that the string IS null-terminated. When you call strlen() on an improperly terminated string, strlen scans until a null character is found and thus can scan outside the buffer if string is not null-terminated. usually this results in a segmentation fault or bus error.
  
## Good external links
1. [Defensive programming](http://en.wikipedia.org/wiki/Defensive_programming)
2. [Secure Programming HOWTO - Creating Secure Software](https://www.dwheeler.com/secure-programs/)
3. [Secure Programming Cookbook for C and C++](http://shop.oreilly.com/product/9780596003944.do)
