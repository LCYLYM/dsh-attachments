# Architecture / 可读的实现说明

## Keep the ordinary path small

The runtime has a Cordis host adapter, a browser entry, shared validation, and one local metadata/file store. There is no database, queue server, model call, native background agent, remote SaaS dependency or extra UI framework. DSH supplies React for mounting; the reusable attachment UI uses ordinary DOM components so the lab executes the same code.

```
OS file/folder drop or native file input
  -> synchronously capture FileSystemEntry handles
  -> bounded asynchronous traversal + visible preflight
  -> conversation: retain File objects + reference chip
     sidebar: confirm independent copy / explicit existing host path
  -> serializer or confirmed import -> idempotent batch
  -> at most 2 raw File PUTs -> actual byte counts + SHA-256
  -> manifest -> atomic directory rename
  -> conversation receipt / workspaceController.create
```

## The ownership boundary is the destination

The sidebar marker comes from a list slot. The client derives a sidebar rectangle from that marker and resolves pointer coordinates against it before asynchronous work. A copied workspace uses the dedicated `@workspace-import` scope; it does not require an active conversation. A conversational import captures the session ID at drop-time and resolves its live cwd at the host—not from a client-supplied path. Switching sessions during a slow scan cannot change the original target.

Files, folders and internal text drags are distinguished. Pure raster-image drops are left to the native handler. A mixed image/file or folder import has path-attachment semantics, because a preview image and a vision-model attachment are not the same object.

## State machines with visible failures

Browser: `ready -> uploading -> committed`, or `uploading -> error/cancelled -> uploading`. Removing a ready selection is reversible during this page lifetime. The browser does not discard an object just because native optimistic sending temporarily removes its chip. A host receipt means materialized files, not a successful model turn.

Host: `staging -> registering -> committed`; explicit cancellation only before the registering/committed boundary. `registering` records a durable intended receipt before renaming the directory, allowing a retry after a lost response or interruption to reconcile the intended final tree. Workspace registration uses the official controller's path-based identity behavior. It is retried rather than claiming a failed registration succeeded.

Writers are admitted before filesystem awaits and tracked per file. A sealing guard blocks a late writer after commit has started checking the batch. Active writers prevent commit. Cancellation aborts and waits for current writers before removing only its staging directory. Retried completed files compare hash rather than merely accepting the same filename/size. A partial file restarts; there is no byte-offset resume protocol.

## Storage

Conversation copies:

```
<session cwd>/.dsh/tmp/attachments/better-attach-v2/<batch UUID>/
  files/<original relative tree>
  manifest.json
```

Workspace copies and metadata, by default:

```
~/.dsh/better-attach/records/<batch UUID>.json
~/.dsh/better-attach/workspaces/<batch UUID>/files/<dropped root folder>
```

`storageRoot` is a host plugin configuration option. The local lab instead uses a system temporary directory and a fixture workspace registry. Old plugin attachment directories are outside the v2 cleanup scope.

Every file entry records original relative path, size, MIME hint, lastModified hint and computed SHA-256. The emitted model text contains a root path, explicit untrusted-data warning, bounded first-file list and manifest path. MIME/mtime are hints; they are not a proof that a file is safe or semantically parsed.

## Editor integration is deliberately narrow

The source name remains `multimedia-webui-input`. A public codec serializes a selected batch when the host's send flow asks for it. `insertReference` inserts a chip at the end of the current input. Public snapshots carry clipboard offsets, while editing spans use one detect character per chip; `detectOffset` converts them. Removal uses a revision-guarded scoped insert-text event with an empty replacement. Missing support causes a visible failure, not a destructive fallback through `setDraft`.

There is no parallel custom Send button injected into DSH and no simulation of the host's command/queue state machine. Claimed or frozen input refuses additions. Subagent intake is deliberately unsupported here. The lab's Send button is visibly a test action, not that native integration.

## Previews and retention

The file list computes populated ancestor directories once instead of running a files-by-directories scan. It initially renders 150 rows, supports filtering and expands in chunks. Text rendering is bounded at 128 KiB. Image objects use Blob URLs, revoked after preview close or when committed browser bytes are released. Generic formats download without parser or execution.

Saved records are loaded from disk for the current session/cwd. Reattachment reuses the receipt, without another copy. The history panel does not change native transcript message rendering. This avoids relying on transcript internals at the cost of not providing inline historical file cards in this candidate.

## Failure and trust boundaries

Session mismatch, changed cwd, invalid path, missing capability, size mismatch, hash mismatch, capacity limit, incomplete batch and stale/removed reference are explicit failures. Internal IO errors are logged host-side while the UI receives a non-sensitive generic message. The API is loopback-only with same-origin/custom-header checks, not a remotely authenticated file service.

The store is designed for a trusted single local OS user. Crash windows, forced shutdown, hostile same-user filesystem changes and filesystem-specific semantics still require care; the executed tests are not a proof of all possible crash recovery or platform behavior. See SECURITY.md and ACCEPTANCE.md for the actual scope.
