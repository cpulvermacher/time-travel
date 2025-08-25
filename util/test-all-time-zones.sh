#!/usr/bin/env bash
# Runs pnpm test in all system time zones in parallel

set -eu

if ! command -v timedatectl &> /dev/null; then
    echo "timedatectl not found. This script requires systemd to list time zones."
    exit 1
fi

if ! command -v pnpm &> /dev/null; then
    echo "pnpm not found. Please install pnpm to run this script."
    exit 1
fi

if ! command -v pv &> /dev/null; then
    echo "pv not found. Please install pv to see progress."
    exit 1
fi

TIMEZONES=$(timedatectl list-timezones)
MAX_PARALLEL=$(nproc)
TMPDIR=$(mktemp -d)

run_test() {
    # Replace slashes in timezone names with underscores for safe filenames
    SAFE_TZ=$(echo "$2" | tr '/' '_')
    TZ="$2" pnpm test -- --no-isolate > "$1/test-$SAFE_TZ.log" 2>&1 && rm "$1/test-$SAFE_TZ.log" || echo "$2" >> "$1/failures.txt" 
    echo "Test completed for time zone: $2"
}

export -f run_test


echo -n > "$TMPDIR/failures.txt"

NUM_TIMEZONES=$(echo "$TIMEZONES" | wc -l)
echo "$TIMEZONES" | xargs -n 1 -P "$MAX_PARALLEL"  bash -c ' run_test "$@"' _ "$TMPDIR" | pv -l -s "$NUM_TIMEZONES" >/dev/null

if [ ! -s "$TMPDIR/failures.txt" ]; then
    echo "Tests passed in all time zones."
    rm -rf "$TMPDIR"
else
    echo "Tests failed in the following time zones:"
    cat "$TMPDIR/failures.txt"

    echo "See logs in $TMPDIR for details."
    exit 1
fi
