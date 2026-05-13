from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.metrics import twilio_webhook_errors, twilio_webhook_total
from app.rate_limit import limiter
from app.services.orchestrator import process_inbound_whatsapp
from app.services.twilio_auth import validate_twilio_request_async

router = APIRouter(prefix="/webhooks")


@router.post("/twilio/whatsapp")
@limiter.limit("120/minute")
async def twilio_whatsapp(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> Response:
    form = await request.form()
    form_dict: dict[str, str] = {}
    for key, value in form.multi_items():
        form_dict[str(key)] = str(value)

    if not await validate_twilio_request_async(request, form_dict, db):
        twilio_webhook_total.labels("forbidden").inc()
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Invalid Twilio signature"
        )

    try:
        xml = await process_inbound_whatsapp(db, form_dict)
        await db.commit()
        twilio_webhook_total.labels("success").inc()
    except Exception:
        await db.rollback()
        twilio_webhook_errors.inc()
        twilio_webhook_total.labels("error").inc()
        raise
    return Response(content=xml, media_type="application/xml")
