#!/usr/bin/env bash
# Updates local main from origin and checks out origin/main in detached HEAD state
set -euo pipefail

git fetch origin
git branch -f main origin/main
git checkout --detach origin/main
