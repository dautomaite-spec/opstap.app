from pydantic import BaseModel, UUID4
from typing import Optional
from datetime import datetime


class MotivationLetterRequest(BaseModel):
    job_id: UUID4
    profile_id: UUID4
    custom_notes: Optional[str] = None  # extra context from user


class MotivationLetterOut(BaseModel):
    job_id: UUID4
    letter_nl: str  # Dutch motivation letter
    generated_at: datetime


class ApplicationCreate(BaseModel):
    job_id: UUID4
    profile_id: UUID4
    letter_nl: str
    send_method: str  # email / form


class ApplicationOut(BaseModel):
    id: UUID4
    job_id: UUID4
    user_id: UUID4
    company: str
    job_title: str
    letter_nl: str
    send_method: str
    status: str  # sent / failed / pending
    sent_at: Optional[datetime] = None
    created_at: datetime

    model_config = {"from_attributes": True}
