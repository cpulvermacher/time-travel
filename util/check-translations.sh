#!/bin/bash
set -eu

# Define colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

BASE_LOCALE="en"
BASE_FILE="./messages/${BASE_LOCALE}.json"
EXIT_CODE=0

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo -e "${RED}Error: jq is not installed. Please install it first.${NC}"
    exit 1
fi

# First validate JSON files
for file in ./messages/*.json; do
    if ! jq empty "$file" 2>/dev/null; then
        echo -e "${RED}Error: Invalid JSON in $file${NC}"
        exit 1
    fi
done

# Check each locale against base locale
for LOCALE_FILE in ./messages/*.json; do
    locale=$(basename "$LOCALE_FILE" .json)
    if [ "$locale" = "$BASE_LOCALE" ]; then
        continue
    fi

    echo -e "\n${YELLOW}Checking $locale against $BASE_LOCALE...${NC}"

    # Get base keys that are missing in the locale file
    MISSING_KEYS=$(jq -r --slurpfile localeFile "$LOCALE_FILE" 'keys - ($localeFile[0] | keys) | .[]' "$BASE_FILE")

    if [ -z "$(echo "$MISSING_KEYS" | tr -d '\n')" ]; then
        echo -e "${GREEN}✓ All $BASE_LOCALE keys are present in $locale${NC}"
    else
        echo -e "${RED}Missing translations in $locale:${NC}"
        echo "$MISSING_KEYS" | sed 's/^/  - /'

        # Count missing keys (wc adds spaces, so we need to trim)
        MISSING_KEYS_COUNT=$(echo "$MISSING_KEYS" | wc -l | tr -d ' ')
        echo -e "${RED}✗ Found $MISSING_KEYS_COUNT missing keys in $locale${NC}"
        EXIT_CODE=1
    fi

    # Check for extra keys not in base locale
    EXTRA_KEYS=$(jq -r --slurpfile baseFile "$BASE_FILE" 'keys - ($baseFile[0] | keys) | .[]' "$LOCALE_FILE")

    if [ -n "$EXTRA_KEYS" ]; then
        echo -e "${YELLOW}Extra keys in $locale not in $BASE_LOCALE:${NC}"
        echo "$EXTRA_KEYS" | sed 's/^/  - /'
    fi
done

if [ $EXIT_CODE -eq 0 ]; then
    echo -e "\n${GREEN}All translations are complete!${NC}"
fi

exit $EXIT_CODE
