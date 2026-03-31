from pathlib import Path

from fastapi import Depends, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from app.deps import get_current_user
from app.models import Usuario
from app.routers.dashboard import router as dashboard_router
from app.routers.equipamentos import router as equipamentos_router
from app.routers.os import router as os_router
from app.routers.veiculos import router as veiculos_router
from app.schemas import UserOut

app = FastAPI(title="Fleet Maintenance SaaS API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(os_router)
app.include_router(dashboard_router)
app.include_router(veiculos_router)
app.include_router(equipamentos_router)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/me", response_model=UserOut)
def me(user: Usuario = Depends(get_current_user)):
    return user


_frontend_dist = Path(__file__).resolve().parent.parent / "frontend" / "dist"
if _frontend_dist.is_dir():
    app.mount("/", StaticFiles(directory=str(_frontend_dist), html=True), name="spa")


@app.exception_handler(404)
async def spa_fallback_404(request: Request, _exc):
    if not _frontend_dist.is_dir():
        return JSONResponse(status_code=404, content={"detail": "Not Found"})

    api_prefixes = (
        "/health",
        "/me",
        "/dashboard",
        "/os",
        "/veiculos",
        "/equipamentos",
        "/docs",
        "/redoc",
        "/openapi.json",
    )
    if request.url.path.startswith(api_prefixes):
        return JSONResponse(status_code=404, content={"detail": "Not Found"})

    return FileResponse(_frontend_dist / "index.html")
