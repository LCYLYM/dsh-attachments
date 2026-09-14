# Acceptance / 验收

## 本轮结果

0.3.0-rc.2 新增独立录制脚本的 4 项单元测试通过（artifacts/recorder-unit-tests.tap）。生成的图片已通过真实模型 API 识别（artifacts/vision-api-check.json）；这不代表通过 DSH 页面录制。浏览器再次尝试仍被 ERR_BLOCKED_BY_CLIENT 阻止，当前没有实际 GIF/MP4。


| 检查 | 实际结果 | 证据 |
| --- | --- | --- |
| Node 核心、HTTP、存储、引用、编辑器契约、DOM 模拟 | 72 passed, 0 failed | artifacts/current-node-tests.tap |
| DSH latest CLI 0.1.5-rc.1 | 9 项真实宿主联调通过 | artifacts/live-dsh-latest.json |
| DSH next CLI 0.1.5-rc.2 | 9 项真实宿主联调通过 | artifacts/live-dsh.json |
| 真实 DSH 图形界面 | 未运行成功 | ERR_BLOCKED_BY_CLIENT |
| 实际模型回复、Windows/macOS 人工拖放 | 未执行 | 不作认证 |

真实宿主测试通过官方 CLI 启动完整 web profile，额外挂载仅在临时目录存在的测试插件。它调用真实 SessionController、WorkspaceController，并通过 HTTP 上传字节和检查磁盘；没有替换这些宿主服务。客户端启动图和实际服务的脚本也经过检查。DOM 测试使用 jsdom 和显式服务替身，不能当作浏览器验收。

9 项内容：客户端启动图与脚本、创建会话、插件路由、会话副本与空目录、附件记录、原路径引用、原目录注册、文件夹副本注册、清理不删除原文件。测试均不调用远程模型。

历史 rc.1 的 20 项内存浏览器测试和截图没有作为本版证据复用；旧提交中仍可查看。

## 本地复跑

根目录 `npm ci && npm run check`。

`npm ci --prefix fixtures/dsh-latest && npm run test:live:latest`。

`npm ci --prefix fixtures/dsh-next && npm run test:live:next`。

真实宿主测试只向自动创建的临时 DSH_HOME 和测试目录写入，结束后清除测试文件；不会修改用户的默认 DSH_HOME。

## 发版前的人工验收

1. 安装到独立 DSH_HOME 并在浏览器打开原生 DSH，检查设置入口、深浅色、窄屏与键盘焦点。
2. 拖普通文件和含空目录的文件夹到对话，检查预览、删除、重试、发送后清单。
3. 拖文件夹到侧栏，检查复制副本与原目录注册两种流程，打开对应工作区。
4. 设置引用路径，检查不存在路径、原文件修改、替换文件、复制路径、刷新后记录再附加。
5. 发送纯图片，确认模型实际收到原生图像；再测试混合文件夹路径读取。
6. 在 Finder/Explorer 人工拖放，确认没有浏览器导航或目标漂移。
7. 卸载并重启，确认界面还原，已有文件保留。

将实测结果及截图记录到 artifacts/native-acceptance.json，再运行 npm run release:check。此门禁继承自上传的候选版，不要求为本地开发申请权限。
