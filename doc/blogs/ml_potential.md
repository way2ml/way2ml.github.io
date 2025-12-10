---
title: Machine learning potential
date: 2025-12-10
author: Jie Huang
comment: True
description: 
---

# Roadmap: Building a Machine Learning Potential (MLP) for Atomistic Simulations

This roadmap guides you through the stages of learning required to develop a 
machine learning interatomic potential from scratch. It starts with fundamental 
concepts and progresses to advanced integration into simulation tools. Each 
stage lists key topics, recommended resources, and what you should be able 
to achieve before moving on.


## Stage 1: Foundational Machine Learning Knowledge (Beginner)

- **Core ML Concepts (Regression & Optimization)**  
  Learn supervised regression, gradient descent, and loss functions.  
  *Resource:* [Andrew Ng’s ML course (Coursera)](https://www.coursera.org/learn/machine-learning)  
  *Goal:* Implement and train a simple regression model.

- **Neural Networks and Backpropagation**  
  Learn how feed-forward neural networks function.  
  *Resource:* [Neural Networks and Deep Learning (Michael Nielsen)](http://neuralnetworksanddeeplearning.com/)  
  *Goal:* Train a 2-3 layer neural network on toy data.

- **Practical ML Skills**  
  Get familiar with ML libraries like Scikit-learn, PyTorch, or TensorFlow.  
  *Goal:* Evaluate regression model performance and avoid overfitting.


## Stage 2: Atomistic Simulation Basics

- **Understanding DFT and Classical Potentials**  
  Learn why MLPs are needed and how they improve over DFT and force fields.  
  *Resource:* [DFT 101 (MIT OCW)](https://ocw.mit.edu/courses/materials-science-and-engineering/3-320-atomistic-computer-modeling-of-materials-sma-5107-fall-2005/index.htm)  
  *Goal:* Explain PES and ML potential value proposition.

- **Molecular Dynamics Basics**  
  Learn how forces evolve positions using integrators.  
  *Resource:* *Understanding Molecular Simulation* – Frenkel & Smit  
  *Goal:* Run a Lennard-Jones MD simulation (e.g., in ASE or LAMMPS).


## Stage 3: Atomic Descriptors and Representations

- **Invariant Descriptors**  
  Understand ACSF and SOAP descriptors.  
  *Resource:* [DScribe Documentation](https://singroup.github.io/dscribe/latest/)  
  *Goal:* Compute ACSF/SOAP vectors for a water molecule.

- **Graph Representations (GNNs)**  
  Learn about SchNet, NequIP, message passing.  
  *Resource:* [Neural Message Passing (Gilmer et al.)](https://arxiv.org/abs/1704.01212)  
  *Goal:* Understand learned vs. hand-crafted descriptors.

- **A Gentle Introduction to Graph Neural Networks**
    https://distill.pub/2021/gnn-intro/ 


## Stage 4: Energy and Force Prediction

- **Energy = Sum of Atomic Contributions**  
  Understand per-atom energy networks.  
  *Resource:* [Behler-Parrinello NN paper](https://doi.org/10.1103/PhysRevLett.98.146401)

- **Forces = -∇E via Autograd**  
  Learn autograd-based force training.  
  *Goal:* Fit a 1D energy model and compute force via derivative.

- **Loss Function with Forces**  
  *Resource:* [TorchANI Tutorial](https://github.com/aiqm/torchani/blob/master/tutorials/Tutorial.ipynb)  
  *Goal:* Train a force+energy MLP and balance their loss weights.


## Stage 5: Data Preparation and Preprocessing

- **Generating DFT Data**  
  Collect structures using AIMD, NEB, random perturbations, etc.

- **Cutoffs and Neighbor Lists**  
  *Resource:* [ASE Neighbor List Docs](https://wiki.fysik.dtu.dk/ase/ase/neighborlist.html)  
  *Goal:* Implement or use neighbor list and choose suitable cutoffs.

- **Descriptor Calculation and Scaling**  
  *Resource:* [DScribe Examples](https://github.com/SINGROUP/dscribe/tree/master/examples)  
  *Goal:* Prepare normalized descriptors and energies for training.


## Stage 6: Training and Evaluation

- **Training with PyTorch or TensorFlow**  
  *Resource:* [PyTorch Lightning](https://www.pytorchlightning.ai/) or [Keras Guide](https://keras.io/)  
  *Goal:* Train a model with a combined energy/force loss.

- **Model Validation**  
  *Goal:* Evaluate RMSE (energy/force), run MD with your MLP.

- **Model Iteration**  
  Active learning to refine dataset using model uncertainty.  
  *Resource:* [DeepMD-Kit Active Learning](https://github.com/deepmodeling/deepmd-kit)


## Stage 7: Simulation Integration

- **ASE Integration**  
  *Resource:* [ASE Calculator Guide](https://wiki.fysik.dtu.dk/ase/ase/calculators/calculators.html)  
  *Goal:* Use your MLP in structure optimization or MD.

- **LAMMPS Integration**  
  *Resources:*  
  - [LAMMPS ML potential tutorial](https://docs.lammps.org/Python_interface.html)  
  - [DeepMD for LAMMPS](https://github.com/deepmodeling/deepmd-kit)

- **Validation Simulations**  
  Run short MD, check conservation of energy, phonons, or diffusion.


## Bonus Resources

- [Machine Learning for Materials Discovery (Springer, 2024)](https://link.springer.com/book/10.1007/978-3-031-53505-9)  
- [Practical Guide to ML Potentials (Jacobs et al., 2025)](https://doi.org/10.1016/j.cossms.2025.101214)  
- [Behler Tutorial Review on HDNNP](https://doi.org/10.1002/qua.24890)


**Tip:** Keep your first project simple — 1 element, 1000 structures, radial descriptor, shallow NN — and test everything end-to-end before scaling up.

