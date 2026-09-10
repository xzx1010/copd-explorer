# COPD Explorer 产品设计文档

**版本**：V1.0  
**文档类型**：Product Design Specification  
**产品名称**：COPD 可视化教学与 AI 辅助诊断平台  
**关联需求**：`docs/prd.md`

## 1. 设计概述

### 1.1 产品简介

COPD Explorer 是面向医学教育与辅助诊断学习场景的可视化智能平台。平台围绕 COPD（慢性阻塞性肺疾病）的病理过程，串联以下内容：

- 大体病理标本展示；
- 数字病理切片查看；
- 病理区域标注与解释；
- 发病机制解析；
- 临床表现推导；
- DeepSeek AI 辅助诊断分析。

平台通过下列路径建立完整的医学认知闭环：

```text
病理形态
  ↓
疾病机制
  ↓
临床表现
  ↓
AI 辅助诊断
  ↓
病理证据追溯
```

### 1.2 设计目标

#### 降低医学理解难度

将传统的“文字描述 → 记忆疾病”转化为：

```text
观察病理
  ↓
理解机制
  ↓
形成诊断逻辑
```

#### 建立病理证据链

系统中的标本、切片、标注、机制节点和 AI 分析结果通过统一的 Anchor ID 关联，实现：

```text
AI 分析结果
  ↓
具体病理区域
  ↓
数字切片证据
```

#### 明确 AI 的辅助定位

AI 用于整合信息、提供分析依据、提示鉴别方向和支持学习决策，不替代医生、不输出面向真实患者的确定性医疗诊断。

## 2. 产品设计方向

### 2.1 产品定位

**产品类型**：医学病理可视化与 AI 辅助诊断学习平台  
**核心关键词**：`Medical Visualization`、`Pathology Learning`、`Clinical Reasoning`、`AI Assistance`

### 2.2 设计原则

| 原则 | 设计要求 |
| --- | --- |
| 简洁 | 减少与当前学习任务无关的信息，突出标本、切片和推导链 |
| 专业 | 保持医学术语、病理标注和内容来源的可信度 |
| 可解释 | AI 结果必须展示判断依据，并能回溯至病理证据 |
| 可扩展 | 内容、标注、机制链和代码解耦，支持后续疾病与病例扩展 |
| 安全 | 明确教学用途和 AI 限制，不形成真实医疗决策暗示 |

## 3. 信息架构

### 3.1 系统结构

```text
Home
  ↓
Pathology Explorer
  ↓
Mechanism Analysis
  ↓
Clinical Understanding
  ↓
AI Assisted Diagnosis
```

模块 2 和模块 3 既可作为独立页面访问，也可作为 Pathology Explorer 页面中的联动内容呈现。AI 诊断页通过 Anchor Link 返回病理探索页。

### 3.2 用户主流程

```text
进入平台
  ↓
观察 COPD 病理标本
  ↓
选择病变区域
  ↓
查看数字切片
  ↓
理解病理机制
  ↓
关联临床表现
  ↓
进行 AI 辅助诊断分析
  ↓
回溯病理证据
```

## 4. 页面设计规范

### 4.1 Home 首页

#### 页面目标

快速说明平台价值，引导用户进入“病理观察 → 机制理解 → 临床关联 → AI 实践”的探索流程。

#### 页面结构

```text
Header
  ↓
Hero 区域
  ↓
Learning Path 学习路径
  ↓
Core Capabilities 核心能力
  ↓
Footer
```

#### Hero 内容

```text
COPD Explorer
从病理形态理解疾病机制，
利用 AI 辅助临床分析
```

主要按钮：`开始探索`。按钮跳转至 `Pathology Explorer`。

#### Learning Path

```text
01 病理观察
  ↓
02 机制理解
  ↓
03 临床关联
  ↓
04 AI 辅助诊断
```

### 4.2 Pathology Explorer 病理探索页

#### 页面定位

平台核心学习页面，完成“大体标本 → 镜下切片 → 病理解释 → 机制关联”的主要交互。

#### 页面布局

```text
┌──────────────────────────────────────────────────┐
│ Header                                           │
├──────────────────────┬───────────────────────────┤
│ 大体标本区            │ 数字切片区                │
│ SpecimenViewer        │ SlideViewer               │
│ - 热区                │ - 缩放/拖拽               │
│ - 悬停提示            │ - 标注叠加                │
│ - 选中状态            │ - 标注说明                │
├──────────────────────┴───────────────────────────┤
│ 病理解释区：AnnotationLayer                      │
├──────────────────────────────────────────────────┤
│ 机制链：MechanismFlow                             │
├──────────────────────────────────────────────────┤
│ 临床意义：ClinicalCard                            │
└──────────────────────────────────────────────────┘
```

#### 交互要求

1. 用户悬停大体标本热区时，显示区域名称和简短说明。
2. 用户点击热区后，更新当前 `currentAnchor`，右侧加载对应数字切片。
3. 数字切片加载后，展示与当前区域对应的病理标注。
4. 用户可对切片进行缩放、拖拽和平移，并支持一键复位。
5. 点击标注后，显示病理解释，并展开对应机制链和临床卡片。
6. 切换热区时，切片、标注、机制和临床内容同步切换。
7. 所有内容支持通过 Anchor ID 被 AI 结果直接定位。

#### 页面组件

- `SpecimenViewer`：大体病理标本展示与热区交互；
- `HotspotMarker`：热区位置、悬停和选中状态；
- `SlideViewer`：数字切片查看器；
- `AnnotationLayer`：病理标注及其说明；
- `MechanismFlow`：机制链展示；
- `ClinicalCard`：功能影响、临床表现、治疗和预防推导。

### 4.3 Mechanism Analysis 机制分析页

#### 页面目标

解释病理改变如何逐步导致 COPD 的组织结构变化、功能下降和临床表现。

#### 页面结构

```text
组织损伤
  ↓
分子/细胞机制
  ↓
结构变化
  ↓
功能下降
  ↓
临床表现
```

#### 交互要求

- 支持从病理探索页带入当前 Anchor；
- 支持逐步查看节点或自动播放机制链；
- 每个节点显示简短解释、证据类型和关联标本；
- 可从机制节点返回原始切片标注。

#### 示例机制链

```text
炎症反应
  ↓
蛋白酶释放
  ↓
肺泡壁破坏
  ↓
肺弹性下降
  ↓
气流受限
```

### 4.4 AI Assisted Diagnosis AI 辅助诊断页

#### 页面定位

用于学生完成病理学习后的综合分析练习。页面强调“辅助判断、依据解释和病理回溯”，而非确定性诊断。

#### 页面结构

```text
患者信息/病例输入
  ↓
AI 分析
  ↓
诊断可能性
  ↓
关键依据
  ↓
鉴别方向
  ↓
病理证据关联
```

#### 输入内容

- 患者基本信息；
- 症状和病程；
- 肺功能、影像学等检查结果；
- 已知病理信息（可选）。

MVP 以文本输入为主，肺功能报告截图、CT 图像和病理图像识别作为后续版本能力。

#### 输出内容

- 辅助判断；
- 可能性分析和置信度说明；
- 关键临床与病理依据；
- 鉴别方向；
- 下一步学习/评估建议；
- 可点击的病理证据链接。

## 5. 组件设计

### 5.1 SpecimenViewer

**作用**：展示大体病理标本并承载热区交互。  
**功能**：图片展示、热区渲染、区域选择、当前区域提示。  
**数据示例**：

```json
{
  "id": "specimen_lung_001",
  "title": "COPD 尸检肺标本",
  "image": "/assets/specimens/lung-001.webp",
  "hotspots": [
    {
      "id": "specimen_bullae_001",
      "label": "胸膜下肺大疱",
      "x": 0.42,
      "y": 0.28,
      "width": 0.16,
      "height": 0.12,
      "anchor": "specimen_bullae_001"
    }
  ]
}
```

### 5.2 HotspotMarker

**作用**：标记大体标本中的可交互病理区域。  
**状态**：`Normal`、`Hover`、`Selected`、`Disabled`。  
**要求**：热区与视觉标记分离，支持后续改用 SVG 多边形或不规则区域。

### 5.3 SlideViewer

**作用**：查看与当前大体区域对应的数字病理切片。  
**功能**：`Zoom`、`Pan`、`Reset`、`Annotation Toggle`。  
**要求**：优先支持高分辨率图片的渐进加载，避免首次加载阻塞页面。

### 5.4 AnnotationLayer

**作用**：管理切片上的病理标注。  
**职责**：标注渲染、标注说明、选中事件、与机制/临床内容关联。

### 5.5 MechanismFlow

**作用**：展示从病理改变到临床后果的机制链。  
**功能**：节点展示、节点详情、逐步播放、Anchor 回溯。

### 5.6 ClinicalCard

**作用**：把病理改变转化为临床理解。  
**内容结构**：

```text
病理改变
  ↓
功能影响
  ↓
临床表现
  ↓
治疗/预防启示
```

### 5.7 AIReport

**作用**：以结构化方式展示 AI 分析结果。  
**内容区块**：`Assessment`、`Evidence`、`Differential`、`Recommendation`、`Pathology Link`。

## 6. 交互设计

### 6.1 状态驱动交互

前端维护统一的学习状态：

```ts
interface LearningState {
  currentAnchor: string | null;
  currentSpecimen: string | null;
  currentSlide: string | null;
  currentAnnotation: string | null;
  currentMechanism: string | null;
  currentAIResult: AIResult | null;
}
```

状态更新原则：

- 选择热区时，同时更新标本、切片和默认标注；
- 选择标注时，更新机制和临床内容；
- 点击 AI 证据链接时，恢复对应的标本浏览上下文；
- 浏览器前进/后退应尽量保留 Anchor 上下文，可使用 URL 查询参数或路由状态实现。

### 6.2 病理探索流程

```text
点击病变区域
  ↓
加载对应切片
  ↓
显示病理标注
  ↓
展开机制链
  ↓
展示临床意义
```

### 6.3 AI 证据回溯

```text
AI 辅助判断
  ↓
Evidence Anchor
  ↓
病理区域
  ↓
数字切片
  ↓
具体标注
```

回溯后应提供“返回 AI 分析”的明确入口，避免用户丢失原始诊断上下文。

### 6.4 异常与空状态

- 切片加载失败：保留大体标本和病理文字，显示重试按钮；
- AI 请求超时：显示请求状态和重试入口，不伪造分析结果；
- AI 输出解析失败：展示原始文本，同时提示暂时无法生成病理链接；
- 未选择热区：右侧展示引导占位，提示用户选择病变区域；
- 内容缺少对应资源：显示“资源待补充”，不显示失效链接。

## 7. UI 设计系统

### 7.1 色彩

| 用途 | 色值 | 使用说明 |
| --- | --- | --- |
| Primary | `#2563EB` | 主按钮、主要链接、选中状态 |
| Success | `#10B981` | 完成状态、正向提示 |
| Pathology | `#E76F51` | 病理热点、病变强调和证据标识 |
| Background | `#F8FAFC` | 页面背景 |
| Text | `#0F172A` | 主文本，建议补充统一文本色 |
| Muted | `#64748B` | 辅助说明和次要信息 |

颜色不应单独承担信息表达，选中、错误和提示状态需同时配合文字或图标。

### 7.2 Typography

| 类型 | 大小 | 使用场景 |
| --- | --- | --- |
| 页面标题 | 32px | 首页 Hero、页面主标题 |
| 模块标题 | 24px | 主要功能区标题 |
| 卡片标题 | 18px | 病理、机制和 AI 卡片 |
| 正文 | 14 - 16px | 说明、推导内容和结果文本 |
| 辅助文本 | 12 - 13px | 来源、状态和免责声明 |

中文界面需优先选择可读性良好的系统字体或项目统一字体，并保证足够的行高。

### 7.3 Card 规范

```css
border-radius: 12px;
padding: 16px;
box-shadow: 0 4px 16px rgba(15, 23, 42, 0.08);
```

卡片应区分“当前学习内容”和“补充说明”，避免所有信息使用同一视觉权重。

### 7.4 Button 规范

- **Primary**：蓝色背景、白色文字，用于开始探索、提交分析等主操作；
- **Secondary**：边框按钮，用于返回、重置和次要操作；
- **Text/Link**：用于 Anchor 证据跳转，需具备清晰的悬停和键盘焦点状态；
- 所有按钮需支持禁用、加载和错误恢复状态。

## 8. 前端实现映射

### 8.1 技术架构

- **Frontend**：React 或 Vue；
- **Backend**：Python FastAPI；
- **AI**：DeepSeek API（由后端调用）；
- **状态管理**：轻量 Store 或框架状态管理方案；
- **资源查看**：二维图片/SVG 优先，只有确有 3D 需求时再引入 Three.js。

### 8.2 前端目录建议

```text
src/
├── components/
├── pages/
├── data/
├── stores/
├── services/
└── assets/
```

建议将标本、切片、标注、机制链等教学内容放在 `data/` 或独立内容资源中，不硬编码在展示组件内。

### 8.3 页面组件树

```text
ExplorerPage
├── ExplorerHeader
├── SpecimenViewer
│   └── HotspotMarker[]
├── SlideViewer
│   └── AnnotationLayer
├── MechanismFlow
├── ClinicalCard
└── AnchorBreadcrumb
```

```text
AIDiagnosisPage
├── CaseInputForm
├── AnalysisStatus
├── AIReport
│   ├── AssessmentSection
│   ├── EvidenceSection
│   ├── DifferentialSection
│   ├── RecommendationSection
│   └── PathologyLink[]
└── MedicalDisclaimer
```

## 9. 数据与 Anchor 设计

### 9.1 Anchor 定义

Anchor 是平台知识关联和跨页面跳转的核心标识。MVP 采用稳定、可读、全局唯一的字符串 ID，推荐格式：

```text
{type}_{name}_{id}
```

示例：

```text
specimen_bullae_001
slide_alveolar_break_001
annotation_alveolar_break_001
mechanism_elastic_loss_001
```

### 9.2 Anchor 类型

| 类型 | 说明 |
| --- | --- |
| `specimen` | 大体标本或标本中的热区 |
| `slide` | 数字病理切片 |
| `annotation` | 切片上的具体病理标注 |
| `mechanism` | 发病机制节点或通路 |
| `clinical` | 临床表现、功能变化或治疗启示 |
| `ai_evidence` | AI 结果中的证据引用 |

### 9.3 Anchor 关系

```text
Specimen
  ↓
Slide
  ↓
Annotation
  ↓
Mechanism
  ↓
Clinical
  ↓
AI Evidence
```

关系可以双向查询：从大体热区进入切片，也可以从 AI 证据返回大体热区。

### 9.4 Anchor 数据示例

```json
{
  "id": "annotation_alveolar_break_001",
  "type": "annotation",
  "name": "肺泡壁断裂",
  "links": {
    "specimen": "specimen_bullae_001",
    "slide": "slide_alveolar_break_001",
    "mechanism": "mechanism_elastic_loss_001",
    "clinical": "clinical_emphysema_001"
  },
  "target": {
    "x": 0.58,
    "y": 0.36,
    "zoom": 2.5
  }
}
```

### 9.5 Anchor 跳转约定

前端链接至少携带目标 Anchor，例如：

```text
/explorer?anchor=annotation_alveolar_break_001
```

页面加载时根据 Anchor 恢复标本、切片、标注和视图位置。无效 Anchor 必须降级为页面默认状态并显示可理解的提示。

## 10. AI 辅助诊断设计

### 10.1 AI 定位

**用于**：信息整合、诊断辅助、证据解释、鉴别方向提示和学习反馈。  
**不用于**：替代医生、输出确定诊断、直接指导真实患者治疗。

### 10.2 输入数据

```json
{
  "patientInfo": {
    "age": 68,
    "sex": "男",
    "smokingHistory": "吸烟 50 年"
  },
  "symptoms": ["活动后气促 5 年"],
  "tests": {
    "lungFunction": "FEV1/FVC=58%，FEV1 占预计值 48%",
    "ctDescription": "双肺透亮度增高，可见多发无壁透亮区"
  },
  "pathologyContext": []
}
```

### 10.3 输出结构

```json
{
  "assessment": {
    "disease": "COPD",
    "likelihood": "high",
    "confidence": 0.86,
    "basis": ["长期吸烟史", "持续气流受限"]
  },
  "evidence": [
    {
      "text": "肺泡结构破坏可导致肺气肿相关改变",
      "anchorId": "annotation_alveolar_break_001"
    }
  ],
  "differential": [],
  "recommendation": ["结合完整肺功能和影像学资料进一步评估"],
  "disclaimer": "仅供医学学习与辅助参考，不替代专业医疗判断。"
}
```

字段要求：

- `assessment`：辅助判断、可能性和依据；
- `evidence`：自然语言解释及对应 `anchorId`；
- `differential`：鉴别方向，不得伪装为排除诊断；
- `recommendation`：下一步学习或评估建议；
- `disclaimer`：始终返回并在界面显著展示。

### 10.4 AI 结果展示

AIReport 按以下顺序呈现：

1. 辅助判断；
2. 关键依据；
3. 病理基础解释；
4. 鉴别方向；
5. 学习/评估建议；
6. 病理标本关联。

`Pathology Link` 渲染为可点击链接。点击后进入病理探索页，定位到对应标本热区和切片标注，并保留“返回 AI 分析”入口。

## 11. 非功能需求

### 11.1 性能

| 指标 | 目标 |
| --- | --- |
| 首屏加载 | < 3 秒（常规网络和桌面设备） |
| 页面切换 | < 1 秒（不含外部 AI 请求） |
| 普通资源加载 | < 2 秒；高分辨率切片采用渐进加载 |
| AI 请求反馈 | 立即展示提交/处理中状态，并支持超时重试 |

### 11.2 医学安全

- 病理内容、标注和机制链经过医学背景人员审核；
- AI 输出仅作为教学和辅助参考；
- 对输入不足、不确定性和超出范围的结论进行明确提示；
- 页面显著展示：

  > AI 分析结果仅供医学学习与辅助参考，不替代专业医疗判断。

### 11.3 兼容性与可访问性

- 支持 Chrome、Edge、Firefox 的近两版桌面浏览器；
- 关键交互支持键盘焦点和清晰的悬停/选中状态；
- 热区不能仅依靠颜色区分，需提供文字标签或可访问名称；
- 图片、标注和 AI 结果区域提供合理的加载、错误和空状态。

## 12. MVP 范围

### 12.1 必须实现

- COPD 单疾病场景；
- 大体标本展示；
- 3 - 5 个病理热点；
- 数字切片查看、缩放和拖拽；
- 病理标注及说明；
- 机制链展示；
- 临床关联卡片；
- DeepSeek 文本病例辅助分析；
- Anchor 证据回溯；
- 教学免责声明和 AI 异常降级。

### 12.2 暂不实现

- 3D 肺模型；
- 用户注册、权限和学习档案系统；
- 教师内容管理后台；
- CT/肺功能报告自动图像识别；
- 大规模病例库和复杂题库；
- 面向真实患者的临床决策支持。

## 13. 后续扩展

### V1.1：病例库扩展

- 增加 COPD 分型和典型病例；
- 增加病例练习、答案解析和学习记录；
- 支持多个标本主题之间的导航。

### V1.5：多模态 AI

```text
文本
  +
影像描述/报告截图
  +
病理图片
  ↓
多模态教学分析
```

### V2.0：教师管理平台

- 上传病例和病理资源；
- 创建、编辑和审核标注；
- 配置机制链和临床推导；
- 管理 AI Prompt、内容版本和 Anchor 关系。

## 14. 设计交付边界

本文件定义产品设计、页面结构、交互状态、组件职责和内容关联方式。后续文档分别负责：

- `architecture.md`：系统架构、接口、数据模型、AI 服务和部署方案；
- `readme.md`：项目介绍、本地开发、环境变量、启动、测试和部署说明。

