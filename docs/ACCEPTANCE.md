# Better Attach 0.3.0-rc.5 验收

2026-09-14，macOS、Node.js v24.13.1、真实 DSH npm 发行包和 Chrome。自动化拖放与操作系统拖放分别记录。

| ID | 需求 | 结果与证据 |
| --- | --- | --- |
| A1 | 插件身份、Git 历史、官方安装 | PASS：起点 028dc1f 与远端一致；隔离 DSH_HOME 的官方 add/remove 成功 |
| A2 | 对话文件/目录、预览、发送、重试和记录 | PASS：真实模型读文件/目录；真实 HTTP 存储；浏览器断线上传后点击重试保存成功 |
| A3 | 侧栏添加原目录工作区 | PASS：注册路径与原目录一致；两种对话附件模式下均不上传目录内容；原目录树保持一致 |
| A4 | 两种模式、原生图片、图标与三种主题 | PASS：设置持久化、实际图像草稿与模型识别、浏览器主题与窄屏检查 |
| A5 | 最新发行版真实 DSH 与模型 | PASS：latest/next 各 9 项宿主联调；latest 页面内模型读图、便笺与目录 |
| A6 | 独立录制、GIF/MP4、Logo、中英 README、tags | PASS：网页视口录制，真实模型与文件调用，见 docs/assets |
| A7 | 本地提交、源码 ZIP、TGZ 与 bundle | PASS：本地源码历史、npm 包与 Git bundle 随 ZIP 交付；SHA-256 清单可核对 |
| A8 | OS 拖放、窄屏、深浅色和卸载 | BLOCKED：窄屏、深浅色和官方移除已验证；Finder/Explorer 跨窗口拖放待确认 |

## 当前证据

- `artifacts/current-node-tests.tap`：75 项核心、存储、HTTP、引用、UI 契约测试通过。
- `artifacts/live-dsh-latest.json` / `live-dsh.json`：DSH CLI 0.1.5-rc.1、0.1.5-rc.2 各 9 项真实宿主检查。
- `artifacts/browser-acceptance.json`：9 项真实 Chrome 检查，包括上传中断与恢复；未捕获页面异常为 0。
- `artifacts/recording.json`：实际网页录制步骤。模型识别图片中的杯子、多肉和笔记本；读取便笺口令“青岚-731”与目录口令“纸舟沿河行”。
- `docs/assets/walkthrough.gif` / `walkthrough.mp4`：仅 DSH 网页视口，没有桌面及其他应用。

宿主检查使用临时测试插件调用真实 SessionController、WorkspaceController，并验证文件落盘。UI 契约单测使用 jsdom；真实浏览器检查直接打开 DSH，不替换宿主服务。网络故障用例中断一次 PUT 后恢复真实连接。

## 验收边界

原生 Finder 跨窗口拖放已尝试，但工具操作没有取得可靠的成功读回；自动化目录 DragEvent 不代替该项。原生 DSH 文件引用与插件附件共存、移除后保留原引用的浏览器用例已通过（artifacts/foreign-reference.json）。Windows、GitHub Actions 尚未实跑。完整发布验收保持 BLOCKED，候选包可供本机审阅与使用。

最终发布前按 `artifacts/native-acceptance.json` 补充各项真实证据，再运行 `npm run release:check`。验收门禁不影响本地安装、构建和打包。

## 拖拽显示与录制节奏

0.3.0-rc.5 的 5 项真实 Chrome 拖拽检查通过，见 `artifacts/drag-motion.json`。350 ms 间隔的拖拽事件期间，107 个采样帧中提示层隐藏帧为 0，重复内容重建为 0；1.1 秒录制拖动有 67 个动画帧，帧间隔 P95 为 17.5 ms。检查覆盖区域切换、子元素离开、窗口边界、Escape 和松手后的提示层状态。输入使用自动化 DragEvent，操作系统跨窗口验收仍独立保留。

GIF 按 25 fps 导出，MP4 与 GIF 均来自本次真实 DSH 网页录制。安装/卸载和原生引用共存记录沿用 rc.3 基线；本次复跑 75 项测试、两版宿主联调、9 项浏览器检查及完整模型演示。

## 原目录工作区

`artifacts/workspace-registration.json` 记录 4 项真实浏览器检查：两种对话附件模式均注册原目录，显式绝对路径元数据可直接注册，注册过程没有文件批次上传，原目录树哈希保持一致。`artifacts/recording.json` 的 workspace 步骤核对注册路径与实际原目录一致，文件批次请求为 0。工作区注册与对话文件批次分别验证；宿主拒绝以工作区为目标的文件上传。
