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

// Go to previous/next post/tip/...
function blogNav(key) {
  if ( key === 'h' ) {
    var navPrev = document.querySelectorAll(".PageNavigation .prev")
    window.location.href = navPrev[0].href;
  } else if (key === 'l' ) {
    var navNext = document.querySelectorAll(".PageNavigation .next")
    window.location.href = navNext[0].href;
  }
}

// Bind keys
Mousetrap.bind({
  'g h': function() { window.location.href = "/"; },
  'g b': function() { window.location.href = "/blog"; },
  'g c': function() { window.location.href = "/cheat-sheets"; },
  'g t': function() { window.location.href = "/tips"; },
  'g a': function() { window.location.href = "/about"; },
  'h':   function() { blogNav('h'); },
  'l':   function() { blogNav('l'); },
  'j':   function() { entriesNav('j'); },
  'k':   function() { entriesNav('k'); },
  '?':   function() { overlayOn(); },
  'esc': function() { overlayOff(); },

})
