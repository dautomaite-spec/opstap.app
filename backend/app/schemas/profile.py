from pydantic import BaseModel, UUID4, Field
from typing import Optional
from datetime import datetime


class ProfileCreate(BaseModel):
    naam: str = Field(..., max_length=120)
    woonplaats: Optional[str] = Field(None, max_length=120)
    functietitel: Optional[str] = Field(None, max_length=120)
    functietitel_2: Optional[str] = Field(None, max_length=120)
    functietitel_3: Optional[str] = Field(None, max_length=120)
    open_voor_alles: bool = False
    beschikbaarheid: Optional[str] = Field(None, max_length=50)
    uren_per_week: Optional[int] = Field(None, ge=1, le=80)
    salaris_min: Optional[int] = Field(None, ge=0, le=50_000)
    salaris_max: Optional[int] = Field(None, ge=0, le=50_000)
    werklocatie: Optional[str] = Field(None, max_length=50)
    extra_info: Optional[str] = Field(None, max_length=500)
    job_preferences: Optional[str] = Field(None, max_length=300)
    opleidingsniveau: Optional[str] = Field(None, max_length=50)
    leeftijd: Optional[int] = Field(None, ge=14, le=99)
    brief_taal: str = Field('nl', pattern='^(nl|en)$')
    email_digest_enabled: bool = True
    email_reminders_enabled: bool = True
    cv_expiry_reminder_enabled: bool = True


class ProfileUpdate(ProfileCreate):
    pass


class ProfileOut(ProfileCreate):
    id: UUID4
    user_id: UUID4
    cv_url: Optional[str] = None
    cv_parsed: bool = False
    cv_expires_at: Optional[datetime] = None
    avg_consent_given_at: Optional[datetime] = None
    last_active_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    credits_balance: int = 0
    referral_code: Optional[str] = None
    profile_bonus_given: bool = False

    model_config = {"from_attributes": True}
