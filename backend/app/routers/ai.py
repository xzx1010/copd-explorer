"""AI router – POST /api/ai/analyze"""

from typing import Annotated

from fastapi import APIRouter, Depends, status

from app.core.config import Settings, get_settings
from app.core.errors import APIError, ErrorCode
from app.repositories.content_repository import ContentRepository, load_content_bundle
from app.schemas.ai import AIAnalyzeRequest, AIResult
from app.services.ai_provider import AIProviderError, AIProviderTimeoutError
from app.services.ai_service import AIService

router = APIRouter(tags=["ai"])


# ---------------------------------------------------------------------------
# Dependency
# ---------------------------------------------------------------------------

def _service(settings: Annotated[Settings, Depends(get_settings)]) -> AIService:
    repo = ContentRepository(load_content_bundle())
    return AIService(settings, repo)


# ---------------------------------------------------------------------------
# Handler
# ---------------------------------------------------------------------------

@router.post(
    "/api/ai/analyze",
    response_model=AIResult,
    summary="AI 教学分析",
    description=(
        "根据病史、症状、检查结果和病理上下文返回教学分析。"
        "结果仅用于教学，不构成临床诊断。"
    ),
)
async def analyze(
    request: AIAnalyzeRequest,
    service: Annotated[AIService, Depends(_service)],
) -> AIResult:
    try:
        return await service.analyze(request)
    except AIProviderTimeoutError as exc:
        raise APIError(
            status_code=status.HTTP_408_REQUEST_TIMEOUT,
            code=ErrorCode.AI_TIMEOUT,
            message=exc.message,
        ) from exc
    except AIProviderError as exc:
        raise APIError(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            code=ErrorCode.AI_SERVICE_ERROR,
            message=exc.message,
        ) from exc
