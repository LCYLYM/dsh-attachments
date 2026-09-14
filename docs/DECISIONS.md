# Product decisions

Conversation attachments support copying on send or referencing an original host path. The selected mode applies to the conversation only. References identify the original file explicitly and recheck its identity before reading.

Sidebar drops register the original host directory through WorkspaceController. An absolute original path supplied by a drop is used directly. When the browser omits it, the user selects or enters the host directory. File upload batches belong to conversations.

Standalone images use native DSH image drafts. Mixed selections and directories preserve their structure as path attachments. File previews are bounded to supported text and raster formats; other formats offer a download.

The default appearance follows the host. Optional backgrounds decorate attachment panels, with keyboard access and reduced-motion support. Upload retries preserve completed files; removing a draft and deleting saved copies are distinct operations.

Current verification and remaining platform coverage are recorded in [ACCEPTANCE.md](ACCEPTANCE.md). GIF and MP4 capture the actual DSH page and model responses; their drag events are automated.
