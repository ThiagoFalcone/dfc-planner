from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import obter_settings
from app.routers import auditoria, auth, projetos

settings = obter_settings()

app = FastAPI(title="DFC Planner API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.cors_origin],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(auth.router)
app.include_router(projetos.router)
app.include_router(auditoria.router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
