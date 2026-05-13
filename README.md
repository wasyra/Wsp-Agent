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
5. La API arranca con `init_db()` y crea las tablas en Supabase si aún no existen.

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

- API: http://localhost:8000/health  
- Web: http://localhost:3000  
- Webhook Twilio (POST): `http://<tu-host>:8000/webhooks/twilio/whatsapp`  
  En local usa un túnel (ngrok, Cloudflare Tunnel) y pon esa URL en Twilio y en `WEBHOOK_BASE_URL`.

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

Rutas bajo `/internal/*` requieren header `X-API-Key: <INTERNAL_API_KEY>`. Next.js las llama desde el servidor usando `BACKEND_URL` y la misma clave (ver `apps/web/src/lib/server-api.ts`).

## Stack

- FastAPI, SQLAlchemy 2 async, asyncpg → Supabase Postgres (TLS automático si el host es `*.supabase.co` / pooler), Twilio (validación de firma), OpenAI (opcional).
- Next.js 15 App Router, Tailwind.

## Licencia

Uso interno / proyecto de aprendizaje — añade la licencia que prefieras.
