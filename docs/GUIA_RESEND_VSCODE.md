# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
# ZRC â€” INTEGRACIÃ“N RESEND + GUÃA VS CODE / CODEX
# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

## ARQUITECTURA

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”        â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚   ZRC FRONTEND      â”‚  POST  â”‚    ZRC API            â”‚
â”‚   (Static Site)     â”‚ â”€â”€â”€â”€â”€â”€ â”‚    (Web Service)      â”‚
â”‚   Render            â”‚  /api/ â”‚    Render              â”‚
â”‚   React + Vite      â”‚        â”‚    Express + Resend    â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜        â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                                          â”‚
                                          â”‚ Resend API
                                          â–¼
                               â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
                               â”‚   EMAILS              â”‚
                               â”‚   â†’ info@zenrise...   â”‚
                               â”‚   â†’ user confirmation â”‚
                               â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

Dos servicios separados en Render:
1. **zrc-platform** (Static Site) â€” tu frontend actual
2. **zrc-api** (Web Service) â€” nuevo, maneja formularios y envÃ­a emails

---

## PASO 1 â€” CREAR CUENTA EN RESEND

1. Ve a https://resend.com â†’ Sign Up (gratis hasta 3,000 emails/mes)
2. Dashboard â†’ **API Keys** â†’ Create API Key
   - Nombre: `zrc-platform`
   - Permission: `Full access`
3. **COPIA la API key** (empieza con `re_`) â†’ guÃ¡rdala en un sitio seguro
4. Dashboard â†’ **Domains** â†’ Add Domain
   - Escribe: `zenithrisecapital.com`
   - Resend te da 3-5 registros DNS (TXT, CNAME, MX)
5. Ve a **IONOS** â†’ DNS de zenithrisecapital.com â†’ aÃ±ade esos registros
6. Vuelve a Resend â†’ click "Verify" â†’ espera verificaciÃ³n (5-30 min)

**MIENTRAS TANTO** puedes usar `onboarding@resend.dev` como FROM email
para pruebas (Resend lo permite sin dominio verificado).

---

## PASO 2 â€” CREAR EL REPO DEL API

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

DeberÃ­as recibir un email en tu bandeja. Si funciona, sigue al paso 3.

---

## PASO 3 â€” SUBIR API A GITHUB

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

## PASO 4 â€” DEPLOY API EN RENDER

1. https://dashboard.render.com â†’ **New +** â†’ **Web Service**
2. Conecta repo: `lmgomeze77/zrc-api`
3. ConfiguraciÃ³n:
   - **Name**: zrc-api
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
4. **Environment Variables** (MUY IMPORTANTE):
   - `RESEND_API_KEY` = `re_TU_KEY_REAL` (marca como Secret)
   - `NOTIFY_EMAIL` = `info@zenithrisecapital.com`
   - `FROM_EMAIL` = `ZRC Platform <noreply@zenithrisecapital.com>`
   - `FRONTEND_URL` = `https://zenithrisecapital.com`
5. Plan: **Free** (suficiente para empezar)
6. Click **Create Web Service**

Render te darÃ¡ una URL tipo: `https://zrc-api.onrender.com`

Verifica: abre `https://zrc-api.onrender.com/health` â†’ debe decir `{"status":"healthy"}`

---

## PASO 5 â€” CONECTAR FRONTEND AL API

En tu repo del frontend (`zrc-platform-V1_26`), abre `src/App.jsx`.

Busca la funciÃ³n `handleSubmit` dentro de `ContactForm` y reemplaza
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

**DespuÃ©s** (con Resend):
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

**DespuÃ©s:**
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

## PASO 6 â€” VERIFICAR TODO

1. Abre tu web (zenithrisecapital.com o la URL de Render)
2. Click en "SOLICITAR TEASER" de cualquier deal
3. Rellena el formulario y envÃ­a
4. Verifica que:
   - âœ… Ves el checkmark de confirmaciÃ³n en la web
   - âœ… Recibes email de notificaciÃ³n en info@zenithrisecapital.com
   - âœ… El usuario recibe email de confirmaciÃ³n
5. Registra una cuenta nueva â†’ verifica welcome email

---

## INSTRUCCIONES PARA CODEX EN VS CODE

Si usas GitHub Copilot / Codex en VS Code, aquÃ­ tienes prompts
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

### Prompt 3: AÃ±adir variable de entorno para API URL
```
@workspace Create a config utility at src/utils/config.js that exports
an API_URL constant. In development use http://localhost:3001, in production
use https://zrc-api.onrender.com. Use import.meta.env.PROD to detect environment.
Import and use this in ContactForm and AuthModal instead of hardcoded URLs.
```

### Prompt 4: AÃ±adir newsletter signup al footer
```
@workspace Add a newsletter email signup field to the Footer component.
It should be a small inline form with an email input and a "Subscribe"
button, styled to match the ZRC gold/dark aesthetic. On submit, POST
to API_URL/api/submit with type "newsletter".
```

### Prompt 5: ValidaciÃ³n de formularios
```
@workspace Add client-side validation to ContactForm: validate email
format with regex, require name (min 2 chars), show inline error messages
in red below each field. Prevent submission until all required fields
are valid. Style error messages with font-family mono, size 10px, color #EF4444.
```

### Prompt 6: Mejorar el dominio verificado en Resend
```
@workspace In the zrc-api server.js, the FROM_EMAIL uses zenithrisecapital.com
domain. Before going live, I need to verify this domain in Resend by adding
DNS records. Create a checklist comment at the top of server.js documenting
the required DNS records: SPF (TXT), DKIM (CNAME), and DMARC (TXT).
```

---

## RESUMEN DE REPOS

DespuÃ©s de todo esto tienes:

```
GitHub:
â”œâ”€â”€ lmgomeze77/zrc-platform-V1_26  â† Frontend (Static Site)
â”œâ”€â”€ lmgomeze77/zrc-api             â† API + Resend (Web Service)
â””â”€â”€ noelframil/zenith-rise-capital  â† Legacy backup (archived)

Render:
â”œâ”€â”€ zrc-platform  (Static Site)  â†’ zenithrisecapital.com
â””â”€â”€ zrc-api       (Web Service)  â†’ zrc-api.onrender.com
```

---

## COSTES

- **Render Static Site** (frontend): Gratis
- **Render Web Service** (API): Gratis (se duerme tras 15min inactividad,
  arranca en ~30s en primer request â€” aceptable para formularios)
- **Resend**: Gratis hasta 3,000 emails/mes, 100/dÃ­a
- **IONOS dominio**: Lo que ya pagas

**Para escalar** (cuando tengas trÃ¡fico real):
- Render Starter ($7/mes) para que el API no se duerma
- Resend Pro ($20/mes) para 50,000 emails/mes y dominio dedicado

---

## TROUBLESHOOTING

### "CORS error" en el navegador
â†’ Verifica que FRONTEND_URL en Render env vars coincide exactamente
  con tu dominio (incluyendo https://)

### Emails no llegan
â†’ Verifica RESEND_API_KEY en Render env vars
â†’ Comprueba Resend Dashboard â†’ Logs para ver si hay errores
â†’ Mientras no verifiques dominio, usa FROM: onboarding@resend.dev

### API responde 502 en Render
â†’ El free tier se duerme. El primer request tarda ~30s en arrancar.
â†’ SoluciÃ³n: upgrader a Starter ($7/mes) o aÃ±adir un health check
   externo que haga ping cada 10min (UptimeRobot gratis)

### Formulario envÃ­a pero no recibe email
â†’ Revisa la pestaÃ±a Network en DevTools del navegador
â†’ Busca el POST a /api/submit â†’ mira el response body
â†’ Si hay error, el mensaje te dirÃ¡ quÃ© falla
