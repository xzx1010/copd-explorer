# COPD Explorer 后端

FastAPI 后端，为 COPD 病理教学平台提供内容查询、Anchor 上下文聚合与 AI 教学分析接口。

## 快速启动

项目统一使用仓库根目录的 `.venv`，不要在 `backend` 内创建第二个虚拟环境。
首次安装请在仓库根目录执行：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\setup.ps1
.\scripts\run-backend.ps1
```

固定版本和完整交付流程见根目录 `README.md`。Python 直接依赖记录在
`requirements.txt` / `requirements-dev.txt`，可复现安装使用完整的
`requirements-lock.txt`。

启动后访问：

- API 文档：<http://127.0.0.1:8000/docs>
- 健康检查：<http://127.0.0.1:8000/api/health>

## 运行测试与质量检查

```powershell
# 从仓库根目录运行全部后端和前端质量检查
powershell -ExecutionPolicy Bypass -File .\scripts\verify.ps1
```

## 端到端联调验证

先启动后端，再另开终端：

```powershell
# 终端 A：启动后端
cd backend
..\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000

# 终端 B：运行联调契约检查
..\.venv\Scripts\python.exe app/tests/integration/verify_integration.py
```

## 前后端联调

前端（`VITE_USE_MOCK_API=false` 时）：

```powershell
cd frontend
npm ci
npm run dev -- --host 127.0.0.1 --port 4174
```

前端 `.env`：

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_USE_MOCK_API=false
```

## 环境变量

参考 `.env.example`。关键变量：

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `APP_ENV` | `development` | `development` / `test` / `production` |
| `API_HOST` / `API_PORT` | `127.0.0.1` / `8000` | 监听地址与端口 |
| `CORS_ORIGINS` | `http://localhost:5173,http://127.0.0.1:4174` | 允许的前端来源（逗号分隔） |
| `AI_PROVIDER` | `mock` | `mock`（教学 fixture）或 `deepseek`（真实 API） |
| `AI_TIMEOUT_SECONDS` | `30` | AI 请求超时（秒） |
| `DEEPSEEK_API_KEY` | （空） | 仅运行时设置，**绝不**写入 `.env.example` 或提交到仓库 |

## 目录结构

```text
backend/
  app/
    main.py              # FastAPI 入口（CORS / 异常处理 / 路由装配）
    core/
      config.py           # 环境变量（pydantic-settings）
      errors.py           # 统一错误模型、APIError、异常处理器
      logging.py          # 脱敏日志
    routers/
      health.py           # GET /api/health
      content.py          # GET /api/content/*
      ai.py               # POST /api/ai/analyze
    schemas/
      common.py           # HealthResponse
      content.py          # 内容域 Pydantic 模型
      ai.py               # AI 域 Pydantic 模型
    services/
      content_service.py  # Anchor 上下文聚合
      anchor_service.py   # Anchor 格式/存在性检查
      ai_service.py       # Provider 选择 + 证据/安全校验
      ai_provider.py      # MockAIProvider / DeepSeekProvider
    repositories/
      content_repository.py  # JSON 加载、缓存、内容校验
    data/
      content.json        # 静态教学内容
    tests/
      conftest.py
      test_health.py
      test_content.py
      test_ai.py
      integration/        # 端到端契约验证脚本
  requirements.txt
  requirements-dev.txt
  .env.example
  .gitignore
```

## API 契约

| 方法 | 路径 | 说明 | 状态 |
|------|------|------|------|
| GET | `/api/health` | 健康检查 | ✅ |
| GET | `/api/content/home` | 首页内容 | ✅ |
| GET | `/api/content/anchor/{anchorId}` | 病理上下文 | ✅ |
| POST | `/api/ai/analyze` | AI 教学分析 | ✅ |

所有成功响应直接返回业务 Schema。失败响应统一格式：

```json
{
  "error": {
    "code": "CONTENT_NOT_FOUND",
    "message": "未找到对应内容"
  }
}
```

错误码：`INVALID_REQUEST`、`CONTENT_NOT_FOUND`、`VALIDATION_ERROR`、`AI_TIMEOUT`、`AI_SERVICE_ERROR`、`INTERNAL_ERROR`。

## 已知限制

- 真实 DeepSeek 联调需在获得有效 `DEEPSEEK_API_KEY` 后单独验证（当前仅实现适配器与错误路径，未经真实网络验证）；
- 图片仍使用占位资源 `/content/placeholder.svg`，替换说明见内容来源记录；
- 生产部署配置（Docker / gunicorn）未包含在 MVP 范围内；
- AI 教学结果仅作教学用途，不构成临床诊断。
