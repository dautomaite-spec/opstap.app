from fastapi import APIRouter
from .profile import router as profile_router
from .jobs import router as jobs_router
from .apply import router as apply_router

v1_router = APIRouter(prefix="/api/v1")
v1_router.include_router(profile_router)
v1_router.include_router(jobs_router)
v1_router.include_router(apply_router)
