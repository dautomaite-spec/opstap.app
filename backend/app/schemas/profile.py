from pydantic import BaseModel, UUID4
from typing import Optional
from datetime import datetime


class ProfileCreate(BaseModel):
    naam: str
    woonplaats: Optional[str] = None
    functietitel: Optional[str] = None
    open_voor_alles: bool = False
    beschikbaarheid: Optional[str] = None  # fulltime / parttime / both
    uren_per_week: Optional[int] = None
    salaris_min: Optional[int] = None
    salaris_max: Optional[int] = None
    werklocatie: Optional[str] = None  # on-site / hybrid / remote
    extra_info: Optional[str] = None


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
