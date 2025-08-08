#!/usr/bin/env bash
set -eu

MODE=$1

if [ "$MODE" != "production" ] && [ "$MODE" != "dev" ]
then
    echo "Usage: $0 production|dev"
    exit 1
fi

ROOT=$(dirname -- "$0")/..
VERSION=$(git describe --tags --abbrev=0 | sed 's/^v//')
LONG_VERSION=$(git describe --tags | sed 's/^v//')
if [ "$MODE" = "dev" ]
then
    LONG_VERSION="$LONG_VERSION-dev"
fi
export MODE
export LONG_VERSION

cd "$ROOT"

rm -rf dist

################## Chrome build ###################

mkdir -p dist/chrome
vite build -m "${MODE}"

# wrap main content script in an IIFE to avoid polluting the global scope
cat dist/chrome/scripts/replace_date.js | \
    sed '1s/^/(() => {\n/' | \
    sed '$s/$/\n})();/' > dist/chrome/scripts/replace_date.js.iife
mv dist/chrome/scripts/replace_date.js.iife dist/chrome/scripts/replace_date.js

# copy extra assets
mkdir dist/chrome/images/
cp -a images/icon*.png dist/chrome/images/
cp -a src/_locales dist/chrome/_locales

cat src/manifest.json | \
    sed "s/__VERSION_NAME__/$LONG_VERSION/g" | \
    sed "s/__VERSION__/$VERSION/g" \
    > dist/chrome/manifest.json

### Create Firefox version using Chrome as base ###

mkdir -p dist/firefox
cp -r dist/chrome/* dist/firefox/
cat dist/chrome/manifest.json | \
    jq '.background.scripts = [.background.service_worker] | del(.background.service_worker) | del(.version_name) ' | \
    jq '. * input' - "src/manifest.firefox.json" \
    > dist/firefox/manifest.json

create_zip() {
    ZIP_PATH="$1"
    TARGET_DIR="$2"

    rm -f "$ZIP_PATH"
    cd "$TARGET_DIR"
    zip -r "$ZIP_PATH" ./*
    cd -

    echo ""
    echo "Created zip file: $ZIP_PATH"
}

if [ "$MODE" = "production" ]
then
    create_zip "$PWD/time-travel-$LONG_VERSION-chrome.zip" dist/chrome
    create_zip "$PWD/time-travel-$LONG_VERSION-firefox.zip" dist/firefox

    # create a source code bundle by cloning the repo and zipping it
    TMP_DIR=$(mktemp -d)
    git clone . "$TMP_DIR/time-travel-$LONG_VERSION"
    create_zip "$PWD/time-travel-$LONG_VERSION-src.zip" "$TMP_DIR/time-travel-$LONG_VERSION"
    rm -rf "$TMP_DIR"
fi

echo "========================================"
echo "current version is $VERSION (version_name: $LONG_VERSION)."
if [ "$MODE" = "production" ] && [ "$VERSION" != "$LONG_VERSION" ]
then
    echo "WARNING: For a production build, you probably want to set a new git tag."
fi
echo "========================================"
