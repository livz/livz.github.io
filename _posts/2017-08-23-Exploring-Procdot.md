---
categories: [Deep-Dive]
---

![Logo](/assets/images/procdot/logo.png)

## Motivation
There are numerous free security related analysis tools online and more of them are being written every day. A lot of times we see them, share some Twitter links and that’s about it. Which is a shame because many are useful and potentially extendable to suit our very specific needs. 

Next time we see an interesting project on Github, why not spend a little time to see what the tool can do, whether it's really suitable for our current tasks, and if so, how to use it properly? In this post I want to look at one such tool - [ProcDOT](http://procdot.com/). 

## Tool
Procdot is a free tool created by Christian Wojne from CERT.at. It runs on Windows and Linux with very few dependencies. The tool has the capability to parse Procmon data *and* correlate it with PCAP information to produce a graph of the events that have taken place. In some cases this makes the visual analysis of malware a lot easier and helps to spot oddities quicker. More about its cool features later.

## Getting started
First make sure to check the official [documentation](http://www.procdot.com/onlinedocumentation.htm). Then, to quickly get going with the analysis:
* Download [Procdot binaries](http://procdot.com/downloadprocdotbinaries.htm) for your platform
* Download and install [Windump](http://www.winpcap.org/windump/install/default.htm)
* Download and install [Graphviz](http://www.graphviz.org/download_windows.php)
* Configure Procdot options as suggested [here](http://www.procdot.com/onlinedocumentation.htm)
* Very important, configure Procmon also as suggested in the readme.txt file (yes, you have to read the readme.txt file!):
* Disable (uncheck) *"Show Resolved Network Addresses"* (*Options* menu)
* Disable (uncheck) *"Enable Advanced Output"* (*Filter* menu)
* Don’t show the the *"Sequence"* column (*Options -> Select Columns*)
* Show the *"Thread ID"* column (*Options -> Select Columns*)

Finally, when exporting from Procmon, remember to use the CSV output file format.

## Walkthrough 
This section and the next are a concise overview of some of the features *I* found to be interesting and useful. For the full list of features check the website. In a nutshell, ProcDOT shows information about the files accessed by the processes, Windows registry keys, network communication, spawned processes and threads and more. Also, a few [analysis tutorials](http://www.procdot.com/videos.htm) are available on the official website. Check them out as well.

To get a feeling of its features, I’ll use Procmon data only (no PCAP), captured during a drive-by infection, exploiting a vulnerable Flash player. The attack vector is not important here really. I want to understand if I can use Procdot to:
* Provide me with some starting points for in-depth analysis
* Understand the correlation between events (processes, file writes, registry keys)

## Features
* The GUI interface is **intuitive and easy to use**. You can nagivate quickly between events, zoom in/out, and get a picture of what's happened:

<a href="/assets/images/procdot/pd1-large.png">
<img alt="Navigate events" src="/assets/images/procdot/pd1.png" class="figure-body">
</a>

* **Colors code** and thickness of the lines quickly show *hot places*:

<img src="/assets/images/procdot/pd2.png" alt="Colours code" class="figure-body">

* Events are aranged on a **timeline**, and you can actually *watch* them as they happened. You can adjust the number of frames per second and switch between the normal and frame mode using Enter key:

<img src="/assets/images/procdot/timeline.gif" alt="Tmeline" class="figure-body">

* There is a good **search functionality**. Results are *visually highlighted on the graph* and *on the timeline*. In the screenshot below I was searching for *iexplore*, a good candidate for drive-by infections:

<a href="/assets/images/procdot/pd3-large.png">
<img alt="Graph" src="/assets/images/procdot/pd3.png" class="figure-body">
</a>

* Ability to **group multiple nodes** into pre-established categories (e.g. Cookies, HTML, JS) to reduce clutter and make navigation easier. Observe in the image below how the suspicious file __*C0DE.tmp*__ is immediately visible once we de-cluttered the graph:

<a href="/assets/images/procdot/pd4-large.png">
<img alt="Multiple nodes" src="/assets/images/procdot/pd4.png" class="figure-body">
</a>

* The final nice feature I wanted to mention is **filters**. Also to reduce clutter, you can create exclusion rules for IP addresses or hostnames, registry entries and files. There are also some already configured filters related to common windows events and false positives (Remember, *Procmon* also has something similar). 

## Conclusion
One missing feature I would like to see is *quicker navigation between an event and its trigger*, à la IDA Pro graph view (e.g. clicking an edge named _Create Thread_ should go to the the source of the event). And since I've mention IDA, the possibility to reposition nodes on the graph  would be nice also, but not essential ;)

The question is “Will I use it in the future?” I believe Procdot is useful and will test it in different scenarios. I’m planning to analyse a few different infections: a stealthy process injection technique, ransomware and a remote access trojan, and update this in case I find more cool features.

If you're interested in a reverse engineering ransomeware hands-on tutorial and learn to reverse and decrypt some ransomware along the way, check out [this course](https://www.udemy.com/course/advanced-ransomware-reverse-engineering/?referralCode=54910378D37BD6EEC551)! Very recommended for intermediate and advanced.
Or, if you're interested to cover the basics, see [this one](https://www.udemy.com/course/reverse-engineering-ransomware/?referralCode=DBF9302936C660084635).

