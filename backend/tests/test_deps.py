from app.models import Usuario
from app.security import gerar_token
from app.util import agora_iso


def _criar_usuario(db) -> Usuario:
    usuario = Usuario(nome="Ana", email="ana@exemplo.com", senha_hash="hash", criado_em=agora_iso())
    db.add(usuario)
    db.commit()
    db.refresh(usuario)
    return usuario


def test_rota_protegida_sem_token_retorna_401(client):
    assert client.get("/auth/me").status_code == 401


def test_rota_protegida_com_token_invalido_retorna_401(client):
    resposta = client.get("/auth/me", headers={"Authorization": "Bearer lixo.invalido"})
    assert resposta.status_code == 401


def test_rota_protegida_com_token_valido_retorna_200(client, db):
    usuario = _criar_usuario(db)
    token = gerar_token(usuario.id)
    resposta = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert resposta.status_code == 200
    assert resposta.json()["id"] == usuario.id
