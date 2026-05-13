"""Comprueba DATABASE_URL (Supabase/Postgres). Ejecutar `python scripts/check_db.py` en apps/api."""

import asyncio
import ssl

from sqlalchemy import text

from app.db.session import engine


async def main() -> None:
    async with engine.connect() as conn:
        one = (await conn.execute(text("SELECT 1"))).scalar()
        assert one == 1
        rows = (
            await conn.execute(
                text(
                    "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename"
                )
            )
        ).fetchall()
        names = [r[0] for r in rows]
        print("Conexion OK (SELECT 1).")
        print("Tablas en public:", ", ".join(names))
        need = {
            "conversations",
            "messages",
            "leads",
            "handoffs",
            "tool_invocations",
            "app_configuration",
        }
        missing = need - set(names)
        if missing:
            print("AVISO: faltan tablas esperadas:", ", ".join(sorted(missing)))
        else:
            print("Esquema Wsp-Agent: tablas presentes.")
    await engine.dispose()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except ssl.SSLError as e:
        print(
            "Error TLS/SSL:",
            e,
            "\n"
            "Si es antivirus/proxy corporativo, en apps/api/.env prueba:\n"
            "  DATABASE_SSL_VERIFY=false\n"
            "(solo desarrollo; en producción arregla la cadena de confianza.)",
        )
        raise SystemExit(1) from e
    except OSError as e:
        errno = getattr(e, "errno", None)
        if errno == 11001:
            print(
                "DNS fallo (getaddrinfo). En Windows suele pasar con db.<ref>.supabase.co "
                "(solo IPv6).\n"
                "Usa el pooler en DATABASE_URL (IPv4), p. ej.:\n"
                "  postgresql+asyncpg://postgres.<REF>:PASSWORD@"
                "aws-0-<REGION>.pooler.supabase.com:5432/postgres\n"
                "Codifica caracteres especiales en la contraseña (* → %2A, @ → %40)."
            )
        else:
            print("Error de red (revisa host en DATABASE_URL y tu conexion):", e)
        raise SystemExit(1) from e
    except Exception as e:
        msg = str(e)
        if "Tenant or user not found" in msg:
            print(
                "Supavisor: el host del pooler no corresponde a tu proyecto "
                "(muy comun con aws-0 vs aws-1).\n"
                "Abre el proyecto en Supabase → boton Connect → Session pooler y copia el "
                "host de la URI (p. ej. aws-1-us-east-1...)."
            )
        else:
            print("Error de conexion o credenciales (revisa DATABASE_URL en apps/api/.env):", e)
        raise SystemExit(1) from e
