# COPD Explorer

COPD 病理可视化教学平台。前端使用 React + TypeScript，后端使用 FastAPI。

## 固定开发环境

本项目以 Windows + PowerShell 为交付基线，并固定以下工具版本：

- Python `3.12.13`（见 `.python-version`）
- Node.js `24.14.0`（见 `.nvmrc` / `.node-version`）
- npm `11.19.0`（见 `frontend/package.json`）

Python 完整依赖由 `backend/requirements-lock.txt` 固定；前端完整依赖由
`frontend/package-lock.json` 固定。前端只使用 npm，不要混用 pnpm 或 yarn。

## 第一次安装

1. 安装上述版本的 Python、Node.js 和 npm，并确保 `python`、`node`、`npm`
   可在 PowerShell 中执行。
2. 在仓库根目录运行：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\setup.ps1
```

使用 nvm-windows 或 fnm 时，可按 `.nvmrc` 安装 Node.js；随后固定 npm：

```powershell
nvm install 24.14.0
nvm use 24.14.0
npm install --global npm@11.19.0
```

脚本会：

- 校验 Python、Node.js、npm 版本；
- 在仓库根目录创建唯一的 `.venv`；
- 按 Python 锁文件安装后端依赖；
- 使用 `npm ci` 按锁文件安装前端依赖；
- 创建缺失的本地 `.env`；
- 自动执行前后端质量检查。

如需完全重建本地依赖：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\setup.ps1 -Recreate
```

## 日常启动

打开两个 PowerShell 终端，分别运行：

```powershell
.\scripts\run-backend.ps1
```

```powershell
.\scripts\run-frontend.ps1
```

默认地址：

- 前端：<http://127.0.0.1:5173>
- 后端 API：<http://127.0.0.1:8000>
- API 文档：<http://127.0.0.1:8000/docs>

前端 `.env.example` 默认启用 Mock API，适合独立演示。需要真实前后端联调时，
把 `frontend/.env` 中的 `VITE_USE_MOCK_API` 改为 `false`。

## 无后端静态发布

项目已提供 GitHub Pages 工作流 `.github/workflows/deploy-pages.yml`。推送到
`main` 后，GitHub Actions 会只构建 `frontend`，强制使用 Mock API，并发布为静态站点。
访问者只需打开 Pages 网址，不需要安装 Python、启动后端或获得源代码。

也可以把 `frontend/dist` 上传到 Netlify、Vercel、Cloudflare Pages 或任意静态文件托管。
部署时设置 `VITE_USE_MOCK_API=true`；如果站点不是部署在域名根路径，再设置
`VITE_BASE_PATH` 为实际子路径。

## 交付前验证

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\verify.ps1
```

该命令会执行后端 pytest、Ruff、Mypy、编译检查，以及前端类型检查、ESLint、
Vitest 和生产构建。浏览器端到端测试需要本机存在 Chrome 或 Playwright Chromium：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\verify.ps1 -IncludeE2E
```

## 依赖维护约定

- Python：先修改 `requirements.txt` / `requirements-dev.txt`，在全新 Python
  3.12.13 虚拟环境中验证后，再更新 `requirements-lock.txt`。
- 前端：只通过 npm 修改依赖，并提交同步变化的 `package.json` 与
  `package-lock.json`。
- 安装应用依赖使用 `npm ci`，不要使用会隐式改写依赖树的其他包管理器。
- `.env`、`.venv`、`node_modules` 和构建产物均不得提交。

后端详细 API 与环境变量说明见 [backend/README.md](backend/README.md)。
