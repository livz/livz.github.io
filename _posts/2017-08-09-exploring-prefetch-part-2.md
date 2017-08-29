![Logo](/assets/images/tricks2.png)

In the [first part](https://livz.github.io/2017/06/29/exploring-prefetch-part-1.html) of this blog post we explored 
the way Windows records information in the prefetch files, more specifically the loaded libraries and opened files.
We saw how in some cases one could prevent this completely and no library traces will be present in the .pf files. 
Next let's check whether one could hide even the traces of a binar ybeing run from the prefetching process. 

For a bit of context on the subject of prefetch files, check the first part of this blog or use your favourite search engine.  

## Recording executables
So let’s see different ways of *running code*, using either slightly manipulated traditional binaries
or normal executables started in unusual ways.

* __TLS callbacks only__

[**Threa local storage (TLS)**](https://msdn.microsoft.com/en-us/library/windows/desktop/ms686749(v=vs.85).aspx) is a mechanism 
to provide unique data for each thread within a process. We can define *TLS callbacks* functions, which are executed 
*before the main entry point* of the application. This trick is already abused by malware in order to evade debuggers. 
If the debugger is not configured properly, it will break the execution on the main function, which is *after* the TLS callbacks hae been executed. For more on TLS callbacks, check [these](http://waleedassar.blogspot.co.uk/2010/10/quick-look-at-tls-callbacks.html) [posts](http://www.hexblog.com/?p=9).

**Result**: Even if a TLS callback terminates the execution of the program way before the main function, a corresponding 
prefetch file will still be created for the application.

**Code**: [TLS callbacks](https://gist.github.com/livz/47d128220af3357a0616fb2f762ddcfd).
* __Vary the file extension__

Next let's check whether all the executable files supported by Windows are recorded properly. We can rename an EXE to one of the following extensions, and Windows will happily run it without any problems: *.bat, .cmd, .scr, .com, .pif**. For an extensive list of 
executable file extensions, check [this](https://www.lifewire.com/list-of-executable-file-extensions-2626061).

**Result**: All the executable formats are correctly recorded by the prefetching process. 
