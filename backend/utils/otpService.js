const nodemailer = require('nodemailer');

// ─── Email Transporter ───────────────────────────────────────────
// Requires EMAIL_USER and EMAIL_PASS in .env (Gmail App Password).
// Guide: myaccount.google.com → Security → 2-Step → App Passwords
let transporter = null;

if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  console.log(`[EMAIL] ✅ Gmail configured: ${process.env.EMAIL_USER}`);
} else {
  console.warn('[EMAIL] ⚠️  No EMAIL_USER/EMAIL_PASS set — running in dev mode. OTPs will appear in API responses only.');
}

// ─── Generate OTP ────────────────────────────────────────────────
exports.generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// ─── Send Email Helper ───────────────────────────────────────────
async function sendEmail(to, subject, text, html) {
  if (!transporter) {
    // Dev mode: just log to console
    console.log(`\n${'─'.repeat(50)}`);
    console.log(`[DEV EMAIL] To: ${to}`);
    console.log(`[DEV EMAIL] Subject: ${subject}`);
    console.log(`[DEV EMAIL] ${text}`);
    console.log(`${'─'.repeat(50)}\n`);
    return { devMode: true };
  }
  try {
    await transporter.sendMail({
      from: `"EASY Marketplace" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    });
    console.log(`[EMAIL] ✅ Sent to ${to}`);
    return { sent: true };
  } catch (err) {
    console.error(`[EMAIL] ❌ Failed to send to ${to}:`, err.message);
    // Don't throw — let the app continue even if email fails
    return { error: err.message };
  }
}

// ─── Send Signup Verification OTP ───────────────────────────────
exports.sendEmailOTP = async (email, otp) => {
  return sendEmail(
    email,
    `${otp} — Your EASY verification code`,
    `Your EASY verification code is: ${otp}. It expires in 10 minutes.`,
    buildOtpEmail({
      otp,
      heading: 'Verify your email',
      subtext: 'Use this code to complete your EASY Marketplace account setup. Do not share it with anyone.',
      color: '#0ea5e9',
    })
  );
};

// ─── Send Password Reset OTP ─────────────────────────────────────
exports.sendPasswordResetOTP = async (email, otp) => {
  return sendEmail(
    email,
    `${otp} — EASY password reset code`,
    `Your EASY password reset code is: ${otp}. It expires in 10 minutes. If you didn't request this, ignore this email.`,
    buildOtpEmail({
      otp,
      heading: 'Reset your password',
      subtext: "Use this code to reset your EASY Marketplace password. If you didn't request a password reset, you can safely ignore this email.",
      color: '#7c3aed',
    })
  );
};

// ─── Professional HTML Email Template ───────────────────────────
function buildOtpEmail({ otp, heading, subtext, color }) {
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${heading}</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 32px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,${color} 0%,${darken(color)} 100%);padding:36px 40px;text-align:center;">
              <p style="margin:0;font-size:30px;font-weight:900;color:#fff;letter-spacing:-1px;line-height:1;">EASY</p>
              <p style="margin:4px 0 0;font-size:12px;color:rgba(255,255,255,0.75);font-weight:600;letter-spacing:2px;text-transform:uppercase;">Marketplace</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <h2 style="margin:0 0 10px;font-size:22px;font-weight:800;color:#111827;">${heading}</h2>
              <p style="margin:0 0 32px;font-size:14px;color:#6b7280;line-height:1.7;">${subtext}</p>

              <!-- OTP Box -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="background:#f8fafc;border:2px dashed ${color};border-radius:16px;padding:28px 20px;">
                    <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:${color};text-transform:uppercase;letter-spacing:2px;">Your verification code</p>
                    <p style="margin:0;font-size:46px;font-weight:900;color:#111827;letter-spacing:16px;font-family:'Courier New',Courier,monospace;line-height:1;">${otp}</p>
                  </td>
                </tr>
              </table>

              <p style="margin:24px 0 0;font-size:13px;color:#9ca3af;text-align:center;">
                ⏱ This code expires in <strong style="color:#374151;">10 minutes</strong>
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr><td style="padding:0 40px;"><hr style="border:none;border-top:1px solid #f0f0f0;"></td></tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px 32px;text-align:center;">
              <p style="margin:0 0 6px;font-size:12px;color:#9ca3af;line-height:1.6;">
                If you did not request this, you can safely ignore this email.<br>Your account security is not compromised.
              </p>
              <p style="margin:16px 0 0;font-size:11px;color:#d1d5db;">
                © ${year} EASY Marketplace &nbsp;·&nbsp; Lucknow, India
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// Simple color darkening for gradient
function darken(hex) {
  const colors = {
    '#0ea5e9': '#0284c7',
    '#7c3aed': '#5b21b6',
  };
  return colors[hex] || hex;
}
