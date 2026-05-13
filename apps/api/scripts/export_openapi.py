"""Escribe OpenAPI JSON en disco (para openapi-typescript y documentación)."""

from __future__ import annotations

import json
import sys
from pathlib import Path

# Import después de ajustar path si hace falta
_root = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(_root))

from app.main import app  # noqa: E402


def main() -> None:
    out = _root / "openapi.json"
    out.write_text(json.dumps(app.openapi(), indent=2), encoding="utf-8")
    print(f"Wrote {out}")


if __name__ == "__main__":
    main()
