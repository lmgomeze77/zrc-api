// routes/lead.js
// ZRC API · Endpoint /api/lead — captura de leads del Visor Inmobiliario

const express = require("express");
const { Resend } = require("resend");
const router = express.Router();

const resend = new Resend(process.env.RESEND_API_KEY);
const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL || "info@zenithrisecapital.com";
const FROM_EMAIL = process.env.FROM_EMAIL || "ZRC Platform <noreply@zenithrisecapital.com>";

// ============================================================
// POST /api/lead
// ============================================================
router.post("/", async (req, res) => {
  try {
    const { email, sector, source, rc, parcela } = req.body;

    // Validación
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ error: "Email inválido" });
    }
    if (!sector || sector.length > 100) {
      return res.status(400).json({ error: "Sector inválido" });
    }

    const sourceClean = (source || "visor-inmobiliario").substring(0, 50);
    const rcClean = rc ? String(rc).substring(0, 20) : null;
    const parcelaClean = parcela && typeof parcela === "object" ? parcela : null;

    // Email notify a info@
    const notifyResult = await resend.emails.send({
      from: FROM_EMAIL,
      to: [NOTIFY_EMAIL],
      replyTo: email,
      subject: `🔔 Lead Visor — ${sector}${rcClean ? ` · RC ${rcClean.substring(0, 8)}…` : ""}`,
      html: notifyEmailHTML({ email, sector, source: sourceClean, rc: rcClean, parcela: parcelaClean }),
    });

    if (notifyResult.error) {
      console.error("Resend notify error:", notifyResult.error);
      return res.status(500).json({ error: "Failed to send notification" });
    }

    // Email bienvenida al lead
    await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject: "Acceso al Visor Inmobiliario · ZRC Labs",
      html: welcomeEmailHTML({ email, sector }),
    });

    console.log(`✓ Visor lead: ${email} (${sector})${rcClean ? ` RC=${rcClean}` : ""} [${notifyResult.data?.id}]`);
    res.json({ success: true });
  } catch (err) {
    console.error("Lead endpoint error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ============================================================
// HELPERS
// ============================================================
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function escapeHTML(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[c]);
}

// ============================================================
// EMAIL TEMPLATES
// ============================================================
function notifyEmailHTML({ email, sector, source, rc, parcela }) {
  const parcelaRows = parcela ? `
    ${parcela.municipio ? `<tr><td style="padding:8px 16px;font-family:monospace;font-size:12px;color:#999;text-transform:uppercase;letter-spacing:0.1em;width:140px;">Municipio</td><td style="padding:8px 16px;font-family:sans-serif;font-size:14px;color:#E8E8E8;">${escapeHTML(parcela.municipio)}, ${escapeHTML(parcela.provincia || "")}</td></tr>` : ""}
    ${parcela.uso ? `<tr><td style="padding:8px 16px;font-family:monospace;font-size:12px;color:#999;text-transform:uppercase;letter-spacing:0.1em;">Uso</td><td style="padding:8px 16px;font-family:sans-serif;font-size:14px;color:#E8E8E8;">${escapeHTML(parcela.uso)}</td></tr>` : ""}
    ${parcela.superficie ? `<tr><td style="padding:8px 16px;font-family:monospace;font-size:12px;color:#999;text-transform:uppercase;letter-spacing:0.1em;">Superficie</td><td style="padding:8px 16px;font-family:sans-serif;font-size:14px;color:#E8E8E8;">${parcela.superficie.toLocaleString("es-ES")} m²</td></tr>` : ""}
  ` : "";

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#09090B;color:#FAFAFA;font-family:'Helvetica Neue',sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 24px;">
    <div style="border-bottom:1px solid rgba(212,168,83,0.3);padding-bottom:24px;margin-bottom:32px;">
      <div style="font-family:Georgia,serif;font-size:18px;color:#FAFAFA;letter-spacing:0.1em;">◈ ZENITH RISE CAPITAL</div>
      <div style="font-family:monospace;font-size:11px;color:#D4A853;letter-spacing:0.15em;margin-top:8px;">ZRC LABS · NEW VISOR LEAD</div>
    </div>
    <table style="width:100%;border-collapse:collapse;background:#111113;border:1px solid #27272A;">
      <tr>
        <td style="padding:8px 16px;font-family:monospace;font-size:12px;color:#999;text-transform:uppercase;letter-spacing:0.1em;width:140px;">Email</td>
        <td style="padding:8px 16px;font-family:sans-serif;font-size:14px;color:#E8E8E8;"><strong style="color:#D4A853;">${escapeHTML(email)}</strong></td>
      </tr>
      <tr>
        <td style="padding:8px 16px;font-family:monospace;font-size:12px;color:#999;text-transform:uppercase;letter-spacing:0.1em;">Sector</td>
        <td style="padding:8px 16px;font-family:sans-serif;font-size:14px;color:#E8E8E8;">${escapeHTML(sector)}</td>
      </tr>
      <tr>
        <td style="padding:8px 16px;font-family:monospace;font-size:12px;color:#999;text-transform:uppercase;letter-spacing:0.1em;">Fuente</td>
        <td style="padding:8px 16px;font-family:monospace;font-size:12px;color:#E8E8E8;">${escapeHTML(source)}</td>
      </tr>
      ${rc ? `<tr>
        <td style="padding:8px 16px;font-family:monospace;font-size:12px;color:#999;text-transform:uppercase;letter-spacing:0.1em;">Última RC</td>
        <td style="padding:8px 16px;font-family:monospace;font-size:12px;color:#E8E8E8;">${escapeHTML(rc)}</td>
      </tr>` : ""}
      ${parcelaRows}
    </table>
    <div style="margin-top:24px;font-family:monospace;font-size:10px;color:#71717A;">Received: ${new Date().toISOString()} UTC · Reply directly to contact the lead</div>
  </div>
</body></html>`;
}

function welcomeEmailHTML({ email, sector }) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#F5F3EE;color:#1A1A1A;font-family:'Helvetica Neue',sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#FFFFFF;padding:40px;border-top:3px solid #D4A853;">
    <div style="font-family:monospace;font-size:10px;letter-spacing:0.2em;color:#D4A853;text-transform:uppercase;margin-bottom:16px;">
      ZENITH RISE CAPITAL · LABS
    </div>
    <h1 style="font-family:Georgia,serif;font-weight:400;font-size:28px;margin:0 0 16px;color:#0B1F3F;">
      Bienvenido al Visor Inmobiliario
    </h1>
    <p style="font-size:15px;line-height:1.7;color:#404040;margin:0 0 16px;">
      Gracias por registrarte. Tu acceso al modo demo del Visor está activo:
      búsquedas ilimitadas por referencia catastral, capas de riesgo, alertas
      regulatorias y matching con mandatos ZRC.
    </p>
    <p style="font-size:15px;line-height:1.7;color:#404040;margin:0 0 24px;">
      También recibirás cada mes el informe <em>Zenrise State</em> con
      indicadores macro y señales de mercado extraídas de nuestras herramientas.
    </p>
    <a href="https://zenithrisecapital.com" style="display:inline-block;padding:12px 28px;background:#0B1F3F;color:#FFFFFF;text-decoration:none;font-family:monospace;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;font-weight:600;">
      Volver al Visor
    </a>
    <div style="margin-top:32px;padding-top:20px;border-top:1px solid #E8E5DC;font-size:12px;color:#71717A;line-height:1.6;">
      Zenith Rise Capital · Calesius Global S.L.<br>
      Madrid · zenithrisecapital.com
    </div>
  </div>
</body></html>`;
}

module.exports = router;
