![Logo](/assets/images/tricks2.png)

In the [first part](https://livz.github.io/2017/06/29/exploring-prefetch-part-1.html) of this blog post we explored 
the way Windows records information in the prefetch files, more specifically the loaded libraries and opened files.
We saw how in some cases one could prevent this completely and no library traces will be present in the .pf files. 
Next let's check whether one could hide even the traces of a binar ybeing run from the prefetching process. 

For a bit of context on the subject of prefetch files, check the first part of this blog or use your favourite search engine.  

## Recording executables
So let’s see different ways of *running code*, using either slightly manipulated traditional binaries
or normal executables started in unusual ways.

### __TLS callbacks only__

[**Threa local storage (TLS)**](https://msdn.microsoft.com/en-us/library/windows/desktop/ms686749(v=vs.85).aspx) is a mechanism 
to provide unique data for each thread within a process. We can define *TLS callbacks* functions, which are executed 
*before the main entry point* of the application. This trick is already abused by malware in order to evade debuggers. 
If the debugger is not configured properly, it will break the execution on the main function, which is *after* the TLS callbacks hae been executed. For more on TLS callbacks, check [these](http://waleedassar.blogspot.co.uk/2010/10/quick-look-at-tls-callbacks.html) [posts](http://www.hexblog.com/?p=9).

**Result**: Even if a TLS callback terminates the execution of the program way before the main function, a corresponding 
prefetch file will still be created for the application.

**Code**: [TLS callbacks](https://gist.github.com/livz/47d128220af3357a0616fb2f762ddcfd).

###  __Vary the executable file type__

Next let's check whether all the executable files supported by Windows are recorded properly. We can rename an EXE to one of the following extensions, and Windows will happily run it without any problems: *.bat, .cmd, .scr, .com, .pif**. For an extensive list of 
executable file extensions, check [this](https://www.lifewire.com/list-of-executable-file-extensions-2626061).

**Result**: All the executable formats are correctly recorded by the prefetching process. 

### __Use random extensions__

Instead of changing the executable file type, we can use any extension for the file we want to run. The code below uses
the standard [CreateProcess API](https://msdn.microsoft.com/en-us/library/windows/desktop/ms682425(v=vs.85).aspx) in order to launch binaries with random extensions.

**Result**: No matter what file extension we use for the binary, a prefetch file will still be created, having the corresponding name.

**Code**: [CreateProcess with any extension](https://gist.github.com/livz/1c541884f88aac382392344137be9620)

### __Create suspended process__

What if we create the process in suspended mode, wait for a while, then resume execution?

**Result**: Even if its execution is delayed by more than 10 seconds - the default time the prefetching process 
monitors new processes for loaded libraries, a prefetch file is still created after the process resumes execution by itself or if it is resumed manually.

**Code**: [CreateProcess suspended](https://gist.github.com/livz/cea4225c96036c4cbdc567d059c07487)

### __Start application from ADS

We can hide an application in an [*alternate data stream*](https://blogs.technet.microsoft.com/askcore/2013/03/24/alternate-data-streams-in-ntfs/). This is an ancient feature of NTFS filesystem, already documented and covered elsewhere. What is not so well-known is that you can have ADSs attached to files *but also to folders*. 

**Result**: When launching an application hidden in an ADS for a file/folder, a prefetch file *does get created*,  but has the name of the file/folder containing the ADS. Although this is good news, it opens the possibility to hide executed binaries in files/folders *havine the same name as already existing files/folders in the Prefetch folder*. If in doubt, try this for yourself using the code below.

**Code**: [CreateProcess from ADS])https://gist.github.com/livz/bfcdef45aae1e4a3e789097333e442d3)

for file		→ name of file recorded
for directory	→ name of file recorded

