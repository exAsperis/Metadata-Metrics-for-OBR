# Metadata Metrics

Metadata Metrics is an independent, read-only diagnostic extension for
[Owlbear Rodeo](https://www.owlbear.rodeo/). It shows how much of a room's
metadata quota is in use and lets the GM inspect nested object and array
structure to locate oversized values—without revealing the values themselves.

## Guarantees and privacy

- Metadata Metrics calls `OBR.room.getMetadata()` and listens to
  `OBR.room.onMetadataChange()`.
- It never calls `OBR.room.setMetadata()` or any other metadata-writing API.
- Only GMs can use the inspector. Players receive an access-restricted screen.
- Raw metadata values are never rendered, searched, copied, logged, persisted,
  or transmitted.
- The extension includes no telemetry, analytics, or external network calls.
- Settings and UI state remain local to the popover.

## Size calculation

The total is the UTF-8 byte length of `JSON.stringify(metadata)`. This extension
uses a conservative documented room metadata limit of **16 kB = 16,000 bytes**,
not 16 KiB. The adjustable value lives in
`src/constants.ts` as `DOCUMENTED_ROOM_METADATA_LIMIT_BYTES`.

Each top-level attribution is:

```text
UTF8(JSON.stringify(key)) + 1 colon byte + UTF8(JSON.stringify(value))
```

The separately displayed root overhead is two brace bytes plus one comma byte
between each pair. Top-level entries plus root overhead therefore equal the
exact total.

Nested values are serialized independently for diagnostic comparison. A
parent's size includes all of its descendants, so nested rows overlap and must
not be summed. Escaping and JSON punctuation can also make the apparent size
different from source data or in-memory size.

## Install from GitHub Pages

After GitHub Pages is enabled for the repository's `gh-pages` deployment, add
this manifest URL in Owlbear Rodeo:

```text
https://exasperis.github.io/Metadata-Metrics-for-OBR/manifest.json
```

The action opens a compact 440×650 px popover.

## Develop

Requires a current Node.js LTS release.

```bash
npm install
npm run dev
```

Load `http://localhost:5173/manifest.json` as a development extension. The Vite
server allows the Owlbear Rodeo origin for iframe development.

## Validate and build

```bash
npm run typecheck
npm test
npm run build
```

The static output is written to `dist/`.

## Limitations

- The 16,000-byte limit follows Owlbear Rodeo's current documentation and may
  change upstream.
- JSON serialization measures transport/storage representation, not JavaScript
  heap usage.
- Nested attribution overlaps by design; only the top-level reconciliation is
  additive.
- Friendly array labels are intentionally omitted because displaying values
  would violate the extension's privacy guarantee.
