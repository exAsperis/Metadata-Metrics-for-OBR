# Owlbear Rodeo Store Submission

Metadata Metrics is prepared for manual submission to the Owlbear Rodeo
Extension Store. The store key `metadata-metrics` is currently available.

## Published listing

Use this publicly available Markdown file as the store listing:

```text
https://raw.githubusercontent.com/exAsperis/Metadata-Metrics-for-OBR/main/README.md
```

The listing references these published assets:

```text
Manifest: https://exasperis.github.io/Metadata-Metrics-for-OBR/manifest.json
Icon:     https://exasperis.github.io/Metadata-Metrics-for-OBR/icon.svg
Hero:     https://raw.githubusercontent.com/exAsperis/Metadata-Metrics-for-OBR/main/docs/store-hero.png
```

## Submit manually

1. Fork `https://github.com/owlbear-rodeo/extensions`.
2. Clone the fork and create a submission branch.
3. Add this entry to `extensions.json`:

   ```json
   "metadata-metrics": "https://raw.githubusercontent.com/exAsperis/Metadata-Metrics-for-OBR/main/README.md"
   ```

4. Validate that `extensions.json` remains valid JSON and that every listing
   URL above is publicly reachable.
5. Commit the submission as a single commit.
6. Push the branch to the fork.
7. Open a pull request targeting `owlbear-rodeo/extensions:main`.

The official process requires a lowercase, kebab-case, unique key and a pull
request containing only one commit:

https://docs.owlbear.rodeo/extensions/tutorial-sharing-your-extension/showcase-your-extension/
