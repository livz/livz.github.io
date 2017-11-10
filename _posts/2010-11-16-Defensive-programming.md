---
title:  "Defensive Programming"
---

## Overview

Defensive Programming is a technique where you assume the worst from all input. Why?
* The biggest danger to your application is user input: it's *uncontrolled, unexpected and unpredictable.*
* The input sent to your application could be malicious. Or it could just be something you never expected.
* Debugging for unpredicted situations takes a lot of time!
 

### First Rule - **_Never Assume Anything!_**

Two kinds of assumptions: 

Expected input 
Data from the user cannot be trusted. As such, all input must be validated.
For each input: 
Define the set of all legal input values.
When receiving input, validate against this set.
Determine the behavior when input is incorrect: 
Terminate
Retry
Warning
The programmer assuming something about a programming language 
Some primitive data types have different sizes depending on the operating system and the hardware platform. For example, integers have been 8,16,32 and 64 bits. Assuming the size of a data type can be disastrous when working on different platform.
In C, the size of data types are defined in limits.h. In addition, C has the sizeof operator which will calculate the size of a variable.
You need to be especially careful on integer operation.
?
1
2
short x = 10000 * 10
Will x overflow?

Testing:

Just testing that it works is not good enough.
Error cases need to be tested, to see that the application reacts accordingly. Add tests for different kinds of input:
illogical
strange ASCII characters
numerical/non-numerical
positive/negative/0
too large/small
only composed of numbers/letters
border values
Ask other people to test your application 
First start with the technical testers
The asks non-technical people
Second Rule
Use standards!

Proper coding standards address weaknesses in the language standard and/or compiler design.
They define a format or "style" used for writing code. Every software development team should has an agreed-upon and formally documented coding standard. Coding standards make code more coherent and easier to read, thus reduce the likelihood of bugs. They cover a wide range of topics:
Variable naming
Indentation
Position of brackets
Content of header files
Function declaration
Use of constants/magic numbers
Macro definitions
Good reference: Google C++ Style Guide
Third Rule
Keep code as simple as possible !

Complexity breeds bugs.
Software should only contain the features it needs.
Proper planning is key to keeping you application simple
Functions should be seen as a contract 
Given input, the execute a specific task.
They should not do anything other than that specific task.
If they cannot execute that task, they should have some kind of indicator so that the callee can detect the error. 
Throw an exception (doesn't work in C)
Set a global error value
Return an invalid value 
NULL?
False?
Negative number?
Refactoring 
Is not a bug-fixing technique. Is a good technique to battle feature creep: 
Features are often added during development
These features are more often the source of problems
Fights this by forcing the programmer to reevaluate the structure of his/her program.
It can help you keep you application simple
Third-party libraries 
Code reuse is not just a smart-choice, it's a safe choice. Odds are that a specific library has proven itself and is much more stable than anything you could build short-term. Although code reuse is highly recommended, many questions must be addressed before using someone else's code: 
Do this do exactly what I need?
How much will I need to change my design?
How stable is it? What reputation does it have?
How old is the code?
Who built it?
Are people still using it? Can I get help?
How much documentation is there?
