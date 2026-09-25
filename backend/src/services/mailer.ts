import { logger } from '../utils/logger';

/**
 * Outbound mail via Resend's HTTP API.
 *
 * One POST to one endpoint is the whole integration. No SDK and no SMTP client
 * on purpose: Node's global fetch means a backend that had no mail dependency
 * still has none, and there is nothing extra to audit.
 *
 * Sending is best-effort, always. A transactional email is a side effect of a
 * request, never its point, so nothing in this file throws — every failure is
 * logged and handed back as a value for the caller to ignore or act on.
 *
 * With no RESEND_API_KEY set the module is inert: it logs the message it would
 * have sent and reports 'not-configured'. That is the normal state in
 * development, and it means a deploy missing the key goes quiet rather than
 * breaking whatever flow was trying to send.
 *
 * Mail leaves from the `send.` subdomain while support@ is received on the
 * apex through Cloudflare Email Routing. Keep them apart: each needs its own
 * MX records, and a sending-reputation problem should not reach the inbox.
 */

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

/** Resend sits on the request path. Ten seconds is already generous for a call
 *  nobody is waiting on. */
const SEND_TIMEOUT_MS = 10_000;

const mailConfig = {
  apiKey: process.env.RESEND_API_KEY || '',
  from: process.env.MAIL_FROM || 'CyberKhana <noreply@send.cyberkhana.tech>',
  // Replies must land in a mailbox a person reads. The sending subdomain has
  // no inbox behind it.
  replyTo: process.env.MAIL_REPLY_TO || 'support@cyberkhana.tech',
};

export interface MailMessage {
  to: string;
  subject: string;
  /** Always required. Every message needs a body that survives a client which
   *  strips HTML, and it doubles as the text/plain alternative that keeps a
   *  message out of the spam folder. */
  text: string;
  html?: string;
}

export type MailResult =
  | { sent: true; id: string }
  | { sent: false; reason: 'not-configured' | 'failed' };

/** Addresses are personal data and logs are not the place for them. Enough is
 *  kept to tie a log line to a support complaint, and no more. */
const maskAddress = (address: string): string => {
  const at = address.lastIndexOf('@');
  if (at < 1) return '***';
  return `${address[0]}***${address.slice(at)}`;
};

export const isMailConfigured = (): boolean => Boolean(mailConfig.apiKey);

export const sendMail = async (message: MailMessage): Promise<MailResult> => {
  const to = maskAddress(message.to);

  if (!mailConfig.apiKey) {
    logger.warn('mail.not_configured', { to, subject: message.subject });
    return { sent: false, reason: 'not-configured' };
  }

  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${mailConfig.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: mailConfig.from,
        to: [message.to],
        reply_to: mailConfig.replyTo,
        subject: message.subject,
        text: message.text,
        ...(message.html ? { html: message.html } : {}),
      }),
      signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
    });

    if (!response.ok) {
      // The status alone rarely says why Resend refused. An unverified sending
      // domain and a bad API key are indistinguishable without the body.
      const detail = await response.text().catch(() => '');
      logger.error('mail.send_failed', {
        to,
        subject: message.subject,
        status: response.status,
        detail: detail.slice(0, 500),
      });
      return { sent: false, reason: 'failed' };
    }

    const body = (await response.json().catch(() => ({}))) as { id?: string };
    logger.info('mail.sent', { to, subject: message.subject, id: body.id });
    return { sent: true, id: body.id || '' };
  } catch (err) {
    // Covers the timeout above as well: AbortSignal.timeout rejects the fetch.
    logger.error('mail.send_error', { to, subject: message.subject, error: String(err) });
    return { sent: false, reason: 'failed' };
  }
};
