document.addEventListener('DOMContentLoaded', function () {
  var dateEl = document.querySelector('meta[name="article-date"]');
  var authorEl = document.querySelector('meta[name="article-author"]');

  if (!dateEl && !authorEl) {
    return;
  }

  var article = document.querySelector('article.bd-article');
  if (!article) {
    return;
  }

  var heading = article.querySelector('h1');
  if (!heading) {
    return;
  }

  var formatted = [];
  if (dateEl) {
    var isoDate = dateEl.getAttribute('content');
    var parsedDate = new Date(isoDate);
    if (!Number.isNaN(parsedDate.valueOf())) {
      formatted.push(
        'Published: ' +
          parsedDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
      );
    } else {
      formatted.push('Published: ' + isoDate);
    }
  }

  if (authorEl) {
    formatted.push('By ' + authorEl.getAttribute('content'));
  }

  if (!formatted.length) {
    return;
  }

  var metaDiv = document.createElement('div');
  metaDiv.className = 'article-metadata';
  metaDiv.textContent = formatted.join(' • ');

  heading.insertAdjacentElement('afterend', metaDiv);
});
