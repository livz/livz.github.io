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

## Walkthrough 

### Function call and parameters
We cannot create *functions* per-se but we can include another file that would perform all the logic and return a result. In GitHub Pages I've added a file called ```findCollectionItem.html``` in the ```_includes``` folder.

To call a function and pass any desired parameters, we'd have to do something like this:

```liquid
{% include myFunction.html param1='valParam1' param2='valParam2' %}
```

### Return value
We cannot specifically return a value. The result of the *include* would be any output of evaluating the instructions in the file. For my purpose this was fine since I want to search a post and return its URL. *Almost!*

There is one small problem. We would also see all the blank spaces and new lines from the included HTML file. In general, this is not desirable. In this case, the link would end up unrecognisable as an actual URL. The workaround I've used for this involves stripping the new lines *after we include the HTML file*:

```liquid
{% capture itemLink %} 
{% include findCollectionItem.html param1='valParam1' param2='valParam2' %}
{% endcapture %}
{{ itemLink | strip_newlines }}
```

Another option would be to put all the instructions outside the comment block in one line, but this would not look nice and make any maintenance of the code a burden. 

### Full code

```liquid
{% include myFunction.html param1='valParam1' param2='valParam2' %}

{% comment %}
  Workaround to create a function in Jekyll that returns an item's URL from a collection, other than posts.
  
  Parameters:
  {{ include.collectionName }}    - Name of the colelction to search into
  {{ include.itemTitle }}         - Title of the item

  Call example:
  {% capture itemLink %}{% include findCollectionItem.html collectionName='col' itemTitle='my title' %}{% endcapture %}{{ itemLink | strip_newlines }}

  Return:
  Full URL of the item, if found.
{% endcomment %}

{% assign myCollection = site.collections | where: "label", include.collectionName | first %}

{% assign tip = myCollection.docs | where: "title", include.itemTitle | first %}

{{ site.url}}{{ tip.url | prepend: site.baseurl }}
```
