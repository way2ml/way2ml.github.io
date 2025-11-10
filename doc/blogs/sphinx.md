---
title: How to use sphinx to document my research
date: 2025-11-10
author: Jie Huang
---
# Basics

## Latex equations
Make sure the `conf.py` has this setting, which will auto numbering the equations.
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
Figure 1. This is test to add image with caption. The grammar is
different from the common markdown format.
```

## References


