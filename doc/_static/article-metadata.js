document.addEventListener('DOMContentLoaded', function () {
  var dateEl = document.querySelector('meta[name="article-date"]');
  var authorEl = document.querySelector('meta[name="article-author"]');
  
  var githubUserEl = document.querySelector('meta[name="github-user"]');
  var githubRepoEl = document.querySelector('meta[name="github-repo"]');
  var githubBranchEl = document.querySelector('meta[name="github-branch"]');
  var docPathEl = document.querySelector('meta[name="doc-path"]');
  var pageNameEl = document.querySelector('meta[name="page-name"]');

  var article = document.querySelector('article.bd-article');
  if (!article) {
    return;
  }

  var heading = article.querySelector('h1');
  if (!heading) {
    return;
  }

  // --- Handle Metadata (Date/Author) ---
  if (dateEl || authorEl) {
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
        metaDiv.textContent = formatted.join(' • ');
        heading.insertAdjacentElement('afterend', metaDiv);
      }
  }

  // --- Handle Edit on GitHub (Bottom of page) ---
  if (githubUserEl && githubRepoEl && githubBranchEl && docPathEl && pageNameEl) {
    var user = githubUserEl.getAttribute('content');
    var repo = githubRepoEl.getAttribute('content');
    var branch = githubBranchEl.getAttribute('content');
    var docPath = docPathEl.getAttribute('content');
    var pageName = pageNameEl.getAttribute('content');
    
    // Construct URL
    var extension = '.md'; 
    var url = `https://github.com/${user}/${repo}/edit/${branch}/${docPath}/${pageName}${extension}`;
    
    var editDiv = document.createElement('div');
    editDiv.className = 'article-footer-edit';
    
    var link = document.createElement('a');
    link.href = url;
    link.textContent = 'Edit this page on GitHub';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    
    // Add an icon
    var icon = document.createElement('i');
    icon.className = 'fab fa-github';
    icon.style.marginRight = '5px';
    link.prepend(icon);
    
    editDiv.appendChild(link);
    article.appendChild(editDiv);
  }
});
