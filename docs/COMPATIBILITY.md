# 安装与兼容

2026-09-14 在 macOS、Node.js v24.13.1 上安装并测试 DSH CLI `0.1.5-rc.1`（latest）和 `0.1.5-rc.2`（next）。每版 9 项宿主联调通过；真实网页与模型操作在 latest 上验证。内部组件版本以 `fixtures/dsh-latest/package-lock.json` 和 `fixtures/dsh-next/package-lock.json` 为准。

## 官方插件接口

插件使用 `dsh.bundle` 和 `dsh.client` 元数据，服务端挂载 `webServer`，从真实 `sessions`/`sessionController` 解析工作区。客户端通过 `conversation.input.left`、`conversation.input.dock`、`sidebar.footer.action` 与 `settings.section` 插槽挂载，通过 `inputTriggers` 异步序列化附件。

宿主接口和文件系统由真实 DSH 提供。浏览器录制使用自动化拖放事件；模型回复来自实际 DeepSeek API。

## 本地安装与卸载

```sh
npx --yes @deepseek-ai/dsh plugin --profile web add /absolute/path/to/better-attach
npx --yes @deepseek-ai/dsh web
```

源码目录需长期保留。也可以将安装目标替换为交付 TGZ 的绝对路径。已有 DSH 命令时可使用随包安装脚本。

隔离试用时先设置 `DSH_HOME` 到新目录。插件的记录和工作区导入遵守这个目录。卸载并重启后界面入口移除，原文件及已保存附件保留：

```sh
npx --yes @deepseek-ai/dsh plugin --profile web remove dsh-multimedia-webui-input
```

恢复旧版时安装旧目录或已发布的旧版本。官方 CLI 的本地安装、移除命令已在独立配置运行。

## 已验证与待确认

已验证：真实 DSH 网页、原生图片发送与模型识别、普通文件和目录的真实读取、工作区复制注册、引用路径、设置持久化、预览、窄屏和上传失败重试。详见 [验收记录](ACCEPTANCE.md)。

待确认：Finder/Explorer 跨窗口原生拖放、Windows 实机和 GitHub Actions。原生拖放尝试未取得可靠的成功读回，因此不以自动化事件替代该项。

仅支持同机回环同源 HTTP；远程浏览器与反向代理部署不在此版范围。PDF、Office、音视频、压缩包提供下载。未发送的本地文件选择刷新后需要重选。
