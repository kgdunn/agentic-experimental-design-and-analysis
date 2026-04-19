"""Admin dashboard endpoint for listing rows from the ``admin_events`` table."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import AuthUser, require_admin
from app.db.session import get_db_session
from app.schemas.admin_event import AdminEventDetail, AdminEventListResponse
from app.services import admin_event_service

router = APIRouter()


@router.get("", response_model=AdminEventListResponse)
async def list_events(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    event_type: str | None = Query(None),
    status: str | None = Query(None),
    _admin: AuthUser = Depends(require_admin),
    db: AsyncSession = Depends(get_db_session),
) -> AdminEventListResponse:
    events, total = await admin_event_service.list_events(
        db,
        page=page,
        page_size=page_size,
        event_type=event_type,
        status=status,
    )
    return AdminEventListResponse(
        events=[AdminEventDetail.model_validate(e) for e in events],
        total=total,
        page=page,
        page_size=page_size,
    )
