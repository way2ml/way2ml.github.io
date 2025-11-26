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

  // --- Handle Metadata (Date/Author) and Edit Link ---
  var metaDiv = document.createElement('div');
  metaDiv.className = 'article-metadata';
  
  var formatted = [];
  
  // Always add Edit on GitHub link FIRST if we have the required info
  if (githubUserEl && githubRepoEl && githubBranchEl && docPathEl && pageNameEl) {
    var user = githubUserEl.getAttribute('content');
    var repo = githubRepoEl.getAttribute('content');
    var branch = githubBranchEl.getAttribute('content');
    var docPath = docPathEl.getAttribute('content');
    var pageName = pageNameEl.getAttribute('content');
    
    var extension = '.md'; 
    var url = `https://github.com/${user}/${repo}/edit/${branch}/${docPath}/${pageName}${extension}`;
    
    formatted.push(`<a href="${url}" target="_blank" rel="noopener noreferrer" class="edit-link"><i class="fab fa-github"></i> Edit this page on GitHub</a>`);
  }

  // Add date if available
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

  // Add author if available
  if (authorEl) {
    formatted.push('By ' + authorEl.getAttribute('content'));
  }

  // Only insert if we have something to show
  if (formatted.length > 0) {
    metaDiv.innerHTML = formatted.join(' • ');
    heading.insertAdjacentElement('afterend', metaDiv);
  }
});
