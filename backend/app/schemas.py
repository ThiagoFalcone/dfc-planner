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
