require("dotenv").config();
// ═══════════════════════════════════════════════════════════════
// ZRC API — Form Submission + Email Service (Resend)
// Deploy as a separate Web Service on Render
// ═══════════════════════════════════════════════════════════════

const express = require("express");
const cors = require("cors");
const { Resend } = require("resend");

const app = express();
const PORT = process.env.PORT || 3001;

// ─── CONFIG ───
const resend = new Resend(process.env.RESEND_API_KEY);
const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL || "info@zenrisecapital.com";
const FROM_EMAIL = process.env.FROM_EMAIL || "ZRC Platform <noreply@zenrisecapital.com>";

// ─── MIDDLEWARE ───
app.use(express.json());
app.use(
  cors({
    origin: [
      "https://zenrisecapital.com",
      "https://www.zenrisecapital.com",
      process.env.FRONTEND_URL || "http://localhost:5173",
    ],
    methods: ["POST", "GET"],
  })
);

// ─── HEALTH CHECK ───
app.get("/", (req, res) => {
  res.json({ status: "ok", service: "ZRC API", version: "1.0.0" });
});

app.get("/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// ─── EMAIL TEMPLATE ───
function buildEmailHTML({ type, data }) {
  const fields = Object.entries(data)
    .filter(([_, v]) => v && v.trim())
    .map(
      ([k, v]) => `
      <tr>
        <td style="padding:8px 16px;font-family:monospace;font-size:12px;color:#999;text-transform:uppercase;letter-spacing:0.1em;vertical-align:top;width:140px;">${k}</td>
        <td style="padding:8px 16px;font-family:sans-serif;font-size:14px;color:#E8E8E8;">${v}</td>
      </tr>`
    )
    .join("");

  return `
  <!DOCTYPE html>
  <html>
  <head><meta charset="utf-8"></head>
  <body style="margin:0;padding:0;background:#09090B;color:#FAFAFA;font-family:'Helvetica Neue',sans-serif;">
    <div style="max-width:600px;margin:0 auto;padding:40px 24px;">
      <!-- Header -->
      <div style="border-bottom:1px solid rgba(212,168,83,0.3);padding-bottom:24px;margin-bottom:32px;">
        <div style="font-family:Georgia,serif;font-size:18px;color:#FAFAFA;letter-spacing:0.1em;">◈ ZENITH RISE CAPITAL</div>
        <div style="font-family:monospace;font-size:11px;color:#D4A853;letter-spacing:0.15em;margin-top:8px;">NEW ${type.toUpperCase()} SUBMISSION</div>
      </div>

      <!-- Type badge -->
      <div style="display:inline-block;padding:4px 12px;background:rgba(212,168,83,0.12);border:1px solid rgba(212,168,83,0.25);font-family:monospace;font-size:10px;color:#D4A853;letter-spacing:0.12em;margin-bottom:24px;">
        ${type.toUpperCase()}
      </div>

      <!-- Data table -->
      <table style="width:100%;border-collapse:collapse;background:#111113;border:1px solid #27272A;">
        ${fields}
      </table>

      <!-- Timestamp -->
      <div style="margin-top:24px;font-family:monospace;font-size:10px;color:#71717A;">
        Received: ${new Date().toISOString()} UTC
      </div>

      <!-- Footer -->
      <div style="margin-top:40px;padding-top:16px;border-top:1px solid #27272A;font-family:monospace;font-size:9px;color:#71717A;">
        ZRC Platform · Automated notification · zenrisecapital.com
      </div>
    </div>
  </body>
  </html>`;
}

// ─── FORM SUBMISSION ENDPOINT ───
app.post("/api/submit", async (req, res) => {
  try {
    const { type, name, email, phone, company, message, context } = req.body;

    // Validate required fields
    if (!name || !email) {
      return res.status(400).json({ error: "Name and email are required" });
    }

    // Build subject based on form type
    const subjectMap = {
      teaser: `🏢 Teaser Request: ${context || "Investment Opportunity"}`,
      advisory: `💼 Advisory Inquiry from ${company || name}`,
      enroll: `🎓 Enrollment Request: ${context || "Course"}`,
      apply: `🔑 Inner Circle Application: ${name}`,
      contact: `📩 Contact from ${name} — ${company || "N/A"}`,
      register: `👤 New Registration: ${name} (${email})`,
    };

    const subject = subjectMap[type] || `📩 ZRC Form: ${type} from ${name}`;

    // Send notification email to ZRC team
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [NOTIFY_EMAIL],
      replyTo: email,
      subject: subject,
      html: buildEmailHTML({
        type: type || "contact",
        data: { name, email, phone, company, message, context },
      }),
    });

    if (error) {
      console.error("Resend error FULL:", JSON.stringify(error, null, 2));
      return res.status(500).json({ error: "Failed to send email", detail: error });
    }

    // Send confirmation email to the user
    await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject: "Zenith Rise Capital — We received your request",
      html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="margin:0;padding:0;background:#09090B;color:#FAFAFA;font-family:'Helvetica Neue',sans-serif;">
        <div style="max-width:520px;margin:0 auto;padding:40px 24px;">
          <div style="font-family:Georgia,serif;font-size:18px;color:#FAFAFA;letter-spacing:0.1em;margin-bottom:8px;">◈ ZENITH RISE CAPITAL</div>
          <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(212,168,83,0.4),transparent);margin:20px 0 28px;"></div>
          <p style="font-family:sans-serif;font-size:15px;color:#A1A1AA;line-height:1.7;">
            Dear ${name},<br><br>
            Thank you for your interest in Zenith Rise Capital. We have received your request and our team will review it shortly.<br><br>
            You can expect a response within 24-48 business hours.<br><br>
            Best regards,<br>
            <span style="color:#D4A853;">The ZRC Team</span>
          </p>
          <div style="margin-top:32px;padding-top:16px;border-top:1px solid #27272A;font-family:monospace;font-size:9px;color:#71717A;">
            Zenith Rise Capital · Calesius Global SL · Madrid<br>
            zenrisecapital.com
          </div>
        </div>
      </body>
      </html>`,
    });

    console.log(`✓ Form submitted: ${type} from ${email} [${data?.id}]`);
    res.json({ success: true, id: data?.id });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── USER REGISTRATION ENDPOINT ───
app.post("/api/register", async (req, res) => {
  try {
    const { name, email, company, role, interest } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: "Name and email required" });
    }

    // Notify ZRC of new registration
    await resend.emails.send({
      from: FROM_EMAIL,
      to: [NOTIFY_EMAIL],
      subject: `👤 New Platform Registration: ${name}`,
      html: buildEmailHTML({
        type: "registration",
        data: { name, email, company, role, interest },
      }),
    });

    // Send welcome email
    await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject: "Welcome to Zenith Rise Capital",
      html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="margin:0;padding:0;background:#09090B;color:#FAFAFA;font-family:'Helvetica Neue',sans-serif;">
        <div style="max-width:520px;margin:0 auto;padding:40px 24px;">
          <div style="font-family:Georgia,serif;font-size:18px;color:#FAFAFA;letter-spacing:0.1em;margin-bottom:8px;">◈ ZENITH RISE CAPITAL</div>
          <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(212,168,83,0.4),transparent);margin:20px 0 28px;"></div>

          <h2 style="font-family:Georgia,serif;font-size:24px;font-weight:300;color:#FAFAFA;margin:0 0 16px;">Welcome, ${name}</h2>

          <p style="font-family:sans-serif;font-size:15px;color:#A1A1AA;line-height:1.7;">
            You now have access to:<br><br>
            <span style="color:#D4A853;">◈</span> Geopolitical Observatory — full intelligence feed<br>
            <span style="color:#D4A853;">◈</span> Investor Intelligence — analytical applications<br>
            <span style="color:#D4A853;">◈</span> Inner Circle — community discussions<br>
            <span style="color:#D4A853;">◈</span> Priority access to Singular Opportunities<br><br>
            Visit <a href="https://zenrisecapital.com" style="color:#D4A853;">zenrisecapital.com</a> to explore.
          </p>

          <div style="margin-top:32px;padding-top:16px;border-top:1px solid #27272A;font-family:monospace;font-size:9px;color:#71717A;">
            Zenith Rise Capital · Calesius Global SL · Madrid
          </div>
        </div>
      </body>
      </html>`,
    });

    console.log(`✓ New registration: ${name} (${email})`);
    res.json({ success: true });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── START ───
app.listen(PORT, () => {
  console.log(`\n  ◈ ZRC API running on port ${PORT}`);
  console.log(`  Notify: ${NOTIFY_EMAIL}\n`);
});


