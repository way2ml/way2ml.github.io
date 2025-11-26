---
title: How to use Sphinx to document my research
date: 2025-11-10
author: Jie Huang
comment: True
---
# How to use Sphinx to document 

## Console

```console
$ mkdir doc-example
$ cd doc-example
$ sphinx-quickstart
```

You probably noticed that there's a handy **Copy** button when you hover around the block.
To enable this feature, you need `pip install sphinx-copybutton`, then enable it in `conf.py`
by adding to the extension list.
```python
extensions = [
    # ... your other extensions ...
    "sphinx_copybutton",
]
```

## Latex equations
Make sure the `conf.py` file has this setting, which will auto-number the equations.
```bash
extensions = [
    "myst_parser",
]

myst_enable_extensions = [
    "amsmath",
    "dollarmath",
]

math_number_all = True
```

This is inline math $E=mc^2$, and here is a separated one as shown in equation {eq}`eq:euler`.

$$
e^{i\theta} = \cos(\theta) + i\sin{\theta}
$$ (eq:euler)

You can also use inline dollar symbol to write equation like this $a^2 + b^2 = c^2$, or seperated 
equations like this. 

$$
\ln(1+x) = x - \frac{1}{2}x^2 + \frac{1}{3}x^3 - \frac{1}{4}x^4 + \frac{1}{5}x^5 - \frac{1}{6}x^6 + \cdots
$$ (eq:natural)

Equation {eq}`eq:natural` excited Newton for two reasons. First, they could be used to speed up calculations
enormously, and second, they were relevant to a controversial problem in music theory ha was working on: how
to divide an octave into perfectly equal musical steps without sacrificing the most pleasing harmonies of the
traditional scale {cite}`Strogatz2019`.

## Image with caption
We can use the following way to add an image with a caption. The grammar is different from the common Markdown format. With `numfig = True` in `conf.py`, figures will be automatically numbered across **all documents** in the toctree (not per-document), and you can reference them using `{numref}`.

```{figure} ../../data/github_workflow/Github-Workflow-2.png
:name: fig-test

This is a test to add an image with a caption.
```
As shown in {numref}`fig-test`, the figure is automatically numbered. Note that Sphinx numbers figures continuously across all documents in your documentation (like chapters in a book), so this might not be Figure 1 if there are figures in earlier documents.

## Information boxes
:::{note}
This is a note.
:::

:::{tip}
This is a tip.
:::

:::{warning}
This is a warning.
:::

## Citation
You can cite other papers easily. For example, I published my first
research paper in 2020, which uses a neural network to fit a function
of the structure factor of polymer systems {cite}`Huang2020`. Make sure
`conf.py` has the following lines.

```python
extensions = [
    # ...
    'sphinxcontrib.bibtex'
    ]
bibtex_bibfiles = ["ref.bib"]
```



## References

```{bibliography}
:style: unsrt
```

