![Logo](/assets/images/tricks.png)

[The Prefetch file](http://www.forensicswiki.org/wiki/Windows_Prefetch_File_Format) format has been studied extensively. 
There is a lot of research on this subject already, so I won’t reinvent any wheels. 
Feel free to skip the background information, which is mostly for me to have things clear in my mind before starting to work. 
If you’re not familiar with the topic, I strongly encourage you to go straight to [Forensic Magazine](https://www.forensicmag.com/) 
and read **Decoding Prefetch Files for Forensic Purposes**  [Part 1](https://www.forensicmag.com/article/2010/12/decoding-prefetch-files-forensic-purposes-part-1)  
and [Part 2](https://www.forensicmag.com/article/2010/12/decoding-prefetch-files-forensic-purposes-part-2).

As detailed below, among the artefacts listed in the prefetch files are libraries loaded by our applications. In this post we’ll see how the process of recording these libraries works in different scenarios, and also how it can be tricked. 

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

