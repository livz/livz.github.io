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
Intuitive, easy to use GUI interface.
Timeline of the events frame by frame
Color codes and thickness of the lines
Search within the graph
With visual representation of the results 
And show when they occurred on the timeline
Group nodes by categories to reduce clutter and make navigation easier (e.g. Cookies, htmL, JS)
Filters (for IP addresses/hostnames, registry, files) to reduce clutter
Already set up filters to exclude common events and false positives
The only missing feature I would like to see is easier navigation between the an event and its trigger (e.g. click a “Create Thread” edge and go to the source, as in IDA Pro graph view)

## Conclusion
The question is “Will I use it for the future?” I believe Procdot is useful and will test it to in different scenarios. I’m planning to analyse a few different infections: a stealthy process injection technique, ransomware and a remote access trojan. 

