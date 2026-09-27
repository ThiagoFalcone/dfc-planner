from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import obter_settings
from app.deps import get_current_user
from app.models import Usuario

settings = obter_settings()

app = FastAPI(title="DFC Planner API")

# CORS: frontend (5173) e backend (8000) são origens diferentes; sem isso
# todo fetch do navegador falha antes mesmo de chegar numa rota.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.cors_origin],
    allow_credentials=False,  # autenticação é Bearer token, não cookie
    allow_methods=["*"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/_protegida_teste")
def _protegida_teste(usuario: Usuario = Depends(get_current_user)) -> dict[str, str]:
    return {"usuario_id": usuario.id}
