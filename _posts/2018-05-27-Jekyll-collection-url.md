---
title: Implement post_url for Collections in Jekyll
layout: post
date: 2018-05-27
published: true
categories: [Experiment]
---

![Logo](/assets/images/jekyll-logo.png)

## Overview
* **Linking to posts** - If you want to include a link to a post on your site, the ```post_url``` tag will generate the correct permalink URL for a post you specify by name, *without the .md extension*. For example:

```liquid
{{ site.baseurl }}{% post_url 2018-01-25-My-new-post %}
```
* One advantage of using the ```post_url``` tag is **link validation**. If the link doesn’t exist, Jekyll won’t build your site and will alert you on a broken link.

* Unfortunately, there's __no equivalent of *post_url* for custom collections__. There is, however, a closed [feature request](https://github.com/jekyll/jekyll/issues/2252) which states that the functionality would not be implemented due to various constraints.  

* In this context I was looking for an acceptable workaround, possibly a function that would search items and return their URLs. But **Jekyll doesn't support functions** so I needed *a workaround for the workaround* :)
