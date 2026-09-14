<div align="center">
<h1>Better Attach</h1>
<p>Drop a folder into the conversation. Drop it into the sidebar. Get two different, predictable results.</p>
<p><b>For DeepSeek Harness · 0.2.0-rc.1 · MIT</b></p>
<p>English · <a href="README.zh.md">简体中文</a></p>
</div>

![Review a folder before importing it as a workspace](docs/assets/08-workspace-review.png)

*Screenshot of the shipped UI test fixture, not a native DSH screenshot. The fixture used a local HTTP test bridge and real filesystem storage; its workspace registry is a test substitute.*

**Better Attach is a folder workflow, not another claim that DSH cannot upload files.** Current upstream DSH already handles ordinary files. This candidate focuses on destination-aware drops, review before copying, safe previews, and predictable attachment ownership.

### One gesture. The right destination.

| You do this | Better Attach does this |
| --- | --- |
| Drop files or a folder into a conversation | Review the selection, keep the tree, and copy only during send-time serialization |
| Drop one folder into the sidebar | Review, create an independent host-side copy, then register it as a workspace |
| Choose **Use existing host directory** | Register the explicitly entered host path; upload and copy nothing |
| Drop only PNG / JPEG / WebP / GIF images into the conversation | Leave the event to DSH's native image intake |
| Open a saved attachment | Inspect its files, preview safe formats, download, or attach it again without another copy |

A browser does **not** reveal an arbitrary original directory's absolute path. Sidebar import therefore never silently guesses a path or claims a copy is the original. Mixed image/file imports are **path attachments**, not automatically native vision inputs.

## Try the complete local lab

Node.js 22.16+ is sufficient for the dependency-free lab and core tests. Installing into DSH must also satisfy **your DSH release's own Node requirements**; do not treat the lab minimum as DSH certification.

```bash
# In this source directory. No npm install or pnpm step is needed.
npm run check
npm run demo
```

Open `http://127.0.0.1:4173`. The demo creates real files beneath your system temporary directory. It has **no model connection**. `START-DEMO.cmd` and `START-DEMO.sh` start the same lab; stop it with Ctrl+C.

[Open the screenshot walkthrough](docs/assets/walkthrough.gif) · [Read the test report](docs/ACCEPTANCE.md) · [See the architecture](docs/ARCHITECTURE.md)

## Install the integration candidate

> **Not yet certified against a running native DSH release.** This is a contract-based implementation with executed core/browser-fixture tests, not a claim of a fully cloned, drop-in upstream upgrade. Read [compatibility](docs/COMPATIBILITY.md) and [source provenance](docs/PROVENANCE.md) first. Do not load this candidate alongside the old version or another generic drop handler.

The npm identity stays **`dsh-multimedia-webui-input`**. Better Attach is the product name; this repository remains `LCYLYM/dsh-attachments`. No new npm-name ownership is assumed.

```bash
# From a separate test DSH setup; use the absolute path to this extracted directory.
dsh plugin --profile web add /absolute/path/to/better-attach
dsh --profile web --dump-config
dsh --profile web
```

`install.sh` / `install.ps1` wrap the local-path add command; they do not patch DSH's compiled UI. To remove the plugin:

```bash
dsh plugin --profile web remove dsh-multimedia-webui-input
```

Restart the host and refresh the browser. Removal leaves committed copies intact. Explicit cleanup is available from **Attachments**, and never deletes original folders or workspace imports.

## What is included

**Folder review.** One folder stays one draft card. Relative paths and empty directories from directory-drop APIs are retained. The picker fallback cannot observe empty directories. Generated folders and common secret-like filenames are excluded by default, with visible reasons and an explicit sensitive-file opt-in. This is neither a full `.gitignore` interpreter nor a secret scanner.

**Useful previews.** Raster image preview; searchable file list; bounded text/code preview; safe download for other formats. HTML and SVG are text, not executable preview documents. Long names retain their complete value in accessible buttons/tooltips. File lists render the first 150 matches and expand on demand.

**Recoverable transfer.** Two concurrent raw-file uploads, byte progress, cancellation, explicit retry, and request identities reused across retries. Already completed files are not uploaded again. The host checks actual sizes and SHA-256 and publishes a batch only after every file is complete. A saved batch is not proof that the model accepted a message.

**Respectful integration.** Public slots and reference serialization; no replacement of the native workspace list; no whole-draft `setDraft` fallback; no interception of text/internal drags. Reduced-motion, keyboard focus, dark token fallbacks, and small-screen layouts are included.

## Tested, and not tested

| Layer | Result in this delivery |
| --- | --- |
| Core, real HTTP/filesystem, input/host contract and overlay tests | **58 passed** on Linux / Node 22.16.0 |
| Chromium UI acceptance | **20 passed**, explicitly using the in-memory/local-HTTP test bridge |
| Browser exceptions | **0** during that UI run |
| Native DSH install, actual model send, Finder/Explorer drag | **Not executed** |
| Windows/macOS execution and supplied GitHub Actions | **Not executed here** |

The managed browser prohibited URL navigation. The test runner rendered the actual shared UI code in memory and used a constrained local HTTP bridge. Its XHR-shaped shim is **not native browser transport validation**. Real Node HTTP and disk behavior were separately exercised. The runner's default mode uses direct browser HTTP on a normal local development machine.

```bash
npm test
# Optional browser development dependency; not needed by the plugin or demo.
python -m pip install playwright==1.57.0
python -m playwright install chromium
python tests/browser_tests.py --chromium /path/to/chromium
```

The source includes `artifacts/live-dsh.template.json`. After real native testing, provide the exact candidate commit, versions and redacted evidence, then run `npm run release:check`. It intentionally fails until that evidence exists. No GitHub upload, npm publication, or marketplace submission was performed for this delivery.

## Boundaries worth knowing

This candidate's HTTP API is **loopback-only**. DSH's public webServer route contract does not establish an authentication policy for arbitrary extension endpoints; this package does not invent one. Remote browser access and public reverse proxies are not supported by this candidate.

Unsent selections live in the current browser page; refreshing loses them. Saved copies survive restart. A saved reference can be attached again from the plugin's history dialog, but this version does **not** replace native transcript bubbles with custom historical cards or migrate the old plugin's attachment database.

The limits are 10,000 files, 20,000 total entries, 64 path levels, 1 GiB per file and 2 GiB per batch. These are admission ceilings, **not measured large-file performance guarantees**. Incomplete staging expires after 24 hours and is cleaned on the hourly sweep. Committed data is never automatically deleted.

[Security](SECURITY.md) · [Research & competitors](docs/RESEARCH.md) · [Market submission](docs/MARKETPLACES.md) · [Product decisions](docs/DECISIONS.md) · [Changelog](CHANGELOG.md)

## Bring it back to your existing repository

The source archive is not fabricated Git history. `scripts/overlay.mjs` dry-runs an overlay onto an existing checkout, preserves `.git` and unrelated files, and creates a reversible sibling backup before writing:

```bash
node scripts/overlay.mjs /path/to/your/dsh-attachments
node scripts/overlay.mjs /path/to/your/dsh-attachments --apply
# The command prints the precise backup path for --restore.
```

Review `git diff`, run checks, and perform native acceptance before publishing. The research credits [Emil Kowalski's design skills](https://github.com/emilkowalski/skills); no third-party skill source or font files are bundled.
