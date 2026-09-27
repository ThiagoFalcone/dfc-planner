from sqlalchemy import create_engine, inspect

from app.config import obter_settings
from app.db import Base
from app import models  # noqa: F401


def test_metadata_bate_com_as_5_tabelas_esperadas():
    engine = create_engine(obter_settings().database_url)
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    tabelas = set(inspect(engine).get_table_names())
    assert tabelas == {"usuarios", "projetos", "cenarios", "periodos", "auditoria_eventos"}
