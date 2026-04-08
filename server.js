require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Resend } = require("resend");

const app = express();
const PORT = process.env.PORT || 3001;

const resend = new Resend(process.env.RESEND_API_KEY);
const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL || "info@zenrisecapital.com";
const FROM_EMAIL = process.env.FROM_EMAIL || "ZRC Platform <noreply@zenrisecapital.com>";

// ─── MORNING INTELLIGENCE ROUTES ───
const apexAiRoute=require("./routes/apex-ai");const subscribeRoute    = require("./routes/subscribe");
const sendBriefingRoute = require("./routes/send-briefing");
const unsubscribeRoute  = require("./routes/unsubscribe");

app.use(express.json());
app.use(cors({ origin: ["https://zenrisecapital.com","https://www.zenrisecapital.com", process.env.FRONTEND_URL || "http://localhost:5173"], methods: ["POST","GET"] }));

app.get("/", (req, res) => res.json({ status: "ok", service: "ZRC API", version: "1.0.0" }));
app.get("/health", (req, res) => res.json({ status: "healthy", timestamp: new Date().toISOString() }));

app.use("/apex/ai",apexAiRoute);app.use("/api/subscribe",     subscribeRoute);
app.use("/api/send-briefing", sendBriefingRoute);
app.use("/api/unsubscribe",   unsubscribeRoute);

function buildEmailHTML({ type, data }) {
  const fields = Object.entries(data).filter(([_, v]) => v && v.trim()).map(([k, v]) => `<tr><td style="padding:8px 16px;font-family:monospace;font-size:12px;color:#999;text-transform:uppercase;letter-spacing:0.1em;vertical-align:top;width:140px;">${k}</td><td style="padding:8px 16px;font-family:sans-serif;font-size:14px;color:#E8E8E8;">${v}</td></tr>`).join("");
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#09090B;color:#FAFAFA;font-family:'Helvetica Neue',sans-serif;"><div style="max-width:600px;margin:0 auto;padding:40px 24px;"><div style="border-bottom:1px solid rgba(212,168,83,0.3);padding-bottom:24px;margin-bottom:32px;"><div style="font-family:Georgia,serif;font-size:18px;color:#FAFAFA;letter-spacing:0.1em;">◈ ZENITH RISE CAPITAL</div><div style="font-family:monospace;font-size:11px;color:#D4A853;letter-spacing:0.15em;margin-top:8px;">NEW ${type.toUpperCase()} SUBMISSION</div></div><table style="width:100%;border-collapse:collapse;background:#111113;border:1px solid #27272A;">${fields}</table><div style="margin-top:24px;font-family:monospace;font-size:10px;color:#71717A;">Received: ${new Date().toISOString()} UTC</div></div></body></html>`;
}

app.post("/api/submit", async (req, res) => {
  try {
    const { type, name, email, phone, company, message, context } = req.body;
    if (!name || !email) return res.status(400).json({ error: "Name and email are required" });
    const subjectMap = { teaser:`🏢 Teaser Request: ${context||"Investment Opportunity"}`, advisory:`💼 Advisory Inquiry from ${company||name}`, enroll:`🎓 Enrollment Request: ${context||"Course"}`, apply:`🔑 Inner Circle Application: ${name}`, contact:`📩 Contact from ${name} — ${company||"N/A"}`, register:`👤 New Registration: ${name} (${email})` };
    const subject = subjectMap[type] || `📩 ZRC Form: ${type} from ${name}`;
    const { data, error } = await resend.emails.send({ from: FROM_EMAIL, to: [NOTIFY_EMAIL], replyTo: email, subject, html: buildEmailHTML({ type: type||"contact", data: { name, email, phone, company, message, context } }) });
    if (error) return res.status(500).json({ error: "Failed to send email", detail: error });
    await resend.emails.send({ from: FROM_EMAIL, to: [email], subject: "Zenith Rise Capital — We received your request", html: `<body style="background:#09090B;color:#FAFAFA;font-family:'Helvetica Neue',sans-serif;padding:40px;"><p>Dear ${name},<br><br>Thank you for your interest. We will respond within 24-48 hours.<br><br>The ZRC Team</p></body>` });
    console.log(`✓ Form submitted: ${type} from ${email} [${data?.id}]`);
    res.json({ success: true, id: data?.id });
  } catch (err) { console.error("Server error:", err); res.status(500).json({ error: "Internal server error" }); }
});

app.post("/api/register", async (req, res) => {
  try {
    const { name, email, company, role, interest } = req.body;
    if (!name || !email) return res.status(400).json({ error: "Name and email required" });
    await resend.emails.send({ from: FROM_EMAIL, to: [NOTIFY_EMAIL], subject: `👤 New Platform Registration: ${name}`, html: buildEmailHTML({ type: "registration", data: { name, email, company, role, interest } }) });
    await resend.emails.send({ from: FROM_EMAIL, to: [email], subject: "Welcome to Zenith Rise Capital", html: `<body style="background:#09090B;color:#FAFAFA;font-family:'Helvetica Neue',sans-serif;padding:40px;"><h2>Welcome, ${name}</h2><p>You now have access to the ZRC platform. Visit <a href="https://zenrisecapital.com" style="color:#D4A853;">zenrisecapital.com</a></p></body>` });
    console.log(`✓ New registration: ${name} (${email})`);
    res.json({ success: true });
  } catch (err) { console.error("Registration error:", err); res.status(500).json({ error: "Internal server error" }); }
});

app.listen(PORT, () => { console.log(`\n  ◈ ZRC API running on port ${PORT}\n  Notify: ${NOTIFY_EMAIL}\n`); });