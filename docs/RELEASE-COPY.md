# 发布素材（供维护者审阅，不代表已经发布）

## GitHub About

Better Attach for DeepSeek Harness — folder drops with clear destinations, preflight review, previews and retry.

Topics: `dsh-plugin`, `deepseek-harness`, `dsh`, `attachments`, `drag-and-drop`, `workspace`, `file-upload`.

## 中文候选版发布说明

### Better Attach 0.2.0-rc.1

文件夹拖进对话，是附件；拖进侧栏，是工作区。侧栏默认导入独立副本，也提供显式注册 DSH 主机原目录的入口。

本候选版加入目录预检、敏感文件默认排除、图片与有界文本预览、两路原始字节传输、取消重试、已保存附件再次附加与可逆覆盖工具。普通图片单独拖入时继续交给官方入口，不改 DSH 核心文件。

本次交付环境通过 58 项 Node 测试和 20 项明确标注的浏览器测试桥检查；尚未完成原生 DSH 实机认证，HTTP API 仅支持回环访问。截图为测试夹具，完整范围见 README 和验收报告。不得在真实验证前删掉这段限制。

## English candidate release

### Better Attach 0.2.0-rc.1

Drop a folder into a conversation to stage an attachment, or onto the sidebar to import an independent workspace copy. Register an existing host directory explicitly when you need the original instead.

This candidate includes preflight review, sensitive-name exclusions, raster and bounded text previews, two-stream uploads, cancellation, retry and saved-attachment reuse. Pure image drops stay with the native intake. No core bundle patching.

58 Node tests and 20 explicitly bridged Chromium UI checks passed in the delivery environment. Native DSH certification remains outstanding; the HTTP API is loopback-only. Screenshots show the test fixture, not a native DSH session. Preserve these qualifications until real integration evidence is recorded.

## 截图与动图

首图：`docs/assets/08-workspace-review.png`；预览：`05-image-preview.png`；窄屏：`12-mobile-review.png`；截图步骤动图：`walkthrough.gif`。不要删掉“非真实 DSH”的截图标签再用于兼容宣传。

## Awesome PR 条目

```markdown
- [Better Attach](https://github.com/LCYLYM/dsh-attachments) — Folder-to-conversation attachments and sidebar workspace imports, with preflight review and previews. Release candidate; see compatibility notes.
```

沿用目标列表已有排序和分类规则，提交一次即可。本条目仅是材料，不是已经获得维护者接受。
