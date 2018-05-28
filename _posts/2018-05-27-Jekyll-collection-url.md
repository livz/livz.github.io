---
title: Implement'post_url' for Collections in Jekyll
layout: post
date: 2018-05-27
published: true
categories: [Experiment]
---

![Logo](/assets/images/jekyll-logo.png)



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
