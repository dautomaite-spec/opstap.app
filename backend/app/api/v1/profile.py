from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from typing import Annotated
from datetime import datetime, timedelta, timezone
from uuid import uuid4
import re

from app.core.supabase import get_supabase
from app.core.auth import get_current_user_id
from app.schemas.profile import ProfileCreate, ProfileUpdate, ProfileOut

router = APIRouter(prefix="/profile", tags=["profile"])

CV_BUCKET = "cvs"
CV_SIGNED_URL_EXPIRY = 3600  # 1 hour


def _attach_cv_url(profile: dict, supabase) -> dict:
    """Replace cv_path with a signed cv_url if a CV is stored."""
    path = profile.pop("cv_path", None)
    user_id = str(profile.get("user_id", ""))
    # Guard: only generate signed URL for paths owned by this user
    if path and path.startswith(f"{user_id}/"):
        try:
            res = supabase.storage.from_(CV_BUCKET).create_signed_url(path, CV_SIGNED_URL_EXPIRY)
            profile["cv_url"] = res.get("signedURL") or res.get("signed_url")
        except Exception:
            profile["cv_url"] = None
    else:
        profile["cv_url"] = None
    return profile


@router.post("/", response_model=ProfileOut, status_code=201)
async def create_profile(
    body: ProfileCreate,
    user_id: str = Depends(get_current_user_id),
    supabase=Depends(get_supabase),
):
    data = body.model_dump()
    data["user_id"] = user_id
    result = supabase.table("profiles").insert(data).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Profile creation failed")
    return _attach_cv_url(result.data[0], supabase)


@router.get("/me", response_model=ProfileOut)
async def get_profile(
    user_id: str = Depends(get_current_user_id),
    supabase=Depends(get_supabase),
):
    result = supabase.table("profiles").select("*").eq("user_id", user_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    return _attach_cv_url(result.data, supabase)


@router.patch("/me", response_model=ProfileOut)
async def update_profile(
    body: ProfileUpdate,
    user_id: str = Depends(get_current_user_id),
    supabase=Depends(get_supabase),
):
    data = body.model_dump(exclude_unset=True)
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = (
        supabase.table("profiles").update(data).eq("user_id", user_id).execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    return _attach_cv_url(result.data[0], supabase)


@router.delete("/me", status_code=200)
async def delete_account(
    user_id: str = Depends(get_current_user_id),
    supabase=Depends(get_supabase),
):
    # Delete CV from storage if present
    profile_result = supabase.table("profiles").select("cv_path").eq("user_id", user_id).maybe_single().execute()
    if profile_result.data and profile_result.data.get("cv_path"):
        try:
            supabase.storage.from_(CV_BUCKET).remove([profile_result.data["cv_path"]])
        except Exception:
            pass

    # Delete auth user first — if this fails, DB rows are still intact (safe to retry)
    supabase.auth.admin.delete_user(user_id)

    # Then delete application and profile rows
    supabase.table("applications").delete().eq("user_id", user_id).execute()
    supabase.table("profiles").delete().eq("user_id", user_id).execute()

    return {"message": "Account deleted"}


@router.post("/cv", status_code=200)
async def upload_cv(
    retention_days: Annotated[int, Form(ge=7, le=90)] = 30,
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user_id),
    supabase=Depends(get_supabase),
):
    allowed_mime = {
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    }
    allowed_magic = (b"%PDF", b"PK\x03\x04")

    if file.content_type not in allowed_mime:
        raise HTTPException(status_code=400, detail="Only PDF and DOCX files are accepted")

    content = await file.read()

    if not any(content.startswith(magic) for magic in allowed_magic):
        raise HTTPException(status_code=400, detail="File content does not match the declared type")

    max_bytes = 10 * 1024 * 1024
    if len(content) > max_bytes:
        raise HTTPException(status_code=400, detail="File too large (max 10 MB)")

    # Use a UUID-based filename to prevent path traversal and filename-based attacks
    ext = "pdf" if file.content_type == "application/pdf" else "docx"
    path = f"{user_id}/{uuid4()}.{ext}"
    supabase.storage.from_(CV_BUCKET).upload(path, content, {"content-type": file.content_type, "upsert": "true"})

    expires_at = (datetime.now(timezone.utc) + timedelta(days=retention_days)).isoformat()
    supabase.table("profiles").update({
        "cv_path": path,
        "cv_expires_at": expires_at,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }).eq("user_id", user_id).execute()

    return {"message": "CV uploaded", "expires_at": expires_at}


@router.delete("/cv", status_code=200)
async def delete_cv(
    user_id: str = Depends(get_current_user_id),
    supabase=Depends(get_supabase),
):
    result = supabase.table("profiles").select("cv_path").eq("user_id", user_id).single().execute()
    if not result.data or not result.data.get("cv_path"):
        raise HTTPException(status_code=404, detail="No CV on record")

    supabase.storage.from_(CV_BUCKET).remove([result.data["cv_path"]])
    supabase.table("profiles").update({
        "cv_path": None,
        "cv_expires_at": None,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }).eq("user_id", user_id).execute()

    return {"message": "CV deleted"}
