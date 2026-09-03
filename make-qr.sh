#!/usr/bin/env bash
# Generate a print-ready QR code for the given URL: an SVG (vector, for
# print) and a high-resolution PNG (for screens, previews, and printers
# that don't accept vector art).
#
# Usage: ./make-qr.sh <url> [output-basename]
#   ./make-qr.sh https://your-project.vercel.app
#   ./make-qr.sh https://your-project.vercel.app qr-front-counter
#
# Error correction level: M (15% of the code can be damaged/obscured and
# still scan). L is denser-friendly but leaves no margin for a scratched
# laminate, a logo overlay, or a slightly bad print run; Q/H buy more
# resilience than a printed poster URL needs and cost QR density for it.
# M is the standard default for exactly this use case.
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: $0 <url> [output-basename]" >&2
  exit 1
fi

URL="$1"
BASENAME="${2:-qr}"
OUTDIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/qr-output"
mkdir -p "$OUTDIR"

if ! command -v qrencode >/dev/null 2>&1; then
  echo "qrencode not found. Install it: brew install qrencode" >&2
  exit 1
fi

SVG_PATH="$OUTDIR/$BASENAME.svg"
PNG_PATH="$OUTDIR/$BASENAME.png"

# -t SVG / -t PNG: output format
# -l M: error correction level M
# -m 4: quiet zone of 4 modules (the spec-minimum margin so scanners can
#       find the code's edges; qrencode's own default is thinner)
# -s 10: PNG module size in pixels (10px/module keeps the PNG print-resolution
#        at a typical QR version's size; scale up further before printing large)
qrencode -t SVG -l M -m 4 -o "$SVG_PATH" "$URL"
qrencode -t PNG -l M -m 4 -s 10 -o "$PNG_PATH" "$URL"

echo "Wrote:"
echo "  $SVG_PATH"
echo "  $PNG_PATH"

if command -v zbarimg >/dev/null 2>&1; then
  echo
  echo "Decoding to verify..."
  DECODED="$(zbarimg --raw -q "$PNG_PATH")"
  if [ "$DECODED" = "$URL" ]; then
    echo "OK: PNG decodes back to the exact URL."
  else
    echo "MISMATCH: decoded '$DECODED' but expected '$URL'" >&2
    exit 1
  fi
else
  echo
  echo "zbarimg not found — skipping automatic decode verification." >&2
  echo "Install it (brew install zbar) or scan the PNG with your phone to confirm." >&2
fi
