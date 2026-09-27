from app.models import Usuario
from app.security import gerar_token
from app.util import agora_iso


def _criar_usuario(db, email="ana@exemplo.com") -> Usuario:
    usuario = Usuario(nome="Ana", email=email, senha_hash="hash", criado_em=agora_iso())
    db.add(usuario)
    db.commit()
    db.refresh(usuario)
    return usuario


def _token_de(usuario: Usuario) -> dict:
    return {"Authorization": f"Bearer {gerar_token(usuario.id)}"}


def test_registrar_ignora_id_timestamp_e_user_forjados_no_corpo(client, db):
    usuario = _criar_usuario(db)
    corpo = {
        "id": "evt_forjado",
        "timestamp": "1999-01-01T00:00:00.000Z",
        "user": {"id": "outro_usuario", "nome": "Invasor"},
        "category": "sessao",
        "entity": "sessao",
        "field": None,
        "previousValue": None,
        "newValue": None,
        "action": "LOGIN",
        "summary": "Sessão iniciada",
    }
    resposta = client.post("/auditoria", json=corpo, headers=_token_de(usuario))
    assert resposta.status_code == 201
    salvo = resposta.json()
    assert salvo["id"] != "evt_forjado"
    assert salvo["timestamp"] != "1999-01-01T00:00:00.000Z"
    assert salvo["user"] == {"id": usuario.id, "nome": usuario.nome}


def test_listar_so_traz_eventos_do_proprio_usuario(client, db):
    usuario_a = _criar_usuario(db, "a@x.com")
    usuario_b = _criar_usuario(db, "b@x.com")
    evento = {
        "category": "sessao", "entity": "sessao", "field": None, "previousValue": None,
        "newValue": None, "action": "LOGIN", "summary": "Sessão iniciada",
    }
    client.post("/auditoria", json=evento, headers=_token_de(usuario_a))
    assert len(client.get("/auditoria", headers=_token_de(usuario_a)).json()) == 1
    assert client.get("/auditoria", headers=_token_de(usuario_b)).json() == []


def test_limpar_remove_todos_os_eventos_do_usuario(client, db):
    usuario = _criar_usuario(db)
    evento = {
        "category": "sessao", "entity": "sessao", "field": None, "previousValue": None,
        "newValue": None, "action": "LOGIN", "summary": "Sessão iniciada",
    }
    client.post("/auditoria", json=evento, headers=_token_de(usuario))
    resposta = client.delete("/auditoria", headers=_token_de(usuario))
    assert resposta.status_code == 204
    assert client.get("/auditoria", headers=_token_de(usuario)).json() == []
