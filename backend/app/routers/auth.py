from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.deps import get_current_user, get_db
from app.models import Usuario
from app.schemas import LoginRequest, RegistrarRequest, RespostaAuth, UsuarioResponse
from app.security import gerar_token, hash_senha, verificar_senha
from app.util import agora_iso

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/registrar", response_model=RespostaAuth, response_model_by_alias=True, status_code=status.HTTP_201_CREATED)
def registrar(dados: RegistrarRequest, db: Session = Depends(get_db)) -> RespostaAuth:
    email = dados.email.strip().lower()
    existe = db.scalar(select(Usuario).where(Usuario.email == email))
    if existe is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, "Já existe uma conta com este e-mail.")
    usuario = Usuario(
        nome=dados.nome,
        email=email,
        senha_hash=hash_senha(dados.senha),
        empresa=dados.empresa,
        criado_em=agora_iso(),
    )
    db.add(usuario)
    db.commit()
    db.refresh(usuario)
    return RespostaAuth(usuario=UsuarioResponse.model_validate(usuario), token=gerar_token(usuario.id))


@router.post("/login", response_model=RespostaAuth, response_model_by_alias=True)
def login(credenciais: LoginRequest, db: Session = Depends(get_db)) -> RespostaAuth:
    email = credenciais.email.strip().lower()
    usuario = db.scalar(select(Usuario).where(Usuario.email == email))
    if usuario is None or not verificar_senha(credenciais.senha, usuario.senha_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "E-mail ou senha inválidos.")
    return RespostaAuth(usuario=UsuarioResponse.model_validate(usuario), token=gerar_token(usuario.id))


@router.get("/me", response_model=UsuarioResponse, response_model_by_alias=True)
def me(usuario: Usuario = Depends(get_current_user)) -> UsuarioResponse:
    return UsuarioResponse.model_validate(usuario)
