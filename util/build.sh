#!/usr/bin/env sh
set -eu

MODE=$1

if [ "$MODE" != "production" ] && [ "$MODE" != "dev" ]
then
    echo "Usage: $0 production|dev"
    exit 1
fi

build() {
    TARGET=$1 # chrome / firefox

    mkdir -p "dist/${TARGET}"
    export TARGET
    vite build -m "${MODE}" --outDir "../dist/${TARGET}"

    # copy extra assets
    mkdir "dist/${TARGET}/images/"
    cp -a images/icon*.png "dist/${TARGET}/images/"

    MANIFEST="src/manifest.v3.json"
    if [ "$TARGET" = "firefox" ]
    then
        MANIFEST="src/manifest.v2.json"
    fi

    cat $MANIFEST | \
        sed "s/__VERSION_NAME__/$LONG_VERSION/g" | \
        sed "s/__VERSION__/$VERSION/g" \
        > "dist/${TARGET}/manifest.json"


    if [ "$MODE" = "production" ]
    then
        ZIP_NAME="../../time-travel-$LONG_VERSION.${TARGET}.zip"

        rm -f "$ZIP_NAME"
        cd "dist/${TARGET}"
        zip -r "$ZIP_NAME" ./*
        cd -

        echo ""
        echo "Created zip file: $ZIP_NAME"
    fi
}

ROOT=$(dirname -- "$0")/..
VERSION=$(git describe --tags --abbrev=0 | sed 's/^v//')
LONG_VERSION=$(git describe --tags | sed 's/^v//')
if [ "$MODE" = "dev" ]
then
    LONG_VERSION="$LONG_VERSION-dev"
fi
export LONG_VERSION

cd "$ROOT"

rm -rf dist
build "chrome"
build "firefox"


echo "========================================"
echo "current version is $VERSION (version_name: $LONG_VERSION)."
if [ "$MODE" = "production" ] && [ "$VERSION" != "$LONG_VERSION" ]
then
    echo "WARNING: For a production build, you probably want to set a new git tag."
fi
echo "========================================"
