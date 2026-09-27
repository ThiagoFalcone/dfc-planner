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
