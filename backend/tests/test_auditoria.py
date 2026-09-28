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


def _evento_valido(**extra) -> dict:
    return {
        "category": "sessao", "entity": "sessao", "field": None, "previousValue": None,
        "newValue": None, "action": "LOGIN", "summary": "Sessão iniciada", **extra,
    }


def test_category_entity_ou_action_fora_dos_valores_permitidos_sao_rejeitados(client, db):
    usuario = _criar_usuario(db)
    for campo, valor in [("category", "inventada"), ("entity", "inventada"), ("action", "HACK")]:
        resposta = client.post("/auditoria", json=_evento_valido(**{campo: valor}), headers=_token_de(usuario))
        assert resposta.status_code == 422, campo
    assert client.get("/auditoria", headers=_token_de(usuario)).json() == []


def test_project_sem_id_ou_nome_e_rejeitado_com_422_e_nao_500(client, db):
    usuario = _criar_usuario(db)
    resposta = client.post("/auditoria", json=_evento_valido(project={"id": "prj_1"}), headers=_token_de(usuario))
    assert resposta.status_code == 422


def test_project_e_scenario_validos_sao_gravados_e_devolvidos(client, db):
    usuario = _criar_usuario(db)
    corpo = _evento_valido(
        category="planejamento", entity="receitas", action="EDIT",
        project={"id": "prj_1", "nome": "Projeto"}, scenario={"id": "cen_1", "nome": "Base"},
    )
    resposta = client.post("/auditoria", json=corpo, headers=_token_de(usuario))
    assert resposta.status_code == 201
    assert resposta.json()["project"] == {"id": "prj_1", "nome": "Projeto"}
    assert resposta.json()["scenario"] == {"id": "cen_1", "nome": "Base"}
