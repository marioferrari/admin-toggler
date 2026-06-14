#!/bin/bash

set -e

if ! command -v jq &> /dev/null; then
    echo "Error: 'jq' is required but not installed. Please install it first."
    exit 1
fi

VERSION=$(jq -r '.version' manifest.base.json)
DIST_DIR="./dist"
ASSETS="background.js content.js options.html options.js icon-default.png icon-active.png" 

echo "Starting build pipeline v$VERSION..."

rm -rf "$DIST_DIR"
mkdir -p "$DIST_DIR/chrome" "$DIST_DIR/firefox"

for asset in $ASSETS; do
    cp "$asset" "$DIST_DIR/chrome/"
    cp "$asset" "$DIST_DIR/firefox/"
done

# CHROME BUILD
echo "- Processing Chrome Manifest..."
cp manifest.base.json "$DIST_DIR/chrome/manifest.json"

(cd "$DIST_DIR/chrome" && zip -q -r "../admin-toggler-v$VERSION-chrome.zip" .)
echo "- Chrome extension zipped."

# FIREFOX BUILD
echo "- Processing Firefox Manifest..."
jq '
  . + {"browser_specific_settings": { "gecko": { "id": "admin@toggler" } } } |
  .background = { "scripts": ["background.js"] } |
  .commands["toggle-admin"].suggested_key.default = "Ctrl+Alt+A"
' manifest.base.json > "$DIST_DIR/firefox/manifest.json"

(cd "$DIST_DIR/firefox" && zip -q -r "../admin-toggler-v$VERSION-firefox.zip" .)
echo "- Firefox extension zipped."

echo "Build complete! Check the '$DIST_DIR' folder."