import nodemailer, { type SendMailOptions, type Transporter } from "nodemailer";

type Mailer = { transporter: Transporter; isTest: boolean };

let cached: Promise<Mailer> | null = null;

/**
 * Real SMTP when SMTP_HOST is set. Otherwise falls back to a throwaway
 * Ethereal inbox so the demo works with no credentials — each send returns
 * a preview URL instead of delivering mail.
 */
export function getMailer(): Promise<Mailer> {
  if (!cached) {
    cached = (async () => {
      if (process.env.SMTP_HOST) {
        return {
          isTest: false,
          transporter: nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT ?? 465),
            secure: (process.env.SMTP_SECURE ?? "true") !== "false",
            auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
          }),
        };
      }
      console.warn("[mailer] SMTP_HOST not set — using an Ethereal test inbox (emails are not delivered).");
      const acc = await nodemailer.createTestAccount();
      return {
        isTest: true,
        transporter: nodemailer.createTransport({
          host: acc.smtp.host,
          port: acc.smtp.port,
          secure: acc.smtp.secure,
          auth: { user: acc.user, pass: acc.pass },
        }),
      };
    })();
    cached.catch(() => {
      cached = null;
    });
  }
  return cached;
}

export const mailFrom = () => process.env.MAIL_FROM ?? '"Green Mark Lodge" <reservations@greenmarklodge.com>';
export const receptionEmail = () => process.env.RECEPTION_EMAIL ?? "reception@greenmarklodge.com";

export async function send(opts: SendMailOptions) {
  const { transporter, isTest } = await getMailer();
  const info = await transporter.sendMail({ from: mailFrom(), ...opts });
  const preview = isTest ? nodemailer.getTestMessageUrl(info) || null : null;
  if (preview) console.log(`[mailer] preview: ${preview}`);
  return { preview };
}
