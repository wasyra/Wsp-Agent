from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest
from fastapi import HTTPException

from app.deps import verify_internal_api_key


@pytest.mark.asyncio
async def test_internal_key_accepts_x_api_key_header() -> None:
    with patch("app.deps.get_settings") as p:
        s = MagicMock()
        s.internal_api_key = "secret-key"
        p.return_value = s
        await verify_internal_api_key(x_api_key="secret-key", authorization=None)


@pytest.mark.asyncio
async def test_internal_key_accepts_bearer() -> None:
    with patch("app.deps.get_settings") as p:
        s = MagicMock()
        s.internal_api_key = "secret-key"
        p.return_value = s
        await verify_internal_api_key(x_api_key=None, authorization="Bearer secret-key")


@pytest.mark.asyncio
async def test_internal_key_rejects_wrong_key() -> None:
    with patch("app.deps.get_settings") as p:
        s = MagicMock()
        s.internal_api_key = "secret-key"
        p.return_value = s
        with pytest.raises(HTTPException) as ei:
            await verify_internal_api_key(x_api_key="wrong", authorization=None)
        assert ei.value.status_code == 401


@pytest.mark.asyncio
async def test_internal_key_missing_config_returns_503() -> None:
    with patch("app.deps.get_settings") as p:
        s = MagicMock()
        s.internal_api_key = ""
        p.return_value = s
        with pytest.raises(HTTPException) as ei:
            await verify_internal_api_key(x_api_key="x", authorization=None)
        assert ei.value.status_code == 503
