---
title: The minimal Git workflow I use in my research
date: 2025-05-10
author: Jie Huang
---

# The minimal git workflow 

```{figure} ../../data/github_workflow/Github-Workflow.png
The git workflow I used in my research [1]. This workflow consists of the following three parts.
```

```{figure} ../../data/github_workflow/Github-Workflow-1.png
Create a branch. Create a branch `my-feature`  when you need to make a change; Make changes in this branch you just created; then commit them; Push the commits to Github.
```

```{figure} ../../data/github_workflow/Github-Workflow-3.png
Make a pull request. Push the commit to the remote; create a pull request from `my-feature` to `main`; on your local machine, switch to the main, and pull from the remote main.
```

```{figure} ../../data/github_workflow/Github-Workflow-2.png
Handle exceptions.
```

**References**

[1] "十分钟学会正确的github工作流，和开源作者们使用同一套流程" YouTube, uploaded by 码农高天, April 13, 2024, https://youtu.be/uj8hjLyEBmU?si=S29XiEkhG3of9y83     
[2] "Introduction to version control with Git/Recording changes" CodeRefinery,  Mar 31, 2025, https://coderefinery.github.io/git-intro/commits/    
