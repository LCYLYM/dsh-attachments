# 竞品与定位研究

核查日期：2026-09-14。范围是公开 GitHub 仓库、官方主干文档和社区收录页面，不是对所有插件的运行审计，也不把搜索未找到的功能写成“竞品绝对没有”。

## 结论先行

不要继续主打“官方只能发图片，我能发文件”。官方当前主干的 `ui-conversation` 文档已写明普通文件入口、文件卡片、后台上传队列、进度与取消。[官方依据](https://raw.githubusercontent.com/deepseek-ai/deepseek-harness/master/packages/client/ui-conversation/README.md)

这里说的是**检索到的主干状态，不等于用户安装的所有发行版都已具备**。产品要与实际安装版本协商能力，而不是根据旧印象讲故事。原版保留的价值是按需复制、附件与工作区整合，下一步应围绕“投放意图明确，出错也能继续”竞争。

## 如何检索

使用过的检索方向包括 `dsh attachment`、`dsh-plugin drag folder`、`"DeepSeek Harness Plugins"`、GitHub `topic:dsh-plugin`、`dsh-attachments` 及文件夹／workspace 组合。应同时检查 npm 名称和 GitHub 仓库名：多个不同作者的仓库都叫 dsh-attachments，并不意味着同一实现。

可复查入口：[GitHub topic](https://github.com/topics/dsh-plugin)、[官方项目](https://github.com/deepseek-ai/deepseek-harness)、[你的仓库](https://github.com/LCYLYM/dsh-attachments)。搜索结果和 README 会变化；本次没有保存一个完整生态镜像，也没有确认每一个仓库的 HEAD。

## 直接竞品

| 项目 | 公开材料确认的方向 | 对 Better Attach 的启发 |
| --- | --- | --- |
| [WJZ-P/dsh-attachments](https://github.com/WJZ-P/dsh-attachments) | npm 名称是 `dsh-attachment`；已有文件夹单卡片、目录结构、历史附件和原生图片共存 | “支持文件夹”和“一夹一卡”都不是独创。体验必须延伸到导入前检查、侧栏工作区语义与失败恢复 |
| [CocoSgt/dsh-attachments](https://github.com/CocoSgt/dsh-attachments) | npm 名称是 `dsh-attachments`；文件卡片、图片/文本预览、路径再附加。公开说明采用 stash 和 RPC | 不抢其包名。预览和再次附加是基础体验，不宜宣传成独家创新 |
| [djt889/dsh-drag-to-attachment](https://github.com/djt889/dsh-drag-to-attachment) | 两种模式围绕本机真实路径识别：附件引用或直接插入路径；公开说明不复制、不上传 | 零复制有独立价值，但不应把无法可靠定位的浏览器拖拽猜成一个同名目录。我们明确提供原目录注册入口 |
| [bill9109/dsh-drag-and-drop](https://github.com/bill9109/dsh-drag-and-drop) | 另一条真实路径定位路线；公开说明包含路径索引/校验思路 | 可以借鉴“验证后才用”，不必为了拖拽功能引入整盘扫描。该项目兼容环境需单独核验 |

另外检索到了 `Zenjibad/dsh-drop-any-file` 等基础附件项目，以及 `Jiyr0119/dsh-workspace-explorer`、`chou109/dsh-workspace-launcher` 等相邻工作区工具。本次对这些项目没有完成相同深度的源码与运行检查，不拿它们做严苛的性能或安全排名。

**未在已核查说明中看到一个与本次“对话附件暂存＋侧栏原目录注册＋附件检查＋错误恢复”完全一致的组合。** 这仅支持一个值得验证的组合定位，不能证明全球首个，也不能据此预测市场规模。

## 与当前候选版的取舍

本版已经把差异化写进可测试的行为，而不是只换名字：

- 对话与侧栏有不同状态机；对话附件在序列化发送时复制，侧栏导入在用户确认后独立完成，不依赖正在聊天的 cwd。
- 文件夹导入先展示目录、体积、跳过项与敏感文件选项。空目录、路径别名、重名和文件/目录冲突有确定结果。
- 纯图片不抢官方接收链路。混合文件中的图片可以预览，但它仍是路径附件，不能承诺模型收到原生多模态输入。
- 原始字节传输、最多两路并发；重试跳过已完成文件。取消、半途失败、会话切换都有独立测试。
- 拖到侧栏直接注册主机原目录，拿不到绝对路径时选择或填写该目录。

当前弱项也要摆出来：本版没有原生聊天气泡完整重绘，没有远程鉴权适配、没有刷新恢复未发送 File、没有完整 `.gitignore` 解释器，没有证明对任何竞品性能更快。首个发布周期应以真实 DSH 集成稳定性为优先级，而非继续堆格式解析器、AI 文件分类或全盘索引。

## 前端参考如何落地

参考 [Emil Kowalski 的设计工程 skill](https://raw.githubusercontent.com/emilkowalski/skills/main/skills/emil-design-eng/SKILL.md)。应用的是可检验的交互原则：反馈短、动画有目的、减少动态效果时关闭位移、键盘焦点可见、触摸设备不依赖 hover。它没有被作为产品功能依赖，也未把其源码打包改署名。

本实现的 modal、按钮、拖放提示使用约 120–180 ms 的短反馈；没有弹簧卡片满屏飞动，没有渐变营销仪表盘。重要信息是目标、数量、排除原因、复制后位置和失败恢复。UI 测试实际找出了两个问题并修复：不合法导入的确认按钮未禁用；底部通知覆盖发送按钮。

## README 与传播

采用“首屏一句话说明结果＋实际截图＋可复制命令＋行为表＋信任与限制＋开发方式”的结构。参考了本领域活跃公开仓库与 Emil 的成果呈现，而不是虚构“最近爆款排行榜”、购买星数或承诺爆款。中英文文案与测试范围一致；未上市 npm 版本不提供伪造的在线安装成功指令，未收录也不放已收录徽章。

建议的产品一句话：**文件夹拖进对话，是附件；拖进侧栏，是工作区。** 下面紧跟解释：对话附件支持副本与路径引用；工作区使用主机原目录。
