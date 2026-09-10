# COPD Explorer 前端 Agent 任务清单

**版本**：V1.1  
**文档定位**：可逐项交给编码 Agent 执行的任务单  
**唯一实施基线**：[frontend-plan.md](frontend-plan.md)

## 1. 执行规则

### 1.1 开始任务前

每个 Agent 必须：

1. 阅读 `frontend-plan.md` 中与任务相关的章节；
2. 检查仓库现状和已有改动，不覆盖无关工作；
3. 确认前置任务已完成，或已有等价实现；
4. 只修改完成当前任务所需的最小文件范围；
5. 如果实现与文档契约冲突，先更新计划或报告冲突，不自行创造第二套方案。

### 1.2 每项任务的交付格式

交付说明至少包含：

- 完成内容；
- 修改/新增文件；
- 执行过的验证命令及结果；
- 未解决限制或后续依赖。

### 1.3 通用完成条件

- TypeScript 无新增类型错误；
- 新增内容不硬编码在页面业务组件中；
- API 调用统一经过 `services`；
- 交互具备加载、空、错误或禁用状态；
- 新增可操作元素支持基本键盘访问；
- 当前阶段适用的 `lint`、`test`、`build` 通过；
- 不在前端保存 DeepSeek Key 或真实患者身份信息。

## 2. 任务依赖图

```text
T00 项目基线
 ├─→ T01 应用骨架与路由 ─→ T05 首页
 ├─→ T02 领域类型与 Schema
 │    ├─→ T03 静态内容与校验
 │    │    └─→ T04 内容仓库与 Anchor 服务
 │    │          ├─→ T06 Explorer 布局
 │    │          │    ├─→ T07 标本热区
 │    │          │    ├─→ T08 切片交互
 │    │          │    └─→ T09 标注联动
 │    │          │          └─→ T10 机制与临床
 │    │          └─→ T11 URL 与跨页状态
 │    └─→ T12 AI Mock 契约与服务
 │          └─→ T13 AI 页面与报告
 │                └─→ T14 AI 证据回溯
 └──────────────────────────────────────→ T15 状态与错误完善

T07 + T08 + T09 + T10 + T11 → T16 Explorer 集成测试
T13 + T14                  → T17 AI 集成测试
T05 + T16 + T17            → T18 响应式/可访问性/性能
T18                        → T19 最终验收
```

同一分支上建议按编号顺序执行。具备独立工作区和明确文件边界时，可并行处理同层任务，但合并前必须重新运行全部验证。

## 3. Phase 0：工程基线

### T00：初始化项目与质量工具

**目标**：创建稳定、可验证的 React 工程基线。  
**前置依赖**：无。

**工作内容**：

- 使用 Vite + React + TypeScript 初始化唯一前端项目；
- 安装 React Router、Zustand、Zod、CSS Modules 支持、Vitest、Testing Library、Playwright；
- 配置 ESLint、Prettier、测试环境和 TypeScript 严格模式；
- 创建 `env.d.ts`、`.env.example` 和基础目录；
- 提供 `dev`、`build`、`lint`、`test`、`test:e2e` 脚本；
- 提交依赖 lockfile；
- 不引入 Tailwind、Axios 或第二套状态管理方案。

**输出**：

- `package.json`、构建/TS/lint/test 配置；
- `src/main.tsx`、`src/App.tsx`；
- `src/styles/tokens.css`、`src/styles/global.css`；
- `.env.example`。

**验收**：

- `npm install` 成功；
- `npm run dev` 可启动；
- `npm run lint`、`npm run test`、`npm run build` 成功；
- 页面显示最小应用内容，无控制台致命错误。

## 4. Phase 1：领域基础

### T01：应用骨架、路由和错误边界

**目标**：建立所有页面入口和公共布局。  
**前置依赖**：T00。

**工作内容**：

- 配置 `/`、`/explorer`、`/mechanism`、`/ai` 和 `*` 路由；
- 页面级组件使用懒加载；
- 实现 `AppShell`、`Header`、`Footer`、`ErrorBoundary`；
- 创建四个页面占位和 `NotFoundPage`；
- 页面跳转后将焦点移动到主标题/主要内容。

**输出**：路由、布局、页面入口和 404 页面。

**验收**：

- 所有路由可访问并可通过导航切换；
- 未知路由有友好提示和返回首页入口；
- 懒加载期间显示明确 Loading UI；
- 路由测试通过。

### T02：定义领域类型与运行时 Schema

**目标**：建立静态内容和 API 的唯一数据契约。  
**前置依赖**：T00。

**工作内容**：

- 定义 `AnchorItem`、`SpecimenData`、`HotspotData`、`SlideData`、`AnnotationData`；
- 定义 `MechanismData`、`ClinicalData`、`ExplorerContext`；
- 定义 `AIAnalyzeRequest`、`AIResult` 和 `AppError`；
- 定义 Zod schema，并从 schema 或共享类型保持静态/运行时契约一致；
- 固定归一化矩形坐标 `0 - 1` 和 Anchor 类型集合；
- 所有字段必须显式声明，禁止通过 `any`、`unknown` 或不受约束对象绕过校验。

**实现说明**：

- 建议在 `src/types/` 中定义导出类型，并在 `src/schemas/` 中定义对应 Zod schema；
- 类型与 schema 的来源应保持一致，优先使用 `z.infer<typeof XSchema>` 生成 TypeScript 类型，避免两套定义漂移；
- 统一 Anchor 类型集合，例如：`specimen | slide | annotation | mechanism | clinical | ai_evidence`；
- 所有矩形坐标必须是 `0 <= x/y/width/height <= 1`；
- `AppError` 应至少包含 `code`、`message`、`status`、`details?`；
- `AIResult` 必须包含 `assessment`、`evidence`、`differential`、`recommendation`、`disclaimer`；
- `evidence` 中的 `anchorId` 必须遵循 Anchor 规则，且引用的 Anchor 必须能在后续内容仓库中解析；
- 对于 `ExplorerContext`，建议在 schema 中强制要求 `anchor`、`specimen`、`slide`、`annotation`、`mechanism`、`clinical` 这些字段的存在或可选性保持一致，避免后续页面组件出现空字段判断分散。

**输出**：

- `src/types/anchor.ts`；
- `src/types/content.ts`；
- `src/types/ai.ts`；
- `src/types/error.ts`；
- `src/schemas/anchor.schema.ts`；
- `src/schemas/content.schema.ts`；
- `src/schemas/ai.schema.ts`；
- `src/schemas/error.schema.ts`。

**验收**：

- 合法 fixture 校验通过；
- 坐标越界、Anchor 类型错误、AI 缺少必要字段时校验失败；
- 无 `any` 绕过核心契约；
- 对应的测试文件能证明至少 3 种失败场景：坐标越界、非法 Anchor 类型、缺失 AI 必填字段；
- 业务组件后续可直接从这些 schema 或类型读取数据，而不需要重新定义一套字段约定。

### T03：准备 MVP 静态内容与一致性校验

**目标**：提供可完整演示的 COPD 教学内容。  
**前置依赖**：T02。

**工作内容**：

- 创建首页配置及 specimen、hotspot、slide、annotation、mechanism、clinical 数据；
- 至少包含 1 个标本、3 个热区、3 个切片、每个切片 1 个以上标注、2 条以上机制和对应临床卡片；
- 每个对象使用稳定 Anchor/ID；
- 使用本地占位素材时标识来源状态和“待替换”；
- 编写内容校验函数或脚本，检查重复 ID、悬空链接、缺失默认对象和坐标范围。

**输出**：`src/data/content/`、必要的 `public/content/` 素材、内容校验测试/脚本。

**验收**：

- 所有静态数据通过 Zod 校验；
- 所有 Anchor 和对象关系均可解析；
- 修改数据即可改变内容，不需修改组件；
- 校验测试能识别至少一种人为构造的悬空链接。

### T04：内容仓库、Anchor 服务和 API Client

**目标**：隔离页面与实际数据来源。  
**前置依赖**：T02、T03。

**工作内容**：

- 实现 `ContentRepository` 接口；
- 实现静态仓库，根据 Anchor 聚合 `ExplorerContext`；
- 实现 Anchor 解析、类型判断、链接生成和存在性查询；
- 实现 `apiClient`，支持 base URL、超时、AbortSignal 和 `AppError` 转换；
- 预留远程内容仓库，接口对应 `/api/content/home` 和 `/api/content/anchor/{anchorId}`；
- 不在 UI 组件中直接导入多个 JSON 后自行拼接。

**输出**：

- `src/services/content.ts`；
- `src/services/anchor.ts`；
- `src/services/apiClient.ts`；
- 相关单元测试。

**验收**：

- 默认 Anchor 和指定 Anchor 均返回完整上下文；
- 无效 Anchor 返回 `NOT_FOUND`；
- 页面未来切换静态/远程仓库无需修改组件 Props；
- 服务层测试通过。

### T05：实现首页

**目标**：展示产品定位并引导进入教学流程。  
**前置依赖**：T01、T03 或等价首页配置。

**工作内容**：

- 实现 Hero、Learning Path、Core Capabilities、Medical Notice；
- 内容由配置驱动；
- “开始探索”跳转 `/explorer`；
- 不预加载切片大图；
- 完成桌面与手机基本布局。

**验收**：

- 首页价值和四步学习路径清晰；
- CTA 键盘可用且跳转正确；
- 主要内容在窄屏不溢出；
- 首页组件测试通过。

## 5. Phase 2：病理探索闭环

### T06：Explorer 页面容器与布局

**目标**：建立可承载真实上下文的核心页面骨架。  
**前置依赖**：T01、T04。

**工作内容**：

- 页面从 `contentService` 加载默认或 URL 指定上下文；
- 创建标本区、切片区、病理解释、机制和临床区域；
- 实现 `AnchorBreadcrumb`；
- 为每个主要区域接入 loading、empty、error 占位；
- 桌面双栏，窄屏单栏。

**验收**：

- 静态上下文可以完整渲染；
- 页面没有直接拼接多份 JSON；
- 加载失败不会整页空白；
- 布局在 375px 和 1440px 宽度均可阅读。

### T07：SpecimenViewer 与病理热区

**目标**：实现大体标本的区域选择。  
**前置依赖**：T06。

**工作内容**：

- 实现 `SpecimenViewer` 和 `HotspotMarker`；
- 根据归一化坐标定位热区；
- 支持 normal、hover/focus、selected、disabled 状态；
- 鼠标、触摸和键盘均可选择；
- 图片未加载时不错误定位覆盖层；
- 切换选择时通知页面容器，不在组件内部查询业务数据。

**验收**：

- 不同屏幕尺寸下热区仍对准相对位置；
- `Enter`/`Space` 可选择热区；
- 选中状态不只依赖颜色；
- 组件测试覆盖点击、键盘和选中反馈。

### T08：SlideViewer 的缩放、平移与复位

**目标**：实现可用的数字切片浏览体验。  
**前置依赖**：T06。

**工作内容**：

- 实现 `SlideViewer`；
- 支持缩放、平移、复位和标注显隐；
- 切换到不同切片时复位视图；
- 显示图片加载状态和加载失败重试；
- 图片保持宽高比并避免布局跳动；
- 不一次预加载所有切片原图。

**验收**：

- 鼠标滚轮/按钮可缩放，拖拽可平移；
- 复位返回初始视图；
- 切片切换不保留错误的旧缩放；
- 资源失败时仍可查看病理文字说明。

### T09：AnnotationLayer 与病理解释联动

**目标**：在切片上定位病变并驱动下游内容。  
**前置依赖**：T07、T08。

**工作内容**：

- 使用归一化坐标渲染标注区域；
- 支持选择、聚焦、显隐和说明展示；
- 选中标注后向页面返回 Annotation Anchor；
- 同一切片切换标注时保持合理视图，并可聚焦目标区域；
- 标注缺失时显示明确 Empty State。

**验收**：

- 热区切换后标注与切片一致；
- 点击/键盘选择标注后显示正确解释；
- 标注层随缩放和平移保持对齐；
- 组件测试覆盖选择和无标注状态。

### T10：机制链、临床卡片与独立机制页

**目标**：完成“病理 → 机制 → 临床”的教学推导。  
**前置依赖**：T09、T01。

**工作内容**：

- 实现 `MechanismFlow`、`MechanismNodeCard` 和 `ClinicalCard`；
- 内容随当前 Annotation 更新；
- 机制节点支持键盘选择和说明；
- 实现 `/mechanism?anchor=...` 独立页面；
- 从机制页返回对应 Annotation Anchor；
- 临床卡片区分功能影响、表现、治疗启示和预防。

**验收**：

- 每个已配置标注能展示对应机制和临床内容；
- 机制页可直接通过 URL 打开并返回证据；
- 缺少机制/临床内容时显示待补充状态，不展示错误关系；
- 组件和路由测试通过。

### T11：URL Anchor 同步与跨页学习状态

**目标**：让学习位置可恢复、分享和回退。  
**前置依赖**：T04、T06、T09、T10。

**工作内容**：

- 实现 `useAnchorNavigation`；
- 页面初始化时读取 Anchor，选择后更新 URL；
- 浏览器前进/后退能恢复上下文；
- 实现 Zustand Store，仅保存 AI 草稿、最近结果和返回位置；
- 使用 `sessionStorage` 持久化 AI 上下文；
- 无效或类型错误 Anchor 提示并支持回到默认内容。

**验收**：

- `/explorer?anchor=...` 刷新后恢复正确标本、切片和标注；
- 前进/后退不会造成 URL 与 UI 不一致；
- Store 不复制完整内容仓库数据；
- 单元测试覆盖有效、无效、缺省 Anchor。

## 6. Phase 3：AI 教学闭环

### T12：AI Mock、Schema 与服务层

**目标**：在后端未就绪时按真实契约开发 AI 前端。  
**前置依赖**：T02、T04。

**工作内容**：

- 实现 `AIService` 接口和 mock/remote 两种实现；
- 使用 `VITE_USE_MOCK_API` 显式切换；
- 实现 `POST /api/ai/analyze` 请求、超时、取消和错误转换；
- 使用 Zod 校验 AI 响应；
- mock 数据至少包含 Assessment、Pathology Basis、Evidence、Differential、Recommendation、Disclaimer；
- mock Evidence 引用真实存在的 Annotation Anchor；
- 真实请求失败时不得自动伪装为 mock 成功。

**验收**：

- mock 和 remote 使用同一接口与响应类型；
- 不合法响应进入安全错误状态；
- Abort/Timeout 能得到可重试错误；
- service 测试通过，前端代码不存在 DeepSeek Key。

### T13：AI 页面、表单与报告

**目标**：完成病例输入和结构化报告展示。  
**前置依赖**：T01、T11、T12。

**工作内容**：

- 实现 `CaseInputForm`，包含 label、示例、字符限制和输入校验；
- 提交时显示 loading 并防止重复提交；
- 请求失败保留输入并提供重试；
- 实现 `AIReport` 的五个内容区块和免责声明；
- AI 文本仅以安全纯文本渲染；
- 保存最近一次结果和草稿到 Store/sessionStorage；
- 提示用户不要输入可识别真实患者身份的信息。

**验收**：

- 空输入不能提交，合法输入可完成 mock 分析；
- loading、成功、错误和重试状态清晰；
- 刷新 AI 页后可恢复当前会话中的草稿/结果；
- 表单和报告组件测试通过。

### T14：Evidence Link 病理回溯与返回入口

**目标**：闭合 AI 到病理证据的教学链路。  
**前置依赖**：T11、T13。

**工作内容**：

- 实现 `PathologyLink`；
- 点击有效 Evidence 跳转 `/explorer?anchor=...&from=ai`；
- Explorer 自动定位热区、切片和标注；
- 显示“返回 AI 分析”入口，并恢复最近报告位置；
- 无效 Anchor 显示不可点击状态和解释；
- 不把病例内容或完整 AI 结果写入 URL。

**验收**：

- 每个有效 Evidence 能准确定位病理标注；
- 返回 AI 页后报告仍存在；
- 无效 Evidence 不导致 404 或错误定位；
- 集成测试覆盖往返流程。

## 7. Phase 4：质量完善

### T15：统一加载、空、错误和安全提示

**目标**：消除页面“假死”和不安全降级。  
**前置依赖**：T01；在 T06-T14 完成后做最终接入。

**工作内容**：

- 实现/统一 `LoadingState`、`EmptyState`、`ErrorState`、`MedicalDisclaimer`；
- 为页面、切片资源、内容查询和 AI 请求接入对应状态；
- 错误提示区分网络、超时、校验、未找到和服务错误；
- 可重试错误提供重试操作；
- 开发日志不打印病例全文；
- ErrorBoundary 提供安全回退。

**验收**：

- 主要异步区域无空白等待；
- 失败不会显示伪造医学结论；
- 错误组件支持键盘操作并能正确调用重试；
- 医学免责声明在规定位置可见。

### T16：Explorer 测试与稳定性

**目标**：验证核心病理教学流程。  
**前置依赖**：T07、T08、T09、T10、T11、T15。

**工作内容**：

- 补齐 Anchor、坐标、内容聚合单元测试；
- 补齐 Hotspot、Annotation、Mechanism 组件测试；
- 编写 Explorer E2E：热区 → 切片 → 标注 → 机制 → 临床；
- 覆盖刷新恢复、浏览器后退和无效 Anchor；
- 修复测试暴露的状态错位和竞态问题。

**验收**：相关 unit/component/E2E 全部通过，连续快速切换热区不会展示旧内容。

### T17：AI 测试与真实 API 联调

**目标**：验证 AI 页面契约、异常和病理回溯。  
**前置依赖**：T13、T14、T15；真实联调需后端可用。

**工作内容**：

- 测试表单校验、loading、取消、超时、schema 错误和重试；
- 编写 E2E：提交 mock 病例 → Evidence 回溯 → 返回报告；
- 后端可用时用测试病例联调 `/api/ai/analyze`；
- 验证 Evidence Anchor 存在性和免责声明；
- 确认错误日志不泄露病例全文或后端堆栈。

**验收**：

- mock E2E 稳定通过；
- 若后端已就绪，真实 API 契约通过；若未就绪，明确记录未联调项；
- 无效 AI 数据得到安全降级。

### T18：响应式、可访问性和性能优化

**目标**：将功能原型提升为可用的教学产品。  
**前置依赖**：T05、T16、T17。

**工作内容**：

- 统一设计 Token、间距、卡片和按钮；
- 验证 375px、768px、1024px、1440px 布局；
- 完成键盘路径、焦点样式、label、alt、aria-live 和对比度检查；
- 路由懒加载、图片尺寸、WebP/AVIF、按需加载和相邻资源预取；
- 检查首页不加载切片大图；
- Chrome、Edge、Firefox 近两版人工检查。

**验收**：

- 手机端不依赖 hover；
- 键盘能完成首页 → Explorer → AI → Evidence 回溯主流程；
- 无明显布局溢出和大图引起的严重跳动；
- 性能目标偏差有记录和解释。

### T19：最终构建与 MVP 验收

**目标**：按文档交付可演示前端版本。  
**前置依赖**：T18。

**工作内容**：

- 执行 `lint`、`test`、`test:e2e`、`build`；
- 按 `frontend-plan.md` 第 14 节逐项验收；
- 检查环境变量示例、mock 开关和生产配置；
- 检查前端构建产物不含密钥和敏感病例；
- 整理已知限制和后端联调状态；
- 为后续 README 提供准确启动和验证命令。

**验收**：

- 所有质量命令通过；
- 主教学闭环可完整演示；
- 无阻断级控制台错误；
- 交付说明完整，未实现项与 MVP 范围一致。

## 8. 推荐执行批次

### 批次 A：先建立契约

`T00 → T01 → T02 → T03 → T04`

这一批完成后，项目具备可导航骨架、稳定数据模型和内容查询能力。

### 批次 B：先打通核心价值

`T05 → T06 → T07 → T08 → T09 → T10 → T11`

这一批完成后，“标本 → 切片 → 标注 → 机制 → 临床”闭环可运行。

### 批次 C：闭合 AI 证据链

`T12 → T13 → T14 → T15`

这一批完成后，可以演示病例分析与病理证据回溯。

### 批次 D：达到交付质量

`T16 → T17 → T18 → T19`

这一批完成后，完成测试、兼容性、性能和最终构建验收。

## 9. 当前最适合开始的任务

如果仓库尚未创建前端工程，从 `T00` 开始。不要跳过 T02-T04 直接写 Explorer 业务组件，否则 Anchor、数据关系和 API 切换会在后期产生重复返工。

