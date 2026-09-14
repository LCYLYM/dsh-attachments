# Better Attach

**Drop a folder into a conversation to attach it. Drop it onto the sidebar to create a workspace.**

[简体中文](README.zh.md) · [Compatibility](docs/COMPATIBILITY.md) · [Test evidence](docs/ACCEPTANCE.md)

An attachment plugin for DeepSeek Harness. Package identity remains `dsh-multimedia-webui-input`; this release is **0.3.0-rc.1**, developed on the original repository history.

**Verified:** 72 automated tests and 9 real-host integration checks on each of DSH `0.1.5-rc.1` and `0.1.5-rc.2`. The managed browser could not open the local host (`ERR_BLOCKED_BY_CLIENT`), so rendered DSH UI, OS-native drops and model requests remain unverified.

## Install

Requires Node.js 22.19+ or 24+ and DSH.

```sh
sh install.sh                     # macOS / Linux
# PowerShell: ./install.ps1
# Or:
dsh plugin --profile web add /absolute/path/to/better-attach
dsh web --no-open
```

Restart DSH after installation. The official plugin command links this checkout into the web profile; keep the checkout in place. No DSH core files are overwritten.

## Copy or reference

Choose **Settings → Better Attach**, or the attachment settings button beside the composer. Settings persist per browser origin.

| Mode | Conversation | Sidebar |
| --- | --- | --- |
| Copy files (default) | Review and stage; copy on send | Review, copy and register a real workspace |
| Reference paths | Validate an explicit host path; recheck on send | Register an existing host directory |

Browsers do not expose absolute source paths. Reference mode asks for the path on the DSH host; it does not infer it from filenames. References read current original contents. File references support bounded previews, copying the path and reattachment from history. Directory references are browsed through DSH file tools, without recursive enumeration in this plugin.

## Included

- One card per folder, directory filtering, empty directories where the browser exposes them.
- Native DSH image drops preserved; picking only PNG/JPEG/WebP/GIF images also creates native image drafts. Folder and mixed selections remain path attachments, not visual model input.
- Distinct document, spreadsheet, archive, code, audio, video and image icons.
- Text/code preview up to 128 KiB; raster image preview up to 20 MiB. PDF, Office, media and archives are download-only.
- Two concurrent transfers, progress, cancellation, file-level retry and session-scoped history.
- Native no-image appearance, blue gradient or optional character artwork. Decoration stays inside attachment panels; existing conversation content is unchanged.
- Reduced motion, visible keyboard focus and narrow-screen layouts.

## Develop and test

```sh
npm ci
npm run check
npm run demo
```

Open `http://127.0.0.1:4173`. The demo uses real local file storage and a simulated workspace registry; it makes no model calls. The demo itself has no third-party runtime dependencies.

Run the real DSH host tests with the supplied dependency locks:

```sh
npm ci --prefix fixtures/dsh-latest
npm run test:live:latest
npm ci --prefix fixtures/dsh-next
npm run test:live:next
```

Each run creates and removes its own temporary DSH_HOME, sessions and files. `artifacts/dsh-resolved-versions.json` records the exact component versions: the CLI's default tag may resolve newer internal components.

## Repository and release

The delivery archive includes `.git`, the original `028dc1f` commit and local development commits. A separate Git bundle is included for recovery. No remote account was connected, no changes pushed, and no npm package published.

Use `git log --oneline` and `git status`, add your desired remote locally, then push branch `better-attach/v0.3.0`. `npm pack` creates an installable archive. The existing public-release gate requires separately recorded native acceptance in `artifacts/native-acceptance.json`; it does not block local installation or development.

Uninstall with `dsh plugin --profile web remove dsh-multimedia-webui-input`, then restart DSH. Existing files are retained.

## Limits

Loopback same-origin HTTP only; remote proxy authentication is not implemented. Unsent browser file selections are lost on refresh; saved copies and path references can be reattached from history. Native message-history cards remain owned by DSH. Legacy v0.1 attachment data is not migrated or deleted. Windows/macOS, GitHub Actions and actual model responses have not been verified in this environment.

MIT for source code. Optional artwork is user-supplied; see [asset provenance](assets/README.md).
