"""Content router – GET /api/content/home  and  /api/content/anchor/{anchorId}"""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.repositories.content_repository import ContentRepository, load_content_bundle
from app.schemas.content import ExplorerContext, HomePageContent
from app.services.anchor_service import is_valid_anchor_id
from app.services.content_service import ContentService

router = APIRouter(tags=["content"])


# ---------------------------------------------------------------------------
# Singleton-ish dependency – reuse the cached bundle
# ---------------------------------------------------------------------------

def _repo() -> ContentRepository:
    return ContentRepository(load_content_bundle())


def _service() -> ContentService:
    return ContentService(_repo())


# ---------------------------------------------------------------------------
# Handlers
# ---------------------------------------------------------------------------

@router.get(
    "/api/content/home",
    response_model=HomePageContent,
    summary="获取首页内容",
    description="返回首页标题、副标题和教学路径。",
)
async def home(repo: Annotated[ContentRepository, Depends(_repo)]) -> HomePageContent:
    return repo.get_home()


@router.get(
    "/api/content/anchor/{anchor_id}",
    response_model=ExplorerContext,
    summary="获取病理上下文",
    description=(
        "根据 Anchor ID 返回聚合后的标本、热区、切片、标注、机制和临床数据。"
        "格式非法返回 400；格式合法但不存在返回 200 空上下文。"
    ),
)
async def anchor_context(
    anchor_id: str,
    repo: Annotated[ContentRepository, Depends(_repo)],
) -> ExplorerContext:
    # ---- syntactic check first ----------------------------------------------
    if not is_valid_anchor_id(anchor_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Anchor ID 格式不合法：{anchor_id}",
        )

    svc = ContentService(repo)
    return svc.get_context(anchor_id)
