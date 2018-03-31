---
title: Batch Convert Images With SIPS
layout: tip
date: 2017-05-06
categories: [Howto]
---

## Overview

**_sips_** is a very useful built-in utility on MacOS for _scriptable image processing_. It can do a lot of stuff, but let's see a few handy use cases:

1. Convert multiple images from one format to another (e.g. _jpg_ to _png_):

```bash
$ mkdir PNGs
$ sips -s format png *.jpg --out PNGs
```
2. Find and convert only selected images:

```bash
$ find . -iname "*.jpg" -type f -exec sh -c 'sips -s format png "$0" --out "${0%}.png"' {} \;
```
3. Convert and change image quality (e.g. 60%):

```bash
$ sips -s format png -s formatOptions 60 *.jpg -o *.png
```

