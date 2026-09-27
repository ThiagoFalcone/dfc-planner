import os

os.environ["DATABASE_URL"] = "postgresql+psycopg://dfc_user:dfc_pass@localhost:5432/dfc_planner_test"
os.environ["JWT_SECRET"] = "chave-de-teste-nao-usar-em-producao"
os.environ["CORS_ORIGIN"] = "http://localhost:5173"
