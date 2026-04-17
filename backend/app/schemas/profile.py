from pydantic import BaseModel, UUID4, Field
from typing import Optional
from datetime import datetime


class ProfileCreate(BaseModel):
    naam: str = Field(..., max_length=120)
    woonplaats: Optional[str] = Field(None, max_length=120)
    functietitel: Optional[str] = Field(None, max_length=120)
    open_voor_alles: bool = False
    beschikbaarheid: Optional[str] = Field(None, max_length=50)
    uren_per_week: Optional[int] = Field(None, ge=1, le=80)
    salaris_min: Optional[int] = Field(None, ge=0, le=50_000)
    salaris_max: Optional[int] = Field(None, ge=0, le=50_000)
    werklocatie: Optional[str] = Field(None, max_length=50)
    extra_info: Optional[str] = Field(None, max_length=2000)


class ProfileUpdate(ProfileCreate):
    pass


class ProfileOut(ProfileCreate):
    id: UUID4
    user_id: UUID4
    cv_url: Optional[str] = None
    cv_expires_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
