# Compatibility and native acceptance

## This delivery is an integration candidate

The adapter targets public contracts visible in DeepSeek Harness `master` on 2026-09-14. `master`, an npm release, and the user's installed version are not interchangeable. No particular native DSH version is certified by this archive. The older repository's claimed compatibility is not inherited as our test result.

Executed here: Linux, Node 22.16.0, Python 3.13.5, Playwright 1.57.0 and the installed Chromium. The package's dependency-free core can run on that Node version. For DSH installation, use the Node version that the actual DSH release requires; observed upstream/community material used `^22.19.0 || >=24.0.0`.

## Required public surfaces

Host: `webServer.register({kind:'prefix',path,handler})`, `sessions.get(id).header.cwd`. Workspace import additionally requires `workspaceController.create({path})`, returning a `workspace` with `workspaceId` and `path`. This optional capability is resolved lazily, not cached permanently as unavailable during startup.

Client: `sessions.scope(id)`, `conversation.input.for(scope)`, input state/`insertReference`, input trigger source codec, and the session-scoped `slash/input-insert-text` bail event. The local edit converts clipboard offsets to the detect projection, where each reference chip occupies one position. It never uses private Lexical imports or a whole-draft reset to remove a chip.

Slots: `conversation.input.left`, `conversation.input.dock`, `sidebar.footer.action`, and `settings.section`. Sidebar geometry is found from the mounted footer marker, not a hardcoded left-X boundary. The native workspace list is not replaced. Opening a registered workspace optionally uses `uiWorkspace.openWorkspace`.

The test input implements those contracts; it is not the real Lexical editor. Source review exposed why `setDraft` would be destructive and informed a regression test, but only live acceptance can establish compatibility with a particular assembled DSH profile.

## Native verification procedure

Use a separate DSH test configuration and disposable workspace. Disable the previous version and other file-drop plugins first. Record exact DSH/Node/OS/browser versions and this candidate's Git commit. Install from the extracted directory using the normal `web` profile command, inspect `--dump-config`, and start the host.

1. Confirm the UI appears once; unload/reload and confirm listeners/slots do not duplicate. Add a normal text file, send a harmless request to list the manifest, and verify the model has the referenced file available.
2. Drop a raster image alone: native thumbnail and real vision behavior should remain native. Drop image+file together: verify path-attachment wording and do not count it as native vision.
3. Drop a nested folder with an empty subdirectory into a conversation. Check exclusions, defer-write behavior, filename paths, cancel/retry, and a session switch during scanning. Test actual Finder/Explorer drag in addition to synthetic events.
4. Drop a folder on expanded and collapsed sidebar. Verify one real workspace registration and correct copy path; then test the explicitly entered original host path and ensure no copy appears.
5. Keep another plugin's reference before and after a Better Attach reference. Add/remove/undo/send and verify unrelated chips retain identity. Exercise send failure plus immediate typing while the official detached-send flow restores earlier content.
6. Check saved history after page/host restart, reattach, preview, cleanup, missing-file errors, and uninstall. Record that core DSH bundles are unchanged.

Copy `artifacts/live-dsh.template.json` to `artifacts/live-dsh.json` only when recording real results. Add redacted logs/screenshots, then run `npm run release:check`. A read-only `doctor --url ... --session ...` probe only validates route/session access and must not be promoted to those full results.

```bash
node scripts/doctor.mjs --url http://127.0.0.1:PORT --session ACTUAL_SESSION_ID
```

## Explicit exclusions

Remote or reverse-proxied browser use, subagent attachment intake, current-model vision support, native transcript-card replacement, v1 metadata migration, native file-picker recovery after refresh, filesystem modes/symlinks, recursive `.gitignore` semantics, and large-directory performance at maximum limits are not certified. PDF/Office/archive parsing is not implemented. Current mixed-drop semantics are intentional path attachments.
