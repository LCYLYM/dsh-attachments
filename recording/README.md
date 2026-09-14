# 独立录制脚本

本目录不被插件导入、不在插件 npm 包中。删除整个目录不会改变插件功能。没有全屏入口、kiosk 模式、退出密码或常驻演示组件。

**本环境状态：尚未执行真实浏览器录制。** 受管理浏览器重试本地 DSH 仍返回 ERR_BLOCKED_BY_CLIENT；没有使用中转、端口暴露或另一个浏览器绕过限制。因而不提供伪造的 GIF/MP4，不把单元测试当成录屏成功。

## 本地运行

1. 安装新版插件并启动本地 DSH。配置你自己的模型凭证；不要将密钥写入本仓库。可使用本轮指定的 `https://api.deepseek.com`、模型 `deepseek-v4-flash-vision-exp`。脚本不读取或保存密钥。
2. 在 recording 目录运行 `npm ci`、`npx playwright install chromium`。安装 ffmpeg 并加入 PATH，或将 FFMPEG 环境变量设置为其路径。
3. 运行 `node record.mjs`。DSH_URL 可指定本地 DSH 地址（默认 http://127.0.0.1:3080，必要时包含本地访问 token；不要提交该变量）。
4. 脚本先打开不录制的准备窗口。在 DSH 完成模型配置、新建空白会话；回终端按 Enter，才创建录制窗口。请在临时工作区运行，它会发送 3 条模型请求并创建一个工作区副本。

脚本不替换任何 DSH 服务，不伪造模型回复。图片、文件与目录来自 fixtures 的真实文件字节，通过页面正常拖放处理路径进入 DSH。为了自动化文件夹投放，脚本构造 DataTransfer 和目录枚举对象；这是**合成拖放事件**，不是 Finder/Explorer 原生操作的证明。

## 录制过程

- 可移动的小说明牌与可见鼠标，只在录制页面存在。
- 设置展示：复制模式、渐变主题。
- 图片投放到对话，等待真实模型识别。
- 便笺投放、发送，等待出现原文校验口令。
- 文件夹投放到对话，等待读取目录内文件。
- 文件夹投放到侧栏，等待真实工作区成功提示。
- 切换路径模式与角色主题，展示原路径引用。

用户可以拖动说明牌，点击“停止录制”中止。准备阶段不录制；不要在正式录制期间打开凭证设置或切换到私人对话。录制会消耗模型额度，只运行匿名测试素材。脚本限回环地址，不开放监听端口或创建隧道。

## 输出与 README

每次生成 recording/output/<时间>/，含原始 WebM、截图、report.json。ffmpeg 将录制转换成 MP4 与 GIF。

只有所有步骤完成才使用 walkthrough 文件名并复制到 docs/assets，在两份 README 中插入真实媒体。失败输出使用 incomplete 文件名且不更新 README。失败不代表“完整演示成功”。生成媒体仍应人工检查一次；脚本检查可见文本/成功提示，不是对模型最终答案的完备语义认证。

record.mjs 是唯一录制实现文件。record.test.mjs 只验证地址限制、脱敏、测试文件读取和临时说明牌生命周期；这些单元测试不证明本地浏览器脚本已端到端跑通。

## 测试图来源

still-life.png 为本轮内置生图生成的静物图：蓝色马克杯、红陶盆多肉、黄色笔记本，浅色桌面。已用真实模型 API 独立读图成功；结果见 ../artifacts/vision-api-check.json。此 API 测试不是通过 DSH 录制的。

图像提示词：Create a clean editorial still-life illustration for a software image-understanding test. A pale ivory desktop, one cobalt-blue ceramic coffee mug, one small terracotta pot containing a green succulent, and one closed mustard-yellow notebook. Soft daylight, subtle paper grain, tasteful simple composition, no people, no text, no letters, no logo, no watermark. Landscape format. Objects clearly distinguishable for a vision model.
