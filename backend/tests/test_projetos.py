from app.models import Projeto, Usuario
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


def _criar_projeto_direto(db, usuario: Usuario, nome="Projeto 1") -> Projeto:
    projeto = Projeto(
        id=f"prj_{nome}", usuario_id=usuario.id, nome_projeto=nome, criado_em=agora_iso(), atualizado_em=agora_iso()
    )
    db.add(projeto)
    db.commit()
    db.refresh(projeto)
    return projeto


def test_listar_vazio_para_usuario_novo(client, db):
    usuario = _criar_usuario(db)
    resposta = client.get("/projetos", headers=_token_de(usuario))
    assert resposta.status_code == 200
    assert resposta.json() == []


def test_listar_so_traz_projetos_do_proprio_usuario(client, db):
    usuario_a = _criar_usuario(db, "a@x.com")
    usuario_b = _criar_usuario(db, "b@x.com")
    _criar_projeto_direto(db, usuario_a)
    resposta_a = client.get("/projetos", headers=_token_de(usuario_a))
    resposta_b = client.get("/projetos", headers=_token_de(usuario_b))
    assert len(resposta_a.json()) == 1
    assert resposta_b.json() == []


def test_ativo_comeca_nulo_e_pode_ser_definido(client, db):
    usuario = _criar_usuario(db)
    projeto = _criar_projeto_direto(db, usuario)
    assert client.get("/projetos/ativo", headers=_token_de(usuario)).json() == {"projetoId": None}
    resposta = client.put("/projetos/ativo", json={"projetoId": projeto.id}, headers=_token_de(usuario))
    assert resposta.status_code == 200
    assert resposta.json() == {"projetoId": projeto.id}


def test_nao_pode_definir_como_ativo_projeto_de_outro_usuario(client, db):
    usuario_a = _criar_usuario(db, "a@x.com")
    usuario_b = _criar_usuario(db, "b@x.com")
    projeto_de_b = _criar_projeto_direto(db, usuario_b)
    resposta = client.put("/projetos/ativo", json={"projetoId": projeto_de_b.id}, headers=_token_de(usuario_a))
    assert resposta.status_code == 404


def _estado_exemplo(projeto_id="prj_novo", cenario_id="cen_1") -> dict:
    return {
        "id": projeto_id,
        "nomeProjeto": "Projeto Teste",
        "criadoEm": "2026-01-01T00:00:00.000Z",
        "atualizadoEm": "2026-01-01T00:00:00.000Z",
        "cenarioAtivoId": cenario_id,
        "cenarios": [
            {
                "id": cenario_id,
                "nome": "Base",
                "descricaoPremissas": "",
                "proveniencia": {
                    "fonte": "estimativa",
                    "referencia": "",
                    "responsavel": "Ana",
                    "atualizadoEm": "2026-01-01T00:00:00.000Z",
                },
                "cor": 1,
                "tma": "",
                "periodos": [
                    {"mes": 0, "receitas": "1000", "despesas": "0", "investimentos": "0", "tributos": "0", "residual": "0"},
                    {"mes": 1, "receitas": "abc", "despesas": "-500", "investimentos": "0", "tributos": "0", "residual": "0"},
                ],
            }
        ],
    }


def test_criar_e_carregar_projeto(client, db):
    usuario = _criar_usuario(db)
    resposta = client.post("/projetos", json=_estado_exemplo(), headers=_token_de(usuario))
    assert resposta.status_code == 201
    carregado = client.get("/projetos/prj_novo", headers=_token_de(usuario))
    assert carregado.status_code == 200
    assert carregado.json()["nomeProjeto"] == "Projeto Teste"


def test_usuario_nao_acessa_projeto_de_outro_usuario(client, db):
    usuario_a = _criar_usuario(db, "a@x.com")
    usuario_b = _criar_usuario(db, "b@x.com")
    client.post("/projetos", json=_estado_exemplo(), headers=_token_de(usuario_a))
    resposta = client.get("/projetos/prj_novo", headers=_token_de(usuario_b))
    assert resposta.status_code == 404


def test_usuario_nao_edita_nem_exclui_projeto_de_outro_usuario(client, db):
    usuario_a = _criar_usuario(db, "a@x.com")
    usuario_b = _criar_usuario(db, "b@x.com")
    client.post("/projetos", json=_estado_exemplo(), headers=_token_de(usuario_a))
    assert client.put("/projetos/prj_novo", json=_estado_exemplo(), headers=_token_de(usuario_b)).status_code == 404
    assert client.delete("/projetos/prj_novo", headers=_token_de(usuario_b)).status_code == 404


def test_valor_invalido_e_negativo_sobrevive_ao_round_trip_completo(client, db):
    usuario = _criar_usuario(db)
    client.post("/projetos", json=_estado_exemplo(), headers=_token_de(usuario))
    carregado = client.get("/projetos/prj_novo", headers=_token_de(usuario)).json()
    periodos = carregado["cenarios"][0]["periodos"]
    assert periodos[1]["receitas"] == "abc"
    assert periodos[1]["despesas"] == "-500"


def test_salvar_reescreve_cenarios_e_preserva_ordem(client, db):
    usuario = _criar_usuario(db)
    estado = _estado_exemplo()
    estado["cenarios"].append(
        {
            "id": "cen_2",
            "nome": "Pessimista",
            "descricaoPremissas": "",
            "proveniencia": {"fonte": "estimativa", "referencia": "", "responsavel": "Ana", "atualizadoEm": "2026-01-01T00:00:00.000Z"},
            "cor": 2,
            "tma": "",
            "periodos": [{"mes": 0, "receitas": "500", "despesas": "0", "investimentos": "0", "tributos": "0", "residual": "0"}],
        }
    )
    client.post("/projetos", json=_estado_exemplo(), headers=_token_de(usuario))
    resposta = client.put(f"/projetos/{estado['id']}", json=estado, headers=_token_de(usuario))
    assert resposta.status_code == 200
    nomes = [c["nome"] for c in resposta.json()["cenarios"]]
    assert nomes == ["Base", "Pessimista"]


def test_excluir_projeto_ativo_reatribui_ou_limpa_projeto_ativo(client, db):
    usuario = _criar_usuario(db)
    client.post("/projetos", json=_estado_exemplo("prj_1", "cen_1"), headers=_token_de(usuario))
    client.put("/projetos/ativo", json={"projetoId": "prj_1"}, headers=_token_de(usuario))
    client.delete("/projetos/prj_1", headers=_token_de(usuario))
    resposta = client.get("/projetos/ativo", headers=_token_de(usuario))
    assert resposta.json() == {"projetoId": None}


def test_excluir_projeto_ativo_reatribui_para_outro_projeto_restante(client, db):
    usuario = _criar_usuario(db)
    client.post("/projetos", json=_estado_exemplo("prj_1", "cen_1"), headers=_token_de(usuario))
    client.post("/projetos", json=_estado_exemplo("prj_2", "cen_2"), headers=_token_de(usuario))
    client.put("/projetos/ativo", json={"projetoId": "prj_1"}, headers=_token_de(usuario))
    client.delete("/projetos/prj_1", headers=_token_de(usuario))
    resposta = client.get("/projetos/ativo", headers=_token_de(usuario))
    assert resposta.json() == {"projetoId": "prj_2"}


def test_fonte_de_proveniencia_fora_dos_valores_permitidos_e_rejeitada(client, db):
    usuario = _criar_usuario(db)
    estado = _estado_exemplo()
    estado["cenarios"][0]["proveniencia"]["fonte"] = "inventada"
    resposta = client.post("/projetos", json=estado, headers=_token_de(usuario))
    assert resposta.status_code == 422


def test_id_de_cenario_ja_existente_em_outro_projeto_vira_409_e_nao_500(client, db):
    usuario = _criar_usuario(db)
    client.post("/projetos", json=_estado_exemplo("prj_1", "cen_1"), headers=_token_de(usuario))
    resposta = client.post("/projetos", json=_estado_exemplo("prj_2", "cen_1"), headers=_token_de(usuario))
    assert resposta.status_code == 409
