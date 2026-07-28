# Contributing to Metadata Metrics

Metadata Metrics is built with React, TypeScript, Vite, and the Owlbear Rodeo
SDK. Contributions and bug reports are welcome.

## Local development

Install a current Node.js LTS release, then run:

```bash
npm install
npm run dev
```

Add `http://localhost:5173/manifest.json` as a development extension in your
Owlbear Rodeo profile. The Vite development server allows the Owlbear Rodeo
origin for iframe development.

## Validation

Before opening a pull request, run:

```bash
npm run typecheck
npm test
npm run build
```

The static production build is written to `dist/`.

## Project guarantees

Metadata Metrics is intentionally read-only. Do not introduce calls to
`OBR.room.setMetadata()` or any other metadata-writing API. Raw metadata values
must not be rendered, searched, copied, logged, persisted, or transmitted.
