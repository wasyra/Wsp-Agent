from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.services.orchestrator import process_inbound_whatsapp
from app.services.twilio_auth import validate_twilio_request_async

router = APIRouter(prefix="/webhooks")


@router.post("/twilio/whatsapp")
async def twilio_whatsapp(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> Response:
    form = await request.form()
    form_dict: dict[str, str] = {}
    for key, value in form.multi_items():
        form_dict[str(key)] = str(value)

    if not await validate_twilio_request_async(request, form_dict, db):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid Twilio signature")

    try:
        xml = await process_inbound_whatsapp(db, form_dict)
        await db.commit()
    except Exception:
        await db.rollback()
        raise
    return Response(content=xml, media_type="application/xml")
