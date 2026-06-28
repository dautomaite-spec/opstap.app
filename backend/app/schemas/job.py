from pydantic import BaseModel, UUID4, HttpUrl, Field
from typing import Literal, Optional
from datetime import datetime


class JobOut(BaseModel):
    id: UUID4
    title: str
    company: str
    location: str
    source: str
    url: str
    description_snippet: Optional[str] = None
    salary_range: Optional[str] = None
    salary_hourly: Optional[str] = None
    salary_min_raw: Optional[int] = None
    salary_max_raw: Optional[int] = None
    contract_type: Optional[str] = None
    match_score: Optional[int] = None  # 0–100
    posted_at: Optional[datetime] = None
    scraped_at: datetime
    match_reason: Optional[str] = None  # LLM-generated, not stored in DB

    model_config = {"from_attributes": True}


class JobSearchParams(BaseModel):
    keywords: Optional[str] = Field(None, max_length=200)
    location: Optional[str] = Field(None, max_length=200)
    radius_km: int = 30
    contract_type: Optional[Literal["Vast", "Tijdelijk", "Fulltime", "Parttime"]] = None
    salary_min: Optional[int] = None
    limit: int = Field(20, ge=1, le=100)
