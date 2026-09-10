"""Shared anchor helpers.

Kept separate from content_service so that both content and AI services
can depend on a single authority for anchor existence checks.
"""

from __future__ import annotations

from app.repositories.content_repository import ContentRepository

ANCHOR_ID_RE = r"^[a-z0-9_]+$"


def is_valid_anchor_id(value: str) -> bool:
    """Return True when *value* looks like an anchor ID.

    This is a syntactic check only; it does NOT verify existence in the
    content repository.
    """
    import re

    return bool(re.fullmatch(ANCHOR_ID_RE, value))


def anchor_exists(anchor_id: str, repo: ContentRepository) -> bool:
    """Return True when *anchor_id* exists in the content bundle."""
    return repo.has_anchor(anchor_id)
