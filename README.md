---
title: Metadata Metrics
description: Inspect room metadata usage and locate oversized values.
author: ex Asperis
image: https://raw.githubusercontent.com/exAsperis/Metadata-Metrics-for-OBR/main/docs/store-hero.png
icon: https://exasperis.github.io/Metadata-Metrics-for-OBR/icon.svg
tags:
  - other
manifest: https://exasperis.github.io/Metadata-Metrics-for-OBR/manifest.json
learn-more: https://github.com/exAsperis/Metadata-Metrics-for-OBR
---

# Metadata Metrics

Metadata Metrics is a read-only diagnostic tool for Owlbear Rodeo game
masters. It shows how much of the room metadata quota is in use and helps you
find the namespaces, keys, objects, and arrays consuming the most space.

![Metadata Metrics open in an Owlbear Rodeo room](https://raw.githubusercontent.com/exAsperis/Metadata-Metrics-for-OBR/main/docs/store-hero.png)

## Install and enable

1. Open **Extensions** from Owlbear Rodeo's Extras menu.
2. Find **Metadata Metrics** in the extension browser and select **Add**.
3. Enable Metadata Metrics for the room you want to inspect.
4. Select its database icon in the extension bar.

Metadata Metrics is available to the GM only. Players see an access-restricted
message and no room metadata is read for them.

## Use Metadata Metrics

The **Room Metadata** panel shows:

- Current usage against the documented 16 kB room limit
- Exact UTF-8 byte count and percentage used
- Normal, caution, warning, or critical quota status
- Number of top-level metadata keys
- Time of the latest update

The display updates automatically when room metadata changes. Select
**Refresh** whenever you want to request a fresh reading manually.

### Find the largest extension namespaces

Top-level keys are grouped by the namespace before the first `/`. For example,
all `com.example.my-extension/...` keys appear under one
`com.example.my-extension` row with their combined attributed size.

Namespaces start collapsed and are sorted largest first. Expand a namespace to
see its metadata keys, then continue through nested objects and arrays. Object
members are sorted by size; array items remain in their original order and are
shown 100 at a time.

### Search and copy paths

Search is case-insensitive and checks key names and structural paths only.
Matching descendants remain visible with their ancestors so you can understand
where each result belongs.

Use the copy button beside any row to copy only its path, such as:

```text
com.example.my-extension/metadata.characters[3].inventory
```

Metadata values are never copied or displayed.

## How sizes are calculated

The total is the UTF-8 byte length of the room metadata's JSON serialization:

```text
UTF8(JSON.stringify(metadata))
```

Metadata Metrics treats the documented 16 kB limit conservatively as
**16,000 bytes**, not 16 KiB.

Each top-level key includes its serialized key, colon, and serialized value.
Root braces and commas are shown separately, so top-level entries plus root
overhead equal the exact total.

Nested rows show the independently serialized size of each value. A parent
already contains its descendants, so parent and child rows overlap and must not
be added together.

## Privacy and safety

- Metadata Metrics never writes or modifies room metadata.
- Raw metadata values, including potential array labels, are never displayed.
- Search examines keys and paths only.
- No metadata is logged, persisted, transmitted, or sent to telemetry.
- The extension makes no external runtime requests.
- Only the GM can access structural diagnostics.

## Troubleshooting

**The extension says GM access is required**

Only the room's current GM can inspect room metadata. Confirm that you joined
the room as the GM, then select **Retry**.

**Metadata is unavailable**

Confirm that the extension is enabled for the room and that Owlbear Rodeo is
connected, then select **Retry** or reopen the extension.

**A total looks larger than its visible children**

Serialized JSON includes quotes, escaping, punctuation, and other structural
bytes. Nested rows also overlap with their parents by design.

**The quota limit changes in Owlbear Rodeo**

Open a support issue so the extension's documented 16,000-byte constant can be
updated.

## Support

Report bugs or request improvements through
[GitHub Issues](https://github.com/exAsperis/Metadata-Metrics-for-OBR/issues).

Metadata Metrics is independent software and is not affiliated with or
endorsed by Owlbear Rodeo.
