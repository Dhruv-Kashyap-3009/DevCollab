const nodemailer = require('nodemailer');
const dns = require('dns');

// Two ways to deliver invite emails:
//
// 1. HTTP transactional API (Resend) — used when EMAIL_API_KEY is set. Plain
//    HTTPS egress works from every host (Render included), so this is the
//    reliable path. Free tier: 100 emails/day, no card required.
//
// 2. Gmail SMTP (app password) — fallback. Uses STARTTLS on port 587 and an
//    IPv4-only lookup, because cloud hosts (Render) often have no IPv6 route
//    (ENETUNREACH on the IPv6 smtp.gmail.com address) and may not reach the
//    legacy 465/SSL port either (connect timeout).

const RESEND_API = 'https://api.resend.com/emails';

function buildHtml(inviteUrl, projectName, inviterName) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
      <h2 style="color: #3b82f6;">You've been invited!</h2>
      <p><strong>${inviterName}</strong> has invited you to collaborate on <strong>${projectName}</strong>.</p>
      <a href="${inviteUrl}" style="
        display: inline-block;
        padding: 12px 24px;
        background: #3b82f6;
        color: white;
        text-decoration: none;
        border-radius: 6px;
        margin: 16px 0;
        font-weight: bold;
      ">Accept Invite</a>
      <p style="color: #888; font-size: 13px;">
        If the button doesn't work, copy this link:<br/>
        <a href="${inviteUrl}">${inviteUrl}</a>
      </p>
      <p style="color: #888; font-size: 12px;">This invite link expires in 7 days.</p>
    </div>
  `;
}

async function sendViaHttpApi(toEmail, subject, html) {
  const res = await fetch(RESEND_API, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.EMAIL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || 'DevCollab <onboarding@resend.dev>',
      to: [toEmail],
      subject,
      html,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error('Email API error ' + res.status + ': ' + body.slice(0, 200));
  }
}

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  requireTLS: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  // Bound every stage of the SMTP exchange so a slow/unreachable mail server
  // can never stall a request (or a background send) for minutes.
  connectionTimeout: 15000,
  greetingTimeout: 15000,
  socketTimeout: 30000,
  // Force IPv4 resolution for this connection — independent of process-wide
  // DNS ordering and works on any Node version.
  lookup: (hostname, options, callback) =>
    dns.lookup(hostname, { ...options, family: 4 }, callback),
});

const sendInviteEmail = async (toEmail, inviteUrl, projectName, inviterName) => {
  const subject = `You've been invited to join ${projectName} on DevCollab`;
  const html = buildHtml(inviteUrl, projectName, inviterName);

  // Prefer the HTTP API when configured — HTTPS egress is reliable from every
  // host, unlike raw SMTP.
  if (process.env.EMAIL_API_KEY) {
    await sendViaHttpApi(toEmail, subject, html);
    return;
  }

  await transporter.sendMail({
    from: `"DevCollab" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject,
    html,
  });
};

module.exports = { sendInviteEmail };