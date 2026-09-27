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


def _para_schema(projeto: Projeto) -> EstadoPlannerSchema:
    return EstadoPlannerSchema(
        id=projeto.id,
        nome_projeto=projeto.nome_projeto,
        criado_em=projeto.criado_em,
        atualizado_em=projeto.atualizado_em,
        cenario_ativo_id=projeto.cenario_ativo_id or "",
        cenarios=[
            CenarioSchema(
                id=c.id,
                nome=c.nome,
                descricao_premissas=c.descricao_premissas,
                proveniencia=ProvenienciaSchema(
                    fonte=c.proveniencia_fonte,
                    referencia=c.proveniencia_referencia,
                    responsavel=c.proveniencia_responsavel,
                    atualizado_em=c.proveniencia_atualizado_em,
                ),
                cor=c.cor,
                tma=c.tma,
                periodos=[
                    PeriodoSchema(
                        mes=p.mes,
                        receitas=p.receitas,
                        despesas=p.despesas,
                        investimentos=p.investimentos,
                        tributos=p.tributos,
                        residual=p.residual,
                    )
                    for c_ in [c]
                    for p in c_.periodos
                ],
            )
            for c in projeto.cenarios
        ],
    )


def _substituir_cenarios(projeto: Projeto, cenarios: list[CenarioSchema]) -> None:
    """Reescreve cenários e períodos por inteiro (ver spec: volume pequeno,
    mais simples e seguro que diferenciar linha a linha)."""
    projeto.cenarios.clear()
    for ordem, dado in enumerate(cenarios):
        cenario = Cenario(
            id=dado.id,
            ordem=ordem,
            nome=dado.nome,
            descricao_premissas=dado.descricao_premissas,
            proveniencia_fonte=dado.proveniencia.fonte,
            proveniencia_referencia=dado.proveniencia.referencia,
            proveniencia_responsavel=dado.proveniencia.responsavel,
            proveniencia_atualizado_em=dado.proveniencia.atualizado_em,
            cor=dado.cor,
            tma=dado.tma,
        )
        for p in dado.periodos:
            cenario.periodos.append(
                Periodo(
                    mes=p.mes,
                    receitas=p.receitas,
                    despesas=p.despesas,
                    investimentos=p.investimentos,
                    tributos=p.tributos,
                    residual=p.residual,
                )
            )
        projeto.cenarios.append(cenario)


@router.get("/{projeto_id}", response_model=EstadoPlannerSchema, response_model_by_alias=True)
def carregar(
    projeto_id: str, usuario: Usuario = Depends(get_current_user), db: Session = Depends(get_db)
) -> EstadoPlannerSchema:
    projeto = _buscar_do_usuario(db, projeto_id, usuario.id)
    return _para_schema(projeto)


@router.post("", response_model=EstadoPlannerSchema, response_model_by_alias=True, status_code=status.HTTP_201_CREATED)
def criar(
    corpo: EstadoPlannerSchema, usuario: Usuario = Depends(get_current_user), db: Session = Depends(get_db)
) -> EstadoPlannerSchema:
    if db.get(Projeto, corpo.id) is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, "Já existe um planejamento com este id.")
    projeto = Projeto(
        id=corpo.id,
        usuario_id=usuario.id,
        nome_projeto=corpo.nome_projeto,
        cenario_ativo_id=corpo.cenario_ativo_id,
        criado_em=corpo.criado_em,
        atualizado_em=corpo.atualizado_em,
    )
    _substituir_cenarios(projeto, corpo.cenarios)
    db.add(projeto)
    db.commit()
    db.refresh(projeto)
    return _para_schema(projeto)


@router.put("/{projeto_id}", response_model=EstadoPlannerSchema, response_model_by_alias=True)
def salvar(
    projeto_id: str,
    corpo: EstadoPlannerSchema,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> EstadoPlannerSchema:
    projeto = _buscar_do_usuario(db, projeto_id, usuario.id)
    projeto.nome_projeto = corpo.nome_projeto
    projeto.atualizado_em = corpo.atualizado_em
    projeto.cenario_ativo_id = corpo.cenario_ativo_id
    _substituir_cenarios(projeto, corpo.cenarios)
    db.commit()
    db.refresh(projeto)
    return _para_schema(projeto)


@router.delete("/{projeto_id}", status_code=status.HTTP_204_NO_CONTENT)
def excluir(projeto_id: str, usuario: Usuario = Depends(get_current_user), db: Session = Depends(get_db)) -> None:
    projeto = _buscar_do_usuario(db, projeto_id, usuario.id)
    db.delete(projeto)
    # Se o projeto excluído era o ativo do usuário, reatribui para outro
    # restante (ou None) — nunca deixa projeto_ativo_id apontando para um id
    # que não existe mais. A UI de hoje já impede excluir o projeto ativo,
    # mas a API não deve depender disso para ficar consistente.
    if usuario.projeto_ativo_id == projeto_id:
        proximo = db.scalar(
            select(Projeto)
            .where(Projeto.usuario_id == usuario.id, Projeto.id != projeto_id)
            .order_by(Projeto.atualizado_em.desc())
        )
        usuario.projeto_ativo_id = proximo.id if proximo else None
    db.commit()
