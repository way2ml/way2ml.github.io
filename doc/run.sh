#!/usr/bin/env bash

# pip install myst-parser sphinx-tabs pydata-sphinx-theme

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOC_DIR="$SCRIPT_DIR"
PDF_PATH="$DOC_DIR/_static/docs/jiehuang.pdf"
PDF_URL="https://raw.githubusercontent.com/HuangJiaLian/CV/master/simple/jiehuang.pdf"

show_help() {
	cat <<EOF
Usage: $(basename "$0") [--update-cv]

Options:
  --update-cv    Download the latest CV PDF before building docs.
  -h, --help     Show this help message.
EOF
}

UPDATE_CV=false

while [[ $# -gt 0 ]]; do
	case "$1" in
		--update-cv)
			UPDATE_CV=true
			shift
			;;
		-h|--help)
			show_help
			exit 0
			;;
		*)
			echo "Unknown option: $1" >&2
			show_help >&2
			exit 1
			;;
	esac
done

if [[ "$UPDATE_CV" == true ]]; then
	echo "Updating CV PDF from $PDF_URL"
	curl -fsSL -o "$PDF_PATH" "$PDF_URL"
fi

sphinx-build "$DOC_DIR" "$DOC_DIR/_build"
