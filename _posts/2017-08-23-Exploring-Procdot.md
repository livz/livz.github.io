![Logo](/assets/images/procdot/logo.png)

## Motivation
There are numerous security related analysis tools on Github and more of them are being written every day. A lot of times we see them, share some Twitter links and that’s about it. Which is a shame because many are useful and potentially extendable to suit our very specific needs. 

Next time we see an interesting project on Github, why not spend a little time to see what the tool can do, is it really suitable for our current tasks, and if so, how to use it properly? In this post I want to look at ProcDOT. 

## Tool
Procdot is a free tool created by Christian Wojne from CERT.at. It runs on Windows and Linux with very few dependencies. The tool has the capability to parse Procmon data *and* correlate it with PCAP information to produce a graph of the events that have taken place. In some cases this makes the visual analysis of malware a lot easier and helps to spot oddities quicker. More about cool features later.

## Getting started
First make sure to check the official [documentation](http://www.procdot.com/onlinedocumentation.htm). Then, to quickly get going with the analysis:
Download [Procdot binaries](http://procdot.com/downloadprocdotbinaries.htm) for your platform
Download and install [Windump](http://www.winpcap.org/windump/install/default.htm)
Download and and install [Graphviz](http://www.graphviz.org/download_windows.php)
Configure Procdot options as suggested [here](http://www.procdot.com/onlinedocumentation.htm)
Very important, configure Procmon also as suggested in the readme.txt file (yes, you have to read the readme.txt file!):
Disable (uncheck) *"Show Resolved Network Addresses"* (*Options* menu)
Disable (uncheck) *"Enable Advanced Output"* (*Filter* menu)
Don’t show the the *"Sequence"* column (*Options -> Select Columns*)
Show the *"Thread ID"* column (*Options -> Select Columns*)
Finally, when exporting from Procmon, use the CSV output file format

## Walkthrough 
This section and the next are a concise overview of some of the features *I* found to be interesting and useful. For the full list of features check the website. In a nutshell, ProcDOT shows information about the files accessed by the processes, Windows registry keys, network communication, spawned processes and threads and more. Also, a few [analysis tutorials](http://www.procdot.com/videos.htm) are available on the official website. Check them out as well.

To get a feeling of its features, I’ll use Procmon data only (no PCAP), captured during a drive-by infection, exploiting a vulnerable Flash player. The attack vector is not important here really. I want to understand if I can use Procdot to :
provide me with some starting points for in-depth analysis,
Understand the correlation between events (processes, file writes, registry keys)

## Features
* The GUI interface is **intuitive and easy to use**. You can nagivate quickly between events, zoom in/out, and get a picture of what's happened:

[ ![](/assets/images/procdot/pd1.png) ](/assets/images/procdot/pd1-large.png)

* **Colors code** and thickness of the lines quickly show *hot places*:

![Colors code](/assets/images/procdot/pd2.png)

* Events are aranged on a **timeline**, and you can actually *watch* them as they happened. You can adjust the number of frames per second and switch between the normal and frame mode using Enter key:

![Tmeline](/assets/images/procdot/timeline.gif)


* There is a good **search functionality**. Results are *visually highlighted on the graph* and *on the timeline*:

[ ![](/assets/images/procdot/pd3.png) ](/assets/images/procdot/pd3-large.png)

* Ability to **group multiple nodes** into pre-established categories (e.g. Cookies, htmL, JS) to reduce clutter and make navigation easier. Observe in the image below how the suspicious *C0DE.tmp* is immediately visible once we de-cluttered the graph:

[ ![](/assets/images/procdot/pd4.png) ](/assets/images/procdot/pd4-large.png)

* The final nice feature I wanted to mention is **filters**. Also to reduce clutter yo ucan set up exclusion rules for IP addresses or hostnames, registry entries and files. There are also some already configured filters related to common windows events and false positives (Remember *Procmon* also has something similar). 

* One missing feature I would like to see is *quicker navigation between the an event and its trigger*, à la IDA Pro graph view (e.g. clicking an edge named “Create Thread” should go to the the source of the event). And since I've mention IDA, the possibility to reposition nodes on the graph  would be good also, but not essential.

## Conclusion
The question is “Will I use it for the future?” I believe Procdot is useful and will test it to in different scenarios. I’m planning to analyse a few different infections: a stealthy process injection technique, ransomware and a remote access trojan. 

