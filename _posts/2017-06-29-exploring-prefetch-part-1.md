![Logo](/assets/images/tricks.png)

[The Prefetch file](http://www.forensicswiki.org/wiki/Windows_Prefetch_File_Format) format has been studied extensively. 
There is a lot of research on this subject already, so I won’t reinvent any wheels here.
Knowing that among the artefacts listed in the prefetch files are libraries loaded by our applications,
I wanted to understand how the process of recording these libraries works in different scenarios, and how it can be tricked. Can  Istill load my library without Prefetch knowing?
Feel free to skip the background information, which is mostly for me to have things clear in my mind before starting to work. 
If you’re not familiar with the topic, I strongly encourage you to go start with [Forensic Magazine](https://www.forensicmag.com/) 
and read **Decoding Prefetch Files for Forensic Purposes**  [Part 1](https://www.forensicmag.com/article/2010/12/decoding-prefetch-files-forensic-purposes-part-1)  
and [Part 2](https://www.forensicmag.com/article/2010/12/decoding-prefetch-files-forensic-purposes-part-2).

## Context
Prefetch files are created by Windows when an application is run from a particular location for the very first time and 
updated on subsequent runs on the program. Their purpose is to speed up the applications by loading data from disk into memory 
before it is needed. Also, Prefetch will attempt to compute and save new data files each time the system starts up. 
[Forensics Wiki](http://www.forensicswiki.org/wiki/Prefetch) goes into excellent detail on prefetch files and 
links to further resources.

Prefetch files are also great artifacts in a forensic investigations, very useful when building a timeline of applications that have been run on a system.  http://www.forensicswiki.org/wiki/Prefetch

## Naming convention
Prefetch files are named in a format containing the name of the application followed by an eight character hash 
of the location where the application was run and the .PF extension.
To understand how this hash is generated, check this very in-depth [Hexacorn blog post](http://www.hexacorn.com/blog/2012/06/13/prefetch-hash-calculator-a-hash-lookup-table-xpvistaw7w2k3w2k8/).

> The name of the corresponding .pf file depends on the path of the application.

## Prefetch settings 
The prefetch related settings are held in the following registry key:
```
HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\Session Manager\Memory Management\PrefetchParameters
```
For example, in order to alter the prefetch creation, we can modify **EnablePrefetcher** value [as follows](https://msdn.microsoft.com/en-us/library/ms940847(v=winembedded.5).aspx):

```
0 = Disabled 
1 = Application Launch Prefetch 
2 = Boot Prefetch 
3 = Prefetch All
```

Note that these settings need a *reboot* in order to become effective.
 
## Forensic artefacts from the prefetch files
* __Evidence of program execution__ - Even if the program has since been deleted, a prefetch file may still exist on the system to provide evidence of execution. 
* __Application running count__ - At every re-run from the same location, the corresponding .pf file will be updated with the number of times it was executed.
* __Artefacts from malicious files__ - Using forensic tools, we can list libraries loaded by an application or even opened files.
* __Original application path__ - It’s possible to calculate the application path based on the hash in the name. Depending on the version of Windows the file was taken from, a different hashing function is used. Definitely worth checking [Prefetch file names and UNC paths](http://www.hexacorn.com/blog/2012/10/29/prefetch-file-names-and-unc-paths/).
* __First and last time of execution__ - Creation date  of the prefetch file shows the first time an application was executed, while the last time is recorded in the .pf file. This can also reveal “time stomping” attempts. If malware alters the timestamp of an application, it might not be aware of the information captured in the corresponding prefetch file.

## Prefetch parsers and libraries
* [Windows Prefetch File (PF) format](https://github.com/libyal/libscca/blob/master/documentation/Windows%20Prefetch%20File%20(PF)%20format.asciidoc) by [Joachim Metz](https://twitter.com/joachimmetz)
* [WinPrefetchView](http://www.nirsoft.net/utils/win_prefetch_view.html) by Nir Sofer
* [Windows-Prefetch-Parser](https://github.com/PoorBillionaire/Windows-Prefetch-Parser) by [Adam Witt](https://twitter.com/_TrapLoop)
* [Windows-Prefetch-Carver](https://github.com/PoorBillionaire/Windows-Prefetch-Carver) by [Adam Witt](https://twitter.com/_TrapLoop)
* [Windows Prefetch Parser](https://tzworks.net/prototype_page.php?proto_id=1) by  TZWorks

## Recording loaded libraries
* __no blanks after?__ - what is happening here?????
* __Implicit linking__ - This linking method is also referred to as _static load_ or _load-time dynamic linking_. With implicit linking, the executable using the DLL links to an import library (.lib file) provided by the maker of the DLL. The operating system _loads the DLL when the executable is loaded_.

  * **Result**: As expected, libraries loaded this way appear in the prefetch file.

* __Explicit linking__

   This linking method is sometimes referred to as dynamic load or run-time dynamic linking.With explicit linking, the executable using the DLL must make function calls to explicitly load and unload the DLL and to access the DLL's exported functions. 

  * **Result**: Again, libraries are correctly recorded. Even if no function is called there is still a corresponding DLL entry in the .pf file.

* __Explicit linking (with style)__
   This techniques is frequently used in exploits, which find first the base address of kernel32.dll and then find the address of LoadLibrary function manually. Very prevalent technique. 
	Result: Loaded libraries mentioned correctly in the prefetch. 

Result: In this case, any library loaded using this trick is also recorded in the prefetch file.  

* __Delayed loading__

   Using this method, the libraries will be loaded only when needed. With Visual Studio, we can specify libraries for delayed loading using a [specific linker option](https://docs.microsoft.com/en-gb/cpp/build/reference/specifying-dlls-to-delay-load).

Result: Delayed loaded libraries are also present in the prefetch files.

* __DLL Injection__

   There are different ways to inject a library into another process. A quick way to see what’s happening is to use OpenSecurityResearch [Dll injector](https://github.com/OpenSecurityResearch/dllinjector), which implements multiple injection techniques.

> dllInjector-x86.exe -p 3328 -l myDll.dll -P -c
Result: From an offensive security standpoint, the news is that there is no mention of the library being injected in the prefetch file corresponding to the injected process. The other news (which is much worse for the forensic investigator) is that quickly injecting a library into a process, within its first seconds of activity, generates a crash of the Prefetch Manager and no prefetch files will be created until the next restart. At the moment this behaviour seems to reproduce systematically on a Windows 7 32bit VM. More tests to follow. See below a video.

* __Reflective DLL loading__

   If you don’t know what reflective DLL loading is, go [read about it](https://github.com/stephenfewer/ReflectiveDLLInjection) now! In this case the library implements a minimal PE loader in order to load itself. 

Result: Because the loader of the OS is not involved, there is no mention of the library being loaded in the prefetch file corresponding to the host process. 


* __Artificially delayed loading__

   This technique relies on the observation above that Windows will monitor an application for 10 seconds after launch. We’ll introduce an artificial delay of 10 seconds.

Result: Anything loaded after that period will not be recorded in the prefetch file.
	



6. Bonus - Bug!
Fortunately this bug cannot be reproduced reliably, so it won’t cause problems for forensic examinations.

