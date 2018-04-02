---
title: "Control Website Using Shortcuts"
layout: post
date: 2017-02-25
published: false
categories: [Experiment]
---

![Logo](/assets/images/mousetrap.png	)

## Overview

[Mousetrap](https://craig.is/killing/mice) is a JavaScript library for handling keyboard shortcuts developed by [Craig Campbell](https://craig.is). It is a small standalone **4kb** file *with no external dependencies* that can be easily integrated with your Jekyll website on Github pages. That's what I've done here and with a bit of extra code I've added navigation for all the sections on this website. It works flawlessly!

## How To

### Step 1 - Prerequisites

Get both of the following from the author's website:

* **Mousetrap** - Download the minified version from [here](https://craig.global.ssl.fastly.net/js/mousetrap/mousetrap.min.js?a4098).
* **Bind Dictionary** - Handy [plugin](https:/github.com/ccampbell/mousetrap/tree/master/plugins/bind-dictionary) that allows you to bind multiple key events in a single call.

Add the two scripts to your website and create a third one for your code:

```javascript
<!-- load mousetrap -->
<script type="text/javascript" src="/assets/scripts/mousetrap.min.js"> </script>

<!-- load mousetrap bind dictionary plugin -->
<script type="text/javascript" src="/assets/scripts/mousetrap-bind-dictionary.min.js"> </script> 

<!-- load custom keyboard shortcuts -->
<script type="text/javascript" src="/assets/scripts/keyboard.js"> </script>
```

### Step 2 - Add navigation code

#### Navigation to sub-pages

This is very straight-forward. I've the following mnemonics: **g h** - *Go Home*, **g b** - *Go Blog*, etc.

```javascript
// Bind keys
Mousetrap.bind({
  'g h': function() { window.location.href = "/"; },
  'g b': function() { window.location.href = "/blog"; },
  'g c': function() { window.location.href = "/cheat-sheets"; },
  'g t': function() { window.location.href = "/tips"; },
  'g a': function() { window.location.href = "/about"; },
  [..]
}
```

#### Navigate to next/previous post

You can also navigate between posts or elements from a custom collection. Since I already had links pointing to the previous and next entries, it was just a matter of selecting them from JS:

```javascript
function blogNav(key) {
  if ( key === 'h' ) {
    var navPrev = document.querySelectorAll(".PageNavigation .prev")
    window.location.href = navPrev[0].href;
  } else if (key === 'l' ) {
    var navNext = document.querySelectorAll(".PageNavigation .next")
    window.location.href = navNext[0].href;
  }
}
```

#### Navigate through lists

To make keyboard navigation possible within all the sections of the website, I've added shortcuts to cycle through post lists and categories entries, Vim-style using *h/j/k/l*. Developer Tools was really useful to test the JavaScript code and understand the structure of the website and how to locate list elements.

```javascript
// Navigate previous/next entry VIM style
function entriesNav(key) {
  var mainContent = document.getElementById("main_content");
  var listEntries = [];
  
  if (document.getElementById("archives")) {
    var lists = mainContent.getElementsByTagName("ul");
    
    for (var i=0; i<lists.length; i++){
      var currListEntries = [].slice.call(lists[i].getElementsByTagName("li")); 

      for (var j=0; j<currListEntries.length; j++) {
        listEntries.push(currListEntries[j]);
      }
    }
  } else {
    var currentList = mainContent.getElementsByTagName("ul")[0];
    listEntries = [].slice.call(currentList.getElementsByTagName("li"));
  }

  var currentClass = mainContent.getElementsByTagName("ul")[0].className;
  var idx = -1;
  var currentfocus = document.activeElement; 

  // Get current post index
  if ( currentfocus.parentElement.parentElement) {
    if ( currentfocus.parentElement.parentElement.className === currentClass ) {
      idx = listEntries.indexOf(currentfocus.parentElement)
    }
  }

  // Adjust post index
  if ( key === 'j' && idx < listEntries.length - 1 ) {
    idx++;
  } else if (key === 'k' && idx > 0 ) {
    idx--;
  }

  // Move focus to the link
  listEntries[idx].getElementsByTagName("a")[0].focus();
}
```


### Bonus - Overlay help window

You might also want to add a nice overlay window with the shortcuts. I'm not going to include more code here. Again, Developer Tools is amazing :)
