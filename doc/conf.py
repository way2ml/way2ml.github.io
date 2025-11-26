# Configuration file for the Sphinx documentation builder.
#
# For the full list of built-in configuration values, see the documentation:
# https://www.sphinx-doc.org/en/master/usage/configuration.html

# Add custom extensions path
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent / '_extensions'))

# -- Project information -----------------------------------------------------
# https://www.sphinx-doc.org/en/master/usage/configuration.html#project-information

project = 'Way To Machine Learning'
copyright = '2025, Way To Machine Learning'
author = 'Jie Huang'
release = '0.0.1'

# -- General configuration ---------------------------------------------------
# https://www.sphinx-doc.org/en/master/usage/configuration.html#general-configuration

extensions = [
    'myst_parser', 
    'sphinx.ext.mathjax', 
    'sphinx_tabs.tabs',
    'sphinx.ext.autosectionlabel',
    'sphinxcontrib.bibtex',
    'per_page_numfig',  # Custom extension for per-document figure numbering
]
bibtex_bibfiles = ["ref.bib"]

# Prefix section labels with document name to avoid duplicates
autosectionlabel_prefix_document = True

# MyST parser configuration
myst_enable_extensions = [
    "colon_fence",
    "deflist",
    "html_image",
    "amsmath",
    "dollarmath",
]

# Enable automatic figure numbering
# Note: numfig counts figures across ALL documents, not per-page
# Set to False if you want per-page numbering (must be done manually)
numfig = True
numfig_format = {
    'figure': 'Fig. %s',
    'table': 'Tab. %s',
    'code-block': 'List. %s',
    'section': 'Sec. %s'
}

# Math numbering
math_number_all = True
math_numfig = True

# Figure numbering depth:
# 0 = continuous across all documents (Figure 1, 2, 3, 4, 5...)
# 1 = restart per top-level section (Figure 1.1, 1.2, 2.1, 2.2...)
# 2 = restart per second-level section (Figure 1.1.1, 1.1.2...)
numfig_secnum_depth = 1

# Configure MyST to use YAML front matter
myst_substitutions = {}

def setup(app):
    app.add_css_file('custom.css')
    app.add_js_file('article-metadata.js')
    
    # Add a function to process page metadata from MyST front matter
    def add_metadata_to_context(app, pagename, templatename, context, doctree):
        # Get metadata from the build environment
        metadata = {}
        env = app.builder.env
        if hasattr(env, 'metadata') and pagename in env.metadata:
            metadata = dict(env.metadata[pagename])
        
        # Make metadata available in templates
        context['meta'] = metadata
    
    app.connect('html-page-context', add_metadata_to_context)

templates_path = ['_templates']
exclude_patterns = ['_build', 'Thumbs.db', '.DS_Store']



# -- Options for HTML output -------------------------------------------------
# https://www.sphinx-doc.org/en/master/usage/configuration.html#options-for-html-output

html_theme = 'pydata_sphinx_theme'
html_static_path = ['_static']

# Hide Left sidebar
html_sidebars = {
    "**": []
}

html_logo = "_static/logo.png"
html_favicon = '_static/favicon.ico'
html_context = {
    "display_github": True,
    "github_user": "way2ml",         # your GitHub username
    "github_repo": "way2ml.github.io", # your repository name
    "github_version": "main",        # branch name
    "doc_path": "doc",               # path to your docs root in the repo
}
html_show_sourcelink = False # It's useless after we have edit on github
html_theme_options = {
    "logo": {
        "image_light": "logo.png",  # shown in light mode
        "image_dark": "logo.png",   # shown in dark mode
        "text": "Way To Machine Learning",
    },
    "navbar_start": ["navbar-logo"],
    "navbar_center": ["navbar-nav"],
    "show_nav_level": 1,
    "show_prev_next": False,
    "icon_links": [
        {
            "name": "GitHub",
            "url": "https://github.com/way2ml/way2ml.github.io",
            "icon": "fab fa-github",
        },
        {
            "name": "ResearchGate",
            "url": "https://www.researchgate.net/profile/Jie_Huang136",
            "icon": "fab fa-researchgate",  # generic icon
        },
        {
            "name": "Medium",
            "url": "https://medium.com/@jackhuang.wz",
            "icon": "fab fa-medium",
        },
        {
            "name": "YouTube",
            "url": "https://www.youtube.com//@way2ml",
            "icon": "fab fa-youtube",
        },
        {
            "name": "Twitter",
            "url": "https://x.com/jackhuang_wz",
            "icon": "fab fa-twitter",
        },
        {
            "name": "LinkedIn",
            "url": "https://linkedin.com/in/jiehuang-fi",
            "icon": "fab fa-linkedin",
        },
        {
            "name": "ORCID",
            "url": "https://orcid.org/0000-0003-3560-283X",
            "icon": "fab fa-orcid",
        },
        {
            "name": "Google Scholar",
            "url": "https://scholar.google.com/citations?user=238kWMkAAAAJ&hl=en",
            "icon": "fab fa-google-scholar",
        }
    ],
    "navbar_end": ["navbar-icon-links"],  # ensures they go top right
    "use_edit_page_button": True, 
    "secondary_sidebar_items": [], # Remove right sidebar
}


