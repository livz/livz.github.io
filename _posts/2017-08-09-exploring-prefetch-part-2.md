![Logo](/assets/images/tricks2.png)

In the [first part](https://livz.github.io/2017/06/29/exploring-prefetch-part-1.html) of this blog post we explored 
the way Windows stores information in the prefetch files, more specifically the loaded libraries and opened files.
We saw how in some cases one could prevent this completely and no library traces will be present in the .pf files. 
Next let's check whether one could hide even the traces of a binary being run from the prefetching process. 

For a bit of context on the subject of prefetch files, check the first part of this blog or use your favourite search engine.  

## Listing executables
So let’s see different ways of *running code*, using either slightly manipulated traditional binaries
or normal executables started in unusual ways.

### TLS callbacks only

[**Threa local storage (TLS)**](https://msdn.microsoft.com/en-us/library/windows/desktop/ms686749(v=vs.85).aspx) is a mechanism 
to provide unique data for each thread within a process. We can define *TLS callbacks* functions, which are executed 
__*before the main entry point*__ of the application. This trick is already abused by malware in order to evade debuggers. 
If a debugger is not configured properly, it will break the execution on the main function, which is *after* the TLS callbacks hae been executed. For more on TLS callbacks, check [these](http://waleedassar.blogspot.co.uk/2010/10/quick-look-at-tls-callbacks.html) [posts](http://www.hexblog.com/?p=9).

**Result**: Even if a TLS callback terminates the execution of the program way before the main function, a corresponding 
prefetch file will still be created for the application.

**Code**: [TLS callbacks](https://gist.github.com/livz/47d128220af3357a0616fb2f762ddcfd).

###  Vary the executable file type

Next let's check whether all the executable files supported by Windows are logged properly. We can rename an EXE to one of the following extensions, and Windows will happily run it without any problems: **.bat, .cmd, .scr, .com, .pif**. For an extensive list of 
executable file extensions, check [this](https://www.lifewire.com/list-of-executable-file-extensions-2626061).

**Result**: All the executable formats are correctly logged by the prefetching process. 

### Use random extensions

Instead of changing the executable file type, we can use any extension for the file we want to run. The code below uses
the standard [CreateProcess API](https://msdn.microsoft.com/en-us/library/windows/desktop/ms682425(v=vs.85).aspx) in order to launch binaries with random extensions.

**Result**: No matter what file extension we use for the binary, a prefetch file will still be created, having the corresponding name.

**Code**: [CreateProcess with any extension](https://gist.github.com/livz/1c541884f88aac382392344137be9620)

### Create suspended process

What if we create the process in suspended mode, wait for a while, then resume execution?

**Result**: Even if its execution is delayed by more than 10 seconds (the default time the prefetching process 
monitors new processes for loaded libraries), a prefetch file is still created after the process resumes execution (either by itself or if it is resumed manually).

**Code**: [CreateProcess suspended](https://gist.github.com/livz/cea4225c96036c4cbdc567d059c07487)

### Start application from ADS

We can hide an application in an [*alternate data stream*](https://blogs.technet.microsoft.com/askcore/2013/03/24/alternate-data-streams-in-ntfs/). This is an ancient feature of NTFS filesystem, already documented and covered elsewhere. What is not so well-known is that you can have ADSs attached to files *but also to folders*. 

**Result**: When launching an application hidden in an ADS for a file/folder, a prefetch file *does get created*,  but has the name of the file/folder containing the ADS. Although this is good news, it opens the possibility to hide executed binaries in files/folders *having the same name as already existing files/folders in the Prefetch folder*. If in doubt, try this for yourself using the code below.

**Code**: [CreateProcess from ADS](https://gist.github.com/livz/bfcdef45aae1e4a3e789097333e442d3)

### CreateProcess with run-time loading

Another idea to trick the prefetching system is to load the APIs relevant to process creation at run-time, similarly with the technique from the part 1 of this blog post.

**Result**: As expected, a corresponding prefetch file is still created, no matter how we call the API.

**Code**: [CreateProcess run-time loading of libraries](https://gist.github.com/livz/7be971ca570434ed9e0700fa0bd18a21)

### Process hollowing

[*Process hollowing*](http://resources.infosecinstitute.com/process-hallowing) or [*RunPE*](https://www.adlice.com/runpe-hide-code-behind-legit-process/) is another well-known technique for malware writers. The side-effect of this method: a prefectch file is created for the initial legitimate host process, before being injected with malicious code.

**Result**: As it performs process injection, only the original host process is logged. However, there should be a corresponding entry in Prefetch folder for the process which performed the process injection in the first place.

### RunDLL

Another heavily abused legitimate Windows binary is RunDll32.exe. We could store our code in a shared library and launch it using RunDLL32, which is normally used to start functions inside DLL libraries.

**Result**: We would achieve the goal of bypassing Prefetch only partially, because rundll32 binary will still get logged.

### Regsvr

Similarly, the [regsvr32 utility](https://en.wikipedia.org/wiki/Regsvr32) is used to register and unregister DLLs and ActiveX controls. If the library exports two functions named *DllRegisterServer* and *DllUnregisterServer*, they will be called when register/unregister the library. 

**Code**: [This code](https://gist.github.com/subTee/f6123584a3258783e497481690ccc38d) uses the technique mainly to bypass application whitelisting software. You can use it to play with Prefetch creation as well.

**Result**: Same as before, only partial stealth is achieved, because regsvr32 binary will still get logged.

### 16 bit executables

In a final effort to bypass the prefetching process, I was curious what happens with 16-bit (yes, *sixteen!*) COM executables. 

**Result**: The file name is not logged but then again 16-bit??? Not the most useful trick. Even though a corresponding .pf file is not created for the COM file, one is created for [NTVDM](https://en.wikipedia.org/wiki/Virtual_DOS_machine), the virtual machine responsible for running 16-bit DOS files. A weird thing I've noticed, if the prefetch file for NTVDM is deleted, it won't be created again on subsequent runs of the application.

**Code**: ```X5O!P%@AP[4\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*```


### Summary

Technique | Prefetch bypass
--- | --- 
**TLS Callbacks** | NO
**Other executable extension** | NO
**Random extension** | NO
**Suspended process** | NO
**File/folder ADSs** | YES
**Run-time dll loading** | NO
**Process hollowing** | Partially
**Rundll32** | Partially
**Regsvr32** | Partially
**DOS files** | YES
