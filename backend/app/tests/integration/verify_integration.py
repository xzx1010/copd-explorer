"""T23 联调验证脚本 —— 对真实运行的 FastAPI 服务做端到端契约检查。

用法（先启动后端）：
    python -m uvicorn app.main:app --host 127.0.0.1 --port 8000

再另开终端：
    python app/tests/integration/verify_integration.py

通过标准库 urllib 请求真实 HTTP 服务，覆盖：
  - health / home / 三个 annotation Anchor / 未知合法 Anchor / 非法 Anchor
  - AI mock 成功 / 未知字段校验错误
  - 响应脱敏（不得出现 token、堆栈、真实身份或内部配置）
"""

from __future__ import annotations

import json
import sys
import urllib.error
import urllib.request

BASE = "http://127.0.0.1:8000"

AI_REQUEST = {
    "patientInfo": {
        "age": 65,
        "sex": "男性",
        "smokingHistory": "40 年，每日一包",
    },
    "symptoms": ["慢性咳嗽", "咳痰", "活动后气促"],
    "tests": {
        "lungFunction": "FEV₁/FVC 0.62",
        "ctDescription": "双肺透亮度增高，可见肺大疱",
    },
    "pathologyContext": [],
}

results: list[tuple[bool, str]] = []


def check(name: str, ok: bool, detail: str = "") -> None:
    results.append((ok, name if ok else f"{name}  ->  {detail}"))


def get(path: str) -> tuple[int, dict]:
    with urllib.request.urlopen(BASE + path) as resp:
        return resp.status, json.loads(resp.read().decode("utf-8"))


def post(path: str, body: dict) -> tuple[int, dict]:
    data = json.dumps(body).encode("utf-8")
    req = urllib.request.Request(
        BASE + path, data=data, headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as resp:
        return resp.status, json.loads(resp.read().decode("utf-8"))


def post_error(path: str, body: dict) -> tuple[int, dict]:
    data = json.dumps(body).encode("utf-8")
    req = urllib.request.Request(
        BASE + path, data=data, headers={"Content-Type": "application/json"}
    )
    try:
        urllib.request.urlopen(req)
    except urllib.error.HTTPError as exc:
        return exc.code, json.loads(exc.read().decode("utf-8"))
    return 200, {}


def get_error(path: str) -> tuple[int, dict]:
    try:
        urllib.request.urlopen(BASE + path)
    except urllib.error.HTTPError as exc:
        return exc.code, json.loads(exc.read().decode("utf-8"))
    return 200, {}


def assert_no_sensitive(text: str) -> bool:
    lowered = text.lower()
    for forbidden in ("deepseek_api_key", "sk-", "traceback", "file \"", "token"):
        if forbidden in lowered:
            return False
    return True


# ---------------------------------------------------------------------------
# health
# ---------------------------------------------------------------------------

status, data = get("/api/health")
check("GET /api/health -> 200", status == 200, f"status={status}")
check(
    "health 字段为 status/service/version",
    data == {"status": "ok", "service": "copd-backend", "version": "1.0.0"},
    json.dumps(data, ensure_ascii=False),
)

# ---------------------------------------------------------------------------
# home
# ---------------------------------------------------------------------------

status, data = get("/api/content/home")
check("GET /api/content/home -> 200", status == 200, f"status={status}")
check(
    "home 可被前端 homePageContentSchema 解析（title/subtitle/learningPath）",
    all(k in data for k in ("title", "subtitle", "learningPath")),
    json.dumps(data, ensure_ascii=False)[:200],
)
check(
    "learningPath 首项为 anchor_specimen",
    data.get("learningPath", [{}])[0].get("id") == "anchor_specimen",
    json.dumps(data, ensure_ascii=False)[:200],
)

# ---------------------------------------------------------------------------
# three annotation anchors
# ---------------------------------------------------------------------------

for anchor_id in ("anchor_annotation_1", "anchor_annotation_2", "anchor_annotation_3"):
    status, data = get(f"/api/content/anchor/{anchor_id}")
    check(
        f"GET {anchor_id} -> 200 且 annotation 非空",
        status == 200 and data.get("annotation") is not None,
        f"status={status}",
    )

status, data = get("/api/content/anchor/anchor_annotation_1")
check(
    "anchor_annotation_1 解析出 mechanism/clinical",
    data.get("mechanism") is not None and data.get("clinical") is not None,
    json.dumps(data, ensure_ascii=False)[:200],
)

# ---------------------------------------------------------------------------
# unknown valid anchor / invalid anchor
# ---------------------------------------------------------------------------

status, data = get("/api/content/anchor/anchor_nope_99")
check(
    "未知合法 Anchor -> 200 空上下文（对象 null，数组 []）",
    status == 200
    and data.get("specimen") is None
    and data.get("hotspots") == []
    and data.get("slide") is None,
    f"status={status} {json.dumps(data, ensure_ascii=False)[:200]}",
)

status, data = get_error("/api/content/anchor/Anchor-1")
check(
    "非法 Anchor -> 400 INVALID_REQUEST",
    status == 400 and data.get("error", {}).get("code") == "INVALID_REQUEST",
    f"status={status} {json.dumps(data, ensure_ascii=False)[:200]}",
)

# ---------------------------------------------------------------------------
# AI mock
# ---------------------------------------------------------------------------

status, data = post("/api/ai/analyze", AI_REQUEST)
check("POST /api/ai/analyze -> 200", status == 200, f"status={status}")
check(
    "AI 响应可被 aiResultSchema 解析（assessment/evidence/disclaimer）",
    all(k in data for k in ("assessment", "evidence", "differential", "recommendation", "disclaimer")),
    json.dumps(data, ensure_ascii=False)[:200],
)
check(
    "likelihood 合法且 confidence 在 0..1",
    data.get("assessment", {}).get("likelihood") in {"low", "medium", "high", "unknown"}
    and 0 <= data.get("assessment", {}).get("confidence", -1) <= 1,
    json.dumps(data, ensure_ascii=False)[:200],
)
check(
    "字段名为 recommendation（非 recommendations）",
    "recommendation" in data and "recommendations" not in data,
)
check(
    "evidence anchorId 全部真实存在",
    all(
        ev["anchorId"] in {"anchor_annotation_1", "anchor_annotation_2", "anchor_annotation_3"}
        for ev in data.get("evidence", [])
    ),
    json.dumps(data.get("evidence", []), ensure_ascii=False)[:200],
)

# ---------------------------------------------------------------------------
# validation error
# ---------------------------------------------------------------------------

bad = dict(AI_REQUEST)
bad["extraField"] = "x"
status, data = post_error("/api/ai/analyze", bad)
check(
    "AI 未知字段 -> 422 VALIDATION_ERROR 中文",
    status == 422 and data.get("error", {}).get("code") == "VALIDATION_ERROR",
    f"status={status} {json.dumps(data, ensure_ascii=False)[:200]}",
)

# ---------------------------------------------------------------------------
# sanitization
# ---------------------------------------------------------------------------

status, data = post_error("/api/ai/analyze", bad)
check(
    "错误响应不含 token/堆栈/Key/内部配置",
    assert_no_sensitive(json.dumps(data, ensure_ascii=False)),
    json.dumps(data, ensure_ascii=False)[:300],
)

# ---------------------------------------------------------------------------
# summary
# ---------------------------------------------------------------------------

passed = sum(1 for ok, _ in results if ok)
total = len(results)

print("\n" + "=" * 60)
for ok, name in results:
    print(f"{'PASS' if ok else 'FAIL'}  {name}")
print("=" * 60)
print(f"结果：{passed}/{total} 通过")

sys.exit(0 if passed == total else 1)
