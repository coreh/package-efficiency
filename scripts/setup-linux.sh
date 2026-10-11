#!/bin/sh
# Get a fresh Ubuntu 24.04 machine ready to measure (x86-64 or ARM64):
# the system packages the builds need, the pinned Node.js under
# .cache/toolchains, then scripts/setup.mjs for everything else.
# Usage, from the repository: sh scripts/setup-linux.sh
#   then, in every shell that measures: . .cache/toolchains/env.sh
set -eu
cd "$(dirname "$0")/.."
ROOT=$(pwd)

# Compilers and headers: CRuby is built from source, some gems compile a
# native extension, cgo needs a C compiler. `time` is GNU time, which the
# supervisor starts every adapter under.
sudo apt-get update -q
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -q --no-install-recommends \
  build-essential pkg-config git curl ca-certificates xz-utils time \
  libssl-dev libyaml-dev zlib1g-dev libffi-dev libgmp-dev libreadline-dev

# Node.js 24.16.0, released 2026-05-21; its SHA-256 from nodejs.org's SHASUMS256.txt.
NODE_VERSION=24.16.0
case "$(uname -m)" in
  x86_64) NODE_ARCH=x64; NODE_SHA=d804845d34eddc21dc1092b519d643ef40b1f58ec5dec5c22b1f4bd8fabde6c9 ;;
  aarch64) NODE_ARCH=arm64; NODE_SHA=524659219d6a207a7400f2bde15d19ba060ffbe0d32a8643319ad67e3bb64c78 ;;
  *) echo "No pinned Node.js for $(uname -m)" >&2; exit 1 ;;
esac
NODE_DIR="$ROOT/.cache/toolchains/node-$NODE_VERSION"
if [ ! -x "$NODE_DIR/bin/node" ]; then
  mkdir -p "$ROOT/.cache/toolchains"
  ARCHIVE="$ROOT/.cache/toolchains/node.tar.xz"
  curl -fsSL -o "$ARCHIVE" "https://nodejs.org/dist/v$NODE_VERSION/node-v$NODE_VERSION-linux-$NODE_ARCH.tar.xz"
  echo "$NODE_SHA  $ARCHIVE" | sha256sum -c -
  mkdir -p "$NODE_DIR.tmp"
  tar -xJf "$ARCHIVE" -C "$NODE_DIR.tmp" --strip-components=1
  mv "$NODE_DIR.tmp" "$NODE_DIR"
  rm "$ARCHIVE"
fi

# Node.js and cargo are run by name; the other toolchains through runtimes.json.
cat > "$ROOT/.cache/toolchains/env.sh" <<EOF
export PATH="$NODE_DIR/bin:$ROOT/.cache/toolchains/rust-1.96.1/bin:\$PATH"
export npm_config_cache="$ROOT/.cache/npm"
EOF
. "$ROOT/.cache/toolchains/env.sh"

# The toolchains first (setup.mjs checks for cargo, go, python3 and ruby).
node scripts/setup-native.mjs
node scripts/setup.mjs
echo "Ready. In each shell that measures: . .cache/toolchains/env.sh"
