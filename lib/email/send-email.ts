import { Resend } from "resend";

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

const resend =
  process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.length > 0
    ? new Resend(process.env.RESEND_API_KEY)
    : null;

const FROM =
  process.env.EMAIL_FROM ?? "MyFuckingLife <no-reply@example.com>";

export async function sendEmail(options: SendEmailOptions): Promise<void> {
  if (process.env.NODE_ENV !== "production" || !resend) {
    console.log("[sendEmail] DEV — email não enviado");
    console.log("  To:", options.to);
    console.log("  Subject:", options.subject);
    console.log("  HTML:", options.html);
    return;
  }

  await resend.emails.send({
    from: FROM,
    to: options.to,
    subject: options.subject,
    html: options.html,
  });
}
