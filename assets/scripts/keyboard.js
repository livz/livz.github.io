// Navigate previous/next entry VIM style
function blogNav(key) {
  if ( key === 'h' ) {
    var navPrev = document.querySelectorAll(".PageNavigation .prev")
    window.location.href = navPrev[0].href;
  } else if (key === 'l' ) {
    var navNext = document.querySelectorAll(".PageNavigation .next")
    window.location.href = navNext[0].href;
  }
}

Mousetrap.bind({
  'g h': function() {	window.location.href = "/"; },
  'g b': function() {	window.location.href = "/blog"; },
  'g c': function() { window.location.href = "/cheat-sheets"; },
  'g t': function() { window.location.href = "/tips"; },
  'g a': function() { window.location.href = "/about"; },
  'h': function() { blogNav('h'); },
  'l': function() { blogNav('l'); },
})
