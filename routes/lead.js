// routes/lead.js
// ZRC API - Endpoint /api/lead - Visor Inmobiliario lead capture

const express = require("express");
const { Resend } = require("resend");
const router = express.Router();

const resend = new Resend(process.env.RESEND_API_KEY);
const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL;
const FROM_EMAIL   = process.env.FROM_EMAIL;

// ============================================================
// SHARED DESIGN TOKENS
// ============================================================
const GOLD  = "#C9A84C";
const NAVY  = "#0A1628";
const NAVY2 = "#0E1C34";
const EMAIL_FONTS = "https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;1,400&family=Cormorant+SC:wght@300;400&display=swap";

// ============================================================
// HELPERS
// ============================================================
function isValidEmail(e) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e).toLowerCase());
}

function esc(str) {
  if (!str) return "-";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/'/g, "&#39;")
    .replace(/"/g, "&quot;");
}

// ============================================================
// EMAIL TEMPLATES
// ============================================================

function notifyEmailHTML({ email, sector, source, rc, parcela }) {
  const rcClean = rc ? String(rc).replace(/[^a-zA-Z0-9\-]/g, "").substring(0, 12) : null;

  const rows = [
    ["EMAIL",   esc(email)],
    ["SECTOR",  esc(sector)],
    ["FUENTE",  esc(source)],
    ["RC",      rcClean ? esc(rcClean) : "-"],
    ["PARCELA", esc(parcela)],
  ];

  const rowsHtml = rows.map(([label, value]) => `
    <tr>
      <td style="padding:10px 16px;font-family:'Cormorant SC',serif;font-size:9px;letter-spacing:.25em;color:#8899AA;text-transform:uppercase;width:110px;vertical-align:top;border-bottom:1px solid #1A2A40;">${label}</td>
      <td style="padding:10px 16px;font-size:16px;color:#E8E0CC;line-height:1.6;border-bottom:1px solid #1A2A40;">${value}</td>
    </tr>
  `).join("");

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ZRC - Lead Visor</title>
  <link href="${EMAIL_FONTS}" rel="stylesheet" />
</head>
<body style="margin:0;padding:0;background:#06080C;font-family:'EB Garamond',Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#06080C;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:${NAVY};border-top:3px solid ${GOLD};">
        <tr><td style="padding:32px 48px 24px;border-bottom:1px solid rgba(201,168,76,.2);">
          <p style="margin:0 0 6px;font-family:'Cormorant SC',serif;font-size:9px;letter-spacing:.5em;color:rgba(201,168,76,.6);">ZENITH RISE CAPITAL</p>
          <p style="margin:0;font-family:'Cormorant SC',serif;font-size:11px;letter-spacing:.3em;color:${GOLD};text-transform:uppercase;">Nuevo Lead - Visor Inmobiliario</p>
        </td></tr>
        <tr><td style="padding:32px 48px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0E1A2E;border:1px solid #1A2A40;">${rowsHtml}</table>
          <p style="margin:20px 0 0;font-size:13px;color:#556677;font-style:italic;">Recibido: ${new Date().toISOString()} UTC - Responde directamente al lead</p>
        </td></tr>
        <tr><td style="padding:16px 48px;border-top:1px solid rgba(201,168,76,.15);">
          <p style="margin:0;font-family:'Cormorant SC',serif;font-size:9px;letter-spacing:.25em;color:rgba(250,247,241,.2);">Uso interno - No distribuir fuera de ZRC</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function welcomeEmailHTML({ email, sector }) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Zenith Rise Capital</title>
  <link href="${EMAIL_FONTS}" rel="stylesheet" />
</head>
<body style="margin:0;padding:0;background:#E8E4DC;font-family:'EB Garamond',Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#E8E4DC;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#FAF7F1;border-top:3px solid ${NAVY};box-shadow:0 2px 24px rgba(0,0,0,.10);">
        <tr><td style="background:${NAVY};padding:36px 48px 28px;">
          <p style="margin:0 0 8px;font-family:'Cormorant SC',serif;font-size:9px;font-weight:300;letter-spacing:.5em;color:rgba(201,168,76,.7);">ZRC Visor Inmobiliario</p>
          <p style="margin:0 0 20px;font-family:'EB Garamond',serif;font-size:36px;font-style:italic;font-weight:400;color:#FAF7F1;line-height:1;letter-spacing:-.02em;">Zenith Rise Capital</p>
          <div style="height:1px;background:rgba(201,168,76,.25);"></div>
        </td></tr>
        <tr><td style="padding:40px 48px;">
          <p style="margin:0 0 24px;font-family:'Cormorant SC',serif;font-size:9px;letter-spacing:.4em;color:${GOLD};text-transform:uppercase;">Solicitud Recibida</p>
          <p style="margin:0 0 20px;font-size:20px;color:${NAVY};line-height:1.4;">Gracias por su interes en el sector <strong style="font-weight:500;">${esc(sector)}</strong>.</p>
          <p style="margin:0 0 20px;font-size:18px;color:#333;line-height:1.8;font-style:italic;">Hemos recibido su solicitud y nos pondremos en contacto en las proximas 24 a 48 horas con informacion relevante sobre oportunidades en este segmento.</p>
          <p style="margin:0 0 32px;font-size:18px;color:#333;line-height:1.8;font-style:italic;">Para consultas urgentes puede escribirnos directamente a <a href="mailto:luis@zenithrisecapital.com" style="color:${GOLD};text-decoration:none;">luis@zenithrisecapital.com</a>.</p>
          <div style="border-top:1px solid #E0D8C8;padding-top:24px;margin-top:8px;">
            <p style="margin:0 0 4px;font-size:18px;color:${NAVY};font-weight:500;">Luis Miguel Gomez</p>
            <p style="margin:0;font-family:'Cormorant SC',serif;font-size:9px;letter-spacing:.3em;color:#888;text-transform:uppercase;">Founder &amp; CIO - Zenith Rise Capital</p>
          </div>
        </td></tr>
        <tr><td style="background:${NAVY2};padding:20px 48px;">
          <p style="margin:0;font-family:'Cormorant SC',serif;font-size:9px;letter-spacing:.3em;color:rgba(250,247,241,.3);">Zenith Rise Capital &nbsp;&middot;&nbsp; Calesius Global SL</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ============================================================
// ROUTE
// ============================================================

router.post("/", async (req, res) => {
  try {
    const { email, sector, source, rc, parcela } = req.body;

    // Validation
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ error: "Email invalido" });
    }
    if (!sector || sector.length > 100) {
      return res.status(400).json({ error: "Sector invalido" });
    }

    const rcClean = rc ? String(rc).replace(/[^a-zA-Z0-9\-]/g, "").substring(0, 12) : null;

    const notifySubject = "ZRC Visor - Lead: " + sector + (rcClean ? " - RC " + rcClean : "");
    const welcomeSubject = "Zenith Rise Capital - Solicitud recibida";

    // Send internal notification
    await resend.emails.send({
      from: FROM_EMAIL,
      to: [NOTIFY_EMAIL],
      reply_to: email,
      subject: notifySubject,
      html: notifyEmailHTML({ email, sector, source, rc, parcela }),
    });

    // Send confirmation to user
    await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject: welcomeSubject,
      html: welcomeEmailHTML({ email, sector }),
    });

    res.json({ ok: true });

  } catch (err) {
    console.error("Lead route error:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

module.exports = router;
