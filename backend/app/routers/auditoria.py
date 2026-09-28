from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.deps import get_current_user, get_db
from app.models import AuditoriaEvento, Usuario
from app.schemas import EventoResponse, NovoEventoRequest
from app.util import agora_iso, novo_id

router = APIRouter(prefix="/auditoria", tags=["auditoria"])

LIMITE_EVENTOS = 1000


def _para_schema(evento: AuditoriaEvento, usuario: Usuario) -> EventoResponse:
    return EventoResponse(
        id=evento.id,
        timestamp=evento.timestamp,
        user={"id": usuario.id, "nome": usuario.nome},
        project={"id": evento.projeto_id, "nome": evento.projeto_nome} if evento.projeto_id else None,
        scenario={"id": evento.cenario_id, "nome": evento.cenario_nome} if evento.cenario_id else None,
        category=evento.category,
        entity=evento.entity,
        field=evento.field,
        previous_value=evento.previous_value,
        new_value=evento.new_value,
        action=evento.action,
        summary=evento.summary,
    )


@router.get("", response_model=list[EventoResponse], response_model_by_alias=True)
def listar(
    usuario: Usuario = Depends(get_current_user), db: Session = Depends(get_db)
) -> list[EventoResponse]:
    eventos = db.scalars(
        select(AuditoriaEvento)
        .where(AuditoriaEvento.usuario_id == usuario.id)
        .order_by(AuditoriaEvento.timestamp.desc())
        .limit(LIMITE_EVENTOS)
    ).all()
    return [_para_schema(e, usuario) for e in eventos]


@router.post("", response_model=EventoResponse, response_model_by_alias=True, status_code=status.HTTP_201_CREATED)
def registrar(
    dados: NovoEventoRequest, usuario: Usuario = Depends(get_current_user), db: Session = Depends(get_db)
) -> EventoResponse:
    # id, timestamp e user são sempre definidos aqui, nunca aceitos do
    # corpo da requisição — esse é o ponto central de sair do mock local.
    evento = AuditoriaEvento(
        id=novo_id("evt"),
        usuario_id=usuario.id,
        timestamp=agora_iso(),
        projeto_id=dados.project.id if dados.project else None,
        projeto_nome=dados.project.nome if dados.project else None,
        cenario_id=dados.scenario.id if dados.scenario else None,
        cenario_nome=dados.scenario.nome if dados.scenario else None,
        category=dados.category,
        entity=dados.entity,
        field=dados.field,
        previous_value=dados.previous_value,
        new_value=dados.new_value,
        action=dados.action,
        summary=dados.summary,
    )
    db.add(evento)
    db.commit()
    return _para_schema(evento, usuario)


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
def limpar(usuario: Usuario = Depends(get_current_user), db: Session = Depends(get_db)) -> None:
    db.query(AuditoriaEvento).filter(AuditoriaEvento.usuario_id == usuario.id).delete()
    db.commit()
