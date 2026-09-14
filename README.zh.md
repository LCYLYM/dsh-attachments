# Better Attach

<img src="assets/logo.svg" width="64" alt="Better Attach logo">

**文件夹拖进对话，是附件；拖进侧栏，是工作区。**

[English](README.md) · [安装与兼容](docs/COMPATIBILITY.md) · [测试证据](docs/ACCEPTANCE.md) · [设计决策](docs/DECISIONS.md)

DeepSeek Harness 的附件插件。保留包名 `dsh-multimedia-webui-input`，在原仓库历史上升级为 **0.3.0-rc.2**。

本版已实际安装 DSH，并在默认发行版 `0.1.5-rc.1` 与 next 版 `0.1.5-rc.2` 上各通过 9 项真实宿主联调；72 项自动测试通过。真实浏览器页面、模型请求及 Finder/Explorer 人工拖放尚未验收，因此保留候选版标识。

## 用起来

已有 DSH 和 Node.js 22.19+（或 24+），在解压目录执行：

```sh
# macOS / Linux
sh install.sh
# 重启宿主
 dsh web --no-open
```

Windows PowerShell：`./install.ps1`。也可直接运行：

```sh
dsh plugin --profile web add /absolute/path/to/better-attach
```

安装采用 DSH 官方插件命令，不覆盖 DSH 核心文件。开发目录作为本地链接使用，请保留此目录；使用同包名旧版前应先备份原安装来源。

## 两种处理方式

在 DSH **设置 → Better Attach** 或输入区的附件设置按钮中选择，修改立即保存到当前浏览器站点。

| 模式 | 拖进对话 | 拖进侧栏 |
| --- | --- | --- |
| 复制副本（默认） | 检查目录、预览、暂存；发送时复制 | 检查后复制，并调用真实 DSH 工作区注册接口 |
| 引用路径 | 校验主机路径，插入引用；发送前再次校验 | 填写主机原目录，直接注册为工作区 |

**引用路径不等于上传。** 标准浏览器不会公开本机绝对路径，无法从文件夹名字推断 DSH 主机目录。因此路径模式会要求明确填写主机绝对路径，不猜测、不递归扫描主机。路径卡片支持复制路径、文件预览及再次附加；原文件修改后读取的是新内容。目录引用不递归生成文件树，由 DSH 文件工具读取。

## 交互和显示

- 一个文件夹一张卡片，保留相对目录和可枚举的空目录；目录内可筛选、预览。
- 独立 PNG/JPEG/WebP/GIF 图片拖放保留 DSH 原生通道；插件选择器选取纯图片时也接入原生图像草稿。文件夹与混合选择使用路径附件，**不会冒充视觉输入**。
- 文档、表格、压缩包、代码、音频、视频、图片使用不同图标。文本/代码限前 128 KiB，栅格图片限 20 MiB；PDF、Office、音视频、压缩包提供下载，不声称已解析。
- 两路并发上传，进度、取消、文件级重试；失败保留原草稿，清理副本不会删除原路径。
- 默认无图，另有官网风格蓝色渐变和 DSH 娘图片主题；仅装饰附件面板，不覆盖对话正文。配色继承 DSH 主题变量，支持减少动态效果、键盘焦点与窄屏。
- 未发送的浏览器文件选择不能跨刷新恢复。已保存副本及路径引用可从附件记录重新附加。

## 开发、演示与测试

```sh
npm ci
npm run check
```

生产插件已移除 demo 模式。独立录制脚本见 [recording/README.md](recording/README.md)，不被插件加载，也不打入 npm 包。

复跑**真实 DSH**（不是模拟宿主）：

```sh
npm ci --prefix fixtures/dsh-latest
npm run test:live:latest
npm ci --prefix fixtures/dsh-next
npm run test:live:next
```

测试自动创建独立 DSH_HOME、真实会话与临时文件，结束后删除测试目录。锁文件固定了本次全部依赖；CLI 的 latest 标签与内部组件版本可能不同，详见 `artifacts/dsh-resolved-versions.json`。

## Git 与发布

交付 ZIP 含 `.git`，原始提交 `028dc1f`、导入候选包提交和本轮增量提交均保留；还附 Git bundle 作为备用恢复文件。没有推送、连接账户或发布 npm。

```sh
git status
git log --oneline
# 在本地设置你希望推送的远端，再推送当前分支
# git remote add origin <your-repository-url>
# git push -u origin better-attach/v0.3.0
```

`npm pack` 生成可安装包。`npm publish` 的原有发布验收门禁仍保留，需要补齐 `artifacts/native-acceptance.json` 中的真实浏览器和操作系统验收后才能通过。源码开发、安装、测试不受此门禁影响。

卸载：`dsh plugin --profile web remove dsh-multimedia-webui-input`，然后重启 DSH。卸载不自动删除副本或原文件。

## 边界

HTTP 扩展仅接受回环同源请求，未实现远程反向代理认证。原生聊天历史卡片仍由 DSH 管理；本插件添加自己的草稿和记录界面。旧版 v0.1 附件不会自动迁移或删除。Windows/macOS 的实机结果、GitHub Actions 执行结果及模型回复未在本环境验证。

源码采用 MIT。可选图片由本轮用户提供，图片来源说明见 [assets/README.md](assets/README.md)。


<!-- recording:start -->
本环境浏览器访问本地 DSH 仍受限制，尚无真实录屏。独立脚本在本地录制成功后会自动在此插入真实 GIF 与 MP4。
<!-- recording:end -->
