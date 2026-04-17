from pydantic import BaseModel, UUID4, HttpUrl
from typing import Optional
from datetime import datetime


class JobOut(BaseModel):
    id: UUID4
    title: str
    company: str
    location: str
    source: str  # indeed_nl / jobbird / nationale_vacaturebank / linkedin_nl
    url: str
    description_snippet: Optional[str] = None
    salary_range: Optional[str] = None
    contract_type: Optional[str] = None
    match_score: Optional[int] = None  # 0–100
    scraped_at: datetime

    model_config = {"from_attributes": True}


class JobSearchParams(BaseModel):
    keywords: Optional[str] = None
    location: Optional[str] = None
    radius_km: int = 30
    contract_type: Optional[str] = None  # fulltime / parttime / flex
    salary_min: Optional[int] = None
    limit: int = 20
