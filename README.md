# Wsp-AgentAI — WhatsApp agent (Twilio)

Monorepo: **FastAPI** (`apps/api`) + **Next.js** (`apps/web`) + **PostgreSQL**. El webhook de Twilio recibe mensajes de WhatsApp, persiste conversación, opcionalmente llama a **OpenAI** con tools (`save_lead`, `get_lead_by_phone`, `request_human_handoff`) y responde con **TwiML**.

Documento de diseño: [PLAN_WHATSAPP_AGENT.md](./PLAN_WHATSAPP_AGENT.md).

## Requisitos

- Docker Desktop **o** Node 20+, Python 3.12+, PostgreSQL 16.
- Cuenta Twilio con **WhatsApp Sandbox** (o número aprobado).

## Variables de entorno

- Raíz: [`.env.example`](./.env.example) (para `docker compose`).
- API: [`apps/api/.env.example`](./apps/api/.env.example).
- Web: copia a `apps/web/.env.local` desde [`apps/web/.env.example`](./apps/web/.env.example).

`WEBHOOK_BASE_URL` debe coincidir **exactamente** con la URL pública que Twilio llama (incluido esquema y path), para validar la firma cuando `TWILIO_VALIDATE_SIGNATURE=true`. También puedes definirlo desde el panel: **http://localhost:3000/configuracion** (se guarda en PostgreSQL y sustituye al `.env` de la API para esos campos).

## Configuración desde el panel (Next.js)

Abre **Configuración** en la barra superior del front (`/configuracion`). Ahí puedes:

- Pegar **Account SID** y **Auth Token** de Twilio.
- Indicar la **URL base** del túnel (HTTPS) y copiar la **URL completa del webhook** para pegarla en la consola de Twilio.
- Activar o no la **validación de firma**.
- Elegir **OpenAI** o **Google Gemini** (claves y modelos desde el panel; mismas herramientas: leads, handoff, etc.).

Los secretos se guardan en texto en la base de datos (cómodo para desarrollo); en producción usa un vault o solo variables de entorno.

## Arranque con Docker

```powershell
cd c:\Users\EDDY\OneDrive\Escritorio\Wsp-AgentAI
copy .env.example .env
# Edita .env con tus credenciales Twilio / OpenAI si aplica

docker compose up --build
```

- API: http://localhost:8000/health  
- Web: http://localhost:3000  
- Webhook Twilio (POST): `http://<tu-host>:8000/webhooks/twilio/whatsapp`  
  En local usa un túnel (ngrok, Cloudflare Tunnel) y pon esa URL en Twilio y en `WEBHOOK_BASE_URL`.

## Arranque en desarrollo (sin Docker para la web)

1. Levanta PostgreSQL (o `docker compose up -d db`).
2. API:

   ```powershell
   cd apps\api
   copy .env.example .env
   # Ajusta DATABASE_URL si tu Postgres no es localhost:5432
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

- FastAPI, SQLAlchemy 2 async, asyncpg, Twilio (validación de firma), OpenAI (opcional).
- Next.js 15 App Router, Tailwind.

## Licencia

Uso interno / proyecto de aprendizaje — añade la licencia que prefieras.
