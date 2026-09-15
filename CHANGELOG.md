# Changelog

## 0.3.0-rc.6

- Resolve original workspace directory paths from macOS Finder drops through a windowless Swift helper scoped to the visible DSH sidebar.
- Own the full file-drag event lifecycle while preserving DSH native image attachments.
- Present attachment cards in a separate scrollable row with compact toolbar controls.
- Explain the one-folder-per-workspace-drop limit with visible feedback.
- Document platform capabilities, packaged Mac helpers and source installation in one bilingual README.
- Windows automatic path integration remains unavailable; host directory selection and manual paths are supported.

## 0.3.0-rc.5

- Sidebar drops register the original host directory, independently of conversation attachment mode.
- Use an absolute path supplied by the drop, or ask for the original host directory through DSH's picker or a path field.
- Scope file upload batches to conversations and verify original workspace paths in the recorded walkthrough.


## 0.3.0-rc.4

- Keep drag hints visible between sparse native drag events; dismiss on destination exit, drop, Escape, blur or drag end.
- Reuse hint content and coalesce geometry updates per animation frame.
- Animate recording drags inside the browser with one shared DataTransfer, and export the GIF at 25 fps.


## 0.3.0-rc.3

- Align attachment cards with the native composer so retry controls remain clickable.
- Respect DSH_HOME for records and imported workspaces.
- Canonicalize macOS test paths and allocate smoke-test ports dynamically.
- Verify real image/file/folder model requests and workspace imports in DSH.
- Repair directory drag events in the standalone recorder and validate directory children before sending.
- Deliver webpage-only GIF/MP4, bilingual DSH documentation and a compact runtime package.


## 0.3.0-rc.2

- Removed the integrated demo and demo launchers.
- Added a vector logo to the README and plugin settings.
- Added an independent local recording script, movable callout, real file fixtures and output verification. It is excluded from the npm package.
- Successfully tested the generated image against the supplied vision API.
- Browser access remains blocked; no GIF/MP4 capture is claimed.


## 0.3.0-rc.1

- Installed and tested real DSH CLI 0.1.5-rc.1 and 0.1.5-rc.2.
- Replaced obsolete client runtime dependency with current module owners.
- Added persisted copy/path settings, session-scoped path references, bounded preview, copy-path and reattachment history.
- Added native image-draft integration for pure-image picking.
- Added file-type icons and native, blue-gradient and optional character appearance.
- Added real-host smoke runner, exact DSH dependency locks and DOM simulation regressions.
- Preserved the original repository history and imported the supplied 0.2.0-rc.1 candidate as a separate commit.
- Real rendered-browser, model and desktop OS acceptance remains pending.

## 0.2.0-rc.1

User-supplied candidate import. Historical code, reports and screenshots are retained in Git history; they are not current release evidence.
