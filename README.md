# Better Attach · DSH attachments & folder drops

<img src="assets/logo.svg" width="64" alt="Better Attach">

**Drop a folder into a conversation to attach it. Drop it into the sidebar to use the original directory as a workspace.**

[简体中文](README.zh.md) · [Compatibility](docs/COMPATIBILITY.md) · [Verification](docs/ACCEPTANCE.md) · [Plugin directories](docs/MARKETPLACES.md)

`dsh` · `dsh-plugin` · `deepseek-harness` · `attachments` · `drag-and-drop`

Folder review, file previews and copy/path settings for [DeepSeek Harness](https://github.com/deepseek-ai/DeepSeek-Harness). Continues the identity and Git history of [dsh-attachments](https://github.com/LCYLYM/dsh-attachments), published under the package name `dsh-multimedia-webui-input`.

<!-- recording:start -->
![Real DSH walkthrough](docs/assets/walkthrough.gif)

[MP4](docs/assets/walkthrough.mp4) · Automated drag events, real DSH calls. Only the DSH webpage is recorded.
<!-- recording:end -->

## Try it locally

Candidate **0.3.0-rc.5** requires Node.js `^22.19.0 || >=24.0.0`. Verified CLI versions: `0.1.5-rc.1` (latest) and `0.1.5-rc.2` (next). Fixture lockfiles pin the component versions used in verification.

Extract the source to a permanent directory:

```sh
npx --yes @deepseek-ai/dsh plugin --profile web add /absolute/path/to/better-attach
npx --yes @deepseek-ai/dsh web
```

With DSH already installed, use `sh install.sh` or `./install.ps1`. Restart DSH after plugin changes. The delivered TGZ can also be supplied as a local package path. This candidate is distributed locally; check npm for publicly available versions.

For an isolated installation, set `DSH_HOME` to a new directory first. Plugin attachment records use its `better-attach/` directory. Conversation copies live in the current workspace under `.dsh/tmp/attachments/better-attach-v2/`.

## Choose how files enter DSH

Conversation attachments have two modes:

| Conversation attachment mode | Adding files | Later source edits |
| --- | --- | --- |
| Copy files (default) | Review, stage one card, copy on send | Saved copies stay independent |
| Reference paths | Validate and reference the host path | Reads use the current original |

**The sidebar always registers the original host directory as a workspace.** An absolute original path in the drop is registered directly; otherwise select or enter the original directory on the DSH host.

Choose the conversation attachment mode in **Settings → Better Attach** or **Attachment settings** beside the composer. Ordinary browsers generally omit original absolute paths; conversation reference mode asks for an explicit path on the DSH host.

## Review before sending

- **One folder, one card.** Preserve hierarchy and empty directories exposed by drag APIs; filter files and inspect exclusions.
- **Previews and icons.** Raster images, text and code previews; distinct document, spreadsheet, archive and media icons. HTML and SVG remain text.
- **Native image input.** Separate PNG/JPEG/WebP/GIF drops and image-only file selections use DSH's native image drafts. Mixed selections and folders are read through file tools by path.
- **Recoverable transfers.** Two concurrent uploads, progress, cancellation and file-level retries that reuse completed files. Preparation failures preserve the draft.
- **Reuse saved attachments.** Reattach saved copies and original-path references from attachment history.
- **Three appearances.** Native plain, blue gradient and character artwork, with host colors, keyboard focus, reduced motion and narrow layouts.

## Verify and record

```sh
npm ci
npm run check
npm ci --prefix fixtures/dsh-latest
npm run test:live:latest
npm ci --prefix fixtures/dsh-next
npm run test:live:next
```

[Recording instructions](recording/README.md) cover the standalone recorder and real-browser checks. Its movable note and pointer exist only during recording. The production plugin never loads that directory. The walkthrough uses real `deepseek-v4-flash-vision-exp` responses and real DSH file reads.

## Boundaries

Loopback access only. Text previews are bounded to 128 KiB; image previews to 20 MiB. PDF, Office, audio, video and archives are downloadable. Common generated directories and sensitive names are excluded by default; these rules are not a complete `.gitignore` implementation.

Unsent browser selections need reselecting after reload. Saved files and successful message sends are tracked separately. Explicit cleanup affects this plugin's current-session copies, preserving originals, registered workspaces and legacy files. DSH owns native message-history rendering.

Finder/Explorer drag-and-drop still needs manual confirmation. Windows and GitHub Actions have not been executed here. The candidate retains the `next` release tag; see the verification record for exact scope.

Uninstall with `npx --yes @deepseek-ai/dsh plugin --profile web remove dsh-multimedia-webui-input`, then restart DSH.

MIT license. See [artwork provenance](assets/README.md) for optional artwork. Suggested GitHub Topics: `dsh`, `dsh-plugin`, `deepseek-harness`, `attachments`, `drag-and-drop`, `workspace`. Configure Topics separately in the repository's About panel.
