"""Health-check router – GET /api/health"""

from fastapi import APIRouter

from app.schemas.common import HealthResponse

router = APIRouter(tags=["health"])


@router.get(
    "/api/health",
    response_model=HealthResponse,
    summary="服务健康检查",
    description="返回服务运行状态，供前端和运维探测使用。不返回任何密钥或内部信息。",
)
async def health_check() -> HealthResponse:
    return HealthResponse()
