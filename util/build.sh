#!/usr/bin/env sh
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
mkdir dist

vite build -m "${MODE}"

# copy extra assets
mkdir dist/images/
cp -a images/icon*.png dist/images/

cat src/manifest.json | \
    sed "s/__VERSION_NAME__/$LONG_VERSION/g" | \
    sed "s/__VERSION__/$VERSION/g" \
    > dist/manifest.json


if [ "$MODE" = "production" ]
then
    ZIP_NAME="time-travel-$LONG_VERSION.zip"

    rm -f "$ZIP_NAME"
    cd dist/
    zip -r "$ZIP_NAME" ./*

    echo ""
    echo "Created zip file: $ZIP_NAME"
fi

echo "========================================"
echo "current version is $VERSION (version_name: $LONG_VERSION)."
if [ "$MODE" = "production" ] && [ "$VERSION" != "$LONG_VERSION" ]
then
    echo "WARNING: For a production build, you probably want to set a new git tag."
fi
echo "========================================"
