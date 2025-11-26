document.addEventListener('DOMContentLoaded', function () {
  var dateEl = document.querySelector('meta[name="article-date"]');
  var authorEl = document.querySelector('meta[name="article-author"]');
  
  var githubUserEl = document.querySelector('meta[name="github-user"]');
  var githubRepoEl = document.querySelector('meta[name="github-repo"]');
  var githubBranchEl = document.querySelector('meta[name="github-branch"]');
  var docPathEl = document.querySelector('meta[name="doc-path"]');
  var pageNameEl = document.querySelector('meta[name="page-name"]');

  var hasMetadata = dateEl || authorEl;
  var hasGithub = githubUserEl && githubRepoEl && githubBranchEl && docPathEl && pageNameEl;

  if (!hasMetadata && !hasGithub) {
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

  var metaDiv = document.createElement('div');
  metaDiv.className = 'article-metadata';

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

  if (formatted.length > 0) {
    var textSpan = document.createElement('span');
    textSpan.textContent = formatted.join(' • ');
    metaDiv.appendChild(textSpan);
  }

  if (hasGithub) {
    if (formatted.length > 0) {
        var separator = document.createElement('span');
        separator.textContent = ' • ';
        metaDiv.appendChild(separator);
    }
    
    var user = githubUserEl.getAttribute('content');
    var repo = githubRepoEl.getAttribute('content');
    var branch = githubBranchEl.getAttribute('content');
    var docPath = docPathEl.getAttribute('content');
    var pageName = pageNameEl.getAttribute('content');
    
    // Construct URL
    // Assuming .md for now as per user context
    var extension = '.md'; 
    var url = `https://github.com/${user}/${repo}/edit/${branch}/${docPath}/${pageName}${extension}`;
    
    var link = document.createElement('a');
    link.href = url;
    link.textContent = 'Edit on GitHub';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    
    metaDiv.appendChild(link);
  }

  heading.insertAdjacentElement('afterend', metaDiv);
});
