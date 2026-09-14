# 真实 DSH 录制与浏览器检查

`record.mjs` 是独立的录制脚本。它通过真实 DSH 页面发送测试图片、文件与文件夹，调用配置好的模型，再展示侧栏工作区导入和原路径模式。生产插件不加载此目录，npm 运行包不包含它。

## 录制

先在专用 DSH_HOME 启动 DSH 并安装插件。请使用专用测试工作区及会话，配置支持图片的模型。演示验证使用 `deepseek-v4-flash-vision-exp`；凭据只留在 DSH 的配置或进程环境中。

```sh
npm ci --prefix recording
# 已有 Chrome 可直接运行；也可安装 Playwright Chromium
cd recording
DSH_URL=http://127.0.0.1:3080 node record.mjs
```

需要 ffmpeg 在 PATH，或用 `FFMPEG` 指定可执行文件。默认使用 Google Chrome。准备窗口中完成模型配置、关闭公告并打开空白会话，终端按 Enter 后开始。

正式录制只捕获 **1280×800 的 DSH 网页视口**，不录桌面、Finder、浏览器地址栏或其他窗口。说明牌可拖动；点击“停止录制”终止。文件投放由真实 File 字节与自动化 DragEvent 完成，目录对象模拟浏览器目录枚举接口，不作为 Finder/Explorer 原生拖放证明。

脚本发送三条真实模型请求并注册一个原目录工作区，会使用模型额度。目录发送前核对实际子文件，模型回复按测试素材口令检查，全部步骤完成后才生成正式媒体并更新中英文 README。

## 自动运行参数

- `DSH_URL`：仅接受本机回环 URL；首次授权时可包含访问 token。
- `RECORD_STORAGE_STATE`：可选 Playwright storage-state JSON，用于已有的专用测试会话。包含登录状态，应保存在 Git 忽略目录。
- `RECORD_HEADLESS=1`：后台录制网页。
- `RECORD_CHANNEL`：Playwright 浏览器 channel，默认 `chrome`。
- `RECORD_FIXTURES`：测试素材目录，默认本目录下的 fixtures。公开演示建议复制到专用临时目录，避免显示个人路径。

## 产物

每次运行写入 `output/<时间>/`：原始 WebM、逐步 PNG、report.json、MP4 与 GIF。成功媒体复制到 `docs/assets/walkthrough.*`。失败录像标记为 `incomplete`，不会替换正式展示文件。交付录像中的内容全部来自真实测试会话。

`report.json` 的 `syntheticOSDrop` 明确区分自动化事件与操作系统拖放。测试结果及发布门禁见 `docs/ACCEPTANCE.md`。

## 真实浏览器检查

从源码根目录运行，使用专用的空白会话状态；**不要与录制同时操作同一会话**。

```sh
DSH_URL=http://127.0.0.1:3080 \
RECORD_STORAGE_STATE=work/browser-state.json \
node recording/verify.mjs
```

脚本验证设置持久化、目录与空目录、文本预览、卡片移除、无效路径、窄屏及上传重试。重试用例明确中断一次上传连接，再恢复真实网络、点击重试保存；它不替换存储服务或模型响应。此检查只保存附件，不发送成功的模型消息。

## 素材

fixtures 包含静物 PNG、Markdown 便笺与小型文件夹。PNG 为既有生成素材：蓝色杯子、红陶盆多肉、黄色笔记本。本轮已通过 DSH 原生图像通道得到模型识别。
