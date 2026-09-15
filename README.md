# Better Attach · 更好的 DSH 拖放

<img src="assets/logo.svg" width="64" alt="Better Attach">

**拖到对话区，添加文件附件；拖到侧边栏，创建工作区。**

**Drop into the conversation to attach files. Drop into the sidebar to create a workspace.**

同一个文件夹，落点决定用途。工作区直接使用主机原目录。

One folder, two destinations. Workspaces use the original host directory.

| 拖到哪里 / Drop destination | 会发生什么 / Result |
| --- | --- |
| 💬 对话区 / Conversation | 文件或文件夹成为当前对话的附件，供模型读取。 / Files and folders become attachments for the model to read. |
| 📁 侧边栏 / Sidebar | 原目录成为工作区，可以在其中开始对话。 / The original directory becomes a workspace where you can start conversations. |

[中文](#中文) · [English](#english) · [验收记录 / Verification](docs/ACCEPTANCE.md)

`dsh` · `dsh-plugin` · `deepseek-harness` · `attachments` · `drag-and-drop` · `workspace`

<!-- recording:start -->
![Better Attach · rc.5 功能演示 / rc.5 walkthrough](docs/assets/walkthrough.gif)

[观看 rc.5 视频 / Watch rc.5 MP4](docs/assets/walkthrough.mp4) · 此视频展示 rc.5；rc.6 的工具栏、附件布局与 macOS 路径桥接以本文说明为准。 / This video shows rc.5; see below for rc.6 layout and macOS path-bridge behavior.
<!-- recording:end -->

## 中文

Better Attach 是 [DeepSeek Harness](https://github.com/deepseek-ai/DeepSeek-Harness) 的附件与拖放插件，沿用 [dsh-attachments](https://github.com/LCYLYM/dsh-attachments) 的 Git 历史和 npm 包名 `dsh-multimedia-webui-input`。

### 两个落点，两种用途

**拖到对话区：把文件交给模型。** 支持单个文件和整个文件夹；文件夹显示为一张卡片，保留目录层级，添加前可检查文件、筛选和预览。独立图片使用 DSH 原生视觉附件。

对话附件可在 **设置 → Better Attach** 或输入区的 **附件设置** 中选择处理方式：

| 对话附件模式 | 保存与读取方式 |
| --- | --- |
| 复制副本（默认） | 发送时保存副本，已保存内容不随原文件后续编辑改变。 |
| 引用路径 | 引用主机上的原文件或目录，模型读取其当前内容。 |

**拖到侧边栏：把原目录作为工作区。** 侧栏始终注册原目录，独立于对话附件设置。macOS 上，从 Finder 把一个文件夹拖到 DSH 侧边栏，插件自动获取绝对路径并注册原目录。**一次拖一个文件夹**；同时拖多个时会提示分别拖入。

拖拽提示由插件统一显示，独立图片仍通过 DSH 原生视觉接口添加。对话附件卡片独立横向滚动；工具栏图标可悬停查看名称。

### 平台支持

| 能力 | macOS | Windows / Linux |
| --- | --- | --- |
| 对话文件、文件夹附件及预览 | 支持 | 支持 |
| 选择或填写原目录，创建工作区 | 支持 | 支持 |
| Finder 拖入侧边栏，自动取得原绝对路径 | 支持，需随包附带原生桥接 | 尚不支持；需选择或填写主机目录 |

macOS 桥接随 DSH 插件启动和退出，仅在当前可见 DSH 页面的侧边栏收到真实拖拽时请求路径。切换标签页、离开侧边栏或取消拖动会取消请求；桥接不创建接收窗口。浏览器和 DSH 必须运行在同一台机器上。Windows 自动路径桥接仍是待完成能力。

### 安装

当前预发布版本 **0.3.0-rc.6**，需要 Node.js `^22.19.0 || >=24.0.0`。推荐下载 [GitHub Releases](https://github.com/LCYLYM/dsh-attachments/releases/tag/v0.3.0-rc.6) 中的 `.tgz` 包，包含 Apple Silicon 和 Intel Mac 桥接程序。

```sh
npx --yes @deepseek-ai/dsh plugin --profile web add /absolute/path/to/dsh-multimedia-webui-input-0.3.0-rc.6.tgz
npx --yes @deepseek-ai/dsh web
```

从 Git 源码安装时，先在固定源码目录构建。macOS 的原生构建需要 Xcode Command Line Tools：

```sh
npm ci
npm run build
# macOS only / 仅 macOS：
npm run build:native
npx --yes @deepseek-ai/dsh plugin --profile web add /absolute/path/to/better-attach
npx --yes @deepseek-ai/dsh web
```

也可使用交付 TGZ 的绝对路径安装。已有 DSH 命令时，可运行 `sh install.sh` 或 Windows 的 `./install.ps1`。修改插件后重启 DSH。npm 公开版本以注册表为准。

隔离试用时，先将 `DSH_HOME` 设为新目录。插件附件记录保存在其中的 `better-attach/`；对话附件副本位于当前工作区的 `.dsh/tmp/attachments/better-attach-v2/`。

### 其他能力

- **检查与预览**：目录筛选、文本和代码预览、栅格图片预览、文件类型图标；其他格式提供下载。
- **传输恢复**：上传进度、暂停、文件级重试；已完成文件复用，失败保留草稿。
- **附件复用**：从记录中再次附加已保存副本或原路径引用。
- **外观**：原生无图、蓝色渐变和角色图片，适配宿主颜色、窄屏、键盘操作与减少动态效果设置。

### 使用边界

仅支持同机回环访问。普通浏览器通常不提供原绝对路径，路径引用需明确填写主机路径。文本预览前 128 KiB，图片预览上限 20 MiB；HTML/SVG 作为文本显示，PDF、Office、音视频和压缩包提供下载。默认排除常见依赖、缓存和敏感文件名，规则不等同于完整 `.gitignore` 解析。

未发送的文件选择保存在页面内，刷新后需重选。清理仅删除当前会话的插件副本，保留原文件与工作区。文件落盘和模型消息成功分别记录；原生消息历史由 DSH 渲染。

本次 macOS Finder 单文件夹工作区拖入、对话拖放与最终界面由用户在真实 DSH 测试后确认。自动检查覆盖事件隔离、多目录反馈和原目录注册；Windows 自动路径桥接与桌面验收尚未完成。验证范围见[原生路径说明](docs/NATIVE_DROP.md)，历史检查见[验收记录](docs/ACCEPTANCE.md)。

卸载后重启 DSH：

```sh
npx --yes @deepseek-ai/dsh plugin --profile web remove dsh-multimedia-webui-input
```

## English

Better Attach is an attachment and drag-and-drop plugin for [DeepSeek Harness](https://github.com/deepseek-ai/DeepSeek-Harness). It continues the Git history of [dsh-attachments](https://github.com/LCYLYM/dsh-attachments) and keeps the npm package name `dsh-multimedia-webui-input`.

### Two destinations, two purposes

**Drop into the conversation to give files to the model.** Attach individual files or entire folders. A folder becomes one card, preserving its hierarchy, with filtering and previews before adding it. Standalone images use DSH's native image input.

Choose the conversation attachment mode in **Settings → Better Attach** or **Attachment settings** beside the composer:

| Conversation attachment mode | Storage and reading |
| --- | --- |
| Copy files (default) | Save a copy when sending; later edits to the original do not change that copy. |
| Reference paths | Reference an original host file or directory; the model reads its current contents. |

**Drop into the sidebar to use the original directory as a workspace.** On macOS, drag one folder from Finder into the DSH sidebar to resolve its absolute path and register the original directory. **One folder per drop**; multiple folders produce a message asking you to drop them separately. Conversation attachment settings do not change workspace registration.

One plugin-owned drag hint covers both destinations. Standalone images still use native DSH vision attachments. Attachment cards scroll horizontally above the composer; hover over compact toolbar icons for their labels.

### Platform support

| Capability | macOS | Windows / Linux |
| --- | --- | --- |
| Conversation files, folders and previews | Supported | Supported |
| Create a workspace by selecting or entering its original path | Supported | Supported |
| Resolve the original path automatically from a Finder sidebar drop | Supported with the packaged native helper | Not available; select or enter the host directory |

The macOS helper starts and stops with the plugin. Path requests are scoped to real drags over the visible DSH page's sidebar. Leaving the sidebar, switching tabs or cancelling cancels the request. The helper creates no receiving window. Browser and DSH must run on the same machine. Windows automatic path integration remains unfinished.

### Install

Current prerelease: **0.3.0-rc.6**. Requires Node.js `^22.19.0 || >=24.0.0`. Download the `.tgz` from [GitHub Releases](https://github.com/LCYLYM/dsh-attachments/releases/tag/v0.3.0-rc.6); it includes Apple Silicon and Intel Mac helpers.

```sh
npx --yes @deepseek-ai/dsh plugin --profile web add /absolute/path/to/dsh-multimedia-webui-input-0.3.0-rc.6.tgz
npx --yes @deepseek-ai/dsh web
```

For installation from Git source, build in a permanent directory first. Native macOS compilation requires Xcode Command Line Tools:

```sh
npm ci
npm run build
# macOS only:
npm run build:native
npx --yes @deepseek-ai/dsh plugin --profile web add /absolute/path/to/better-attach
npx --yes @deepseek-ai/dsh web
```

The delivered TGZ can also be supplied as an absolute package path. With DSH already installed, use `sh install.sh` or `./install.ps1` on Windows. Restart DSH after plugin changes. Check npm for publicly available versions.

For an isolated installation, set `DSH_HOME` to a new directory first. Plugin attachment records use its `better-attach/` directory. Conversation copies live under `.dsh/tmp/attachments/better-attach-v2/` in the current workspace.

### More features

- **Review and preview:** directory filtering, text/code and raster-image previews, file-type icons, and downloads for other formats.
- **Recoverable transfers:** progress, pause and file-level retries; completed files are reused and failures preserve the draft.
- **Attachment reuse:** reattach saved copies or original-path references from history.
- **Appearance:** native plain, blue gradient and character artwork, with host colors, narrow layouts, keyboard access and reduced motion.

### Boundaries

Loopback access only. Ordinary browsers generally omit original absolute paths, so references require an explicit host path. Text previews are bounded to 128 KiB and image previews to 20 MiB. HTML/SVG remain text; PDF, Office, audio, video and archives offer downloads. Common dependencies, caches and sensitive filenames are excluded by default; this is not a full `.gitignore` parser.

Unsent file selections live in the page and must be reselected after reload. Cleanup affects only this plugin's current-session copies, preserving original files and workspaces. Saved files and successful model messages are tracked separately; DSH owns native message history.

The user confirmed macOS Finder single-folder workspace drops, conversation drops and the final interface against real DSH. Automated checks cover event isolation, multiple-directory feedback and original-directory registration. Windows automatic path integration and desktop acceptance remain unfinished. See [native path scope](docs/NATIVE_DROP.md) and [historical verification](docs/ACCEPTANCE.md).

Uninstall, then restart DSH:

```sh
npx --yes @deepseek-ai/dsh plugin --profile web remove dsh-multimedia-webui-input
```

## 开发与文档 / Development & docs

```sh
npm ci
npm run check
npm ci --prefix fixtures/dsh-latest
npm run test:live:latest
npm ci --prefix fixtures/dsh-next
npm run test:live:next
```

[安装与兼容 / Compatibility](docs/COMPATIBILITY.md) · [录制说明 / Recording](recording/README.md) · [市场收录 / Plugin directories](docs/MARKETPLACES.md)

录制脚本独立于生产插件，视频中的文件读取与模型回复来自真实 DSH。 / The recorder is separate from the production plugin; file reads and model responses in the video come from real DSH.

MIT 许可证 / MIT license. [图片来源 / Artwork provenance](assets/README.md). GitHub Topics: `dsh`, `dsh-plugin`, `deepseek-harness`, `attachments`, `drag-and-drop`, `workspace`.
