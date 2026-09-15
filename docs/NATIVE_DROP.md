# Native workspace paths

The browser owns the sidebar drop target and its existing visual feedback. A workspace is registered only after a browser drop into that sidebar. Successful registration shows a brief notification and leaves conversation navigation unchanged.

## Platform status

| Platform | Implementation | Verification |
| --- | --- | --- |
| macOS | A windowless Swift/AppKit helper reads the current drag pasteboard while the mouse is held. The browser drop resolves its single-use ticket against the pasteboard generation, directory name and current path. | Native compilation, process startup/cancellation/shutdown and repository checks passed. The user confirmed Finder single-folder sidebar drops and the final interface on 2026-09-15. Multi-folder rejection is covered by automated checks. |
| Windows | A browser-host integration is required to obtain the OLE drag data without replacing the browser drop target. The plugin reports this capability as unavailable. | BLOCKED: implementation and real Explorer-to-browser acceptance remain required. |

This prerelease delivers macOS automatic paths. Windows automatic path integration remains an open requirement; macOS checks do not complete that work.

## Development

Run `npm run build:native` on macOS with the Swift command-line tools, then `npm run build`. Use `npm run build:native -- --all` to compile Apple Silicon and Intel helpers for a release package. Binaries are ignored build outputs in `native/bin/`, included in the release TGZ. Intel compilation is not an Intel desktop drag acceptance test.

Run `node scripts/native-desktop-dev.mjs /path/to/dsh/lib/bin.js 3219` to start real DSH with an isolated profile under `work/native-desktop`. The one-time launch URL is stored in the ignored `work/native-desktop/launch-url.txt`. The helper starts and stops with the plugin. The regular DSH profile is not used by this script.

## Manual acceptance

- Drag a Finder directory into the sidebar in one continuous gesture; confirm the original absolute path is registered.
- Repeat with quick drops, pauses, re-entry, Escape, Chinese names, spaces and directories with identical names in different parents.
- Verify that the original sidebar feedback remains stable and conversation drops still follow attachment settings.
- Confirm that cancelling, dropping outside the sidebar or dropping a file does not register a workspace.
- Stop the isolated DSH process and confirm its helper exits.
- Repeat the corresponding Explorer checks on Windows once browser-host integration is implemented.

The bridge uses the drag pasteboard, not the user's general clipboard. Tickets expire after 16 seconds and are consumed once. An unavailable or changed snapshot produces an error rather than guessing a directory from its name.
