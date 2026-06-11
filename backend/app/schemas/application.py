import re
from pydantic import BaseModel, UUID4, Field, field_validator
from typing import Optional, Literal
from datetime import datetime

_HTML_TAG_RE = re.compile(r'<[^>]+>')

_WritingStyle = Literal["formeel", "informeel", "luchtig", "grappig", "enthousiast"]


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
    send_method: Literal["email", "form", "site"]  # reject arbitrary strings
    contact_email_override: Optional[str] = Field(None, max_length=254)

    @field_validator('letter_nl')
    @classmethod
    def strip_html(cls, v: str) -> str:
        return _HTML_TAG_RE.sub('', v)

    @field_validator('contact_email_override')
    @classmethod
    def validate_email(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and not re.match(r'^[^@\s]+@[^@\s]+\.[^@\s]+$', v):
            raise ValueError('Ongeldig e-mailadres')
        return v


class ApplicationOut(BaseModel):
    id: UUID4
    job_id: UUID4
    user_id: UUID4
    company: str
    job_title: str
    letter_nl: str
    send_method: str
    status: str  # sent / failed / pending / replied
    sent_at: Optional[datetime] = None
    replied_at: Optional[datetime] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ApplicationStatusUpdate(BaseModel):
    status: Literal["replied", "pending", "rejected", "accepted"]
