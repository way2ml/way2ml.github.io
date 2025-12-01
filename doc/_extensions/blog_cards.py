"""
Sphinx extension to generate blog cards with automatic description extraction.

This extension provides a `blog-cards` directive that automatically creates
card-style blog listings. It extracts:
- Title from front matter or first heading
- Date from front matter
- Author from front matter
- Description from front matter (if specified) or first paragraph of content

Usage in MyST markdown:
    ```{blog-cards}
    blogs/tmux
    blogs/gitflow
    blogs/sphinx
    ```
"""

import re
from pathlib import Path
from docutils import nodes
from docutils.parsers.rst import directives
from sphinx.util.docutils import SphinxDirective
from sphinx.application import Sphinx


def extract_blog_metadata(source_path, docname):
    """
    Extract metadata from a blog post's source file.
    
    Returns dict with: title, date, author, description
    """
    metadata = {
        'title': docname.split('/')[-1].replace('-', ' ').replace('_', ' ').title(),
        'date': None,
        'author': None,
        'description': None,
    }
    
    if not source_path.exists():
        return metadata
    
    content = source_path.read_text(encoding='utf-8')
    
    # Parse YAML front matter
    front_matter_match = re.match(r'^---\s*\n(.*?)\n---\s*\n', content, re.DOTALL)
    front_matter = {}
    content_after_front_matter = content
    
    if front_matter_match:
        front_matter_text = front_matter_match.group(1)
        content_after_front_matter = content[front_matter_match.end():]
        
        # Simple YAML parsing for common fields
        for line in front_matter_text.split('\n'):
            if ':' in line:
                key, value = line.split(':', 1)
                key = key.strip().lower()
                value = value.strip().strip('"\'')
                if value:
                    front_matter[key] = value
    
    # Extract title from front matter or first heading
    if 'title' in front_matter:
        metadata['title'] = front_matter['title']
    else:
        # Look for first heading (# Title)
        heading_match = re.search(r'^#\s+(.+)$', content_after_front_matter, re.MULTILINE)
        if heading_match:
            metadata['title'] = heading_match.group(1).strip()
    
    # Extract date
    if 'date' in front_matter:
        metadata['date'] = front_matter['date']
    
    # Extract author
    if 'author' in front_matter:
        metadata['author'] = front_matter['author']
    
    # Extract description - use front matter if specified, otherwise first paragraph
    if 'description' in front_matter:
        metadata['description'] = front_matter['description']
    else:
        # Remove all headings and find first meaningful paragraph
        lines = content_after_front_matter.split('\n')
        
        in_code_block = False
        in_directive = False
        current_para = []
        found_description = None
        
        for line in lines:
            stripped = line.strip()
            
            # Track code blocks
            if stripped.startswith('```'):
                in_code_block = not in_code_block
                continue
            
            if in_code_block:
                continue
            
            # Skip directives (MyST {directive} blocks)
            if stripped.startswith('```{') or stripped.startswith(':::{'):
                in_directive = True
                continue
            if in_directive and stripped == '```' or stripped == ':::':
                in_directive = False
                continue
            if in_directive:
                continue
            
            # Skip headings
            if stripped.startswith('#'):
                continue
            
            # Skip images
            if stripped.startswith('!['):
                continue
            
            # Skip empty lines - they mark paragraph boundaries
            if not stripped:
                if current_para:
                    para_text = ' '.join(current_para)
                    # Check if this looks like a good description
                    if len(para_text) > 20 and not para_text.startswith('[') and not para_text.startswith('http'):
                        found_description = para_text
                        break
                    current_para = []
                continue
            
            # Skip lines that look like references, links only, or special markers
            if stripped.startswith('[') and ']' in stripped and ('http' in stripped or stripped.endswith(']')):
                continue
            if stripped.startswith('http'):
                continue
            if stripped.startswith('..'):  # RST directive
                continue
            
            # Add to current paragraph
            current_para.append(stripped)
        
        # Check last paragraph if we haven't found one yet
        if not found_description and current_para:
            para_text = ' '.join(current_para)
            if len(para_text) > 20:
                found_description = para_text
        
        if found_description:
            # Clean up the paragraph
            para = found_description
            # Remove inline links but keep text: [text](url) -> text
            para = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', para)
            # Remove inline code backticks
            para = re.sub(r'`([^`]+)`', r'\1', para)
            # Remove bold/italic markers
            para = re.sub(r'\*\*([^*]+)\*\*', r'\1', para)
            para = re.sub(r'\*([^*]+)\*', r'\1', para)
            
            # Truncate if too long
            if len(para) > 700:
                para = para[:697] + '...'
            
            metadata['description'] = para
    
    return metadata


class BlogCardsDirective(SphinxDirective):
    """
    Directive to create blog cards from a list of document references.
    
    Usage:
        ```{blog-cards}
        blogs/tmux
        blogs/gitflow
        ```
    """
    
    has_content = True
    required_arguments = 0
    optional_arguments = 0
    option_spec = {}
    
    def run(self):
        env = self.env
        
        # Create container for all cards
        container = nodes.container()
        container['classes'].append('blog-cards-container')
        
        # Process each blog reference
        for line in self.content:
            docname = line.strip()
            if not docname:
                continue
            
            # Find the source file
            source_dir = Path(env.srcdir)
            possible_extensions = ['.md', '.rst', '.txt']
            source_path = None
            
            for ext in possible_extensions:
                candidate = source_dir / (docname + ext)
                if candidate.exists():
                    source_path = candidate
                    break
            
            if source_path is None:
                # Try without extension (might be specified with extension)
                source_path = source_dir / docname
                if not source_path.exists():
                    continue
            
            # Extract metadata
            metadata = extract_blog_metadata(source_path, docname)
            
            # Build the card HTML
            card_html = self._build_card_html(docname, metadata)
            
            # Create raw HTML node
            raw_node = nodes.raw('', card_html, format='html')
            container += raw_node
        
        return [container]
    
    def _build_card_html(self, docname, metadata):
        """Build HTML for a single blog card."""
        title = metadata['title']
        description = metadata['description'] or ''
        date = metadata['date']
        author = metadata['author']
        
        # Build meta info
        meta_parts = []
        if date:
            meta_parts.append(f'<span>Date: {date}</span>')
        if author:
            meta_parts.append(f'<span>Author: {author}</span>')
        
        meta_html = '\n    '.join(meta_parts) if meta_parts else ''
        
        html = f'''<div class="blog-card">
  <h3 class="blog-card-title"><a href="{docname}.html">{title}</a></h3>
  <p class="blog-card-description">{description}</p>
  <div class="blog-card-meta">
    {meta_html}
  </div>
</div>
'''
        return html


def setup(app: Sphinx):
    """Setup the extension."""
    app.add_directive('blog-cards', BlogCardsDirective)
    
    return {
        'version': '1.0',
        'parallel_read_safe': True,
        'parallel_write_safe': True,
    }
