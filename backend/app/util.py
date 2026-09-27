from datetime import datetime, timezone


def agora_iso() -> str:
    """Formato idêntico ao `Date.prototype.toISOString()` do JavaScript."""
    return datetime.now(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")


def novo_id(prefixo: str) -> str:
    import secrets

    return f"{prefixo}_{secrets.token_hex(8)}"
