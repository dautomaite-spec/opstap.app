from pydantic import BaseModel, UUID4, Field
from typing import Optional, Literal
from datetime import datetime

_WritingStyle = Literal["formeel", "informeel", "luchtig", "grappig"]


class MotivationLetterRequest(BaseModel):
    job_id: UUID4
    profile_id: UUID4
    custom_notes: Optional[str] = Field(None, max_length=500)
    writing_style: _WritingStyle = "formeel"


class MotivationLetterOut(BaseModel):
    job_id: UUID4
    letter_nl: str  # Dutch motivation letter
    generated_at: datetime
    regenerations_remaining: int  # how many more times this job's letter can be regenerated today


class ApplicationCreate(BaseModel):
    job_id: UUID4
    profile_id: UUID4
    letter_nl: str = Field(..., min_length=50, max_length=6000)
    send_method: Literal["email", "form"]  # reject arbitrary strings


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
