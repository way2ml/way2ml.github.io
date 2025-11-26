"""
Sphinx extension to reset figure/table/code-block numbering per document.

This extension modifies Sphinx's default behavior where figures are numbered
continuously across all documents. Instead, each document starts numbering
from 1.

Usage:
    Add to conf.py:
        extensions = ['_extensions.per_page_numfig']
"""

from sphinx.application import Sphinx
from docutils import nodes


def reset_figure_numbers(app, doctree, docname):
    """
    Reset figure, table, and code-block numbers for each document.
    Numbers will start from 1 in each document instead of continuing
    from previous documents.
    """
    env = app.builder.env
    
    if not hasattr(env, 'per_page_fignumbers'):
        env.per_page_fignumbers = {}
    
    # Count figures, tables, and literal_blocks in this document
    counters = {
        'figure': 0,
        'table': 0,
        'code-block': 0,
    }
    
    # Map node IDs to their per-page numbers
    doc_fignumbers = {}
    
    for node in doctree.traverse():
        figtype = None
        if isinstance(node, nodes.figure):
            figtype = 'figure'
        elif isinstance(node, nodes.table):
            figtype = 'table'
        elif isinstance(node, nodes.literal_block) and node.get('ids'):
            figtype = 'code-block'
        
        if figtype and node.get('ids'):
            counters[figtype] += 1
            for node_id in node['ids']:
                # Store as tuple for compatibility with Sphinx's format
                doc_fignumbers[node_id] = {figtype: (counters[figtype],)}
    
    env.per_page_fignumbers[docname] = doc_fignumbers


def override_fignumbers(app, doctree, docname):
    """
    Override the global fignumbers with per-page numbers.
    """
    env = app.builder.env
    
    if not hasattr(env, 'per_page_fignumbers'):
        return
    
    if docname not in env.per_page_fignumbers:
        return
    
    # Get or create toc_fignumbers
    if not hasattr(env, 'toc_fignumbers'):
        env.toc_fignumbers = {}
    
    if docname not in env.toc_fignumbers:
        env.toc_fignumbers[docname] = {}
    
    # Override with per-page numbers
    for node_id, fignums in env.per_page_fignumbers[docname].items():
        for figtype, num in fignums.items():
            if figtype not in env.toc_fignumbers[docname]:
                env.toc_fignumbers[docname][figtype] = {}
            env.toc_fignumbers[docname][figtype][node_id] = num


def process_numfig_per_page(app, env):
    """
    Process all documents and assign per-page figure numbers.
    This runs after all documents are read but before writing.
    """
    if not app.config.numfig:
        return
    
    # Store original toc_fignumbers to preserve equation numbers
    original_fignumbers = getattr(env, 'toc_fignumbers', {})
    
    # Reset and recalculate toc_fignumbers for per-page numbering
    new_toc_fignumbers = {}
    
    for docname in env.all_docs:
        try:
            doctree = env.get_doctree(docname)
        except Exception:
            continue
        
        counters = {
            'figure': 0,
            'table': 0,
            'code-block': 0,
        }
        
        new_toc_fignumbers[docname] = {
            'figure': {},
            'table': {},
            'code-block': {},
        }
        
        # Preserve displaymath (equation) numbers from original
        if docname in original_fignumbers and 'displaymath' in original_fignumbers[docname]:
            new_toc_fignumbers[docname]['displaymath'] = original_fignumbers[docname]['displaymath']
        
        for node in doctree.traverse():
            figtype = None
            if isinstance(node, nodes.figure):
                figtype = 'figure'
            elif isinstance(node, nodes.table):
                figtype = 'table'
            elif isinstance(node, nodes.literal_block) and node.get('ids'):
                figtype = 'code-block'
            
            if figtype and node.get('ids'):
                counters[figtype] += 1
                for node_id in node['ids']:
                    new_toc_fignumbers[docname][figtype][node_id] = (counters[figtype],)
    
    # Replace global fignumbers with per-page numbers
    env.toc_fignumbers = new_toc_fignumbers


def setup(app: Sphinx):
    """
    Setup the extension.
    """
    # Connect to env-check-consistency which runs after all docs are read
    app.connect('env-check-consistency', process_numfig_per_page)
    
    return {
        'version': '1.0',
        'parallel_read_safe': True,
        'parallel_write_safe': True,
    }
