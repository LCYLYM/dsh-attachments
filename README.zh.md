# Better Attach · DSH 附件与拖放

<img src="assets/logo.svg" width="64" alt="Better Attach">

**文件夹拖进对话，是附件；拖进侧栏，是工作区。**

[English](README.md) · [安装与兼容](docs/COMPATIBILITY.md) · [验收记录](docs/ACCEPTANCE.md) · [市场收录](docs/MARKETPLACES.md)

`dsh` · `dsh-plugin` · `deepseek-harness` · `attachments` · `drag-and-drop`

为 [DeepSeek Harness](https://github.com/deepseek-ai/DeepSeek-Harness) 提供目录检查、文件预览和两种附件处理方式。沿用 [dsh-attachments](https://github.com/LCYLYM/dsh-attachments) 的插件身份与 Git 历史，npm 包名为 `dsh-multimedia-webui-input`。

<!-- recording:start -->
![真实 DSH 操作演示](docs/assets/walkthrough.gif)

[观看 MP4](docs/assets/walkthrough.mp4) · 真实 DSH 与模型调用，自动化拖放。录制范围仅为 DSH 网页。
<!-- recording:end -->

## 安装试用

版本 **0.3.0-rc.3**。需要 Node.js `^22.19.0 || >=24.0.0` 和 DSH。当前验证的 CLI 为 `0.1.5-rc.1`（latest）、`0.1.5-rc.2`（next）；完整组件版本由 fixtures 的锁文件固定。

将源码解压到长期保留的目录，运行：

```sh
npx --yes @deepseek-ai/dsh plugin --profile web add /absolute/path/to/better-attach
npx --yes @deepseek-ai/dsh web
```

已安装 DSH 的用户也可执行 `sh install.sh`，Windows 使用 `./install.ps1`。修改插件后重启 DSH。交付的 TGZ 可作为同一安装命令的本地包路径。此候选版本以本地交付包试用，npm 公开版本以注册表为准。

需要隔离试用时，先设置 `DSH_HOME` 指向一个新目录，再执行安装和启动命令。插件的记录与工作区导入保存在该目录下的 `better-attach/`；会话附件副本位于当前工作区的 `.dsh/tmp/attachments/better-attach-v2/`。

## 按落点处理文件夹

| 操作 | 复制副本（默认） | 引用路径 |
| --- | --- | --- |
| 拖进对话 | 检查目录与预览，暂存成一张卡片，发送时复制 | 填写主机路径，校验后添加引用 |
| 拖进侧栏 | 确认导入独立副本，注册为工作区 | 填写主机目录，直接注册 |
| 原文件后续变化 | 已保存副本保持独立 | 模型读取当前原文件 |

在 **设置 → Better Attach** 或输入区的 **附件设置** 中切换模式。浏览器不会提供本机绝对路径，因此引用模式需要明确填写运行 DSH 的主机路径。

## 看清楚，再发送

- **文件夹单卡片**：保留层级及拖放接口可枚举的空目录；支持筛选文件、展开预览与查看排除项。
- **预览与图标**：栅格图片、文本和代码可预览；文档、表格、压缩包、音视频有对应图标与下载入口。HTML、SVG 作为文本显示。
- **原生图片**：单独拖入 PNG/JPEG/WebP/GIF，或通过插件选择器选取纯图片，进入 DSH 原生图像通道。文件夹及混合选择按路径交给模型文件工具读取。
- **错误恢复**：两路并发上传，支持进度、暂停与文件级重试；已完成文件在重试时复用。发送准备失败保留草稿。
- **再次附加**：在附件记录中查看已保存副本和原路径引用，重新加入当前会话。
- **三种外观**：原生无图、蓝色渐变、角色图片。背景用于附件面板，配色继承 DSH；支持键盘焦点、减少动态效果和窄屏。

## 验证与录制

```sh
npm ci
npm run check
npm ci --prefix fixtures/dsh-latest
npm run test:live:latest
npm ci --prefix fixtures/dsh-next
npm run test:live:next
```

真实浏览器检查和录制说明见 [recording/README.md](recording/README.md)。录制说明牌与鼠标由独立脚本临时呈现，录制目录不被生产插件加载。视频中的回复来自真实 `deepseek-v4-flash-vision-exp`，文件确实上传并由 DSH 工具读取。

## 使用边界

仅支持同机回环访问。文本预览前 128 KiB，图片预览上限 20 MiB；PDF、Office、音视频和压缩包提供下载。默认排除常见依赖、缓存和敏感文件名，规则不是完整的 `.gitignore` 解析器。

未发送文件选择保存在页面内，刷新后需要重选。已保存附件与“消息发送成功”分开记录。清理只删除当前会话的插件副本；旧版附件、原文件与工作区导入保留。原生消息历史由 DSH 渲染。

Finder/Explorer 原生拖放仍待人工确认，Windows 和 GitHub Actions 未实跑。候选版保持 `next` 发布标签，具体已验证范围见验收记录。

卸载：`npx --yes @deepseek-ai/dsh plugin --profile web remove dsh-multimedia-webui-input`，然后重启 DSH。

MIT 许可证；可选图片的独立来源说明见 [assets/README.md](assets/README.md)。GitHub About 建议 Topics：`dsh`、`dsh-plugin`、`deepseek-harness`、`attachments`、`drag-and-drop`、`workspace`。README 标签与 GitHub Topics 是分别配置的字段。
