import time
from collections import defaultdict, deque

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.api.v1.router import v1_router

app = FastAPI(
    title="Opstap API",
    description="Backend for the Opstap Dutch job application app",
    version="1.0.0",
    docs_url="/docs" if not settings.is_production else None,
    redoc_url=None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_origin_regex=settings.cors_origin_regex,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

# Global IP rate limiter — 200 requests / 60 s per IP (single-instance in-process store)
_RATE_LIMIT = 200
_RATE_WINDOW = 60.0
_ip_windows: dict[str, deque] = defaultdict(deque)


@app.middleware("http")
async def global_rate_limit(request: Request, call_next):
    if request.method == "OPTIONS":
        return await call_next(request)
    ip = request.client.host if request.client else "unknown"
    now = time.monotonic()
    window = _ip_windows[ip]
    # Evict timestamps outside the current window
    while window and window[0] < now - _RATE_WINDOW:
        window.popleft()
    # Prune stale IPs to bound memory — safe because defaultdict recreates on next access
    if not window:
        del _ip_windows[ip]
        window = _ip_windows[ip]
    if len(window) >= _RATE_LIMIT:
        return JSONResponse({"detail": "Te veel verzoeken. Probeer het over een minuut opnieuw."}, status_code=429)
    window.append(now)
    return await call_next(request)

app.include_router(v1_router)


@app.get("/health")
async def health():
    return {"status": "ok"}
