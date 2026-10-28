# Way To Machine Learning
The project files for my homepage: [https://way2ml.github.io/](https://way2ml.github.io/).

## Installation

```bash
conda env create -f myenv.yml
conda activate way2ml 

```

## Local site editor

Run the optional local editor alongside the other documentation scripts:

```bash
./doc/site-editor
```

It opens a browser editor for Research, Blogs, News, and Moments. Markdown remains
the source of truth. Dropped images and PDFs are staged until Save, exact previews are built
in a temporary directory, and every save creates a local backup under
`.site-editor/`. Nothing is pushed or published automatically.

Use `./doc/site-editor --no-browser` when you only want the local URL printed in the
terminal. Press `Ctrl+C` in that terminal to stop the editor.

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
    
