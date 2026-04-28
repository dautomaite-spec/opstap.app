from pydantic import BaseModel, UUID4, HttpUrl, Field
from typing import Optional
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
    contract_type: Optional[str] = None
    match_score: Optional[int] = None  # 0–100
    scraped_at: datetime

    model_config = {"from_attributes": True}


class JobSearchParams(BaseModel):
    keywords: Optional[str] = Field(None, max_length=200)
    location: Optional[str] = Field(None, max_length=200)
    radius_km: int = 30
    contract_type: Optional[str] = None
    salary_min: Optional[int] = None
    limit: int = Field(20, ge=1, le=100)
