import nodemailer from 'nodemailer';

const APP_URL = process.env.APP_URL || 'http://localhost:5173';
const APP_NAME = process.env.APP_NAME || 'Marketing Board';

function isSmtpReady(): boolean {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function createTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true', // true for 465
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

function getFrom(): string {
  return process.env.SMTP_FROM || `${APP_NAME} <${process.env.SMTP_USER || 'noreply@example.com'}>`;
}

async function sendMail(to: string, subject: string, html: string): Promise<boolean> {
  const smtpReady = isSmtpReady();
  console.log(`[Email] SMTP ready: ${smtpReady} (HOST=${process.env.SMTP_HOST}, USER=${process.env.SMTP_USER ? 'set' : 'empty'}, PASS=${process.env.SMTP_PASS ? 'set' : 'empty'})`);

  if (!smtpReady) {
    console.log('[Email] SMTP not configured, skipping send');
    return false;
  }

  try {
    const transport = createTransport();
    console.log(`[Email] Attempting to send to ${to}...`);
    const info = await transport.sendMail({ from: getFrom(), to, subject, html });
    console.log(`[Email] Sent to ${to}: "${subject}" (messageId: ${info.messageId})`);
    return true;
  } catch (err: any) {
    console.error(`[Email] Failed to send to ${to}:`, err?.message || err);
    return false;
  }
}

// ── Invite Email ──

interface InviteEmailParams {
  to: string;
  name?: string;
  token: string;
  role: string;
  invitedByName: string;
  expiresAt: Date;
}

export async function sendInviteEmail(params: InviteEmailParams): Promise<void> {
  const registerUrl = `${APP_URL}/signup?token=${params.token}`;
  const expiresDate = params.expiresAt.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#f1f5f9;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:40px 0;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;border:1px solid #e2e8f0;padding:32px 24px;font-family:'Segoe UI',Arial,sans-serif;">
        <tr><td>
          <h2 style="margin:0 0 8px;color:#1e293b;font-size:20px;">You're Invited!</h2>
          <p style="margin:0 0 20px;color:#64748b;font-size:14px;line-height:1.6;">
            <strong>${params.invitedByName}</strong> has invited you to join <strong>${APP_NAME}</strong> as <strong>${params.role}</strong>.
          </p>
          <table cellpadding="0" cellspacing="0"><tr><td style="background-color:#4f46e5;border-radius:8px;padding:12px 28px;">
            <a href="${registerUrl}" style="color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;display:inline-block;">Create Your Account</a>
          </td></tr></table>
          <p style="margin:20px 0 0;color:#94a3b8;font-size:12px;">
            This link expires on ${expiresDate}.<br/>
            If you can't click the button, copy this URL:<br/>
            <span style="color:#6366f1;word-break:break-all;">${registerUrl}</span>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const sent = await sendMail(params.to, `You've been invited to ${APP_NAME}`, html);

  // Always log to console as backup
  if (!sent) {
    console.log('');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`  INVITE EMAIL ${isSmtpReady() ? '(SMTP failed — showing here)' : '(SMTP not configured)'}`);
    console.log('═══════════════════════════════════════════════════════');
    console.log(`  To:          ${params.to}`);
    console.log(`  Role:        ${params.role}`);
    console.log(`  Invited By:  ${params.invitedByName}`);
    console.log(`  Expires:     ${params.expiresAt.toISOString()}`);
    console.log('───────────────────────────────────────────────────────');
    console.log(`  Register URL: ${registerUrl}`);
    console.log('═══════════════════════════════════════════════════════');
    console.log('');
  }
}

// ── Password Reset Email ──

interface PasswordResetEmailParams {
  to: string;
  token: string;
  expiresAt: Date;
}

export async function sendPasswordResetEmail(params: PasswordResetEmailParams): Promise<void> {
  const resetUrl = `${APP_URL}/reset-password?token=${params.token}`;

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#f1f5f9;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:40px 0;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;border:1px solid #e2e8f0;padding:32px 24px;font-family:'Segoe UI',Arial,sans-serif;">
        <tr><td>
          <h2 style="margin:0 0 8px;color:#1e293b;font-size:20px;">Password Reset</h2>
          <p style="margin:0 0 20px;color:#64748b;font-size:14px;line-height:1.6;">
            You requested a password reset for your <strong>${APP_NAME}</strong> account.
          </p>
          <table cellpadding="0" cellspacing="0"><tr><td style="background-color:#4f46e5;border-radius:8px;padding:12px 28px;">
            <a href="${resetUrl}" style="color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;display:inline-block;">Reset Password</a>
          </td></tr></table>
          <p style="margin:20px 0 0;color:#94a3b8;font-size:12px;">
            This link expires in 1 hour.<br/>
            If you didn't request this, you can safely ignore this email.<br/><br/>
            <span style="color:#6366f1;word-break:break-all;">${resetUrl}</span>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const sent = await sendMail(params.to, `${APP_NAME} — Password Reset`, html);

  if (!sent) {
    console.log('');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`  PASSWORD RESET EMAIL ${isSmtpReady() ? '(SMTP failed — showing here)' : '(SMTP not configured)'}`);
    console.log('═══════════════════════════════════════════════════════');
    console.log(`  To:       ${params.to}`);
    console.log(`  Expires:  ${params.expiresAt.toISOString()}`);
    console.log('───────────────────────────────────────────────────────');
    console.log(`  Reset URL: ${resetUrl}`);
    console.log('═══════════════════════════════════════════════════════');
    console.log('');
  }
}
