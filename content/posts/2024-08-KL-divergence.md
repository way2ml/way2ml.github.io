---
author: Jie Huang
title: Information Measurement and Distribution Comparison
date: 2024-08-10
description: A brief guide to information measurement.
draft: true
categories:
  - Information
tags:
  - Divergence
---

When we say these two distributions are very close, what we are talking about? Is how much overlap these two distributions they share? Or the other way around, how much area we left apart from the overlapped part? 

To answer these questions, we need to recap from the very beginning. The first question would be: What is probability of an event $X=x$ ? The probability $p(X=x)$ of an event indicates the chance of this event $X=x$  will happen.  For example, let's defined an event $X=1$ as  "Roll a die $X$, get one 🎲". Then the probability $p(X=1)$ of this event $X=1$ is $1/6$, where $1$ is the number of possible outcomes we get one $\{X = 1\}$ and 6 indicates all the possible outcomes when roll a die, i.e., $\{X = 1, X = 2, X = 3, X = 4, X = 5, X = 6\}$. Hence, the probability of an event can be calculated by **the number of favorable events divided by the total number of possible events**.   

Here, it's worth mentioning that we know this probability without doing any experiment. Hence, we call this kind of the probability **theoretical probability**.  If you conduct the experiment of roll a die many times, and count the number of 1, then divided by the total number of rolling time. You get the **experimental probability** that describes how frequently an event actually occurred in an experiment.  The experimental probability might differ from the theoretical probability, especially if the number of trials is small. As the number of trials increases, the experimental probability tends to get closer to the theoretical probability. This principle is known as the **Law of Large Number (LLN)**.  Most of times, it's impossible to know the theoretical probability of an event. What if the the die I give to you is a biased six-sided die? How did you know the theoretical probability? Well, you see, it's impossible to know it's theoretical. However, based on the LLN, you can roll this biased die many many times, the more times you try, the experimental probability is more close to the theoretical probability. 


What is KL divergence? 

![](https://cdn.jsdelivr.net/gh/HuangJiaLian/DataBase0@master/uPic/2024-08-17-17-40-tYvCFK.png)

