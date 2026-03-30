from fastapi import FastAPI

from app.routers.dashboard import router as dashboard_router
from app.routers.os import router as os_router

app = FastAPI(title="Fleet Maintenance SaaS API")

app.include_router(os_router)
app.include_router(dashboard_router)


@app.get("/health")
def health():
    return {"status": "ok"}
