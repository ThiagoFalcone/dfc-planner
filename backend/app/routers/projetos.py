from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.deps import get_current_user, get_db
from app.models import Cenario, Periodo, Projeto, Usuario
from app.schemas import AtivoSchema, CenarioSchema, EstadoPlannerSchema, PeriodoSchema, ProvenienciaSchema, ResumoProjetoSchema

router = APIRouter(prefix="/projetos", tags=["projetos"])


def _resumo(projeto: Projeto) -> ResumoProjetoSchema:
    meses = max((len(c.periodos) for c in projeto.cenarios), default=0)
    return ResumoProjetoSchema(
        id=projeto.id,
        nome=projeto.nome_projeto,
        criado_em=projeto.criado_em,
        atualizado_em=projeto.atualizado_em,
        cenarios=len(projeto.cenarios),
        meses=meses,
    )


def _buscar_do_usuario(db: Session, projeto_id: str, usuario_id: str) -> Projeto:
    projeto = db.get(Projeto, projeto_id)
    if projeto is None or projeto.usuario_id != usuario_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Planejamento não encontrado.")
    return projeto


@router.get("", response_model=list[ResumoProjetoSchema], response_model_by_alias=True)
def listar(usuario: Usuario = Depends(get_current_user), db: Session = Depends(get_db)) -> list[ResumoProjetoSchema]:
    projetos = db.scalars(
        select(Projeto).where(Projeto.usuario_id == usuario.id).order_by(Projeto.atualizado_em.desc())
    ).all()
    return [_resumo(p) for p in projetos]


@router.get("/ativo", response_model=AtivoSchema, response_model_by_alias=True)
def ativo(usuario: Usuario = Depends(get_current_user)) -> AtivoSchema:
    return AtivoSchema(projeto_id=usuario.projeto_ativo_id)


@router.put("/ativo", response_model=AtivoSchema, response_model_by_alias=True)
def definir_ativo(
    corpo: AtivoSchema, usuario: Usuario = Depends(get_current_user), db: Session = Depends(get_db)
) -> AtivoSchema:
    if corpo.projeto_id is not None:
        _buscar_do_usuario(db, corpo.projeto_id, usuario.id)
    usuario.projeto_ativo_id = corpo.projeto_id
    db.commit()
    return AtivoSchema(projeto_id=usuario.projeto_ativo_id)
