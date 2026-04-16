from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from typing import Annotated
from datetime import datetime, timedelta, timezone

from app.core.supabase import get_supabase
from app.core.auth import get_current_user_id
from app.schemas.profile import ProfileCreate, ProfileUpdate, ProfileOut

router = APIRouter(prefix="/profile", tags=["profile"])

CV_BUCKET = "cvs"


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
    return result.data[0]


@router.get("/me", response_model=ProfileOut)
async def get_profile(
    user_id: str = Depends(get_current_user_id),
    supabase=Depends(get_supabase),
):
    result = supabase.table("profiles").select("*").eq("user_id", user_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    return result.data


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
    return result.data[0]


@router.post("/cv", status_code=200)
async def upload_cv(
    retention_days: Annotated[int, Form(ge=7, le=90)] = 30,
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user_id),
    supabase=Depends(get_supabase),
):
    allowed = {"application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"}
    if file.content_type not in allowed:
        raise HTTPException(status_code=400, detail="Only PDF and DOCX files are accepted")

    content = await file.read()
    max_bytes = 10 * 1024 * 1024
    if len(content) > max_bytes:
        raise HTTPException(status_code=400, detail="File too large (max 10 MB)")

    path = f"{user_id}/{file.filename}"
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
