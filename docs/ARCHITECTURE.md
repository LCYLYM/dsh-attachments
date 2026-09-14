# Architecture

`lib/index.js` mounts the HTTP route and storage into actual Cordis services. Session cwd is resolved from live Sessions, with the official cold inspection API for persisted Sessions. Workspace registration uses WorkspaceController.create.

`lib/store.js` retains copy-on-send batches, manifests, bounded concurrent writes, checksums, cancellation and session-scoped cleanup. `lib/references.js` owns separate reference metadata: explicit absolute host path, session identity, device/inode identity and creation time. No original file is copied, overwritten or deleted. Preview opens verify identity again; references read current contents, while a replacement inode requires a new reference.

`lib/http.js` exposes both surfaces under the existing v2 prefix. Loopback remote address, Host, Origin and a custom same-origin header are checked. Reference preview responses are download-only octet-stream; the UI converts only known raster images/text into bounded previews. This is a local trusted-user extension, not a remote file service.

`src/dsh-client.js` connects four additive native slots and the input-trigger reference serializer. Standalone picked images call DSH createDrafts/addAttachments; failed admission releases drafts. Plain image drops remain owned by DSH. Folder/mixed attachments serialize explicit paths and manifests through the normal message input, not a hidden model channel.

`lib/ui.js` owns DOM panels, review, cards and settings. `lib/preferences.js` validates per-origin preferences and maps file icons. `scripts/build.mjs` deterministically combines owned modules, CSS and the supplied optional image; React remains provided by DSH. No third-party runtime code is bundled. jsdom is development-only.

Unsent selections live in browser memory. Saved copies and reference records survive through host metadata and can be reattached. Reference metadata cleanup does not remove original files. The native conversation transcript and its attachment cards remain DSH-owned.
