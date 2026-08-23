import emailjs from '@emailjs/browser';

const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || '';
const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || '';
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || '';

/**
 * Initialize EmailJS with the public key. Call once on app load.
 */
export function initEmailJS() {
  if (PUBLIC_KEY) {
    emailjs.init(PUBLIC_KEY);
  }
}

/**
 * Send an invite email via EmailJS (client-side, no server SMTP needed).
 * Returns true on success, false on failure (never throws).
 */
export async function sendInviteEmail({ toEmail, projectName, inviterName, inviteLink }) {
  if (!PUBLIC_KEY || !SERVICE_ID || !TEMPLATE_ID) {
    // EmailJS not configured — skip silently. The copy-link button is the fallback.
    return false;
  }

  try {
    await emailjs.send(SERVICE_ID, TEMPLATE_ID, {
      to_email: toEmail,
      project_name: projectName,
      inviter_name: inviterName,
      invite_link: inviteLink,
    });
    return true;
  } catch (err) {
    console.error('EmailJS send failed:', err);
    return false;
  }
}
