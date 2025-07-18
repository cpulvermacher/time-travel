#!/usr/bin/env bash
set -eu

TAG=$1

# Remove the leading "v" from the tag
VERSION=${TAG#v}


# Extract relevant section from changelog
CHANGELOG=$(awk -v version="$VERSION" '
    $0 ~ "^## \\[" version "\\]" {print_it = 1} 
    print_it && /^## / && $0 !~ "^## \\[" version "\\]" {exit}
    print_it {print}
    ' "CHANGELOG.md")

# Check if changelog has "pre-release" after the version
RELEASE_OPTS=""
if grep -q "^## \[$VERSION\] (pre-release)" <<< "$CHANGELOG"; then
    echo "Marking release as pre-release"
    RELEASE_OPTS="--prerelease"
fi

# Abort if empty
if [ -z "$CHANGELOG" ]; then
    echo "No matching changelog section found!"
    exit 1
fi

echo "Creating GitHub release..."
gh release create "${TAG}" \
    --title "${TAG}" \
    $RELEASE_OPTS \
    -n "$CHANGELOG" \
    "time-travel-${TAG}-chrome.zip" \
    "time-travel-${TAG}-firefox.zip"


