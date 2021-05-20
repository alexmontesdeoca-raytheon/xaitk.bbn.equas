#!/bin/sh
pandoc --from=markdown --to=rst --output=README.rst README.md
python setup.py sdist bdist_wheel
#twine upload dist/*
