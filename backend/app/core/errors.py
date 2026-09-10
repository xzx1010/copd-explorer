"""Unified error model and exception handlers.

FastAPI's default 422 response is replaced with a stable, Chinese-language
error structure matching the frontend's `appErrorSchema`.
"""

from __future__ import annotations

from fastapi import Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from starlette.exceptions import HTTPException as StarletteHTTPException

# ---------------------------------------------------------------------------
# Public error codes
# ---------------------------------------------------------------------------

class ErrorCode:
    INVALID_REQUEST = "INVALID_REQUEST"
    CONTENT_NOT_FOUND = "CONTENT_NOT_FOUND"
    VALIDATION_ERROR = "VALIDATION_ERROR"
    AI_TIMEOUT = "AI_TIMEOUT"
    AI_SERVICE_ERROR = "AI_SERVICE_ERROR"
    INTERNAL_ERROR = "INTERNAL_ERROR"


# ---------------------------------------------------------------------------
# Error response schema (matches frontend appErrorSchema expectations)
# ---------------------------------------------------------------------------

class ErrorDetail(BaseModel):
    code: str = Field(..., examples=["INVALID_REQUEST"])
    message: str = Field(..., examples=["请求参数不合法"])


class ErrorResponse(BaseModel):
    error: ErrorDetail


# ---------------------------------------------------------------------------
# Helper – build a JSONResponse with the unified error shape
# ---------------------------------------------------------------------------

def error_response(
    status_code: int,
    code: str,
    message: str,
) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content=ErrorResponse(
            error=ErrorDetail(code=code, message=message),
        ).model_dump(),
    )


# ---------------------------------------------------------------------------
# Domain exception carrying an explicit HTTP status + error code
# ---------------------------------------------------------------------------

class APIError(Exception):
    """Raise this to return a specific error code (e.g. AI_TIMEOUT).

    Unlike Starlette's HTTPException, this carries a business error code so
    the frontend can distinguish AI_TIMEOUT from AI_SERVICE_ERROR etc.
    """

    def __init__(self, status_code: int, code: str, message: str) -> None:
        self.status_code = status_code
        self.code = code
        self.message = message
        super().__init__(message)


# ---------------------------------------------------------------------------
# FastAPI exception handlers
# ---------------------------------------------------------------------------

async def api_error_handler(_request: Request, exc: APIError) -> JSONResponse:
    """Map a domain APIError to the unified error shape."""
    return error_response(
        status_code=exc.status_code,
        code=exc.code,
        message=exc.message,
    )


async def http_exception_handler(
    _request: Request,
    exc: StarletteHTTPException,
) -> JSONResponse:
    """Map Starlette HTTPException to the unified error shape."""
    return error_response(
        status_code=exc.status_code,
        code=ErrorCode.INVALID_REQUEST,
        message=exc.detail if isinstance(exc.detail, str) else "请求处理失败",
    )


async def validation_exception_handler(
    _request: Request,
    exc: RequestValidationError,
) -> JSONResponse:
    """Translate Pydantic validation errors into Chinese messages.

    Deliberately avoids returning the raw error tree so that internal model
    layout is never leaked.
    """
    # Collect field-level messages in a simple human-readable form
    messages: list[str] = []
    for err in exc.errors():
        loc = " → ".join(str(part) for part in err["loc"] if part != "body")
        msg = err.get("msg", "校验失败")
        if loc:
            messages.append(f"字段 [{loc}]：{msg}")
        else:
            messages.append(msg)

    detail = "；".join(messages) if messages else "请求参数校验失败，请检查后重试。"

    return error_response(
        status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
        code=ErrorCode.VALIDATION_ERROR,
        message=detail,
    )


async def unhandled_exception_handler(
    _request: Request,
    _exc: Exception,
) -> JSONResponse:
    """Catch-all for truly unexpected errors – no stack leak."""
    return error_response(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        code=ErrorCode.INTERNAL_ERROR,
        message="服务器内部错误，请稍后重试。",
    )
