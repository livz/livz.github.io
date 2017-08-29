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
If the debugger is not configured properly, it will break the execution on the main function, which is *after* the TLS callbacks 
hae been executed. For more on TLS callbacks, cheks [these](http://waleedassar.blogspot.co.uk/2010/10/quick-look-at-tls-callbacks.html) 
[posts](http://www.hexblog.com/?p=9).


**Result**: As expected, libraries loaded this way appear in the prefetch file.

**Code**: [TLS callbacks](https://gist.github.com/livz/47d128220af3357a0616fb2f762ddcfd).
* __Explicit linking__
