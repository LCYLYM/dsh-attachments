# Security and data boundaries

## Trust model

This candidate is for a single trusted local OS user. Its API requires a loopback peer, a loopback Host, a custom request header, and matching Origin/Fetch-Site when present. It does not rely on an undocumented DSH authentication layer. Do not expose it through a public reverse proxy: a proxy can change peer/Host information, and loopback checks are not user authentication.

No telemetry, model call, third-party upload endpoint, shell execution, ZIP extraction, automatic original-directory search, or arbitrary-file download route is added by this plugin. DSH's own model/tool behavior remains outside this plugin's guarantee.

## File handling

The host chooses the destination from a live session's absolute `header.cwd`, or from the dedicated workspace-import root. The client cannot supply a conversation destination. The session/cwd is revalidated during upload and commit. Metadata records carry ownership and session identity. File access is addressed by batch identity plus index, not a caller-supplied path.

Relative paths reject traversal, absolute/drive/UNC forms, control/bidi characters, ambiguous separators, Windows device names, trailing dots/spaces and case/NFC collisions. Existing storage descendants and roots are checked for symlinks; files are opened without following a final symlink where the OS supports `O_NOFOLLOW`. Downloads reject hardlinked non-private files. Writes use unique temporary files and non-overwriting links. These controls do **not** sandbox a malicious process running as the same OS user, nor close every hostile same-user filesystem TOCTOU race.

Actual streamed byte counts and SHA-256 are checked. Preview/download responses use octet-stream, attachment disposition, nosniff and restrictive CSP. Text previews use `textContent`; SVG and HTML are not executed. Raster preview is limited to 20 MiB per image; that is a byte limit, not a decoded-pixel budget. Files are not antivirus-scanned.

## Exclusions are not a secret scanner

Generated folders are skipped before traversal. Common sensitive names, including `.env`, private-key extensions and credential filenames, are excluded by default and can be opted in explicitly. A renamed secret can still be imported. The model manifest labels imported material as untrusted data; it cannot guarantee a downstream agent will resist prompt injection.

## Data lifetime and removal

Draft File objects are browser memory and are lost on refresh. Removed selections are retained for page-lifetime undo; committed records release browser File bytes and thumbnail object URLs. Disk staging is retained for retry and may remain for up to the next hourly sweep after 24 hours. Completed imports are retained until explicit cleanup; workspaces are never automatically removed.

Session cleanup requires a fixed confirmation string and only deletes this v2 store's committed copies for the current session/cwd. It leaves originals, unrelated sessions, imported workspaces and old v1 files alone. Existing references become invalid after cleanup. Uninstall removes plugin registration/UI contributions, not user data.

A local disk-full/permission error is surfaced rather than reported as success. This candidate does not provide a resumable byte-range upload protocol: retries reuse completed whole files, and a partially sent file restarts.

## Reporting

Do not open a public issue containing exploit credentials, private files or raw home paths. Use the repository's private security reporting facility when the owner has enabled it; otherwise contact the maintainer through an established private channel. No private-reporting endpoint is claimed to have been enabled by this delivery.
