#!/usr/bin/env sh
set -eu

MODE=$1

if [ "$MODE" != "production" ] && [ "$MODE" != "dev" ]
then
    echo "Usage: $0 production|dev"
    exit 1
fi

ROOT=$(dirname -- "$0")/..
SHORT_VERSION=$(git describe --tags --abbrev=0 | sed 's/^v//')
LONG_VERSION=$(git describe --tags | sed 's/^v//')
if [ "$MODE" = "dev" ]
then
    LONG_VERSION="$LONG_VERSION-dev"
fi

cd "$ROOT"

rm -rf dist
mkdir dist

vite build -m "${MODE}"

# copy extra assets
mkdir dist/images/
cp -a images/*.png dist/images/

cat src/manifest.json | \
    sed "s/__VERSION_NAME__/$LONG_VERSION/g" | \
    sed "s/__VERSION__/$SHORT_VERSION/g" \
    > dist/manifest.json


rm -f time-travel.zip
cd dist/
zip -r time-travel ./*

echo "========================================"
echo "current version is $SHORT_VERSION (version_name: $LONG_VERSION)."
if [ "$MODE" = "production" ] && [ "$SHORT_VERSION" != "$LONG_VERSION" ]
then
    echo "WARNING: For a production build, you probably want to set a new git tag."
fi
echo "========================================"
