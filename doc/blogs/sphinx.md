---
title: How to use sphinx to document my research
date: 2025-11-10
author: Jie Huang
---
# How to use sphinx to document 

## Console

```console
$ mkdir doc-example
$ cd doc-example
$ sphinx-quickstart
```

You probably noticed that there's a handy **Copy** button when you hover around the block.
To enable this feature, you need `pip install sphinx-copybutton`, then enable it in `conf.py`
by add to extention list.
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

This is inline math {math}`E=mc^2`, and here is seperated one:
```{math}
e^{i\theta} = \cos(\theta) + i\sin{\theta}
```

## Image with caption
We can use the following way to add image with caption:
```{figure} ../../data/github_workflow/Github-Workflow-2.png
Figure 1. This is a test to add an image with a caption. The grammar is
different from the common markdown format.
```
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

## References


