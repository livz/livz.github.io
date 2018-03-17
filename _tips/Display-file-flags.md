---
title: Display File Flags And Attributes
layout: tip
date: 2017-01-27
---

## Overview

MacOS introduced a non-standard ```ls``` option, not present in the [official man page](http://man7.org/linux/man-pages/man1/ls.1.html), to display file flags and attributes when using long output:
```
  -O      Include the file flags in a long (-l) output.
```

For example, in the following listing the ```ls``` system utility has the **_compressed_** and **_restricted_** flags:
```bash
$ ls -alO /bin/ls
-rwxr-xr-x  1 root  wheel  restricted,compressed 38624 15 Jul  2017 /bin/ls
```

The ```restricted``` flag is covered in [this tip](http://craftware.xyz/tips/Disable-rootless.html) and the ```compressed``` attribute will have its own tip :)
