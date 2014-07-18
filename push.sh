#!/bin/bash -e
commit_message="$1"


lein cljsbuild once release
git add -A
git commit -m "$commit_message"
git push sharpie master
