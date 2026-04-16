from fastapi import APIRouter, Depends, HTTPException
from uuid import uuid4
from datetime import datetime, timezone

from app.core.supabase import get_supabase
from app.schemas.application import (
    MotivationLetterRequest,
    MotivationLetterOut,
    ApplicationCreate,
    ApplicationOut,
)
from app.services.letter_generator import generate_letter
from app.services.email_sender import send_application_email, ApplicationEmail

router = APIRouter(prefix="/apply", tags=["apply"])


@router.post("/letter", response_model=MotivationLetterOut)
async def generate_motivation_letter(
    body: MotivationLetterRequest,
    user_id: str,  # TODO: JWT dep
    supabase=Depends(get_supabase),
):
    job_result = supabase.table("jobs").select("*").eq("id", str(body.job_id)).single().execute()
    if not job_result.data:
        raise HTTPException(status_code=404, detail="Job not found")
    job = job_result.data

    profile_result = supabase.table("profiles").select("*").eq("id", str(body.profile_id)).single().execute()
    if not profile_result.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    profile = profile_result.data

    # Merge any custom notes from the user into extra_info for the generator
    if body.custom_notes:
        profile = {**profile, "extra_info": f"{profile.get('extra_info', '')}\n{body.custom_notes}".strip()}

    letter = await generate_letter(
        job_title=job["title"],
        company=job["company"],
        job_description=job.get("description_snippet") or "",
        profile=profile,
        writing_style=body.writing_style or "formeel",
    )

    return MotivationLetterOut(
        job_id=body.job_id,
        letter_nl=letter,
        generated_at=datetime.now(timezone.utc),
    )


@router.post("/send", response_model=ApplicationOut, status_code=201)
async def send_application(
    body: ApplicationCreate,
    user_id: str,  # TODO: JWT dep
    supabase=Depends(get_supabase),
):
    # Fetch job for metadata + contact email
    job_result = supabase.table("jobs").select("title,company,url,contact_email").eq("id", str(body.job_id)).single().execute()
    if not job_result.data:
        raise HTTPException(status_code=404, detail="Job not found")
    job = job_result.data

    # Fetch user profile for reply-to details
    profile_result = supabase.table("profiles").select("naam,email").eq("user_id", user_id).single().execute()
    if not profile_result.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    profile = profile_result.data

    now = datetime.now(timezone.utc)
    status = "pending"
    sent_at = None

    if body.send_method == "email":
        contact_email = job.get("contact_email")
        if not contact_email:
            raise HTTPException(
                status_code=422,
                detail="No contact email available for this job. Use send_method='form' instead.",
            )

        success = await send_application_email(ApplicationEmail(
            to_email=contact_email,
            to_name=job["company"],
            reply_to_email=profile.get("email", ""),
            reply_to_name=profile.get("naam", ""),
            job_title=job["title"],
            company=job["company"],
            letter_body=body.letter_nl,
        ))
        status = "sent" if success else "failed"
        sent_at = now.isoformat() if success else None

    row = {
        "id": str(uuid4()),
        "job_id": str(body.job_id),
        "user_id": user_id,
        "company": job["company"],
        "job_title": job["title"],
        "letter_nl": body.letter_nl,
        "send_method": body.send_method,
        "status": status,
        "sent_at": sent_at,
        "created_at": now.isoformat(),
    }
    result = supabase.table("applications").insert(row).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to log application")

    return result.data[0]


@router.get("/history", response_model=list[ApplicationOut])
async def application_history(
    user_id: str,
    supabase=Depends(get_supabase),
):
    result = (
        supabase.table("applications")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return result.data or []
