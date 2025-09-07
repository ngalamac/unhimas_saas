import express from 'express';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;

// track whether SMTP is usable (verified at startup). If verify fails we operate in dev-mode.
let smtpAvailable = true;
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465, // true for 465, false for STARTTLS (587)
  auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
  // avoid extremely long hangs; fail faster on network errors
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
});

// verify transporter if SMTP is configured so startup logs helpful diagnostics
(async () => {
  try {
    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
      smtpAvailable = false;
      // eslint-disable-next-line no-console
      console.log('[communication] SMTP not fully configured; running in dev-mode (emails will be logged, not sent)');
      return;
    }
    await transporter.verify();
    // eslint-disable-next-line no-console
    console.log('[communication] SMTP transporter verified');
    smtpAvailable = true;
  } catch (err: any) {
    smtpAvailable = false;
    // eslint-disable-next-line no-console
    console.warn('[communication] SMTP transporter verify failed - switching to dev-mode:', err?.message || err);
  }
})();

// allow forcing dev-mode via environment for local testing
if (process.env.COMM_DEV_EMAIL === 'true') {
  smtpAvailable = false;
  // eslint-disable-next-line no-console
  console.log('[communication] COMM_DEV_EMAIL=true - forcing dev-mode for email sending');
}

// Send an email to a single recipient
router.post('/email', async (req, res) => {
  try {
    // Defensive logging for easier debugging
    // eslint-disable-next-line no-console
    console.log('[communication/email] received request', { headers: { 'content-type': req.headers['content-type'] }, bodyPreview: req.body && typeof req.body === 'object' ? Object.keys(req.body) : typeof req.body });

    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ message: 'Request body must be JSON object' });
    }

    const { to, subject, text, html } = req.body as any;
    if (!to) return res.status(400).json({ message: 'Recipient (to) is required' });

    const mail = {
      from: SMTP_USER || 'no-reply@unhimas.local',
      to,
      subject: subject || 'Message from UNHIMAS',
      text: text || undefined,
      html: html || undefined,
    } as any;

    // If SMTP is not available (either mis-configured or verify failed), operate in dev-mode: log and return success
    if (!smtpAvailable) {
      // eslint-disable-next-line no-console
      console.log('[communication/email] (dev) SMTP unavailable; would send', mail);
      return res.json({ message: 'Email queued (dev-mode; SMTP not available).' });
    }

    // send via provider (with fallback to SMTPS on port 465 for networks blocking STARTTLS)
    try {
      // eslint-disable-next-line no-console
      console.log('[communication/email] sending to', to);
      // helper tries primary transporter then fallback if a network/socket error occurs
      const sendWithFallback = async (mailObj: any) => {
        try {
          const info = await transporter.sendMail(mailObj);
          return info;
        } catch (err: any) {
          const code = err && (err.code || err.errno);
          // common network/socket errors where a fallback may help
          const networkErrors = ['ESOCKET', 'ETIMEDOUT', 'ECONNREFUSED', 'ECONNRESET', 'EHOSTUNREACH'];
          if (code && networkErrors.includes(String(code))) {
            // eslint-disable-next-line no-console
            console.warn('[communication/email] primary transport failed with network error, attempting SMTPS fallback', { code, message: err?.message });
            try {
              const fallback = nodemailer.createTransport({
                host: SMTP_HOST,
                port: 465,
                secure: true,
                auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
                connectionTimeout: 10000,
                greetingTimeout: 10000,
                socketTimeout: 10000,
              });
              const finfo = await fallback.sendMail(mailObj);
              // eslint-disable-next-line no-console
              console.log('[communication/email] fallback SMTPS send success', { messageId: finfo?.messageId, response: finfo?.response });
              return finfo;
            } catch (fallbackErr: any) {
              // eslint-disable-next-line no-console
              console.error('[communication/email] SMTPS fallback failed', fallbackErr && (fallbackErr.message || fallbackErr));
              throw fallbackErr;
            }
          }
          throw err;
        }
      };

      const info = await sendWithFallback(mail);
      // eslint-disable-next-line no-console
      console.log('[communication/email] sendMail info', { messageId: info?.messageId, response: info?.response });
      return res.json({ message: 'Email sent', info: { messageId: info?.messageId } });
    } catch (sendErr: any) {
      // eslint-disable-next-line no-console
      console.error('[communication/email] sendMail failed:', sendErr && (sendErr.message || sendErr));
      return res.status(502).json({ message: sendErr?.message || 'Failed to deliver email', details: (sendErr && sendErr.message) ? String(sendErr.message).slice(0,2000) : undefined });
    }
  } catch (err: any) {
    // eslint-disable-next-line no-console
    console.error('[communication/email] unexpected error', err && (err.stack || err));
    res.status(500).json({ message: err?.message || 'Failed to send email', stack: (err && err.stack) ? String(err.stack).slice(0, 2000) : undefined });
  }
});

// status endpoint so frontend can show whether SMTP is available or dev-mode enforced
router.get('/status', (_req, res) => {
  const forcedDev = process.env.COMM_DEV_EMAIL === 'true';
  res.json({ smtpAvailable: smtpAvailable, forcedDev: forcedDev, smtpHost: SMTP_HOST || null, smtpPort: SMTP_PORT || null });
});

// Simple SMS placeholder endpoint — logs the message and returns success. Integrate a real provider later.
router.post('/sms', async (req, res) => {
  try {
    const { to, text } = req.body;
    if (!to || !text) return res.status(400).json({ message: 'to and text are required' });
    // eslint-disable-next-line no-console
    console.log('[communication/sms] send to', to, 'text:', text);
    // TODO: integrate with Twilio or other SMS provider
    return res.json({ message: 'SMS sent (simulated)' });
  } catch (err: any) {
    // eslint-disable-next-line no-console
    console.error('Failed to send sms', err);
    res.status(500).json({ message: err?.message || 'Failed to send sms' });
  }
});

export default router;
