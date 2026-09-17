import { env } from "../config/env";
import { createHttpClient } from "./http";

type Email = {
  to: string;
  subject: string;
  text: string;
};

// No key means no transport: dev and the e2e stack log instead of reaching Resend.
const resend = env.RESEND_API_KEY
  ? createHttpClient({ baseURL: "https://api.resend.com", name: "Resend" })
  : null;

/**
 * Best-effort by design. Better Auth calls this from inside sign-up, so a throw here
 * would take the sign-up down with it.
 */
export async function sendEmail({ to, subject, text }: Email): Promise<void> {
  if (!resend) {
    console.log(`[mail] to=${to} subject="${subject}"\n${text}`);
    return;
  }

  try {
    await resend.post(
      "/emails",
      { from: env.EMAIL_FROM, to, subject, text },
      { headers: { Authorization: `Bearer ${env.RESEND_API_KEY}` } },
    );
  } catch (error) {
    console.error(`[mail] could not send "${subject}" to ${to}`, error);
  }
}
