from datetime import datetime, timedelta, timezone

import bcrypt
import jwt

from app.config import obter_settings

settings = obter_settings()


def hash_senha(senha: str) -> str:
    return bcrypt.hashpw(senha.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verificar_senha(senha: str, hash_guardado: str) -> bool:
    return bcrypt.checkpw(senha.encode("utf-8"), hash_guardado.encode("utf-8"))


def gerar_token(usuario_id: str) -> str:
    agora = datetime.now(timezone.utc)
    payload = {"sub": usuario_id, "iat": agora, "exp": agora + timedelta(days=settings.jwt_expire_days)}
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decodificar_token(token: str) -> str | None:
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except jwt.PyJWTError:
        return None
    return payload.get("sub")
