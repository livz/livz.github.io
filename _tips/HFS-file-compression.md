---
title: File Compression In HFS+
layout: tip
date: 2017-09-23
---

# Overview

* A strong feature of HFS+ is that it implements __*transparent file compression*__. All MacOS utilities silently perform decompression on the fly.
* Compressed data is placed in the _resource fork_. 
* Compressed files have an additional extended attribute, _**com.apple.decmpfs**_. 

*__Note__*: For small compressed files, their data is actually _stored uncompressed in the extended attribute_ itself.

# Understanding file compression

#### How to find out if a file is compressed?

Just list the extended attributes and check for ```compressed```:
```bash
$ ls -alhO /bin/bash
-r-xr-xr-x  1 root  wheel  restricted,compressed  612K 15 Jul  2017 /bin/bash

$ du -sh /bin/bash
344K	/bin/bash
```

Notice the difference between the sizes reported by ```du``` and ```ls``` utilities!

#### How to find out if a file has a resource fork?

Append ```/..namedfork/rsrc/``` to the file name when listing:

```bash
$ ls -alO /bin/bash/..namedfork/rsrc/
ls: /bin/bash/..namedfork/rsrc/: Not a directory
```

Remember that for small compressed files, the data is not stored in a resource fork but in the extended attribute itself!

Not even ```xattr``` reports correctly the _```com.apple.decmpfs```_ attribute:
```bash
$ xattr -p com.apple.decmpfs /bin/bash
xattr: /bin/bash: No such xattr: com.apple.decmpfs
```

#### Working with compressed files

We can create or move around compressed files using ```ditto (1)``` built-in utility. The following flags are relevant to HFS+ compression:

```
--hfsCompression
  When copying files or extracting content from an archive, if the destination is an HFS+ volume that supports compression, all the
  content will be compressed if appropriate. This is only supported on Mac OS X 10.6 or later, and is only intended to be used in
  installation and backup scenarios that involve system files. Since files using HFS+ compression are not readable on versions of Mac
  OS X earlier than 10.6, this flag should not be used when dealing with non-system files or other user-generated content that will
  be used on a version of Mac OS X earlier than 10.6.

--nohfsCompression
  Do not compress files with HFS+ compression when copying or extracting content from an archive unless the content is already com-
  pressed with HFS+ compression.  This flag is only supported on Mac OS X 10.6 or later.  --nohfsCompression is the default.

--preserveHFSCompression
  When copying files to an HFS+ volume that supports compression, ditto will preserve the compression of any source files that were
  using HFS+ compression.  This flag is only supported on Mac OS X 10.6 or later.  --preserveHFSCompression is the default.

--nopreserveHFSCompression
  Do not preserve HFS+ compression when copying files that are already compressed with HFS+ compression. This is only supported on
  Mac OS X 10.6 or later.
``` 
 
#### Reveal the resource fork

Using ```ditto``` with ```--hfsCompression``` we can copy a file to an HFS+ volume _and apply compression_:

```bash
$ ditto --hfsCompression book.txt bookComp.txt

$ ls -alhO@ book*
-rw-r--r--  1 m  staff  -           278K 19 Mar 11:33 book.txt
-rw-r--r--  1 m  staff  compressed  278K 19 Mar 11:33 bookComp.txt

$ du -sh book*
280K	book.txt
116K	bookComp.txt

$ ls -al bookComp.txt/..namedfork/rsrc
-rw-r--r--  1 m  staff  0 19 Mar 11:33 bookComp.txt/..namedfork/rsrc
```
