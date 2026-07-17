// Picks a random quote from #quotes-data and renders it into #quote-of-the-day
// on every page load (client-side, so it's fresh per refresh, not per Jekyll build).
(function () {
  var dataEl = document.getElementById('quotes-data');
  var container = document.getElementById('quote-of-the-day');
  if (!dataEl || !container) return;

  var quotes;
  try {
    quotes = JSON.parse(dataEl.textContent);
  } catch (e) {
    return;
  }
  if (!quotes || !quotes.length) return;

  var quote = quotes[Math.floor(Math.random() * quotes.length)];
  var textEl = container.querySelector('p');
  var citeEl = container.querySelector('cite');

  if (textEl) textEl.textContent = quote.text;
  if (citeEl) {
    if (quote.author) {
      citeEl.textContent = quote.author;
    } else {
      citeEl.remove();
    }
  }
})();
