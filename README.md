# Wsp-AgentAI — WhatsApp agent (Twilio)

Monorepo: **FastAPI** (`apps/api`) + **Next.js** (`apps/web`) + **Supabase (Postgres)**. El webhook de Twilio recibe mensajes de WhatsApp, persiste conversación, opcionalmente llama a **OpenAI** con tools (`save_lead`, `get_lead_by_phone`, `request_human_handoff`) y responde con **TwiML**.

Documento de diseño: [PLAN_WHATSAPP_AGENT.md](./PLAN_WHATSAPP_AGENT.md).

## Requisitos

- Docker Desktop **o** Node 20+, Python 3.12+, y un proyecto **[Supabase](https://supabase.com/dashboard)** (Postgres en la nube).
- Cuenta Twilio con **WhatsApp Sandbox** (o número aprobado).

## Variables de entorno

- Raíz: [`.env.example`](./.env.example) (para `docker compose`).
- API: [`apps/api/.env.example`](./apps/api/.env.example).
- Web: copia a `apps/web/.env.local` desde [`apps/web/.env.example`](./apps/web/.env.example).

`WEBHOOK_BASE_URL` debe coincidir **exactamente** con la URL pública que Twilio llama (incluido esquema y path), para validar la firma cuando `TWILIO_VALIDATE_SIGNATURE=true`. También puedes definirlo desde el panel: **http://localhost:3000/configuracion** (se guarda en Supabase y sustituye al `.env` de la API para esos campos).

### Supabase (`DATABASE_URL`)

1. Crea un proyecto en el [dashboard de Supabase](https://supabase.com/dashboard).
2. Pulsa **Connect** en el dashboard y elige **Session pooler** (IPv4 si tu red no soporta IPv6 hacia `db.<ref>.supabase.co`). Copia el **host** de la URI tal cual (puede ser `aws-0-...` o `aws-1-...` según el proyecto). Si inventas el host y ves `Tenant or user not found`, vuelve a copiarlo desde **Connect**.
3. Sustituye el prefijo del esquema por el driver async de Python: `postgresql://…` → `postgresql+asyncpg://…`. Usuario del pooler: `postgres.<PROJECT_REF>`.
4. Añade `DATABASE_URL` en el `.env` de la raíz del repo (para `docker compose`) y, si corres la API con `uvicorn` fuera de Docker, en `apps/api/.env`.
5. Al arrancar, la API ejecuta **Alembic** (`alembic upgrade head` vía `init_db()`): crea o actualiza tablas según [`apps/api/migrations/`](./apps/api/migrations/). Para aplicar migraciones a mano: `cd apps\api` y `alembic upgrade head` (requiere `DATABASE_URL` y driver sync `psycopg` instalado con el paquete).

Si la contraseña tiene caracteres reservados en URLs (`@`, `:`, `*`, etc.), codifícala (por ejemplo `@` como `%40`, `*` como `%2A`).

## Configuración desde el panel (Next.js)

Abre **Configuración** en la barra superior del front (`/configuracion`). Ahí puedes:

- Pegar **Account SID** y **Auth Token** de Twilio.
- Indicar la **URL base** del túnel (HTTPS) y copiar la **URL completa del webhook** para pegarla en la consola de Twilio.
- Activar o no la **validación de firma**.
- Elegir **OpenAI** o **Google Gemini** (claves y modelos desde el panel; mismas herramientas: leads, handoff, etc.).

Los secretos se guardan en texto en la base de datos (cómodo para desarrollo); en producción usa un vault o solo variables de entorno.

## Arranque con Docker

```powershell
cd D:\Proyectos\Wsp-Agent
copy .env.example .env
# Edita .env: DATABASE_URL (Supabase), Twilio, OpenAI si aplica

docker compose up --build
```

Con **Supabase**, `DATABASE_URL` y (si lo necesitas) `DATABASE_SSL_VERIFY` van en el **`.env` de la raíz**; Compose **no** monta `apps/api/.env` en el contenedor `api`.

- API: `GET http://localhost:8000/health` (ligero) y `GET http://localhost:8000/health/ready` (comprueba Postgres con `SELECT 1`; responde **503** si la base no está disponible — útil para balanceadores y Kubernetes). Todas las respuestas llevan cabecera **`X-Request-ID`** (UUID si no envías `X-Request-ID` / `X-Correlation-ID`); los logs de la API incluyen ese id en cada línea.
- Web: http://localhost:3000  
- Webhook Twilio (POST): `http://<tu-host>:8000/webhooks/twilio/whatsapp`  
  En local usa un túnel (ngrok, Cloudflare Tunnel) y pon esa URL en Twilio y en `WEBHOOK_BASE_URL`.  
  Ese endpoint tiene **límite de tasa** (120 solicitudes por minuto e IP) para mitigar abuso; en pruebas masivas usa varias IPs o ajusta el límite en código si lo necesitas.

El contenedor de la API corre como usuario **no root** (`appuser`).

## Arranque en desarrollo (sin Docker para la web)

1. Define `DATABASE_URL` hacia tu proyecto Supabase (misma URI que en el `.env` de la raíz si ya usas Docker).
2. API:

   ```powershell
   cd apps\api
   copy .env.example .env
   # Ajusta DATABASE_URL (Supabase, ver sección anterior)
   pip install .
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

3. Web:

   ```powershell
   cd apps\web
   copy .env.example .env.local
   npm run dev
   ```

## Twilio (sandbox)

1. En la consola Twilio, en el sandbox de WhatsApp, configura el webhook **When a message comes in** a tu URL HTTPS + path `/webhooks/twilio/whatsapp`, método **POST**.
2. Con `TWILIO_VALIDATE_SIGNATURE=false` puedes probar más rápido en local; en producción usa `true` y `WEBHOOK_BASE_URL` alineado con la URL registrada.
3. Envía un mensaje al número del sandbox desde tu WhatsApp.

## API interna (panel Next)

Rutas bajo `/internal/*` requieren header `X-API-Key: <INTERNAL_API_KEY>`. Next.js las llama desde el servidor usando `BACKEND_URL` y la misma clave (ver `apps/web/src/lib/server-api.ts`). Las rutas BFF en `apps/web/src/app/api/internal/*` reenvían **`X-Request-ID`** al backend y, en error, devuelven JSON `{ "detail": ..., "request_id": "..." }` para enlazar con los logs de la API.

Página **Estado** (`/estado`): resume versión de API, commit de despliegue (`GIT_COMMIT`), comprobación de base y si hay **Redis** configurado para rate limit distribuido.

### Modelo de seguridad: single-tenant

`/internal/*` está pensado para **un único panel detrás del shared secret**. Quien presente la `INTERNAL_API_KEY` válida lee **todas** las conversaciones, mensajes, leads y handoffs del despliegue — no hay filtro por `workspace_id`/`tenant_id` en las rutas internas (ver docstring en `apps/api/app/deps.py::verify_internal_api_key`).

Implicaciones:

- **Aceptable** para un pilot interno donde el Next.js es el único consumidor.
- **NO** compartas `INTERNAL_API_KEY` con clientes externos ni la incluyas en JS de navegador.
- Para multi-tenant: modelar `workspace_id` en BD, emitir keys por workspace y filtrar en `apps/api/app/routers/internal.py`.

Los **secretos del panel** (Twilio Auth Token, OpenAI/Gemini API keys) se guardan **en texto plano en Supabase** para comodidad de desarrollo. Para producción rota a un vault (AWS Secrets Manager, GCP Secret Manager, etc.) y deja la BD solo con referencias.

## CI (GitHub Actions)

En pushes y PRs a `main`, el workflow [`.github/workflows/ci.yml`](./.github/workflows/ci.yml) ejecuta:

- **API**: Postgres 16 en servicio, `pip install ".[dev]"`, `python -m ruff check .`, `python -m pytest -q` (con `DATABASE_URL` y `INTERNAL_API_KEY` de prueba).
- **Web**: `npm ci`, `npm run lint`, `npm run build`.

Para correr los tests de la API en local necesitas una base accesible (por ejemplo Supabase o Postgres local) y `INTERNAL_API_KEY` coherente con tu `.env`; ver `apps/api/tests/conftest.py`.

## Observabilidad, migraciones y DX

- **Redis** (opcional en local; en `docker compose` hay un servicio `redis` y `REDIS_URL=redis://redis:6379/0` para que **slowapi** use almacenamiento compartido entre réplicas). Sin `REDIS_URL`, el límite del webhook queda en memoria del proceso.
- **Métricas**: `GET http://localhost:8000/metrics` (Prometheus; restringe acceso en producción).
- **Logs**: `LOG_JSON=true` para una línea JSON por evento (agregadores). `LOG_LEVEL` (p. ej. `INFO`). **No** loguees cuerpos de mensajes de usuario ni secretos en `logger.info`; usa `request_id` ya presente en el formato.
- **OpenAPI → TypeScript**: tras cambiar la API, `cd apps\api && python scripts/export_openapi.py` y `cd apps\web && npm run gen:api-types` (genera `apps/web/src/lib/api-v1.d.ts` desde `apps/api/openapi.json`).
- **Herramientas de repo**: en la raíz, [`package.json`](./package.json) con scripts `lint:api`, `test:api`, `export:openapi`, `gen:api-types`, etc. [Dependabot](.github/dependabot.yml) para pip/npm/Actions. [pre-commit](.pre-commit-config.yaml) con Ruff sobre `apps/api` (`pre-commit install`).

## Stack

- FastAPI, SQLAlchemy 2 async, asyncpg → Supabase Postgres (TLS automático si el host es `*.supabase.co` / pooler), Twilio (validación de firma), OpenAI (opcional), **Alembic** (migraciones), **slowapi** (rate limit; backend Redis opcional vía `REDIS_URL`), **prometheus-client** (`/metrics`).
- Next.js 15 App Router, Tailwind.

## Licencia

Uso interno / proyecto de aprendizaje — añade la licencia que prefieras.
