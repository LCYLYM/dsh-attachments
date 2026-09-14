# 实际验收记录 · Better Attach 0.2.0-rc.1

执行日期：2026-09-14。此文件记录本次执行范围，不能代替某台真实 DSH 的安装证明。机器结果在 `artifacts/acceptance.json`，原始结果在 `artifacts/node-tests.tap` 与 `artifacts/browser-tests.json`。

## 已执行

**58 项 Node 自动测试通过**，0 失败、0 跳过。环境 Linux、Node 22.16.0。测试运行真实 Node HTTP 服务与真实临时文件系统，不是只检查返回字符串。覆盖路径遍历、NFC/大小写别名、父文件冲突、实际字节数、SHA-256、零字节文件、嵌套和空目录、取消、半途失败、同批重试、原子提交、workspace 注册失败恢复、并发、符号链接、跨会话边界、24 小时暂存回收和原目录保留。

输入接口测试同时覆盖单字符引用投影与较长 clipboard 投影，验证删除/插入本插件引用不重建其他插件引用。宿主与编辑器是小型明确的接口替身，**不是运行了真正 Cordis 与 Lexical 编辑器**。覆盖脚本测试在临时的 Git 形状目录验证预览、备份、覆盖、恢复和无关文件保留，不冒充用户仓库上的真实 git diff。

**20 项 Chromium UI 测试通过**，该次执行 0 个未捕获页面异常。包括目录预检、排除项、暂存时未复制、文件选择入口、文本转义、实际图片 Blob 解码、会话切换、删除撤回、纯图片事件放行、文本/内部拖拽放行、侧栏工作区副本、非法侧栏文件禁用确认、原目录注册、Escape、扫描时目标固定、传输失败重试、提交释放浏览器 File、保存记录再附加、暗色/减少动态效果及 390px 窄屏。

## 浏览器测试到底如何执行

本环境 Chromium 的管理策略禁止页面导航。没有修改 URLBlocklist、删除管理策略或把这种限制描述成“网络真的可用”。使用 `page.set_content` 载入内存 HTML，同一套 UI/客户端模块通过明确标注的本地测试桥与真实 Node HTTP 服务通信。

该桥使用 XHR 外形替身与受限的本地请求 binding，因此 **浏览器原生 XHR、网络取消与上传进度的端到端行为未在此模式中验证**。Node HTTP 流和存储另有实际测试。页面、事件和弹窗是真实 Chromium；目录拖放由合成 FileSystemEntry 触发，并非操作系统 Finder/Explorer 实际拖动。工作区注册使用测试注册表，没有伪装成真实 DSH。

演示与测试不会请求模型，不消耗模型 token，也不会把你的真实目录作为测试附件。截图的测试桥标签保留可见。`walkthrough.gif` 是实际测试截图按步骤拼成的演示，不是连续录屏，更不是原生 DSH 录屏。

## 没有执行或没有通过的范围

| 项目 | 状态 |
| --- | --- |
| 完整 Git 克隆与原 host 源码比较 | 网络获取失败；未取得原 host、未确定原 HEAD |
| 实际 DSH 安装/启动/发送/卸载 | 未执行 |
| 真实模型读取导入文件、原生图片视觉链路 | 未执行 |
| macOS/Windows 与 Finder/Explorer 目录拖放 | 未执行 |
| Chromium 直接 HTTP 导航模式 | 本环境受策略限制；脚本及 CI 路径已提供但未执行 |
| 最大 1 GiB/2 GiB、1 万文件性能跑分 | 未执行；这些只是输入准入上限 |
| GitHub Actions、GitHub push、npm publish、市场提交 | 未执行 |
| 公开版本发布门禁 | 实际执行并失败，原因是缺少真实 DSH 证据 |

## 复现命令

```bash
npm run check
npm pack
npm run demo
```

普通开发机的浏览器测试：

```bash
python -m pip install playwright==1.57.0
python -m playwright install chromium
python tests/browser_tests.py --chromium /absolute/path/to/chromium
```

本次执行模式为 `python tests/browser_tests.py --in-memory`，必须保留其模式标签。不能将报告的 `realDSH` 或 `browserNativeXHR` 手工改成 true 当作完成验证。

## 交付验收与发布验收分开

源码、可生成浏览器 bundle、npm 候选包、无第三方运行依赖演示、测试、双语 README、竞品研究、市场提交说明均随包交付。原生 DSH 兼容与实际仓库改造仍需要相应环境的验证。本包是**可以继续集成和测试的候选实现**，不是对未验证事实的保证。

发布前请填写 `artifacts/live-dsh.template.json` 中的真实结果，记录候选 Git 提交与去敏证据文件。`npm run release:check` 有意在缺少这些证据时失败；`prepublishOnly` 也会调用该门禁。`npm pack` 与本地运行不受这个发布门禁阻碍。
