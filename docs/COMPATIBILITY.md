# Compatibility / 安装与兼容

本次真实安装：npm `@deepseek-ai/dsh@0.1.5-rc.1`（latest）和 `@deepseek-ai/dsh@0.1.5-rc.2`（next），Node v24.19.0，Linux。每版完成 9 项宿主验收，详见 ACCEPTANCE.md。默认 CLI 的依赖范围会拉取较新的内部组件；fixtures 中保留安装锁文件，不能只凭 CLI 版本推断所有依赖版本。

## 已修复的客户端依赖

旧候选版声明已不存在的 `@deepseek-ai/dsh-client-runtime`。新版改用发行版的 session-controller、ui-renderer、ui-input-trigger、ui-conversation、ui-settings、ui-workspace。真实 Host 生成的客户端启动图包含本插件、所有声明依赖，并能通过 HTTP 返回构建后的插件脚本。

UI 使用 settings.section、conversation.input.left、conversation.input.dock、sidebar.footer.action 这四个可追加插槽，保留官方图片和原生工作区界面。此处已做接口及 DOM 模拟测试，但没有渲染器浏览器验收结论。

## 安装和回退

`sh install.sh` 或 PowerShell `./install.ps1` 调用官方 `dsh plugin --profile web add <checkout>`。使用固定路径存放解压目录。关闭再启动 DSH 后生效。

卸载运行 `dsh plugin --profile web remove dsh-multimedia-webui-input` 并重启。回退旧插件时，重新安装旧目录或旧 npm 包。不会自动删除原文件、工作区目录或插件副本。

如果希望隔离试用，可在新终端设置自己的 DSH_HOME 再运行安装和启动命令；不要覆盖原来的配置目录。真实验收脚本已自动这样处理。

## 尚未验证

- 内置浏览器访问本地地址返回 ERR_BLOCKED_BY_CLIENT，未完成真实 DSH 页面渲染、截图或原生上传入口验收。
- 无模型 API 凭证，未验证模型实际收图、工具读取与回复。
- 无 Windows/macOS 实机，未验证 Finder/Explorer 人工目录拖放。
- 未运行 GitHub Actions、发布 npm 或向市场提交收录。

路径模式在普通浏览器中需要明确输入 DSH 主机路径；上传副本不需要路径。仅支持同机回环同源 HTTP。PDF/Office/音视频当前仅下载。
