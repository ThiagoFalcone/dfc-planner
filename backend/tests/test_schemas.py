from app.schemas import EstadoPlannerSchema


def _estado_exemplo() -> dict:
    return {
        "id": "prj_1",
        "nomeProjeto": "Projeto Teste",
        "criadoEm": "2026-01-01T00:00:00.000Z",
        "atualizadoEm": "2026-01-01T00:00:00.000Z",
        "cenarioAtivoId": "cen_1",
        "cenarios": [
            {
                "id": "cen_1",
                "nome": "Base",
                "descricaoPremissas": "",
                "proveniencia": {"fonte": "estimativa", "referencia": "", "responsavel": "Ana", "atualizadoEm": "2026-01-01T00:00:00.000Z"},
                "cor": 1,
                "tma": "",
                "periodos": [{"mes": 0, "receitas": "abc", "despesas": "-100", "investimentos": "0", "tributos": "0", "residual": "0"}],
            }
        ],
    }


def test_aceita_e_devolve_camelcase_identico():
    entrada = _estado_exemplo()
    schema = EstadoPlannerSchema.model_validate(entrada)
    saida = schema.model_dump(by_alias=True)
    assert saida["nomeProjeto"] == entrada["nomeProjeto"]
    assert saida["cenarios"][0]["descricaoPremissas"] == ""


def test_valor_de_periodo_invalido_e_negativo_passam_sem_alteracao():
    schema = EstadoPlannerSchema.model_validate(_estado_exemplo())
    periodo = schema.cenarios[0].periodos[0]
    assert periodo.receitas == "abc"
    assert periodo.despesas == "-100"
