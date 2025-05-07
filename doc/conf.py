# Configuration file for the Sphinx documentation builder.
#
# For the full list of built-in configuration values, see the documentation:
# https://www.sphinx-doc.org/en/master/usage/configuration.html

# -- Project information -----------------------------------------------------
# https://www.sphinx-doc.org/en/master/usage/configuration.html#project-information

project = 'Way To Machine Learning'
copyright = '2025, Jie Huang'
author = 'Jie Huang'
release = '0.0.1'

# -- General configuration ---------------------------------------------------
# https://www.sphinx-doc.org/en/master/usage/configuration.html#general-configuration

extensions = ['myst_parser', 'sphinx.ext.mathjax', 'sphinx_tabs.tabs']

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
html_theme_options = {
    "logo": {
        "image_light": "logo.png",  # shown in light mode
        "image_dark": "logo.png",   # shown in dark mode
        "text": "Way To Machine Learning",
    },
    "navbar_start": ["navbar-logo"],
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
    ],
    "navbar_end": ["navbar-icon-links"],  # ensures they go top right
    "use_edit_page_button": True, 
}


