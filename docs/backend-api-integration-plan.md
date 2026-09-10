# COPD Explorer 后端 API 与前后端联调计划

版本：MVP 联调基线  
适用范围：当前 `frontend/` 已验收版本与 FastAPI 后端  
权威原则：本文件中的当前联调契约必须与 `frontend/src/types` 和 `frontend/src/services` 一致。

## 1. 当前有效的决策

- 后端使用 FastAPI，前端使用 React + TypeScript。
- API 前缀统一为 `/api`。
- 成功响应直接返回业务 Schema，不增加 `success`、`data` 包装层。
- 失败响应统一返回错误对象：

```json
{
  "error": {
    "code": "CONTENT_NOT_FOUND",
    "message": "未找到对应内容"
  }
}
```

- AI Key 只能保存在后端；前端、构建产物、日志和 API 响应不得出现 Key、Token 或真实患者身份信息。
- MVP 内容使用 JSON/静态资源；暂不引入数据库、用户系统或复杂权限。
- AI 默认支持 `mock`，真实提供商通过后端环境变量切换；真实请求失败不得静默伪装成 mock 成功。
- MVP 第一版只实现文本病例分析；多模态字段可以预留，但不能破坏当前前端请求 Schema。
- 所有用户可见提示使用中文；AI 结果必须带教学免责声明，不得表述为真实临床诊断。

## 2. 前端当前实际使用的契约

### 2.1 首页

`GET /api/content/home`

当前前端解析的成功响应：

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

字段必须与 `frontend/src/types/content.ts` 中的 `homePageContentSchema` 一致，不能直接改成 `description/features` 版本，除非同步修改前端 Schema、服务和测试。

### 2.2 病理上下文

`GET /api/content/anchor/{anchorId}`

当前前端解析的成功响应：

```json
{
  "anchor": "anchor_annotation_1",
  "specimen": {
    "id": "specimen_1",
    "type": "specimen",
    "title": "支气管组织标本",
    "image": "/content/placeholder.svg",
    "altText": "支气管组织标本占位图",
    "hotspots": ["hotspot_1", "hotspot_2", "hotspot_3"]
  },
  "hotspots": [
    {
      "id": "hotspot_1",
      "label": "气道狭窄",
      "anchor": "anchor_annotation_1",
      "x": 0.2,
      "y": 0.3,
      "width": 0.2,
      "height": 0.2
    }
  ],
  "slide": {
    "id": "slide_1",
    "type": "slide",
    "title": "低倍组织学切片",
    "image": "/content/placeholder.svg",
    "altText": "低倍组织学切片占位图",
    "anchor": "anchor_slide_1"
  },
  "slideAnnotations": [],
  "annotation": null,
  "mechanism": null,
  "clinical": null
}
```

对象字段以 `frontend/src/types/content.ts` 为准：

- `specimen`、`slide`、`annotation`、`mechanism`、`clinical` 可以为 `null`；
- `hotspots`、`slideAnnotations` 必须为数组，缺省时返回空数组；
- 归一化坐标必须在 `0..1` 范围内；
- `anchor` 必须是稳定、可解析的 Anchor ID；
- 资源 URL 必须是前端可访问的同源路径或已配置 CORS 的绝对 URL；
- 不存在但格式合法的 Anchor，应返回空上下文（HTTP 200），而不是伪造内容；
- 格式非法的 Anchor 可返回 HTTP 400；已知格式但不存在可返回空上下文或 404，项目必须统一一种行为并同步前端测试。

### 2.3 AI 分析

`POST /api/ai/analyze`

当前前端发送的请求：

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

当前前端解析的成功响应：

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

- `assessment.likelihood` 只能是 `low`、`medium`、`high`、`unknown`；
- `assessment.confidence` 为 `0..1` 的教学提示，不是临床概率；
- `basis`、`evidence` 至少各有一项；
- `evidence[].anchorId` 必须引用内容数据中真实存在且允许展示的 Anchor；
- `recommendation` 使用当前前端字段名，不能改为 `recommendations`；
- 后端不得返回 HTML，前端按纯文本渲染；
- 失败、超时或无法解析模型输出时，返回结构化错误，不返回臆造的医学结论。

## 3. 健康检查

`GET /api/health`

建议响应：

```json
{
  "status": "ok",
  "service": "copd-backend",
  "version": "1.0.0"
}
```

健康检查不得返回密钥、内部堆栈或后端供应商凭据。

## 4. 错误与 HTTP 状态

建议错误码：

|    HTTP | code                | 使用场景                   |
| ------: | ------------------- | -------------------------- |
|     400 | `INVALID_REQUEST`   | 请求体或 Anchor 格式不合法 |
|     404 | `CONTENT_NOT_FOUND` | 后端明确采用 404 策略时    |
| 408/504 | `AI_TIMEOUT`        | AI 请求超时                |
|     422 | `VALIDATION_ERROR`  | Pydantic 请求/响应校验失败 |
|     500 | `AI_SERVICE_ERROR`  | AI 提供商失败              |
|     500 | `INTERNAL_ERROR`    | 未分类后端错误             |

FastAPI 默认的 422 错误应转换为中文、稳定的错误结构；不得把 Python 堆栈直接返回前端。

## 5. 后端建议目录

```text
backend/
  app/
    main.py
    core/
      config.py
      errors.py
    routers/
      health.py
      content.py
      ai.py
    schemas/
      common.py
      content.py
      ai.py
    services/
      content_service.py
      anchor_service.py
      ai_service.py
      ai_provider.py
    repositories/
      content_repository.py
    data/
      content.json
    tests/
      test_health.py
      test_content.py
      test_ai.py
  requirements.txt
  .env.example
  README.md
```

Router 只做参数接收和响应映射；业务逻辑放在 services；JSON 读取放在 repository；Pydantic 模型集中在 schemas。

## 6. 实施顺序

### T20：FastAPI 骨架

- 初始化 FastAPI 工程；
- 配置 `GET /api/health`；
- 配置 CORS：开发环境至少允许 `http://localhost:5173`、`http://127.0.0.1:4174`；
- 配置环境变量；
- 增加统一异常响应；
- 不接入真实 AI。

### T21：Content Service

- 将前端 `defaultContentBundle` 转为后端 JSON/Pydantic 数据；
- 实现 `/api/content/home`；
- 实现 `/api/content/anchor/{anchorId}`；
- 启动时校验重复 ID、悬空链接、坐标范围和必需内容；
- 为不存在 Anchor 提供确定的空/404 策略。

### T22：AI Service

- 实现 Pydantic 请求/响应 Schema；
- 实现 `AI_PROVIDER=mock` 固定返回；
- 校验 mock 和远程结果中的 Anchor；
- 实现超时、供应商错误和无效 JSON 的安全降级；
- 只有后端读取 `DEEPSEEK_API_KEY`；
- 未获得真实 Key 前不得写入仓库、`.env.example` 或测试输出。

### T23：前后端联调

- 启动后端 `http://localhost:8000`；
- 前端 `.env` 设置：

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_USE_MOCK_API=false
```

- 依次验证 health、home、三个有效 Anchor、无效 Anchor、AI mock/remote、错误和超时；
- 确认浏览器 Network 请求均指向 `/api`，没有前端直连 AI Provider；
- 确认 AI Evidence 点击后能回到 Explorer，再返回 AI 报告；
- 确认响应不含 token、堆栈、真实患者身份或内部配置。

### T24：后端质量门

- `pytest` 通过；
- OpenAPI 文档与本文件一致；
- CORS、错误结构、响应 Schema、Anchor 校验有自动化测试；
- `ruff`/`mypy`（若项目采用）通过；
- 提供准确的后端和联调启动命令；
- Docker 仅在本地启动稳定后准备，不阻塞 MVP 联调。

## 7. 联调验收清单

### 接口层

- [ ] `/api/health` 返回状态、服务名和版本；
- [ ] home 响应可被前端 `homePageContentSchema` 解析；
- [ ] anchor 响应可被前端 `explorerContextSchema` 解析；
- [ ] AI 请求可被前端 `aiAnalyzeRequestSchema` 对应；
- [ ] AI 响应可被前端 `aiResultSchema` 解析；
- [ ] 错误结构稳定且中文；
- [ ] 不存在 Anchor、空内容、超时、模型输出不合法均有明确结果。

### 浏览器闭环

- [ ] 首页加载不请求 AI；
- [ ] Explorer 热区切换更新 URL 和上下文；
- [ ] 刷新/前进/后退恢复 Anchor；
- [ ] AI mock 提交显示加载、结果和免责声明；
- [ ] AI evidence 可回溯到真实 Anchor；
- [ ] 后端不可用时前端显示错误和重试，而不是白屏；
- [ ] 浏览器控制台无阻断级错误。

### 安全与内容

- [ ] DeepSeek Key 仅存在后端运行环境；
- [ ] `.env.example` 不含真实 Key；
- [ ] 前端构建产物不含 Key、Token、真实病例；
- [ ] AI 结果不使用“患者确诊”等过度确定表述；
- [ ] 所有 AI 页面和结果包含教学免责声明；
- [ ] 病理内容、资源来源和版权状态有记录。

## 8. 当前不直接采用的草案内容

以下内容有价值，但会导致当前前端契约变化，暂不作为本轮联调必做项：

- Anchor 顶层新增 `disease`、`title`、`description`；
- AI 请求改成 `gender/history/tests/pathology` 聚合字段；
- AI 响应将 `likelihood/confidence/basis` 改为 `confidence/summary`；
- `recommendation` 改名为 `recommendations`；
- Evidence 增加 `type/title/description`；
- `attachments` 多模态输入。

这些扩展应在后续版本中通过前后端同时升级 Schema、服务、测试和版本策略实现。若现在必须加入，先建立 `v2` 或兼容字段方案，不要让后端单方面改变 `v1` 响应。

## 9. 推荐启动命令

前端：

```powershell
cd D:\code\copd\frontend
npm install
npm run dev -- --host 127.0.0.1 --port 4174
```

后端（建议）：

```powershell
cd D:\code\copd\backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

联调前检查：

```powershell
Invoke-RestMethod http://127.0.0.1:8000/api/health
Invoke-RestMethod http://127.0.0.1:8000/api/content/home
Invoke-RestMethod http://127.0.0.1:8000/api/content/anchor/anchor_specimen
```
