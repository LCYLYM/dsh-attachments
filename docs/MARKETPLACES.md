# 市场收录与发布手册

核查日期：2026-09-14。以下均是公开资料对应的提交路径，**本次没有代为提交、创建 PR、发布 npm 或推送 GitHub**。收录不等于安全认证，社区站点也不等于 DeepSeek 官方。

## 发布前先确定身份

产品名 Better Attach；GitHub `LCYLYM/dsh-attachments`；包名继续使用 `dsh-multimedia-webui-input`。`dsh-attachments`、`dsh-attachment` 已分别被其他公开项目使用，不应擅自换用。不要在未取得所有权前承诺 `better-attach` npm 名称。

仓库根目录直接保留可安装结构：`package.json`、`cordis.patch.yml`、`lib/index.js`、预构建 `lib/client.js`、README、LICENSE。源 ZIP 不含伪造的 Git 历史；覆盖原检出目录时用 `scripts/overlay.mjs`，先看 dry-run，再审阅差异。

## 优先级一：dsh.pub

[提交入口](https://dsh.pub/en/submit/)。其公开流程是提交公共仓库 URL，服务解析默认分支的精确提交、校验 bundle 元数据和入口等，然后创建并处理 registry PR。页面说明**不会运行提交的代码**，因此它验证的是收录契约，不是插件在真实 DSH 的正确性。

准备工作：把实机验证后的候选提交推到打算收录的默认分支，确认根目录可以安装；在表单提交 `https://github.com/LCYLYM/dsh-attachments`；保留返回的 PR 链接，检查报错并修复。成功后才添加相应收录链接。它是默认分支提交定位，不要误以为只上传一个 GitHub Release 附件就等同于更新 registry。

## 优先级二：dsh-plugin.org

[提交说明](https://dsh-plugin.org/submit)。站点要求公开仓库、GitHub Topic `dsh-plugin`、完整安装命令、简介、许可证与兼容说明；索引刷新可发现仓库。新发现条目与其人工确认状态应区分，不能把抓取到当作已验证。

在 GitHub 仓库 About 设置 Topics；这不是在 README 写 `#dsh-plugin` 就会自动设置的字段。建议：

```text
dsh-plugin deepseek-harness dsh attachments drag-and-drop workspace file-upload
```

填好简介，确保 README 有 `dsh plugin --profile web add ...` 的真实可用目标。尚未发布 npm 时用真实 GitHub 或本地候选安装说明，不编一个不存在的版本。遇到索引遗漏，按页面提供的项目 issue 入口反馈，不批量刷提交。条目存在且状态准确后再加徽章。

## 其他入口：先验证，再提交

`dsh.so`、`dsh-marketplace.com` 在本次搜索中也作为独立目录出现，但本次没有验证其提交闭环、审查可靠性或持续维护情况。可作为第二轮分发入口，不能当“官方市场”。不要为了 SEO 向不明站点提交 GitHub 写权限 token。

社区列表可检查 [0xsline/awesome-deepseek-harness](https://github.com/0xsline/awesome-deepseek-harness)、[fendouai/awesome-deepseek-harness](https://github.com/fendouai/awesome-deepseek-harness)、[bruc3van/awesome-dsh-plugin](https://github.com/bruc3van/awesome-dsh-plugin)。先读各自贡献格式再发一个简短 PR；不在同一列表重复登记同一个项目。列表存在不代表本插件已被收录。

## 真实发布流程

1. 在原检出目录新建自己的候选分支；执行覆盖预览、备份覆盖、`git diff` 和 `npm run check`。本包提供的 GitHub Actions 尚未在本次交付环境运行。
2. 在独立 DSH 测试配置完成 `docs/COMPATIBILITY.md` 的检查。填 `artifacts/live-dsh.template.json` 的真实副本 `artifacts/live-dsh.json`，记录精确候选 commit 和去敏证据；运行 `npm run release:check`。
3. 使用 `npm pack` 检查实际包内容。确认 npm 包所有权，再以 `next` 标签发布候选版。本包 `prepublishOnly` 有意拦住没有实机证据的发布；`npm pack` 和本地测试不被拦住。不要使用 `--ignore-scripts` 来伪装通过。
4. 在 GitHub 创建 pre-release，发布准确的限制、测试报告与使用演示；随后提交上述目录。不要在未验证时改成 `latest` 或稳定版。

本地 npm 凭证、真实附件、会话标识和绝对工作路径不应进入 ZIP、npm 包或 issue。交付包只带公开的夹具测试结果，不打包未来填入的 `live-dsh.json` 及其私有证据。

## 可直接使用的简介

中文：Better Attach 为 DeepSeek Harness 提供有目标的文件夹拖拽：对话附件与侧栏工作区各自清晰，带导入前检查、预览与失败重试。当前为回环访问候选版，兼容状态见 README。

English: Intentional folder drops for DeepSeek Harness: stage conversation attachments or import a workspace, with preflight review, previews and retry. Loopback-only release candidate; see README for verified scope.

分类建议：UI / Experience 或 Files / Workspace，按目标目录实际提供的分类填写，不伪造不存在的分类字段。
