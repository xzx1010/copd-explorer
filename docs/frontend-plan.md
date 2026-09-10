# COPD Explorer 前端实施计划

**版本**：V1.1  
**文档定位**：前端实现的唯一执行基线  
**适用范围**：COPD Explorer Web MVP  
**关联文档**：[PRD](prd.md)、[产品设计](resign.md)、[系统架构](architecture.md)、[Agent 任务清单](frontend-agent-tasks.md)

## 1. 文档职责与优先级

本文件整合原前端计划中的页面、组件、数据、状态和实施顺序，并补齐工程决策、接口契约、测试、响应式、可访问性、性能和异常处理要求。

文档发生冲突时，按以下顺序处理：

1. `prd.md` 决定产品目标和 MVP 范围；
2. `resign.md` 决定页面结构、交互和视觉方向；
3. `architecture.md` 决定系统边界、接口和核心数据关系；
4. 本文件决定前端具体落地方式；
5. `frontend-agent-tasks.md` 只负责将本计划拆成可执行任务，不另行引入设计决策。

## 2. 交付目标与范围

### 2.1 MVP 交付目标

交付一个可运行、可演示、可测试并可接入 FastAPI 后端的 React 前端，完成以下闭环：

```text
首页了解产品
  → 选择大体标本热区
  → 查看对应数字切片和标注
  → 理解机制与临床意义
  → 输入病例进行 AI 辅助分析
  → 从 AI 证据回溯到具体病理标注
```

### 2.2 MVP 必须实现

- 首页、病理探索页、机制分析页、AI 辅助诊断页；
- 1 个 COPD 大体标本、3 - 5 个热区和对应切片/标注；
- 标本热区的悬停、键盘聚焦和选中反馈；
- 切片缩放、平移、复位及标注显隐；
- 标注、机制链、临床卡片联动；
- Anchor URL 定位、刷新恢复和无效 Anchor 降级；
- AI 文本输入、结构化结果、加载/错误/重试状态；
- AI Evidence 到病理证据的回溯及返回 AI 页入口；
- 桌面端完整体验，平板和手机端保持可阅读、可操作；
- 基础单元/组件测试和一条核心端到端流程测试。

### 2.3 不在 MVP 内

- 3D 肺模型；
- 用户注册、权限、学习档案和教师后台；
- CT、肺功能报告或病理图片的自动识别；
- 大规模病例库；
- 面向真实患者的临床决策支持；
- 前端直接调用 DeepSeek 或保存 AI 密钥。

## 3. 已确定的工程方案

为避免实现过程中反复选择，MVP 固定采用以下方案：

| 领域 | 选择 | 说明 |
| --- | --- | --- |
| 构建框架 | React + TypeScript + Vite | 与架构文档一致 |
| 路由 | React Router | 支持页面路由、查询参数和返回上下文 |
| 跨页状态 | Zustand | 仅保存学习上下文和最近一次 AI 结果 |
| 网络请求 | 原生 `fetch` + `AbortController` | 统一封装在 `apiClient`，MVP 不引入 Axios |
| 运行时校验 | Zod | 校验静态内容和后端 AI 响应，避免不可信数据直接进入 UI |
| 样式 | CSS Modules + CSS Variables | 组件隔离，保留轻量统一主题 |
| 切片交互 | `react-zoom-pan-pinch` 或等价轻量库 | MVP 处理普通高分辨率图片；超大切片后续迁移 OpenSeadragon |
| 测试 | Vitest + Testing Library + Playwright | 单元/组件测试覆盖关键逻辑，Playwright 覆盖教学闭环 |
| Mock | 本地 fixture + 可配置 mock service | 后端未就绪时可演示；生产环境不得自动回退到伪造 AI 结果 |

依赖版本在项目初始化时锁定到当时稳定版本，并提交 lockfile。除非现有项目已经选择了等价方案，否则 Agent 不应自行更换技术栈。

## 4. 路由与主流程

| 路由 | 页面 | 主要职责 |
| --- | --- | --- |
| `/` | `HomePage` | 产品价值、学习路径、开始探索 |
| `/explorer` | `ExplorerPage` | 标本、切片、标注、机制与临床联动 |
| `/mechanism` | `MechanismPage` | 聚焦展示当前机制通路 |
| `/ai` | `AIDiagnosisPage` | 病例输入、AI 分析和证据链接 |
| `*` | `NotFoundPage` | 未知路由提示和返回首页 |

### 4.1 URL 约定

Anchor 是可分享和可恢复状态的来源：

```text
/explorer?anchor=annotation_alveolar_break_001
/mechanism?anchor=mechanism_elastic_loss_001
/explorer?anchor=annotation_alveolar_break_001&from=ai
```

规则：

- Explorer 和 Mechanism 页首次加载时以 URL 中的 `anchor` 为准；
- 用户选择新热区或标注后使用路由 API 更新查询参数；
- `from=ai` 只表示展示“返回 AI 分析”入口，不作为证据数据来源；
- 无 Anchor 时使用默认教学入口；
- Anchor 不存在或类型不匹配时显示提示，并允许回到默认内容；
- 不将完整病例或 AI 报告写入 URL。

## 5. 前端目录结构

```text
frontend/
├── public/
│   └── content/
│       ├── specimens/
│       └── slides/
├── src/
│   ├── app/
│   │   ├── layouts/
│   │   ├── providers/
│   │   └── routes/
│   ├── pages/
│   │   ├── HomePage/
│   │   ├── ExplorerPage/
│   │   ├── MechanismPage/
│   │   ├── AIDiagnosisPage/
│   │   └── NotFoundPage/
│   ├── components/
│   │   ├── layout/
│   │   ├── specimen/
│   │   ├── slide/
│   │   ├── annotation/
│   │   ├── mechanism/
│   │   ├── clinical/
│   │   ├── ai/
│   │   └── common/
│   ├── features/
│   │   ├── explorer/
│   │   └── diagnosis/
│   ├── data/
│   │   └── content/
│   ├── hooks/
│   ├── services/
│   ├── stores/
│   ├── styles/
│   ├── types/
│   ├── utils/
│   ├── test/
│   ├── App.tsx
│   └── main.tsx
├── e2e/
└── package.json
```

如果仓库最终不采用 `frontend/` 子目录，可将其内部结构放到仓库根目录；不得同时存在两套前端入口。

### 5.1 分层职责

- `pages`：读取路由、组合业务模块，不承担低层绘制逻辑；
- `features`：组织 Explorer 和 Diagnosis 的业务行为；
- `components`：接收明确 Props 的可复用展示与交互组件；
- `data`：MVP 静态结构化内容和 mock fixture；
- `services`：唯一的请求、内容查询和 Anchor 解析入口；
- `stores`：跨页面学习上下文，不存放所有远程加载状态；
- `types`：领域类型和 API 契约；
- `utils`：无副作用的坐标、格式化和 Anchor 工具。

## 6. 数据模型与契约

### 6.1 基础类型

```ts
type AnchorType =
  | 'specimen'
  | 'slide'
  | 'annotation'
  | 'mechanism'
  | 'clinical'
  | 'ai_evidence';

interface AnchorItem {
  id: string;
  type: AnchorType;
  name: string;
  links: Partial<Record<AnchorType, string>>;
}

interface NormalizedRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface SpecimenData {
  id: string;
  title: string;
  description?: string;
  image: string;
  defaultHotspotId: string;
  hotspotIds: string[];
}

interface HotspotData {
  id: string;
  label: string;
  description?: string;
  anchorId: string;
  specimenId: string;
  slideId: string;
  region: NormalizedRect;
}

interface SlideData {
  id: string;
  title: string;
  image: string;
  anchorId: string;
  annotationIds: string[];
  defaultAnnotationId?: string;
}

interface AnnotationData {
  id: string;
  name: string;
  description: string;
  anchorId: string;
  slideId: string;
  region: NormalizedRect;
  mechanismId: string;
  clinicalId: string;
}

interface MechanismNode {
  id: string;
  label: string;
  description: string;
}

interface MechanismData {
  id: string;
  title: string;
  anchorId: string;
  nodes: MechanismNode[];
}

interface ClinicalData {
  id: string;
  title: string;
  pathology: string;
  functionalImpact: string[];
  manifestations: string[];
  treatmentImplications: string[];
  prevention: string[];
}
```

### 6.2 坐标约定

- 热区和标注统一使用相对原图的归一化坐标，范围为 `0 - 1`；
- `x/y` 表示左上角，`width/height` 表示区域尺寸；
- 组件根据图片实际渲染尺寸换算坐标，不能保存像素坐标；
- 图片未加载完成前不渲染依赖尺寸的覆盖层；
- MVP 先支持矩形区域，类型中预留后续多边形扩展空间。

### 6.3 Anchor 规则

格式：`{type}_{name}_{sequence}`，例如：

```text
specimen_bullae_001
slide_alveolar_break_001
annotation_alveolar_break_001
mechanism_elastic_loss_001
clinical_emphysema_001
```

每个 Anchor 必须：

- 全局唯一且发布后保持稳定；
- 能解析到一个确定对象；
- 提供必要的上下游关联；
- 在构建或测试阶段校验重复、失效和悬空链接；
- AI 结果中的 `anchorId` 只能引用已存在且允许展示的 Anchor。

### 6.4 Explorer 聚合上下文

页面不应在组件中反复拼接关系。`contentService` 根据 Anchor 返回完整上下文：

```ts
interface ExplorerContext {
  anchor: AnchorItem;
  specimen: SpecimenData;
  hotspots: HotspotData[];
  selectedHotspot: HotspotData;
  slide: SlideData;
  annotations: AnnotationData[];
  selectedAnnotation: AnnotationData | null;
  mechanism: MechanismData | null;
  clinical: ClinicalData | null;
}
```

静态数据阶段和真实 API 阶段都实现同一个 `ContentRepository` 接口，避免切换数据源时改动页面组件。

### 6.5 AI 契约

请求：

```ts
interface AIAnalyzeRequest {
  caseText: string;
}
```

响应：

```ts
interface AIResult {
  analysisId: string;
  assessment: {
    disease: string;
    likelihood: 'low' | 'medium' | 'high' | 'uncertain';
    confidence?: number;
    basis: string[];
    uncertainty?: string;
  };
  pathologyBasis: {
    gross: string[];
    microscopic: string[];
    mechanism: string[];
  };
  evidence: Array<{
    text: string;
    anchorId: string;
  }>;
  differential: string[];
  recommendation: string[];
  disclaimer: string;
}
```

说明：置信度是教学性提示，不得被渲染为临床诊断概率。前端必须通过 Zod 校验响应；校验失败时展示安全降级，不自行补造医学内容。

## 7. 状态管理

### 7.1 状态边界

- URL：Explorer/Mechanism 当前 Anchor 的事实来源；
- Zustand：最近一次 AI 结果、AI 输入草稿、返回位置等跨页上下文；
- 页面容器：当前请求的 loading/error/retry；
- 组件内部：缩放级别、面板展开、hover 等纯 UI 状态；
- 静态内容：由 `contentService` 查询，不复制进全局 Store。

### 7.2 Store 建议

```ts
interface LearningStore {
  latestAIResult: AIResult | null;
  aiDraft: string;
  aiReturnLocation: string | null;
  setAIResult: (result: AIResult) => void;
  setAIDraft: (value: string) => void;
  setAIReturnLocation: (location: string | null) => void;
  clearAIContext: () => void;
}
```

MVP 可使用 `sessionStorage` 持久化 AI 结果和草稿，避免刷新后立即丢失；不得写入 `localStorage` 长期保存病例信息。保存前需明确不存储真实身份信息。

## 8. 页面与组件设计

### 8.1 HomePage

组成：`HeroSection`、`LearningPathSection`、`CapabilitySection`、`MedicalNotice`。

要求：

- CTA 跳转 `/explorer`；
- 学习路径与核心能力由配置数据驱动；
- 首屏直接说明教学用途；
- 页面不加载切片等大型资源。

### 8.2 ExplorerPage

组成：

```text
ExplorerPage
├── AnchorBreadcrumb
├── SpecimenViewer
│   └── HotspotMarker[]
├── SlideViewer
│   └── AnnotationLayer
├── PathologyExplanation
├── MechanismFlow
├── ClinicalCard
└── ReturnToAIAction
```

交互规则：

1. 加载 URL Anchor 并解析 `ExplorerContext`；
2. 点击热区后将 URL 更新为热区对应 Anchor，并加载默认标注；
3. 点击切片标注后将 URL 更新为 annotation Anchor；
4. 机制和临床区始终与当前 Annotation 保持一致；
5. 切换切片时复位视图，切换同一切片内标注时保留合理缩放并聚焦标注；
6. `from=ai` 时显示返回 AI 页按钮；
7. 各区域独立提供加载、空和错误反馈，避免整页空白。

### 8.3 MechanismPage

- 从 `anchor` 查询机制通路；
- 支持键盘选择机制节点；
- 节点详情包含解释和关联病理证据；
- 返回 Explorer 时携带关联 Annotation Anchor；
- 缺少独立机制内容时，Explorer 内嵌机制链仍需可用。

### 8.4 AIDiagnosisPage

组成：`CaseInputForm`、`AnalysisStatus`、`AIReport`、`PathologyLink[]`、`MedicalDisclaimer`。

要求：

- `caseText` 必填，并设置合理字符上限；
- 提交期间按钮禁用，允许取消超时请求；
- 成功后按 Assessment、Pathology Basis、Evidence、Differential、Recommendation 展示；
- 每个有效 Evidence Anchor 可点击；无效 Anchor 以不可点击文本显示并提示证据暂不可用；
- AI 结果只按纯文本渲染，禁止直接插入模型返回 HTML；
- 请求失败不清空输入，提供重试；
- 页面始终显示教学免责声明。

### 8.5 通用组件

- `Button`：primary、secondary、text，支持 loading/disabled；
- `Card`：统一标题、内容和操作区；
- `LoadingState`：说明正在加载的对象；
- `EmptyState`：说明缺少什么以及下一步；
- `ErrorState`：错误信息、重试和安全回退；
- `MedicalDisclaimer`：统一医学安全提示；
- `VisuallyHidden`：屏幕阅读器辅助文本；
- `ErrorBoundary`：捕获非预期渲染错误并提供回到首页入口。

## 9. 服务层与 Mock 策略

### 9.1 服务接口

```ts
interface ContentRepository {
  getHomeContent(): Promise<HomeContent>;
  getExplorerContext(anchorId?: string): Promise<ExplorerContext>;
  getMechanism(anchorId: string): Promise<MechanismData>;
  hasAnchor(anchorId: string): Promise<boolean>;
}

interface AIService {
  analyze(request: AIAnalyzeRequest, signal?: AbortSignal): Promise<AIResult>;
}
```

### 9.2 API 端点

- `GET /api/content/home`；
- `GET /api/content/anchor/{anchorId}`；
- `POST /api/ai/analyze`；
- `GET /api/health`。

### 9.3 环境变量

```text
VITE_API_BASE_URL=http://localhost:8000
VITE_USE_MOCK_API=true
```

- 只允许 `VITE_` 前缀的非敏感配置进入前端；
- DeepSeek API Key 不得出现在前端环境变量、源码或构建产物中；
- `VITE_USE_MOCK_API` 必须显式配置，不能在真实请求失败后悄悄切换成 mock 成功结果。

### 9.4 错误模型

前端统一转换为：

```ts
interface AppError {
  code: 'NETWORK' | 'TIMEOUT' | 'VALIDATION' | 'NOT_FOUND' | 'SERVER' | 'UNKNOWN';
  message: string;
  retryable: boolean;
}
```

面向用户显示易理解的中文提示；开发环境可在控制台保留技术细节，但不得打印病例全文或密钥。

## 10. 视觉、响应式与可访问性

### 10.1 设计 Token

沿用设计文档颜色并补齐文本/边框 Token：

```css
:root {
  --color-primary: #2563eb;
  --color-success: #10b981;
  --color-pathology: #e76f51;
  --color-background: #f8fafc;
  --color-surface: #ffffff;
  --color-text: #0f172a;
  --color-muted: #64748b;
  --color-border: #e2e8f0;
  --radius-card: 12px;
}
```

### 10.2 响应式规则

- `>= 1024px`：Explorer 标本和切片双栏，下方机制/临床区；
- `768 - 1023px`：双栏可压缩，必要时改为上下排列；
- `< 768px`：单栏顺序为标本 → 切片 → 解释 → 机制 → 临床；
- 手机端仍须能选择热区和标注，不能依赖 hover；
- 大图容器需限制高度并保持宽高比，避免布局跳动。

### 10.3 可访问性

- 热区与标注使用可聚焦的 `button` 或具有等价语义的 SVG 元素；
- `Enter` 和 `Space` 可完成选择；
- 选中状态使用颜色、描边和文本三重反馈；
- 所有图片具有说明性 `alt`，装饰图片使用空 `alt`；
- 表单字段具有可见 label，错误通过 `aria-describedby` 关联；
- 加载结果使用适度的 `aria-live`；
- 焦点样式不可移除，页面跳转后焦点移到主标题或主要内容；
- 正文和交互元素满足 WCAG AA 基础对比度目标。

## 11. 性能与安全

### 11.1 性能目标

- 首屏常规网络下目标 < 3 秒；
- 非 AI 页面切换目标 < 1 秒；
- 首页不预加载全部切片；
- 路由页面使用懒加载；
- 图片优先使用 WebP/AVIF，设置尺寸避免布局偏移；
- Explorer 仅预取当前热点相邻的必要资源；
- 大型切片加载显示进度或骨架状态；
- 后续遇到超大病理切片时改用瓦片金字塔方案，不在 MVP 中一次加载原始巨图。

### 11.2 前端安全与隐私

- 不使用 `dangerouslySetInnerHTML` 渲染 AI 文本；
- 不在 URL、日志或分析工具中记录病例全文；
- 不在浏览器长期保存病例输入和 AI 结果；
- API 错误不暴露后端堆栈；
- 外部链接使用安全属性；
- 明确提示用户不要输入可识别真实患者身份的信息。

## 12. 测试策略

### 12.1 单元测试

至少覆盖：

- Anchor 解析、链接生成和无效 Anchor；
- 归一化坐标换算；
- Zod 内容/AI schema 校验；
- `contentService` 上下文聚合；
- Store 的 AI 上下文保存和清除。

### 12.2 组件测试

至少覆盖：

- `HotspotMarker` 的键盘和选中行为；
- `AnnotationLayer` 选择标注；
- `CaseInputForm` 校验、提交和禁用状态；
- `AIReport` 对有效/无效 Evidence Anchor 的处理；
- Loading、Empty、Error 组件和重试回调。

### 12.3 端到端测试

至少实现一条主流程：

```text
首页开始探索
  → 点击肺大疱热区
  → 选择肺泡壁断裂标注
  → 查看机制和临床卡片
  → 进入 AI 页并提交 mock 病例
  → 点击 Evidence Link
  → 返回对应病理标注
  → 返回 AI 分析
```

另需覆盖一次无效 Anchor 和一次 AI 请求失败重试。

### 12.4 质量命令

项目应提供统一脚本：

```text
npm run dev
npm run build
npm run lint
npm run test
npm run test:e2e
```

## 13. 实施阶段与依赖

### Phase 0：项目基线

建立 Vite 项目、依赖、目录、质量脚本、环境变量示例和基础样式。完成后才能开展其他功能。

### Phase 1：领域基础

定义类型、Zod schema、静态数据、内容仓库、Anchor 工具和学习 Store。先建立契约，再实现页面。

### Phase 2：首页与应用骨架

完成路由、AppShell、Header、Footer、NotFound 和首页。形成可导航应用。

### Phase 3：病理探索闭环

依次完成热区、切片、标注、机制、临床、URL 同步和异常状态。该阶段是 MVP 核心。

### Phase 4：AI 教学闭环

先用 mock 契约完成表单和报告，再接入 FastAPI；最后实现 Evidence Anchor 回溯和返回入口。

### Phase 5：产品化与验收

完成响应式、可访问性、性能、单元/组件/E2E 测试和构建验证。

详细任务、依赖和逐项验收见 `frontend-agent-tasks.md`。

## 14. 验收标准

### 14.1 功能验收

- 四个页面和 404 页面可正常访问；
- 3 - 5 个热区能正确切换切片及相关内容；
- 切片可缩放、平移、复位和切换标注；
- 机制与临床内容始终与当前标注一致；
- Anchor 可分享、刷新恢复并处理无效值；
- AI 页面可使用 mock 和真实 API 两种模式；
- AI Evidence 能定位病理证据并返回原 AI 分析；
- 所有主要请求具有加载、空、错误和重试状态；
- 医学免责声明在 AI 页面和结果中清晰可见。

### 14.2 工程验收

- 类型检查、lint、单元/组件测试和生产构建通过；
- 核心 E2E 流程通过；
- 页面内容不硬编码在业务组件中；
- API 仅从 services 调用；
- Anchor 和内容关系可自动校验；
- 无前端 API 密钥、真实患者信息或敏感日志；
- Chrome、Edge、Firefox 近两版完成基础人工检查。

## 15. Definition of Done

单个任务只有同时满足以下条件才算完成：

- 功能与任务验收标准一致；
- 类型和运行时数据校验完整；
- 正常、加载、空、错误状态均被考虑；
- 新增交互支持基本键盘操作；
- 必要测试已补充并通过；
- `npm run build` 和 `npm run lint` 通过；
- 没有超出任务范围的架构重写；
- 任务交付说明列出修改文件、验证命令和剩余限制。

