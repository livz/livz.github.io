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

**_This is important!_** The name of the corresponding .pf file depends on the path of the application.

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

