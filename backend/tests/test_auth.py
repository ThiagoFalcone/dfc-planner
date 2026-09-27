def test_registrar_cria_usuario_e_retorna_token(client):
    resposta = client.post(
        "/auth/registrar",
        json={"nome": "Ana", "email": "ana@exemplo.com", "senha": "segredo123"},
    )
    assert resposta.status_code == 201
    corpo = resposta.json()
    assert corpo["usuario"]["email"] == "ana@exemplo.com"
    assert "token" in corpo
    assert "senha" not in corpo["usuario"]


def test_registrar_com_email_duplicado_retorna_409(client):
    dados = {"nome": "Ana", "email": "ana@exemplo.com", "senha": "segredo123"}
    client.post("/auth/registrar", json=dados)
    resposta = client.post("/auth/registrar", json=dados)
    assert resposta.status_code == 409


def test_login_com_credenciais_corretas(client):
    client.post("/auth/registrar", json={"nome": "Ana", "email": "ana@exemplo.com", "senha": "segredo123"})
    resposta = client.post("/auth/login", json={"email": "ana@exemplo.com", "senha": "segredo123"})
    assert resposta.status_code == 200
    assert "token" in resposta.json()


def test_login_com_senha_errada_retorna_401(client):
    client.post("/auth/registrar", json={"nome": "Ana", "email": "ana@exemplo.com", "senha": "segredo123"})
    resposta = client.post("/auth/login", json={"email": "ana@exemplo.com", "senha": "errada"})
    assert resposta.status_code == 401


def test_login_com_email_inexistente_retorna_401_generico(client):
    resposta = client.post("/auth/login", json={"email": "ninguem@exemplo.com", "senha": "x"})
    assert resposta.status_code == 401
    assert resposta.json()["detail"] == "E-mail ou senha inválidos."


def test_senha_nunca_e_devolvida_em_nenhuma_resposta(client):
    resposta = client.post(
        "/auth/registrar", json={"nome": "Ana", "email": "ana@exemplo.com", "senha": "segredo123"}
    )
    assert "senha" not in resposta.text and "senha_hash" not in resposta.text
