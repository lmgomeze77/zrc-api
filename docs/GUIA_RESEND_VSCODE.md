# ════════════════════════════════════════════════════════════════
# ZRC — INTEGRACIÓN RESEND + GUÍA VS CODE / CODEX
# ════════════════════════════════════════════════════════════════

## ARQUITECTURA

```
┌─────────────────────┐        ┌──────────────────────┐
│   ZRC FRONTEND      │  POST  │    ZRC API            │
│   (Static Site)     │ ────── │    (Web Service)      │
│   Render            │  /api/ │    Render              │
│   React + Vite      │        │    Express + Resend    │
└─────────────────────┘        └──────────┬───────────┘
                                          │
                                          │ Resend API
                                          ▼
                               ┌──────────────────────┐
                               │   EMAILS              │
                               │   → info@zenrise...   │
                               │   → user confirmation │
                               └──────────────────────┘
```

Dos servicios separados en Render:
1. **zrc-platform** (Static Site) — tu frontend actual
2. **zrc-api** (Web Service) — nuevo, maneja formularios y envía emails

---

## PASO 1 — CREAR CUENTA EN RESEND

1. Ve a https://resend.com → Sign Up (gratis hasta 3,000 emails/mes)
2. Dashboard → **API Keys** → Create API Key
   - Nombre: `zrc-platform`
   - Permission: `Full access`
3. **COPIA la API key** (empieza con `re_`) → guárdala en un sitio seguro
4. Dashboard → **Domains** → Add Domain
   - Escribe: `zenrisecapital.com`
   - Resend te da 3-5 registros DNS (TXT, CNAME, MX)
5. Ve a **IONOS** → DNS de zenrisecapital.com → añade esos registros
6. Vuelve a Resend → click "Verify" → espera verificación (5-30 min)

**MIENTRAS TANTO** puedes usar `onboarding@resend.dev` como FROM email
para pruebas (Resend lo permite sin dominio verificado).

---

## PASO 2 — CREAR EL REPO DEL API

Abre Terminal en VS Code:

```bash
cd ~/Desktop
mkdir zrc-api
cd zrc-api
git init
```

Copia los archivos que te doy (server.js, package.json, render.yaml,
.env.example, .gitignore) dentro de esta carpeta.

```bash
# Copia .env.example a .env y edita con tu API key
cp .env.example .env
# Abre .env en VS Code y pon tu key real
code .env
```

Edita `.env`:
```
RESEND_API_KEY=re_TU_KEY_REAL_AQUI
NOTIFY_EMAIL=tu_email_real@gmail.com
```

Prueba en local:
```bash
npm install
npm run dev
```

Abre otra terminal y prueba:
```bash
curl -X POST http://localhost:3001/api/submit \
  -H "Content-Type: application/json" \
  -d '{"type":"contact","name":"Test","email":"tu@email.com","message":"Test desde local"}'
```

Deberías recibir un email en tu bandeja. Si funciona, sigue al paso 3.

---

## PASO 3 — SUBIR API A GITHUB

```bash
cd ~/Desktop/zrc-api

# Crear repo en GitHub
gh repo create lmgomeze77/zrc-api --private --source=. --push

# O manualmente:
git add .
git commit -m "feat: ZRC API with Resend integration"
git remote add origin https://github.com/lmgomeze77/zrc-api.git
git branch -M main
git push -u origin main
```

---

## PASO 4 — DEPLOY API EN RENDER

1. https://dashboard.render.com → **New +** → **Web Service**
2. Conecta repo: `lmgomeze77/zrc-api`
3. Configuración:
   - **Name**: zrc-api
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
4. **Environment Variables** (MUY IMPORTANTE):
   - `RESEND_API_KEY` = `re_TU_KEY_REAL` (marca como Secret)
   - `NOTIFY_EMAIL` = `info@zenrisecapital.com`
   - `FROM_EMAIL` = `ZRC Platform <noreply@zenrisecapital.com>`
   - `FRONTEND_URL` = `https://zenrisecapital.com`
5. Plan: **Free** (suficiente para empezar)
6. Click **Create Web Service**

Render te dará una URL tipo: `https://zrc-api.onrender.com`

Verifica: abre `https://zrc-api.onrender.com/health` → debe decir `{"status":"healthy"}`

---

## PASO 5 — CONECTAR FRONTEND AL API

En tu repo del frontend (`zrc-platform-V1_26`), abre `src/App.jsx`.

Busca la función `handleSubmit` dentro de `ContactForm` y reemplaza
el `console.log` por el fetch real.

### Cambio en ContactForm:

**Antes** (lo que tienes ahora):
```javascript
const handleSubmit = () => {
  if (!form.name || !form.email) return;
  console.log("ZRC Form Submission:", { ...form, context });
  setSent(true);
};
```

**Después** (con Resend):
```javascript
const API_URL = "https://zrc-api.onrender.com";

const handleSubmit = async () => {
  if (!form.name || !form.email) return;
  try {
    const res = await fetch(`${API_URL}/api/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: formType || "contact",
        ...form,
        context,
      }),
    });
    if (res.ok) setSent(true);
  } catch (err) {
    console.error("Submit error:", err);
    setSent(true); // Show success anyway to not block UX
  }
};
```

### Cambio en AuthModal (registro):

**Antes:**
```javascript
const handleSubmit = () => {
  if (!form.email || !form.password) return;
  login({ name: form.name || form.email.split("@")[0], email: form.email, tier: "member" });
};
```

**Después:**
```javascript
const API_URL = "https://zrc-api.onrender.com";

const handleSubmit = async () => {
  if (!form.email || !form.password) return;
  login({ name: form.name || form.email.split("@")[0], email: form.email, tier: "member" });
  // Send registration notification
  try {
    await fetch(`${API_URL}/api/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        email: form.email,
        company: form.company,
        role: form.role,
        interest: form.interest,
      }),
    });
  } catch (err) {
    console.error("Registration notification error:", err);
  }
};
```

### Push los cambios:
```bash
cd ~/Desktop/zrc-platform-V1_26
git add .
git commit -m "feat: connect forms to Resend API"
git push origin main
```

---

## PASO 6 — VERIFICAR TODO

1. Abre tu web (zenrisecapital.com o la URL de Render)
2. Click en "SOLICITAR TEASER" de cualquier deal
3. Rellena el formulario y envía
4. Verifica que:
   - ✅ Ves el checkmark de confirmación en la web
   - ✅ Recibes email de notificación en info@zenrisecapital.com
   - ✅ El usuario recibe email de confirmación
5. Registra una cuenta nueva → verifica welcome email

---

## INSTRUCCIONES PARA CODEX EN VS CODE

Si usas GitHub Copilot / Codex en VS Code, aquí tienes prompts
optimizados para que te ayude con tareas del proyecto:

### Prompt 1: Conectar formulario existente al API
```
@workspace In src/App.jsx, update the ContactForm component's
handleSubmit function to POST form data to https://zrc-api.onrender.com/api/submit
instead of using console.log. Include fields: type, name, email, phone,
company, message, context. Handle errors gracefully and keep the setSent(true)
behavior on success.
```

### Prompt 2: Conectar registro al API
```
@workspace In the AuthModal component in src/App.jsx, after calling
login(), also POST user registration data (name, email, company, role,
interest) to https://zrc-api.onrender.com/api/register. Make it fire-and-forget
so it doesn't block the login flow.
```

### Prompt 3: Añadir variable de entorno para API URL
```
@workspace Create a config utility at src/utils/config.js that exports
an API_URL constant. In development use http://localhost:3001, in production
use https://zrc-api.onrender.com. Use import.meta.env.PROD to detect environment.
Import and use this in ContactForm and AuthModal instead of hardcoded URLs.
```

### Prompt 4: Añadir newsletter signup al footer
```
@workspace Add a newsletter email signup field to the Footer component.
It should be a small inline form with an email input and a "Subscribe"
button, styled to match the ZRC gold/dark aesthetic. On submit, POST
to API_URL/api/submit with type "newsletter".
```

### Prompt 5: Validación de formularios
```
@workspace Add client-side validation to ContactForm: validate email
format with regex, require name (min 2 chars), show inline error messages
in red below each field. Prevent submission until all required fields
are valid. Style error messages with font-family mono, size 10px, color #EF4444.
```

### Prompt 6: Mejorar el dominio verificado en Resend
```
@workspace In the zrc-api server.js, the FROM_EMAIL uses zenrisecapital.com
domain. Before going live, I need to verify this domain in Resend by adding
DNS records. Create a checklist comment at the top of server.js documenting
the required DNS records: SPF (TXT), DKIM (CNAME), and DMARC (TXT).
```

---

## RESUMEN DE REPOS

Después de todo esto tienes:

```
GitHub:
├── lmgomeze77/zrc-platform-V1_26  ← Frontend (Static Site)
├── lmgomeze77/zrc-api             ← API + Resend (Web Service)
└── noelframil/zenith-rise-capital  ← Legacy backup (archived)

Render:
├── zrc-platform  (Static Site)  → zenrisecapital.com
└── zrc-api       (Web Service)  → zrc-api.onrender.com
```

---

## COSTES

- **Render Static Site** (frontend): Gratis
- **Render Web Service** (API): Gratis (se duerme tras 15min inactividad,
  arranca en ~30s en primer request — aceptable para formularios)
- **Resend**: Gratis hasta 3,000 emails/mes, 100/día
- **IONOS dominio**: Lo que ya pagas

**Para escalar** (cuando tengas tráfico real):
- Render Starter ($7/mes) para que el API no se duerma
- Resend Pro ($20/mes) para 50,000 emails/mes y dominio dedicado

---

## TROUBLESHOOTING

### "CORS error" en el navegador
→ Verifica que FRONTEND_URL en Render env vars coincide exactamente
  con tu dominio (incluyendo https://)

### Emails no llegan
→ Verifica RESEND_API_KEY en Render env vars
→ Comprueba Resend Dashboard → Logs para ver si hay errores
→ Mientras no verifiques dominio, usa FROM: onboarding@resend.dev

### API responde 502 en Render
→ El free tier se duerme. El primer request tarda ~30s en arrancar.
→ Solución: upgrader a Starter ($7/mes) o añadir un health check
   externo que haga ping cada 10min (UptimeRobot gratis)

### Formulario envía pero no recibe email
→ Revisa la pestaña Network en DevTools del navegador
→ Busca el POST a /api/submit → mira el response body
→ Si hay error, el mensaje te dirá qué falla
