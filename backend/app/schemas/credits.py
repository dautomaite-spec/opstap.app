from pydantic import BaseModel, UUID4
from typing import Optional
from datetime import datetime


class BalanceOut(BaseModel):
    balance: int
    referral_code: Optional[str] = None


class TransactionOut(BaseModel):
    id: UUID4
    delta: int
    reason: str
    reference_id: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}
