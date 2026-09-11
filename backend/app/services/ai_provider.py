"""AI provider implementations.

- ``MockAIProvider`` returns a deterministic teaching fixture.
- ``DeepSeekProvider`` adapts the real DeepSeek chat-completions API while
  never exposing the API key in responses, exceptions, logs, or OpenAPI.

Both share a common async interface so ``AIService`` can swap them without
the router needing to know which provider is active.
"""

from __future__ import annotations

import json
import logging
from typing import Protocol

import httpx
from pydantic import ValidationError

from app.schemas.ai import AIAnalyzeRequest, AIAssessment, AIEvidence, AIResult

logger = logging.getLogger(__name__)

DEEPSEEK_URL = "https://api.deepseek.com/chat/completions"
DEEPSEEK_MODEL = "deepseek-chat"


# ---------------------------------------------------------------------------
# Provider errors – carry a stable error code up to the router
# ---------------------------------------------------------------------------

class AIProviderError(Exception):
    """Base class for AI provider failures."""

    code = "AI_SERVICE_ERROR"
    default_message = "AI 服务暂不可用，请稍后重试。"

    def __init__(self, message: str | None = None) -> None:
        self.message = message or self.default_message
        super().__init__(self.message)


class AIProviderTimeoutError(AIProviderError):
    code = "AI_TIMEOUT"
    default_message = "AI 请求超时，请稍后重试。"


class AIProviderResponseError(AIProviderError):
    code = "AI_SERVICE_ERROR"
    default_message = "AI 服务返回内容无法解析，请稍后重试。"


# ---------------------------------------------------------------------------
# Protocol shared by all providers
# ---------------------------------------------------------------------------

class AIProvider(Protocol):
    async def analyze(self, request: AIAnalyzeRequest) -> AIResult: ...


# ---------------------------------------------------------------------------
# Mock provider – deterministic teaching result referencing real anchors
# ---------------------------------------------------------------------------

MOCK_RESULT = AIResult(
    assessment=AIAssessment(
        disease="慢性阻塞性肺疾病（COPD）",
        likelihood="high",
        confidence=0.88,
        basis=[
            "长期吸烟史与慢性咳嗽、咳痰表现高度吻合",
            "肺功能检查提示不可逆性气流受限",
            "病理切片可见气道狭窄、黏液腺体增生及肺泡壁破坏",
        ],
    ),
    evidence=[
        AIEvidence(
            text="宏观标本热区可见支气管管壁增厚、管腔狭窄",
            anchorId="anchor_annotation_1",
        ),
        AIEvidence(
            text="镜下可见杯状细胞增生、黏液栓形成",
            anchorId="anchor_annotation_2",
        ),
        AIEvidence(
            text="肺泡隔膜断裂、肺泡腔扩大融合呈肺气肿改变",
            anchorId="anchor_annotation_3",
        ),
    ],
    differential=[
        "支气管哮喘（可逆性气流受限，缓解期肺功能可恢复正常）",
        "支气管扩张症（大量脓痰，HRCT 可见支气管扩张）",
        "慢性心力衰竭（BNP 升高，心脏超声可鉴别）",
    ],
    recommendation=[
        "长期家庭氧疗（静息 SpO₂ ≤ 88% 时）",
        "吸入长效支气管扩张剂联合 ICS 治疗",
        "肺康复训练（包括呼吸肌训练和耐力训练）",
        "定期接种流感疫苗和肺炎球菌疫苗",
    ],
    disclaimer=(
        "本分析仅为教学用途，不构成临床诊断建议。"
        "任何实际诊疗决策均需由具备执业资质的医师在全面评估后作出。"
    ),
)


class MockAIProvider:
    """Deterministic mock that ignores the request body.

    Deliberately does NOT log the request so patient information is never
    persisted to application logs.
    """

    async def analyze(self, _request: AIAnalyzeRequest) -> AIResult:
        return MOCK_RESULT


# ---------------------------------------------------------------------------
# DeepSeek provider – real API adapter (safe boundary)
# ---------------------------------------------------------------------------

class DeepSeekProvider:
    def __init__(
        self,
        api_key: str,
        timeout_seconds: int = 30,
        allowed_anchor_ids: list[str] | None = None,
    ) -> None:
        self._api_key = api_key
        self._timeout = timeout_seconds
        self._allowed_anchor_ids = allowed_anchor_ids or []

    async def analyze(self, request: AIAnalyzeRequest) -> AIResult:
        if not self._api_key:
            raise AIProviderResponseError(
                "AI 服务密钥未配置，请在后端环境变量中设置 DEEPSEEK_API_KEY。"
            )

        payload = self._build_payload(request)
        headers = {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json",
        }

        try:
            async with httpx.AsyncClient(timeout=self._timeout) as client:
                response = await client.post(
                    DEEPSEEK_URL,
                    headers=headers,
                    json=payload,
                )
        except httpx.TimeoutException as exc:
            # Do not include the key or request body in the log
            raise AIProviderTimeoutError() from exc
        except httpx.HTTPError as exc:
            raise AIProviderResponseError(
                "AI 服务网络异常，请稍后重试。"
            ) from exc

        if response.status_code != 200:
            # Log only the status code, never the response body (may contain
            # provider-side echo of our request).
            logger.warning("DeepSeek 返回非 200：%s", response.status_code)
            raise AIProviderResponseError(
                "AI 服务返回错误，请稍后重试。"
            )

        return self._parse_response(response)

    def _build_payload(self, request: AIAnalyzeRequest) -> dict:
        """Build the DeepSeek chat-completions request.

        Instructs the model to return a JSON object matching our AIResult
        schema.  The schema itself is described in Chinese so the model emits
        stable fields; no real patient identity is ever sent by the frontend.
        """
        allowed_anchors = ", ".join(self._allowed_anchor_ids)
        system_prompt = (
            "你是 COPD 病理教学助手。请根据用户提供的病史、症状、检查结果和病理"
            "上下文，输出一个 JSON 对象，字段必须与以下结构完全一致："
            '{"assessment":{"disease":"...","likelihood":"low|medium|high|unknown",'
            '"confidence":0.0-1.0,"basis":["..."]},'
            '"evidence":[{"text":"...","anchorId":"anchor_annotation_1"}],'
            '"differential":["..."],"recommendation":["..."],'
            '"disclaimer":"..."}。'
            "likelihood 只能是 low/medium/high/unknown；confidence 是 0 到 1 的教学提示；"
            "evidence 至少一项且 anchorId 必须从以下白名单中选择，不能改写、创造或猜测 Anchor ID："
            f"[{allowed_anchors}]。"
            "disclaimer 必须包含教学免责声明，不得表述为真实临床诊断。只返回 JSON，不要任何额外文字。"
        )
        user_prompt = json.dumps(
            request.model_dump(), ensure_ascii=False
        )

        return {
            "model": DEEPSEEK_MODEL,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": 0,
            "response_format": {"type": "json_object"},
        }

    def _parse_response(self, response: httpx.Response) -> AIResult:
        try:
            data = response.json()
            content = data["choices"][0]["message"]["content"]
            parsed = json.loads(content)
        except (KeyError, IndexError, TypeError, json.JSONDecodeError) as exc:
            raise AIProviderResponseError(
                "AI 服务返回内容无法解析，请稍后重试。"
            ) from exc

        try:
            return AIResult.model_validate(parsed)
        except ValidationError as exc:
            # Do NOT include the raw validation error (may leak model output)
            raise AIProviderResponseError(
                "AI 服务返回结构不合法，请稍后重试。"
            ) from exc
