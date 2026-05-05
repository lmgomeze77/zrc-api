require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Resend } = require("resend");

const app = express();
const PORT = process.env.PORT || 3001;

const resend = new Resend(process.env.RESEND_API_KEY);
const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL;
const FROM_EMAIL = process.env.FROM_EMAIL;

app.use(express.json());
app.use(cors({
  origin: [
    "https://zenithrisecapital.com",
    "https://www.zenithrisecapital.com",
    "http://localhost:5173",
    "http://localhost:3000"
  ],
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

const apexAiRoute = require("./routes/apex-ai");
const subscribeRoute = require("./routes/subscribe");
const sendBriefingRoute = require("./routes/send-briefing");
const unsubscribeRoute = require("./routes/unsubscribe");
const leadRoute = require("./routes/lead");
const innerCircleRoute = require("./routes/inner-circle");

app.get("/", (req, res) => res.json({ status: "ZRC API running" }));
app.get("/health", (req, res) => res.json({ status: "ok" }));

app.use("/apex/ai", apexAiRoute);
app.use("/api/subscribe",    subscribeRoute);
app.use("/api/send-briefing", sendBriefingRoute);
app.use("/api/unsubscribe",  unsubscribeRoute);
app.use("/api/lead",         leadRoute);
app.use("/api/inner-circle", innerCircleRoute);

// ============================================================
// CONTACT FORM — /api/submit
// ============================================================

// Shared email base styles (Inner Circle standard)
const EMAIL_FONTS = `https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;1,400&family=Cormorant+SC:wght@300;400&display=swap`;

const GOLD    = "#C9A84C";
const NAVY    = "#0A1628";
const NAVY2   = "#0E1C34";
const CREAM   = "#FAF7F1";
const GRAY    = "#555555";

function innerCircleBase(bodyHtml) {
  return `<!DOCTYPE html>
<html lang="en">
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
      <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:${CREAM};border-top:3px solid ${NAVY};box-shadow:0 2px 24px rgba(0,0,0,.10);">
        <!-- Masthead -->
        <tr><td style="background:${NAVY};padding:36px 48px 28px;">
          <p style="margin:0 0 8px;font-family:'Cormorant SC',serif;font-size:9px;font-weight:300;letter-spacing:.5em;color:rgba(201,168,76,.7);text-transform:uppercase;">ZRC Confidential</p>
          <p style="margin:0 0 20px;font-family:'EB Garamond',serif;font-size:38px;font-style:italic;font-weight:400;color:#FAF7F1;line-height:1;letter-spacing:-.02em;">Zenith Rise Capital</p>
          <div style="height:1px;background:rgba(201,168,76,.25);"></div>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:40px 48px;">${bodyHtml}</td></tr>
        <!-- Footer -->
        <tr><td style="background:${NAVY2};padding:20px 48px;display:flex;justify-content:space-between;">
          <p style="margin:0;font-family:'Cormorant SC',serif;font-size:9px;letter-spacing:.3em;color:rgba(250,247,241,.3);">Zenith Rise Capital &nbsp;&middot;&nbsp; Calesius Global SL</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function confirmationEmailHTML({ name }) {
  return innerCircleBase(`
    <p style="margin:0 0 24px;font-family:'Cormorant SC',serif;font-size:9px;letter-spacing:.4em;color:${GOLD};text-transform:uppercase;">Confirmation</p>
    <p style="margin:0 0 20px;font-size:22px;color:${NAVY};line-height:1.4;">Dear ${name},</p>
    <p style="margin:0 0 20px;font-size:18px;color:#333;line-height:1.8;font-style:italic;">Thank you for reaching out to Zenith Rise Capital. We have received your request and will respond within 24 to 48 hours.</p>
    <p style="margin:0 0 32px;font-size:18px;color:#333;line-height:1.8;font-style:italic;">For urgent matters, you may reach us directly at <a href="mailto:luis@zenithrisecapital.com" style="color:${GOLD};text-decoration:none;">luis@zenithrisecapital.com</a>.</p>
    <div style="border-top:1px solid #E0D8C8;padding-top:24px;margin-top:8px;">
      <p style="margin:0 0 4px;font-size:18px;color:${NAVY};font-weight:500;">Luis Miguel Gomez</p>
      <p style="margin:0;font-family:'Cormorant SC',serif;font-size:9px;letter-spacing:.3em;color:#888;text-transform:uppercase;">Founder &amp; CIO &nbsp;&middot;&nbsp; Zenith Rise Capital</p>
    </div>
  `);
}

function notifyEmailHTML({ name, email, phone, company, message, context }) {
  const rows = [
    ["NAME",    name    || "-"],
    ["EMAIL",   email   || "-"],
    ["PHONE",   phone   || "-"],
    ["COMPANY", company || "-"],
    ["MESSAGE", message || "-"],
    ["CONTEXT", context || "-"],
  ];
  const rowsHtml = rows.map(([label, value]) => `
    <tr>
      <td style="padding:10px 16px;font-family:'Cormorant SC',serif;font-size:9px;letter-spacing:.25em;color:#999;text-transform:uppercase;width:120px;vertical-align:top;border-bottom:1px solid #1A2A40;">${label}</td>
      <td style="padding:10px 16px;font-size:17px;color:#E8E0CC;line-height:1.6;border-bottom:1px solid #1A2A40;">${value}</td>
    </tr>
  `).join("");

  const bodyHtml = `
    <p style="margin:0 0 24px;font-family:'Cormorant SC',serif;font-size:9px;letter-spacing:.4em;color:${GOLD};text-transform:uppercase;">New Contact Submission</p>
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0E1A2E;border:1px solid #1A2A40;">${rowsHtml}</table>
    <p style="margin:24px 0 0;font-size:14px;color:${GRAY};font-style:italic;">Received: ${new Date().toISOString()} UTC</p>
  `;

  // Override masthead background for internal notify emails stays dark
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ZRC - New Contact</title>
  <link href="${EMAIL_FONTS}" rel="stylesheet" />
</head>
<body style="margin:0;padding:0;background:#06080C;font-family:'EB Garamond',Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#06080C;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#0A1628;border-top:3px solid ${GOLD};">
        <tr><td style="padding:36px 48px 24px;border-bottom:1px solid rgba(201,168,76,.2);">
          <p style="margin:0 0 6px;font-family:'Cormorant SC',serif;font-size:9px;letter-spacing:.5em;color:rgba(201,168,76,.6);">ZENITH RISE CAPITAL</p>
          <p style="margin:0;font-family:'Cormorant SC',serif;font-size:11px;letter-spacing:.3em;color:${GOLD};text-transform:uppercase;">New Contact Submission</p>
        </td></tr>
        <tr><td style="padding:36px 48px;">${bodyHtml}</td></tr>
        <tr><td style="padding:16px 48px;border-top:1px solid rgba(201,168,76,.15);">
          <p style="margin:0;font-family:'Cormorant SC',serif;font-size:9px;letter-spacing:.25em;color:rgba(250,247,241,.2);">Internal &nbsp;&middot;&nbsp; Not for distribution outside ZRC</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

app.post("/api/submit", async (req, res) => {
  try {
    const { type, name, email, phone, company, message, context } = req.body;
    if (!name || !email) return res.status(400).json({ error: "Name and email are required" });

    const subjectMap = {
      teaser:    "ZRC - Teaser Request: " + (context || ""),
      brokerage: "ZRC - Brokerage Inquiry: " + (context || ""),
      advisory:  "ZRC - Advisory Mandate: " + (context || ""),
      contact:   "ZRC - Contact: " + (context || "General"),
    };

    const notifySubject = subjectMap[type] || ("ZRC - New submission: " + (type || "unknown"));
    const confirmSubject = "Zenith Rise Capital - We received your request";

    // Send internal notification to ZRC
    await resend.emails.send({
      from: FROM_EMAIL,
      to: [NOTIFY_EMAIL],
      reply_to: email,
      subject: notifySubject,
      html: notifyEmailHTML({ name, email, phone, company, message, context }),
    });

    // Send confirmation to the sender
    await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject: confirmSubject,
      html: confirmationEmailHTML({ name }),
    });

    res.json({ ok: true });
  } catch (err) {
    console.error("Submit error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(PORT, () => console.log("ZRC API listening on port " + PORT));
