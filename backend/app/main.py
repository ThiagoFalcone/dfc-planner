from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError

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


@app.exception_handler(IntegrityError)
async def conflito_de_integridade(_request: Request, _erro: IntegrityError) -> JSONResponse:
    # Rede de segurança: qualquer violação de chave/unicidade que escape das
    # checagens explícitas dos routers (id repetido, corrida entre requisições)
    # vira 409 em vez de 500. A sessão é descartada pelo get_db.
    return JSONResponse(
        status_code=status.HTTP_409_CONFLICT,
        content={"detail": "Conflito com dados já existentes."},
    )


app.include_router(auth.router)
app.include_router(projetos.router)
app.include_router(auditoria.router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
