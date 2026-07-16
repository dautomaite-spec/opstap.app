from fastapi import APIRouter
from .profile import router as profile_router
from .apply import router as apply_router
from .abuse import router as abuse_router
from .credits import router as credits_router
from .admin import router as admin_router
from .invite import router as invite_router

v1_router = APIRouter(prefix="/api/v1")
v1_router.include_router(profile_router)
v1_router.include_router(apply_router)
v1_router.include_router(abuse_router)
v1_router.include_router(credits_router)
v1_router.include_router(admin_router)
v1_router.include_router(invite_router)
