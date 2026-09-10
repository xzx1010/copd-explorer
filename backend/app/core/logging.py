"""Minimal logging configuration that never records secrets."""

import logging
import sys


def setup_logging() -> None:
    """Configure root logger with safe defaults.

    - Only log level and message; no request body, patient info, or AI key.
    - Writes to stderr so uvicorn's log interop works cleanly.
    """
    handler = logging.StreamHandler(sys.stderr)
    handler.setFormatter(
        logging.Formatter(
            "[%(asctime)s] %(levelname)s %(name)s : %(message)s",
            datefmt="%Y-%m-%dT%H:%M:%S",
        ),
    )

    root = logging.getLogger()
    root.setLevel(logging.INFO)
    # Avoid attaching duplicate handlers in reload scenarios
    if not root.handlers:
        root.addHandler(handler)

    # Keep third-party loggers quiet unless there's a real problem
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)
