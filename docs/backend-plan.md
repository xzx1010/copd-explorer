# COPD Explorer 后端实施计划

版本：MVP v1.0  
状态：执行基线  
适用范围：`D:\code\copd\frontend` 已完成 T19，下一阶段创建 FastAPI 后端并完成前后端联调。  
配套文档：

- [backend-api-integration-plan.md](backend-api-integration-plan.md)：接口和联调契约；
- [architecture.md](architecture.md)：系统边界与分层原则；
- [prd.md](prd.md)：产品目标和 MVP 范围；
- `frontend/src/types/`：当前前端实际解析的请求/响应 Schema；
- `frontend/src/services/`：当前前端实际调用的 API 路径。

## 1. 计划目标

本计划的最终目标是交付一个可以与当前前端直接联调的 FastAPI 后端：

1. 提供健康检查、首页内容和 Anchor 病理上下文接口；
2. 提供 mock AI 分析接口，并保留安全的真实 AI Provider 适配边界；
3. 使用 Pydantic 对请求、响应和内容关系进行运行时校验；
4. 统一返回中文错误，不泄露堆栈、密钥、Token 或真实患者身份信息；
5. 让前端从 mock 内容/API 模式切换到真实后端时无需修改页面组件；
6. 通过 pytest 和联调回归验证“标本 → 切片 → 标注 → 机制 → 临床 → AI → Evidence 回溯”闭环。

## 2. 执行规则

每个后端任务开始前必须：

1. 阅读本计划中对应任务、`backend-api-integration-plan.md` 相关章节和 `architecture.md` 第 5 节；
2. 检查仓库现状、已有改动和前端实际 Schema，不覆盖无关工作；
3. 确认前置任务完成，或明确记录等价实现；
4. 只修改完成当前任务所需的最小文件范围；
5. 不单方面修改前端契约；如果需要引入字段扩展，先更新版本策略和双方 Schema；
6. 所有数据访问通过 repository/service，Router 不直接读取 JSON 或调用 AI Provider；
7. 不把真实 DeepSeek Key、真实患者身份或完整病例写入源码、测试 fixture、日志、URL 或构建产物；
8. 所有用户可见错误提示使用中文；开发日志只保留必要技术信息并脱敏。

每项任务交付说明必须包含：

- 完成内容；
- 修改/新增文件；
- 执行过的验证命令及结果；
- 未解决限制、环境依赖和后续任务；
- 若发现契约冲突，说明冲突位置、影响和处理决定。

## 3. 当前冻结的 v1 API 契约

### 3.1 全局规则

- 开发地址：`http://127.0.0.1:8000` 或 `http://localhost:8000`；
- API 前缀：`/api`；
- 成功响应：直接返回业务 Schema，不增加 `success`、`data` 包装层；
- 失败响应：

```json
{
  "error": {
    "code": "CONTENT_NOT_FOUND",
    "message": "未找到对应内容"
  }
}
```

- JSON 字段使用 camelCase，以便直接匹配前端字段；
- Pydantic 模型默认拒绝未知字段，防止契约漂移；
- 所有资源 URL 必须能被前端访问；
- API 不返回内部堆栈、环境变量、Provider 响应原文或密钥。

### 3.2 `GET /api/health`

成功响应：

```json
{
  "status": "ok",
  "service": "copd-backend",
  "version": "1.0.0"
}
```

### 3.3 `GET /api/content/home`

响应必须匹配前端 `homePageContentSchema`：

```json
{
  "title": "基于证据的 COPD 病理学习",
  "subtitle": "以标本、切片、标注、机制与临床串联起一条可追溯的学习路径。",
  "learningPath": [
    {
      "id": "anchor_specimen",
      "type": "specimen",
      "name": "标本概览",
      "links": { "slide": "anchor_slide_1" }
    }
  ]
}
```

### 3.4 `GET /api/content/anchor/{anchorId}`

响应必须匹配前端 `explorerContextSchema`，包括：

- `anchor`；
- `specimen`；
- `hotspots`；
- `slide`；
- `slideAnnotations`；
- `annotation`；
- `mechanism`；
- `clinical`。

可空对象返回 `null`，数组字段返回 `[]`，不要省略导致前端契约不稳定。归一化坐标必须满足 `0 <= x/y/width/height <= 1`，并且 `x + width <= 1`、`y + height <= 1`。

MVP 统一策略：

- Anchor 格式非法：HTTP 400，错误码 `INVALID_REQUEST`；
- Anchor 格式合法但不存在：HTTP 200，返回当前 Anchor、其余内容为 `null`/`[]`；
- 内容数据损坏或关系校验失败：HTTP 500，错误码 `INTERNAL_ERROR`，不返回堆栈。

### 3.5 `POST /api/ai/analyze`

请求必须匹配当前前端 `aiAnalyzeRequestSchema`：

```json
{
  "patientInfo": {
    "age": 65,
    "sex": "男性",
    "smokingHistory": "40 年，每日一包"
  },
  "symptoms": ["慢性咳嗽", "咳痰", "活动后气促"],
  "tests": {
    "lungFunction": "FEV₁/FVC 0.62",
    "ctDescription": "双肺透亮度增高，可见肺大疱"
  },
  "pathologyContext": []
}
```

响应必须匹配当前前端 `aiResultSchema`：

```json
{
  "assessment": {
    "disease": "慢性阻塞性肺疾病（COPD）",
    "likelihood": "high",
    "confidence": 0.88,
    "basis": ["长期吸烟史与慢性咳嗽、咳痰表现高度吻合"]
  },
  "evidence": [
    {
      "text": "镜下可见杯状细胞增生、黏液栓形成",
      "anchorId": "anchor_annotation_2"
    }
  ],
  "differential": ["支气管哮喘"],
  "recommendation": ["结合肺功能检查"],
  "disclaimer": "本分析仅为教学用途，不构成临床诊断建议。"
}
```

约束：

- `likelihood` 只能为 `low`、`medium`、`high`、`unknown`；
- `confidence` 是 `0..1` 的教学提示，不是临床概率；
- `basis` 和 `evidence` 至少各一项；
- `evidence[].anchorId` 必须来自内容仓库中真实且允许展示的 Anchor；
- 字段名使用 `recommendation`，不能改为 `recommendations`；
- 后端只返回纯文本，不返回 HTML/Markdown 片段供前端直接执行；
- AI 失败或输出无法解析时返回结构化错误，不伪造成功结果。

### 3.6 当前不纳入 v1 的扩展

以下设计可以保留到 v2，但本轮不得让后端单方面加入并破坏前端：

- Anchor 顶层 `disease`、`title`、`description`；
- `attachments` 多模态字段；
- AI 请求中的 `gender/history/pathology` 替代当前字段；
- `assessment.summary`、`recommendations`；
- Evidence 的 `type/title/description`。

若确需加入，必须采用可选兼容字段或 `/api/v2`，并同步修改前端 Schema、services、测试和文档。

## 4. 依赖关系

```text
T20 后端骨架
 └─→ T21 内容服务与 Anchor
      └─→ T22 AI 服务
           └─→ T23 前后端联调
                └─→ T24 后端质量门与交付
```

T22 可以在 T21 完成基本内容校验后实现 mock Provider；真实 AI Provider 不得阻塞 T20/T21。

## 5. 推荐目录结构

```text
backend/
  app/
    __init__.py
    main.py
    core/
      __init__.py
      config.py
      errors.py
      logging.py
    routers/
      __init__.py
      health.py
      content.py
      ai.py
    schemas/
      __init__.py
      common.py
      content.py
      ai.py
    services/
      __init__.py
      content_service.py
      anchor_service.py
      ai_service.py
      ai_provider.py
    repositories/
      __init__.py
      content_repository.py
    data/
      content.json
    tests/
      conftest.py
      test_health.py
      test_content.py
      test_ai.py
      test_errors.py
  requirements.txt
  requirements-dev.txt
  .env.example
  .gitignore
  README.md
```

分层约束：

- Router：接收参数、调用 service、声明 response model；
- Service：业务编排、Anchor 关系、AI Provider 选择和安全降级；
- Repository：读取/缓存 JSON 和资源元数据；
- Schema：所有 Pydantic 请求、响应、错误模型；
- Core：配置、异常映射、日志脱敏；
- Tests：只使用脱敏的教学 fixture，不放真实患者数据。

## 6. T20：FastAPI 骨架、配置与 Health

### 目标

创建可以稳定启动、可检查、可扩展的后端工程基线，不接入真实内容和真实 AI。

### 前置依赖

无。前端 T19 已完成，但 T20 只依赖 API 契约和 Python 环境。

### 工作内容

1. 初始化 Python 包和 FastAPI 应用入口；
2. 配置 `GET /api/health`，返回固定健康 Schema；
3. 配置环境变量读取：
   - `APP_ENV=development|test|production`；
   - `API_HOST`、`API_PORT`；
   - `CORS_ORIGINS`；
   - `AI_PROVIDER=mock|deepseek`；
   - `AI_TIMEOUT_SECONDS`；
   - `DEEPSEEK_API_KEY` 仅从运行环境读取，不写入示例值；
4. 配置 CORS，开发环境允许 `http://localhost:5173`、`http://127.0.0.1:4174`，生产环境通过配置显式指定；
5. 建立统一错误模型和异常处理入口，至少覆盖 HTTPException、RequestValidationError 和未处理异常；
6. 配置最小日志格式，不记录请求体、患者信息、AI Key 或 Provider 原文；
7. 提供 `requirements.txt`、`requirements-dev.txt`、`.env.example`、`.gitignore` 和后端 README；
8. 保持 OpenAPI 文档可访问，但不在描述中写入密钥或内部地址。

### 预计文件范围

- 新增 `backend/app/main.py`；
- 新增 `backend/app/core/config.py`、`errors.py`、`logging.py`；
- 新增 `backend/app/routers/health.py`；
- 新增 `backend/app/schemas/common.py`；
- 新增依赖、环境示例、README 和测试文件；
- 不修改前端业务代码。

### 验收标准

- `python -m compileall backend/app` 通过；
- `uvicorn app.main:app --host 127.0.0.1 --port 8000` 可启动；
- `GET /api/health` 返回 HTTP 200 且字段为 `status/service/version`；
- 未知路由返回统一错误结构，不暴露堆栈；
- 非法 JSON/缺失字段返回中文校验错误；
- CORS 对允许来源返回正确响应头，对未配置来源不放开；
- `.env.example` 不包含真实 Key；
- `pytest backend/app/tests/test_health.py` 通过；
- `ruff` 或项目选定 lint 工具无新增错误。

### 推荐验证命令

```powershell
cd D:\code\copd\backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt -r requirements-dev.txt
python -m compileall app
pytest app/tests/test_health.py -q
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

### 输出与后续依赖

- 输出：可启动的 FastAPI 空骨架、Health 接口、统一错误处理、环境示例；
- 后续依赖：T21 使用 T20 的配置、错误和应用装配方式；
- 限制：此阶段 `content` 和 `ai` 路由可以尚未注册，但必须明确返回未实现错误或不注册，不能返回伪造成功数据。

## 7. T21：Content Service、JSON 数据与 Anchor 校验

### 目标

把当前前端 `defaultContentBundle` 迁移为后端可校验的数据源，提供与前端完全兼容的首页和病理上下文接口。

### 前置依赖

T20；必须先确认 T20 的统一错误结构和配置加载方式已完成。

### 工作内容

1. 从 `frontend/src/data/content/content.ts` 提取当前 MVP 数据，转为后端 JSON/Pydantic 可读格式；
2. 保持现有 ID 和 Anchor 不变，至少保留：
   - 1 个 specimen；
   - 3 个 hotspot；
   - 3 个 slide；
   - 3 个 annotation；
   - 3 个 mechanism；
   - 2 个 clinical；
3. 定义完整 Pydantic 模型：
   - HomePageContent；
   - AnchorItem；
   - SpecimenData；
   - HotspotData；
   - SlideData；
   - AnnotationData；
   - MechanismData；
   - ClinicalData；
   - ExplorerContext；
4. 实现 repository，负责 JSON 加载、缓存和测试环境注入；
5. 实现内容校验：
   - 重复 ID；
   - Anchor 格式；
   - 悬空链接；
   - 坐标范围和矩形边界；
   - specimen 引用的 hotspot 是否存在；
   - slide 对应 annotation 是否可解析；
   - annotation 对应 mechanism/clinical 是否可解析；
   - 最少对象数量和默认 specimen Anchor；
6. 实现 `ContentService.get_home_content()`；
7. 实现 `ContentService.get_context(anchor_id)`，返回完整聚合上下文；
8. 注册：
   - `GET /api/content/home`；
   - `GET /api/content/anchor/{anchorId}`；
9. 统一不存在 Anchor 策略：格式合法但不存在时返回 HTTP 200 空上下文；
10. 图片只返回资源路径和 alt 文案，不把二进制图片塞入 JSON。

### 预计文件范围

- 新增/修改 `backend/app/schemas/content.py`；
- 新增/修改 `backend/app/repositories/content_repository.py`；
- 新增/修改 `backend/app/services/content_service.py`、`anchor_service.py`；
- 新增/修改 `backend/app/routers/content.py`；
- 新增 `backend/app/data/content.json`；
- 新增 `backend/app/tests/test_content.py`、内容 fixture 和校验测试；
- 必要时新增 `backend/app/static/content/`，但不修改前端页面组件。

### 验收标准

- `GET /api/content/home` 可被前端 `homePageContentSchema` 解析；
- `GET /api/content/anchor/anchor_specimen` 可被前端 `explorerContextSchema` 解析；
- `anchor_annotation_1`、`anchor_annotation_2`、`anchor_annotation_3` 返回对应切片、标注、机制和临床内容；
- 不存在的合法 Anchor 返回空上下文，数组不缺失；
- 非法 Anchor 返回中文 `INVALID_REQUEST`；
- 内容校验能捕获重复 ID、悬空链接、坐标越界；
- 修改 JSON 内容即可改变 API 返回，不需要修改 Router；
- 响应不含后端文件绝对路径、调试字段或内部元数据；
- pytest 覆盖正常、空、非法、内容损坏四类场景。

### 推荐验证命令

```powershell
cd D:\code\copd\backend
pytest app/tests/test_content.py -q
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

另开终端：

```powershell
Invoke-RestMethod http://127.0.0.1:8000/api/content/home
Invoke-RestMethod http://127.0.0.1:8000/api/content/anchor/anchor_specimen
Invoke-RestMethod http://127.0.0.1:8000/api/content/anchor/anchor_annotation_1
Invoke-RestMethod http://127.0.0.1:8000/api/content/anchor/anchor_nope_99
```

### 输出与后续依赖

- 输出：真实内容 API、Pydantic Schema、内容仓库、Anchor 校验和测试；
- 后续依赖：T22 的 AI evidence 校验需要 `AnchorService`；T23 的 Explorer 联调依赖两个 Content API；
- 限制：本阶段可继续使用占位图，但必须通过 API 返回可访问路径并保留替换说明。

## 8. T22：AI Service、Mock Provider 与安全的 DeepSeek Adapter

### 目标

实现与当前前端完全兼容的 AI 分析接口；先完成可重复的 mock，再提供不暴露密钥的真实 Provider 边界。

### 前置依赖

T20、T21。真实 DeepSeek 调用不是 T22 mock 验收的前置条件。

### 工作内容

1. 定义 Pydantic `AIAnalyzeRequest`、`AIResult`、`AIAssessment`、`AIEvidence`；
2. 使用严格字段校验，拒绝未知字段和错误类型；
3. 实现 `MockAIProvider`：
   - 返回确定性结果；
   - 至少引用 3 个真实 annotation Anchor 中的一个或多个；
   - 含 `likelihood/confidence/basis`；
   - 含 differential、recommendation、disclaimer；
   - 不记录请求全文；
4. 实现 `AIService`，根据 `AI_PROVIDER` 显式选择 mock 或 deepseek；
5. 实现 `DeepSeekProvider` 边界：
   - 只从环境读取 `DEEPSEEK_API_KEY`；
   - Key 不进入响应、异常消息、日志和 OpenAPI 示例；
   - 设置连接/读取超时；
   - 对 Provider 返回内容做 JSON 解析和 Pydantic 校验；
   - Provider 失败不得自动转为 mock 成功；
6. 对 AI 返回结果执行 Evidence Anchor 存在性校验；
7. 对模型过度确定表述进行最小安全检查，至少确保免责声明存在；
8. 对空请求、超时、无效 JSON、缺失字段、无效 Anchor、Provider 失败分别映射结构化错误；
9. 注册 `POST /api/ai/analyze`；
10. 建立 mock、Provider 失败和无 Key 配置的测试 fixture。

### 预计文件范围

- 新增/修改 `backend/app/schemas/ai.py`；
- 新增/修改 `backend/app/services/ai_service.py`、`ai_provider.py`；
- 新增/修改 `backend/app/routers/ai.py`；
- 修改 `backend/app/core/config.py`、`errors.py`；
- 新增 `backend/app/tests/test_ai.py`；
- 更新 `.env.example`，但只写变量名、mock 默认值和占位说明，不写真实 Key。

### 验收标准

- 合法请求在 `AI_PROVIDER=mock` 下返回 HTTP 200；
- 返回体可被前端 `aiResultSchema` 解析；
- Evidence Anchor 全部存在于 T21 内容仓库；
- 缺字段、错误类型、未知字段得到中文校验错误；
- mock 延迟或 Provider 调用超时返回 `AI_TIMEOUT`；
- Provider 返回无效结构返回 `AI_SERVICE_ERROR` 或 `VALIDATION_ERROR`，不返回 200 假结果；
- `AI_PROVIDER=deepseek` 且未配置 Key 时，返回明确服务错误，不读取前端环境；
- 日志和错误响应不包含请求中的完整病例文本或身份字段；
- pytest 覆盖 mock 成功、请求校验、Anchor 校验、超时、Provider 失败和免责声明。

### 推荐验证命令

```powershell
cd D:\code\copd\backend
$env:AI_PROVIDER = 'mock'
pytest app/tests/test_ai.py -q
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

请求示例：

```powershell
$body = @{
  patientInfo = @{
    age = 65
    sex = '男性'
    smokingHistory = '40 年，每日一包'
  }
  symptoms = @('慢性咳嗽', '咳痰', '活动后气促')
  tests = @{
    lungFunction = 'FEV₁/FVC 0.62'
    ctDescription = '双肺透亮度增高，可见肺大疱'
  }
  pathologyContext = @()
} | ConvertTo-Json -Depth 5
Invoke-RestMethod -Method Post -Uri http://127.0.0.1:8000/api/ai/analyze -ContentType 'application/json' -Body $body
```

### 输出与后续依赖

- 输出：可独立运行的 mock AI API、真实 Provider 适配接口、Schema 和安全错误处理；
- 后续依赖：T23 先用 mock 后端完成浏览器联调，再在获得 Key 和后端配置后做真实 Provider 联调；
- 限制：没有真实 Key 时不得声称 DeepSeek 已联通；只能报告 Provider 适配器和错误路径已实现。

## 9. T23：前后端联调与主教学闭环

### 目标

让当前前端在 `VITE_USE_MOCK_API=false` 下完全通过真实 FastAPI API 工作，并验证主闭环和错误状态。

### 前置依赖

T21、T22；T20 的服务启动、CORS 和错误处理必须可用。

### 工作内容

1. 启动后端：`127.0.0.1:8000`；
2. 前端 `.env` 切换：

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_USE_MOCK_API=false
```

3. 重启 Vite，确认前端不再使用静态 ContentRepository 和 MockAIService；
4. 依次验证：
   - `/api/health`；
   - `/api/content/home`；
   - `anchor_specimen`；
   - 三个 annotation Anchor；
   - 合法但不存在 Anchor；
   - 非法 Anchor；
   - AI 合法请求；
   - AI 空输入/错误请求；
   - AI Provider 错误和超时；
5. 浏览器验证：
   - 首页不请求 AI；
   - Explorer 热区更新 URL；
   - 切片、标注、机制、临床同步；
   - 刷新、前进、后退恢复 Anchor；
   - AI 表单显示 loading、报告和免责声明；
   - Evidence 跳转 Explorer 并返回 AI 报告；
6. 检查浏览器 Network：所有业务请求经过 `/api`，无前端直连 DeepSeek；
7. 检查浏览器 Console：无阻断级错误，无泄露请求体和 Provider Key；
8. 若发现字段不匹配，优先修正后端 Schema/映射，不在页面组件中添加第二套兼容逻辑；
9. 记录真实 API 与 mock API 的差异、后端启动方式和环境变量。

### 预计文件范围

- 联调期间只修改后端 Schema、service、错误映射或配置；
- 只有发现已冻结前端契约错误时，才允许同步修改前端 `services`、`types` 和测试；
- 新增 `backend/tests/integration/` 或等价联调脚本；
- 不把本地真实 Key、病例或浏览器导出日志提交到仓库。

### 验收标准

- 前端 `.env` 为 remote 模式时首页和 Explorer 正常加载；
- 三个热区均能从真实 API 完成切换；
- AI mock 后端能完成提交、报告、Evidence 回溯和返回 AI；
- 错误 API 能显示中文错误和重试，不白屏；
- 前端请求未出现 `/api/api`、错误端口或 Provider 直连；
- 浏览器控制台无阻断错误；
- 前端现有 `npm run lint`、`npm run test`、`npm run test:e2e`、`npm run build` 在联调配置下通过；
- 后端 pytest 全部通过；
- 真实 DeepSeek 未配置时，联调报告明确标记“未执行真实 Provider 验证”。

### 推荐验证命令

后端终端：

```powershell
cd D:\code\copd\backend
\.venv\Scripts\Activate.ps1
$env:AI_PROVIDER = 'mock'
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

前端终端：

```powershell
cd D:\code\copd\frontend
npm run dev -- --host 127.0.0.1 --port 4174
```

质量验证：

```powershell
cd D:\code\copd\backend
pytest -q

cd D:\code\copd\frontend
npm run lint
npm run test
npm run test:e2e
npm run build
```

### 输出与后续依赖

- 输出：联调记录、真实后端启动命令、环境变量说明、主流程验证结果；
- 后续依赖：T24 根据联调结果做最终质量门；
- 限制：真实 AI Provider 需要后端环境中的合法 Key、网络权限和供应商服务可用性，不能用 mock 结果替代真实联调结论。

## 10. T24：后端质量门、交付和部署准备

### 目标

在不扩大 MVP 范围的前提下，完成后端自动化质量检查、文档、生产配置审计和可交付版本整理。

### 前置依赖

T23 主闭环联调完成。

### 工作内容

1. 运行全量 pytest，并检查覆盖核心 API、错误、Schema、内容关系和 AI Provider；
2. 运行 Python 语法、lint、类型检查（项目实际采用哪些工具由 T20 固定）；
3. 检查 OpenAPI：
   - 路径、方法、状态码、请求/响应模型与本计划一致；
   - 示例不包含真实 Key、真实患者信息或内部地址；
4. 检查配置：
   - `.env.example` 完整且安全；
   - production 默认不启用 debug；
   - CORS 不使用无条件 `*`；
   - AI Provider 失败不静默 fallback；
5. 检查敏感信息：
   - 源码、测试、日志、OpenAPI、构建/容器文件；
   - `DEEPSEEK_API_KEY` 只作为环境变量名出现；
   - 不提交 `.env`、`.venv`、缓存和测试报告；
6. 检查内容资源：
   - 图片路径可访问；
   - 内容来源、版权和待替换状态有记录；
   - Anchor 关系校验在启动和测试阶段执行；
7. 准备 README：
   - 后端安装和启动；
   - mock/remote 切换；
   - API 检查命令；
   - 前后端联调步骤；
   - 已知限制和真实 AI 联调状态；
8. Docker 只做可选准备：先提供非敏感的 `Dockerfile`/compose 草案，再单独验证，不阻塞本地 MVP。

### 预计文件范围

- 后端测试、README、requirements、配置和部署文件；
- 必要时补充根目录 README 的后端章节；
- 不修改已通过验收的前端业务组件，除非联调发现契约问题。

### 验收标准

- `pytest -q` 通过；
- 选定的 lint/type check 通过；
- OpenAPI 文档与 v1 契约一致；
- 安全扫描未发现 Key、Token、真实患者信息或敏感日志；
- mock 联调闭环可重复运行；
- 后端不可用、AI 超时、无效 Anchor 和无效 AI 响应均有安全降级；
- README 命令在干净 Python 环境中可复现；
- 未实现项与 MVP 范围一致，真实 DeepSeek 联调状态有明确说明；
- Docker 若未完成，必须标为后续依赖，不得在交付中声称已验证。

### 推荐验证命令

```powershell
cd D:\code\copd\backend
python -m compileall app
pytest -q
ruff check app
mypy app

cd D:\code\copd\frontend
npm run lint
npm run test
npm run test:e2e
npm run build
```

### 输出与后续依赖

- 输出：后端 MVP 交付包、README、测试记录、OpenAPI 检查结果、已知限制清单；
- 后续依赖：生产部署、真实资源替换、医学内容审核和多模态 v2；
- 限制：没有真实 AI Key 或后端生产部署环境时，只能完成 mock 和适配器级验收，不能声称真实生产 AI 已通过。

## 11. 任务状态与交付模板

每个任务完成后，在交付说明中使用以下格式：

```text
任务：T20/T21/T22/T23/T24

完成内容：
- …

修改/新增文件：
- …

验证命令及结果：
- `命令`：通过/失败（简述原因）

未解决限制或后续依赖：
- …

契约变更：
- 无；或列出已同步修改的 Schema、前端服务、测试和文档。
```

## 12. 最终后端验收矩阵

| 类别 | 验收项         | 必须结果                             |
| ---- | -------------- | ------------------------------------ |
| 工程 | FastAPI 可启动 | `uvicorn` 正常启动                   |
| 工程 | Health         | `/api/health` 200 且字段稳定         |
| 内容 | Home           | 可被前端 Schema 解析                 |
| 内容 | Anchor         | 三个核心标注 Anchor 可解析           |
| 内容 | 关系校验       | 无重复 ID、悬空链接、越界坐标        |
| AI   | Mock           | 返回前端兼容结构                     |
| AI   | Evidence       | Anchor 全部真实存在                  |
| AI   | 失败           | 超时/无效 JSON/Provider 错误安全降级 |
| 安全 | Key            | 只存在后端运行环境                   |
| 安全 | 隐私           | 不保存或输出真实身份信息             |
| 联调 | Explorer       | 热区到机制/临床闭环可用              |
| 联调 | AI             | 提交、报告、Evidence、返回 AI 可用   |
| 质量 | 后端测试       | pytest 全部通过                      |
| 质量 | 前端回归       | lint/test/e2e/build 全部通过         |
| 交付 | 文档           | 启动命令、环境变量、限制准确         |

## 13. 建议执行顺序

```text
先完成 T20 骨架和 Health
  ↓
再完成 T21 内容 API 和 Anchor 校验
  ↓
再完成 T22 Mock AI 和 Provider 边界
  ↓
先用 mock 后端完成 T23 浏览器联调
  ↓
具备 Key 和后端网络条件后，再单独验证 DeepSeek Provider
  ↓
最后执行 T24 全量质量门、文档和交付整理
```

当前最适合开始的是 T20。不要在后端尚未完成 Schema 和内容校验前直接接入真实 DeepSeek；先让 Health、Content 和 Mock AI 三类接口稳定，再做真实 Provider 联调。
