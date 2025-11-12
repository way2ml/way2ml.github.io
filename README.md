# Way To Machine Learning
The project files for my homepage: [https://way2ml.github.io/](https://way2ml.github.io/).

## Installation

```bash
conda env create -f src/myenv.yml
conda activate way2ml 

```

## Project structure

The reference directory structure for this project. 

```bash
project_name/
├── README.md             # overview of the project
├── data/                 # data files used in the project
│   ├── README.md         # describes where data came from
│   └── sub-directory/       # may contain subdirectories
├── processed_data/       # intermediate files from the analysis
├── manuscript/           # manuscript describing the results
├── results/              # results of the analysis (data, tables, figures)
├── src/                  # contains all code in the project
│   ├── LICENSE           # license for your code
│   ├── requirements.txt  # software requirements and dependencies
│   └── ...
└── doc/                  # documentation for your project
    ├── index.rst
    
