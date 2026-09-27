import os

os.environ["DATABASE_URL"] = "postgresql+psycopg://dfc_user:dfc_pass@localhost:5432/dfc_planner_test"
os.environ["JWT_SECRET"] = "chave-de-teste-nao-usar-em-producao"
os.environ["CORS_ORIGIN"] = "http://localhost:5173"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.config import obter_settings
from app.db import Base
from app.deps import get_db
from app.main import app

_settings = obter_settings()
_engine = create_engine(_settings.database_url)
_TestingSessionLocal = sessionmaker(bind=_engine, autoflush=False, autocommit=False)


@pytest.fixture(autouse=True)
def banco_limpo():
    Base.metadata.drop_all(bind=_engine)
    Base.metadata.create_all(bind=_engine)
    yield


@pytest.fixture
def db():
    sessao = _TestingSessionLocal()
    try:
        yield sessao
    finally:
        sessao.close()


@pytest.fixture
def client(db):
    def _get_db_override():
        yield db

    app.dependency_overrides[get_db] = _get_db_override
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
