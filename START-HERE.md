# Better Attach 0.3.0-rc.5

先看 [中文 README](README.zh.md)，或直接播放 [操作视频](docs/assets/walkthrough.mp4)。GIF、视频仅录制 DSH 网页，操作和模型回复来自真实宿主。

## 安装

保持这个源码目录的位置稳定，运行：

```sh
npx --yes @deepseek-ai/dsh plugin --profile web add /absolute/path/to/better-attach
npx --yes @deepseek-ai/dsh web
```

已有 DSH 命令时可用 `sh install.sh` 或 `./install.ps1`。同名旧插件会由 DSH 官方管理器切换到此安装来源，重启后生效。建议先用独立 DSH_HOME 试用。

## 开发与提交

```sh
npm ci
npm run check
git status
git log --oneline
```

交付保留原仓库历史和本地增量提交。审阅后自行设置远端并推送当前分支；仓库没有配置远端。本地脚本和运行目录不进入交付。

## 验证范围

75 项核心测试、两版 DSH 各 9 项宿主联调、9 项真实浏览器检查、5 项拖拽显示检查、4 项原目录工作区检查和 4 项录制辅助测试通过。实际模型完成图片识别、便笺与目录读取，原目录工作区及对话路径引用也经过验证。

OS 原生跨窗口拖放仍待确认，完整发布门禁保持 BLOCKED。Windows 与 GitHub Actions 未运行。详细证据见 [验收记录](docs/ACCEPTANCE.md)。

源码使用 MIT；角色图片来源说明独立列在 assets/README.md。生产插件不加载 recording 目录。
