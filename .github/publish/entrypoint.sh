#!/bin/sh

set -e

git config user.name "${GITHUB_ACTOR}"
git config user.email "${GITHUB_ACTOR}@users.noreply.github.com" 
remote_repo="https://${GH_PAT}@github.com/${GITHUB_REPOSITORY}.git"

git add dist
git commit -m"Deploy to github pages"
git push -f $remote_repo master:gh-pages
