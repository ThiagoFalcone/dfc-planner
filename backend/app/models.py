from sqlalchemy import ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base
from app.util import novo_id


class Usuario(Base):
    __tablename__ = "usuarios"

    id: Mapped[str] = mapped_column(primary_key=True, default=lambda: novo_id("usr"))
    nome: Mapped[str]
    email: Mapped[str] = mapped_column(unique=True, index=True)
    senha_hash: Mapped[str]
    empresa: Mapped[str | None] = mapped_column(default=None)
    # Sem FK formal: aponta para um projeto do próprio usuário, validado na
    # camada de aplicação. Evita o ciclo usuarios -> projetos -> cenarios no
    # DDL sem abrir mão de integridade (a aplicação nunca grava um id que
    # não pertença ao usuário — ver router de projetos).
    projeto_ativo_id: Mapped[str | None] = mapped_column(default=None)
    criado_em: Mapped[str]


class Projeto(Base):
    __tablename__ = "projetos"

    id: Mapped[str] = mapped_column(primary_key=True)
    usuario_id: Mapped[str] = mapped_column(ForeignKey("usuarios.id", ondelete="CASCADE"), index=True)
    nome_projeto: Mapped[str]
    cenario_ativo_id: Mapped[str | None] = mapped_column(default=None)  # idem: sem FK formal
    criado_em: Mapped[str]
    atualizado_em: Mapped[str]

    cenarios: Mapped[list["Cenario"]] = relationship(
        back_populates="projeto", cascade="all, delete-orphan", order_by="Cenario.ordem"
    )


class Cenario(Base):
    __tablename__ = "cenarios"

    id: Mapped[str] = mapped_column(primary_key=True)
    projeto_id: Mapped[str] = mapped_column(ForeignKey("projetos.id", ondelete="CASCADE"), index=True)
    # Não existe no domínio do front-end: guarda a posição no array de
    # cenários, já que uma tabela relacional não tem ordem implícita como um
    # array JSON tinha no localStorage.
    ordem: Mapped[int]
    nome: Mapped[str]
    descricao_premissas: Mapped[str] = mapped_column(Text, default="")
    proveniencia_fonte: Mapped[str]
    proveniencia_referencia: Mapped[str] = mapped_column(Text, default="")
    proveniencia_responsavel: Mapped[str]
    proveniencia_atualizado_em: Mapped[str]
    cor: Mapped[int]
    tma: Mapped[str] = mapped_column(default="")

    projeto: Mapped["Projeto"] = relationship(back_populates="cenarios")
    periodos: Mapped[list["Periodo"]] = relationship(
        back_populates="cenario", cascade="all, delete-orphan", order_by="Periodo.mes"
    )


class Periodo(Base):
    """
    Nota de design: os cinco campos monetários abaixo são TEXT, não NUMERIC.
    Isso preserva um comportamento já testado no front-end
    (src/lib/formato.test.ts): uma célula com texto inválido ("abc") ou um
    número negativo precisa ser guardada exatamente como o usuário digitou,
    para a tela sinalizar a célula como inválida em vez de travar. NUMERIC
    rejeitaria o INSERT/UPDATE nesses casos, ou exigiria coagir o valor para
    NULL/0, quebrando esse comportamento e duplicando no banco uma regra de
    validação que já existe, testada, em src/lib/calculos.ts. Ver também a
    seção "Modelo de dados" do spec em
    docs/superpowers/specs/2026-09-27-backend-fastapi-postgres-design.md.
    """

    __tablename__ = "periodos"

    cenario_id: Mapped[str] = mapped_column(ForeignKey("cenarios.id", ondelete="CASCADE"), primary_key=True)
    mes: Mapped[int] = mapped_column(primary_key=True)
    receitas: Mapped[str]
    despesas: Mapped[str]
    investimentos: Mapped[str]
    tributos: Mapped[str]
    residual: Mapped[str]

    cenario: Mapped["Cenario"] = relationship(back_populates="periodos")


class AuditoriaEvento(Base):
    __tablename__ = "auditoria_eventos"

    id: Mapped[str] = mapped_column(primary_key=True, default=lambda: novo_id("evt"))
    usuario_id: Mapped[str] = mapped_column(ForeignKey("usuarios.id", ondelete="CASCADE"), index=True)
    timestamp: Mapped[str] = mapped_column(index=True)
    # Cópias no momento do evento, sem FK obrigatória: se o projeto/cenário
    # for excluído depois, o evento continua legível com o nome que tinha.
    projeto_id: Mapped[str | None] = mapped_column(default=None)
    projeto_nome: Mapped[str | None] = mapped_column(default=None)
    cenario_id: Mapped[str | None] = mapped_column(default=None)
    cenario_nome: Mapped[str | None] = mapped_column(default=None)
    category: Mapped[str]
    entity: Mapped[str]
    field: Mapped[str | None] = mapped_column(default=None)
    previous_value: Mapped[str | None] = mapped_column(Text, default=None)
    new_value: Mapped[str | None] = mapped_column(Text, default=None)
    action: Mapped[str]
    summary: Mapped[str]
