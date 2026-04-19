"""HTTP-level tests for ``GET /api/v1/admin/events``.

Mocks the service layer (same pattern as ``test_experiments_shares_api``
and the rest of the admin-adjacent endpoint tests) so the test focuses
on routing, auth gating, response shape, and query-param wiring.
"""

from __future__ import annotations

import datetime as dt
import uuid
from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient

from app.api.deps import TESTING_USER_ID, AuthUser, require_auth
from app.main import app


def _fake_row(**overrides: object) -> object:
    """Build an object that ``AdminEventDetail.model_validate`` accepts."""

    class Row:
        pass

    row = Row()
    row.id = overrides.get("id", uuid.uuid4())
    row.event_type = overrides.get("event_type", "postgres_backup")
    row.status = overrides.get("status", "success")
    row.source = overrides.get("source", "cron@vps01")
    row.actor = overrides.get("actor")
    row.message = overrides.get("message")
    row.error_message = overrides.get("error_message")
    row.payload = overrides.get("payload", {"s3_key": "postgres/daily/2026/04/19/doe.dump"})
    row.started_at = overrides.get("started_at", dt.datetime(2026, 4, 19, 3, 7, tzinfo=dt.UTC))
    row.completed_at = overrides.get("completed_at", dt.datetime(2026, 4, 19, 3, 8, tzinfo=dt.UTC))
    row.duration_ms = overrides.get("duration_ms", 47_000)
    row.created_at = overrides.get("created_at", dt.datetime(2026, 4, 19, 3, 7, tzinfo=dt.UTC))
    row.updated_at = overrides.get("updated_at", dt.datetime(2026, 4, 19, 3, 8, tzinfo=dt.UTC))
    return row


@pytest.mark.asyncio
async def test_list_events_returns_rows_and_total(client: AsyncClient) -> None:
    rows = [_fake_row(event_type="postgres_backup"), _fake_row(event_type="restore_drill")]
    with patch("app.api.v1.endpoints.admin_events.admin_event_service") as svc:
        svc.list_events = AsyncMock(return_value=(rows, 12))
        resp = await client.get("/api/v1/admin/events")

    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] == 12
    assert body["page"] == 1
    assert body["page_size"] == 50
    assert len(body["events"]) == 2
    assert {e["event_type"] for e in body["events"]} == {"postgres_backup", "restore_drill"}


@pytest.mark.asyncio
async def test_list_events_forwards_query_params(client: AsyncClient) -> None:
    with patch("app.api.v1.endpoints.admin_events.admin_event_service") as svc:
        svc.list_events = AsyncMock(return_value=([_fake_row()], 1))
        resp = await client.get(
            "/api/v1/admin/events",
            params={"page": 2, "page_size": 10, "event_type": "postgres_backup", "status": "failed"},
        )

    assert resp.status_code == 200
    kwargs = svc.list_events.call_args.kwargs
    assert kwargs["page"] == 2
    assert kwargs["page_size"] == 10
    assert kwargs["event_type"] == "postgres_backup"
    assert kwargs["status"] == "failed"


@pytest.mark.asyncio
async def test_list_events_rejects_non_admin(client: AsyncClient) -> None:
    async def _non_admin() -> AuthUser:
        return AuthUser(
            id=TESTING_USER_ID,
            email="user@example.com",
            display_name="Regular User",
            is_admin=False,
        )

    original = app.dependency_overrides.get(require_auth)
    app.dependency_overrides[require_auth] = _non_admin
    try:
        resp = await client.get("/api/v1/admin/events")
    finally:
        if original is not None:
            app.dependency_overrides[require_auth] = original
        else:
            app.dependency_overrides.pop(require_auth, None)

    assert resp.status_code == 403
