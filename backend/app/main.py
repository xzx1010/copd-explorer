"""FastAPI application entry point – T22 AI API.

This module wires together CORS, exception handlers, logging, and routers.
Health, content, and AI routes are registered.  The catch-all returns a
structured error for any /api/* route that is not yet registered.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.config import get_settings
from app.core.errors import (
    APIError,
    ErrorCode,
    ErrorDetail,
    ErrorResponse,
    api_error_handler,
    http_exception_handler,
    unhandled_exception_handler,
    validation_exception_handler,
)
from app.core.logging import setup_logging
from app.routers import ai, content, health


@asynccontextmanager
async def lifespan(_app: FastAPI):
    """Startup / shutdown logic.

    At T20 this is deliberately minimal.  Content validation and AI provider
    warm-up will be added in T21/T22.
    """
    setup_logging()
    yield


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title="COPD Explorer API",
        description=(
            "COPD 病理教学平台后端。"
            "提供内容查询、Anchor 上下文聚合与 AI 教学分析接口。"
        ),
        version="1.0.0",
        lifespan=lifespan,
        # Disable automatic OpenAPI URL rewriting behind proxies
        root_path="",
        # Never show internal Pydantic details in docs
        swagger_ui_parameters={"defaultModelsExpandDepth": -1},
    )

    # ---- CORS ---------------------------------------------------------------
    if settings.is_development:
        # Allow local frontend dev servers
        app.add_middleware(
            CORSMiddleware,
            allow_origins=settings.cors_origin_list,
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )
    else:
        # production – origins must be explicitly configured
        app.add_middleware(
            CORSMiddleware,
            allow_origins=settings.cors_origin_list,
            allow_credentials=True,
            allow_methods=["GET", "POST"],
            allow_headers=["Accept", "Content-Type"],
        )

    # ---- exception handlers (order matters) ---------------------------------
    app.add_exception_handler(APIError, api_error_handler)  # type: ignore[arg-type]
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)  # type: ignore[arg-type]
    app.add_exception_handler(RequestValidationError, validation_exception_handler)  # type: ignore[arg-type]
    app.add_exception_handler(Exception, unhandled_exception_handler)

    # ---- routers ------------------------------------------------------------
    app.include_router(health.router)
    app.include_router(content.router)
    app.include_router(ai.router)

    # ---- catch-all for unimplemented /api/* routes --------------------------
    @app.api_route(
        "/api/{rest_of_path:path}",
        methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        include_in_schema=False,
    )
    async def unimplemented_handler(request: Request):
        """Return a structured error for routes not yet registered.

        This prevents accidental 404 HTML pages and guarantees the frontend
        always receives our error contract.
        """
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content=ErrorResponse(
                error=ErrorDetail(
                    code=ErrorCode.CONTENT_NOT_FOUND,
                    message=f"接口 /api/{request.path_params['rest_of_path']} 暂未实现。",
                )
            ).model_dump(),
        )

    return app


# ---- uvicorn entry point ---------------------------------------------------
app = create_app()
