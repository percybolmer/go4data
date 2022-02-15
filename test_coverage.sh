#!/usr/bin/bash
set -e
echo "" > coverage.txt

for d in $(go list ./... | grep -v vendor); do
    sudo go test -coverprofile=profile.out -covermode=atomic $d
    if [ -f profile.out ]; then
        cat profile.out >> coverage.txt
        yes | rm profile.out
    fi
done
