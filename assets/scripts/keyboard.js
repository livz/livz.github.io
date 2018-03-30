// Navigate previous/next entry VIM style
function entriesNav(key) {
  var mainContent = document.getElementById("main_content");
  var currentList = mainContent.getElementsByTagName("ul")[0];
  var currentClass = currentList.className
  var listEntries = [].slice.call(currentList.getElementsByTagName("li"));

  var idx = -1; 

  var currentfocus = document.activeElement; 

  // get current post index
  if ( currentfocus.parentElement.parentElement.className === currentClass ) {
    idx = listEntries.indexOf(currentfocus.parentElement)
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
})
