# Judy 初中三年学习网站：开源方案调研与实际采用记录

调研日期：2026-11-11。依据原项目 README、许可证、官方模块说明与 npm 包；
这是13个相关项目的第一轮筛选，不是对“全网”的穷尽搜索，也没有声称全部部署实测。
以下内容为本项目自行归纳，未复制第三方题库、视频、教材或整站代码。

## 家长最新确认的产品方向

- 人教版、北京家庭使用、覆盖初一至初三，当前13岁与初一只是起点。
- 家长称“北京专用最新版”；尚未取得具体出版年份/版次，不能据此推断正式章次。
- 主界面快速上手：学习、错题本、复习三个入口；家长设置与资料放到次要位置。
- 服务端分析新题、追问与诊断是核心，不是有限样题的检索网站。
- 可以参考开源项目，但必须明确实际采用、仅参考与未接通的区别。

## 项目比较

| 原项目 / 来源 | 核实到的能力与许可 | 对 Judy 的判断 | 本轮状态 |
| --- | --- | --- | --- |
| [ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs) | 间隔复习排期；MIT。发布包5.4.2为纯JS ES模块，Node>=20；上游主分支已发展至不同版本体系 | 数学复习需要独立重做与自评；算法只决定日期，不判断数学理解或成绩 | **实际接入5.4.2**，锁定版本、保留MIT，四档反馈，最长90天；不训练个性化参数 |
| [KaTeX](https://github.com/KaTeX/KaTeX) | 数学公式显示；MIT | 已有公式显示和A4排版足够，保留本站资源避免运行时依赖外部CDN | **继续使用0.16.22**，保留MIT |
| [DeepTutor](https://github.com/HKUDS/DeepTutor) | 原README介绍个性化辅导、研究、创建、练习；[Apache-2.0](https://github.com/HKUDS/DeepTutor/blob/main/LICENSE) | 参考带上下文的辅导和来源定位；完整代理工作台不直接放进Judy学生端 | 仅参考流程，未部署、未复制代码 |
| [Kolibri](https://github.com/learningequality/kolibri) | Learning Equality的离线优先学习平台；MIT代码；内容另有各自许可 | 参考学习资源组织、练习反馈；完整课堂系统和离线内容分发暂非必要 | 仅参考流程，未部署、未导入内容 |
| [Perseus](https://github.com/Khan/perseus) | Khan Academy练习编辑、交互渲染、作答反馈；[MIT代码](https://github.com/Khan/perseus/blob/main/LICENSE) | 参考提示与反馈设计，之后可用于更丰富的互动题；不能由MIT代码许可推断题目内容许可 | 未接入组件或Khan题库 |
| [PaddleOCR](https://github.com/PaddlePaddle/PaddleOCR) | 中文与文档OCR；含[公式识别模块](https://github.com/PaddlePaddle/PaddleOCR/blob/main/docs/version3.x/module_usage/formula_recognition.en.md)；Apache-2.0代码，具体模型许可另核对 | 是中文试卷、公式识别的候选；仍需单独推理服务、资源预算及模糊图/手写准确率测试，无法直接在128MB Worker中运行大型推理模型 | 独立OCR服务候选，未下载模型、未接通 |
| [MathLive](https://github.com/arnog/mathlive) | 数学输入、手机虚拟键盘、无障碍；MIT | 有助于分数、根式、方程输入；本轮简洁优先，先保留照片和普通文字输入 | 候选，未接入 |
| [JSXGraph](https://github.com/jsxgraph/jsxgraph) | 交互几何、函数图像；MIT或LGPL双许可 | 后续适合拖动点观察不变量；当前结构化SVG更容易对本轮样题逐项核验 | 候选，未接入，继续SVG |
| [Math.js](https://github.com/josdejong/mathjs) | 数值与符号数学工具；Apache-2.0，NOTICE及捆绑第三方代码另有说明 | 可评估受限的计算校验；不能把数值吻合当成题意或证明正确，也不应开放无限制表达式执行 | 候选，未接入 |
| [cn-math-taxonomy](https://github.com/xiaoyang111222/cn-math-taxonomy) | 人教版知识点和先修图谱；[CC BY-NC 4.0](https://github.com/xiaoyang111222/cn-math-taxonomy/blob/main/LICENSE)；原项目也注明教材/标准对应的限制 | 正适合后续知识点回溯，但需将七至九年级与Judy具体版次核对；不能用北京使用的概述替代这一核对 | 只参考说明，未导入数据；未来复用须注明作者、版本、修改和来源 |
| [RAGFlow](https://github.com/infiniflow/ragflow) | 文档解析、检索增强与上下文；[Apache-2.0](https://github.com/infiniflow/ragflow/blob/main/LICENSE) | 候选教材资料库，强调检索出处与授权资料；需独立服务，不能宣称它自带北京人教版完整教材库 | 候选，未部署 |
| [Dify](https://github.com/langgenius/dify) | 模型工作流、RAG；[基于Apache2但含附加条件的Dify许可证](https://github.com/langgenius/dify/blob/main/LICENSE) | 参考编排和服务观测；不是可忽略附加条件的标准Apache2代码。本轮简单服务端接口更适合现有部署 | 仅比较，未部署或复制代码 |
| [LearnHouse](https://github.com/learnhouse/learnhouse) | 开源学习管理平台；[AGPL-3.0](https://github.com/learnhouse/learnhouse/blob/main/LICENSE) | 比较课程管理能力，完整LMS界面和运维负担不符合本轮学生端需求 | 未采用代码 |

另：检索发现旧的 [khan-exercises](https://github.com/Khan/khan-exercises) 已在仓库说明中标为deprecated，
其练习内容与软件许可有区别，因此没有将该旧框架或练习库加入运行依赖。

## 实际实现

### 简洁学生界面

移除装饰性大横幅、侧边老师卡与讲题六步目录。主导航仅学习、错题本、复习。
输入题目和上传照片保留在同一学习空间；样题收进可选的演示区。
提示与追问接近题目，完整解答由学生按需展开。官方课程查找折叠为补学入口。

### 初中三年与教材设置

原创43类知识点候选覆盖数与代数、函数、几何、统计概率等七至九年级主题。
这些分类不是经核实的最新北京教材目录，也不代表已有43类真实AI解答。
家长可更新当前年级、册次、章节、目标和已学范围；当前章节为选填，不限制跨年级题目。
服务端讲题与追问带入该学习上下文。未知版次不得生成虚假的页码或章节对应。
图片缺条件的情况可返回需澄清状态，不硬生成解答。

### 开源复习算法

实际使用ts-fsrs，不再只使用固定1/3/7天间隔。
反馈为还不会、比较吃力、能独立完成、轻松并能讲明白。
旧记录和复习次数保留，在首次新复习时建立FSRS卡片；不伪造历史记忆参数。
参数为默认模型基础上的排期设置，未对Judy训练优化器；目标记忆参数0.9不是其真实记忆率。
待讲解题目不直接进入复习或计为已掌握。
本轮仍为本机存储，不是云端跨设备学习数据库。

## 验证与边界

- 40项自动API/DOM/复习算法测试通过。
- 包括三年年级切换、未知教材版次、排期差异、JSON恢复、非法排期状态、简洁导航、缺条件澄清。
- 模型测试仅模拟返回，使用测试字符串且拦截fetch，没有真实模型调用或费用。
- Worker构建成功；首页、前端模块、FSRS资源和session接口的构建产物请求检查通过。
- 上次托管预览/浏览器受环境转发及网络限制，手机真机、官方课程播放、实际A4打印与本轮视觉仍待验证。
- 真实AI、模型账号密钥、家庭真实身份隔离和教材逐章核对仍未完成，不能由开源调研代替。

## 后续顺序

1. 家长选择模型服务并确认费用，在安全设置配置密钥。
2. 两种家庭账号完成私人访问与角色验证，再启用真实数据。
3. 用合成题测试真实OCR、条件核对、知识点诊断和分层讲解；记录失败样本与修正。
4. 核对教材版次，逐步建立有来源的知识与课程映射；可按实际需要评估taxonomy/RAG服务。
5. 数据持久化、备份与家庭跨设备同步，再扩充交互式数学工具。
