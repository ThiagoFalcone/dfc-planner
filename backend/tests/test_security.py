from datetime import datetime, timedelta, timezone

import jwt

from app.config import obter_settings
from app.security import decodificar_token, gerar_token, hash_senha, verificar_senha


def test_hash_senha_nunca_e_texto_puro():
    hash_gerado = hash_senha("minhasenha123")
    assert hash_gerado != "minhasenha123"
    assert verificar_senha("minhasenha123", hash_gerado) is True
    assert verificar_senha("senhaerrada", hash_gerado) is False


def test_gerar_e_decodificar_token():
    token = gerar_token("usr_abc123")
    assert decodificar_token(token) == "usr_abc123"


def test_decodificar_token_invalido_retorna_none():
    assert decodificar_token("token.invalido.aqui") is None


def test_decodificar_token_expirado_retorna_none():
    settings = obter_settings()
    passado = datetime.now(timezone.utc) - timedelta(days=1)
    token_expirado = jwt.encode(
        {"sub": "usr_x", "iat": passado - timedelta(days=1), "exp": passado},
        settings.jwt_secret,
        algorithm=settings.jwt_algorithm,
    )
    assert decodificar_token(token_expirado) is None
