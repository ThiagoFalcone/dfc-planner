from typing import Literal

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    """Base para todo schema exposto na API: serializa/aceita camelCase no
    JSON (compatível com os tipos TypeScript do front-end), mantendo
    snake_case nos atributos Python."""

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, from_attributes=True)


class UsuarioResponse(CamelModel):
    id: str
    nome: str
    email: str
    empresa: str | None = None


class RegistrarRequest(CamelModel):
    nome: str
    email: str
    senha: str
    empresa: str | None = None


class LoginRequest(CamelModel):
    email: str
    senha: str


class RespostaAuth(CamelModel):
    usuario: UsuarioResponse
    token: str


class PeriodoSchema(CamelModel):
    mes: int
    receitas: str
    despesas: str
    investimentos: str
    tributos: str
    residual: str


class ProvenienciaSchema(CamelModel):
    fonte: str
    referencia: str
    responsavel: str
    atualizado_em: str


class CenarioSchema(CamelModel):
    id: str
    nome: str
    descricao_premissas: str
    proveniencia: ProvenienciaSchema
    cor: int
    tma: str
    periodos: list[PeriodoSchema]


class EstadoPlannerSchema(CamelModel):
    versao: Literal[2] = 2
    id: str
    nome_projeto: str
    criado_em: str
    atualizado_em: str
    cenarios: list[CenarioSchema]
    cenario_ativo_id: str


class ResumoProjetoSchema(CamelModel):
    id: str
    nome: str
    criado_em: str
    atualizado_em: str
    cenarios: int
    meses: int


class AtivoSchema(CamelModel):
    projeto_id: str | None
