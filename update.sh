#!/bin/bash
set -Eeuo pipefail

yarn upgrade
yarn test

git add .
git commit -m "依存関係の更新"

npm version patch
git push origin --tags
