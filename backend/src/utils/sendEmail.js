const nodemailer = require('nodemailer');
const dns = require('dns');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  // Bound every stage of the SMTP exchange so a slow/unreachable mail server
  // can never stall a request (or a background send) for minutes.
  connectionTimeout: 15000,
  greetingTimeout: 15000,
  socketTimeout: 30000,
  // Cloud hosts (Render) often have no IPv6 route: smtp.gmail.com resolves to
  // an IPv6 address first, and the connect fails with ENETUNREACH before ever
  // falling back to IPv4. Force the lookup to IPv4-only for this connection —
  // this is independent of process-wide DNS ordering and works on any Node.
  lookup: (hostname, options, callback) =>
    dns.lookup(hostname, { ...options, family: 4 }, callback),
});

const sendInviteEmail = async (toEmail, inviteUrl, projectName, inviterName) => {
  await transporter.sendMail({
    from: `"DevCollab" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `You've been invited to join ${projectName} on DevCollab`,
    html: `
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
    `,
  });
};

module.exports = { sendInviteEmail };