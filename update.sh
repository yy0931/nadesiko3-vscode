#!/bin/bash
set -Eeuo pipefail

yarn upgrade
yarn
# yarn test

git add .
git commit -m "Update dependencies"

npm version patch
git push origin --tags
git push origin main
