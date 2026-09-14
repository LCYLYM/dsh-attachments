# Source provenance / 来源与改造边界

As of 2026-09-14.

The requested upstream is https://github.com/LCYLYM/dsh-attachments . Public metadata, README, `package.json`, `cordis.patch.yml`, and the existing `lib/client.js` were inspected through web retrieval. The original client used the npm identity `dsh-multimedia-webui-input`, loader identity of the same name, `multimedia-webui-input` reference source, session-bound reference serialization, and copy-on-send batches.

**A full Git clone did not succeed in the execution environment. The original host `lib/index.js` was not successfully retrieved. No exact upstream commit SHA was established.** This archive is consequently a newly authored, contract-based candidate—not a preserved checkout, a verified diff against every upstream file, or a security audit of the unseen host implementation. It contains no fabricated `.git` directory or fabricated original-host source.

Preserved by design: package/loader/reference identities, standard bundle patch, ordinary session references and copy-on-send intent. Reimplemented: browser UI/intake, raw stream storage/API v2, host/public-slot adapters, tests and developer tooling. Added: folder-to-sidebar workflow, explicit existing-host-directory registration, previews and lifecycle reporting. No competitor's source code or Emil's skill text was vendored.

The v2 storage and HTTP namespaces are separate from the old plugin. Existing old files are not deleted or silently migrated. Old pending browser File selections cannot be recovered by this archive. Disabling the old version before installing the candidate avoids duplicate source IDs/drop listeners.

## Apply to the actual project

Keep a real local clone. When network access is available, the optional helper retrieves that actual clone and records the real HEAD:

```bash
node scripts/fetch-upstream.mjs /path/to/dsh-attachments-upstream
node scripts/overlay.mjs /path/to/dsh-attachments-upstream
node scripts/overlay.mjs /path/to/dsh-attachments-upstream --apply
```

The overlay does not delete unlisted files and does not touch `.git`. It creates a sibling backup before changing any listed existing file. `--restore` uses the exact printed backup path. Restoration deliberately reverts the listed paths; save any edits made after applying the overlay before restoring. Empty created directories may remain. The overlay itself was exercised against a synthetic Git-shaped checkout; it was not run against the user's real repository.

Review package metadata, installer conflicts, the replaced host implementation, and any existing custom patches before committing. The network-retrieval helper is supplied but successful network execution is not claimed here.

## Evidence classification

| Item | Evidence |
| --- | --- |
| User repository metadata/client design | Public source inspection |
| Official API/slot/input behavior | Public `master` source inspection; not a pinned release certification |
| This candidate's core/filesystem/HTTP | Actual local automated execution |
| Browser layout/intake/dialogs | Actual Chromium, in-memory HTML with explicitly substituted local transport |
| Workspace registry and DSH input/editor in tests | Deliberately small test substitutes |
| Git clone, native DSH, real model, physical OS drag | Not verified |
