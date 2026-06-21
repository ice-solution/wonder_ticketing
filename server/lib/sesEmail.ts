import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { env } from "../_core/env.js";

let client: SESClient | null = null;

export function isSesConfigured(): boolean {
  return !!(
    env.AWS_SES_ACCESS_KEY_ID &&
    env.AWS_SES_SECRET_ACCESS_KEY &&
    env.SENDER_EMAIL
  );
}

function getClient(): SESClient {
  if (!client) {
    client = new SESClient({
      region: env.AWS_SES_REGION ?? "ap-southeast-1",
      credentials: {
        accessKeyId: env.AWS_SES_ACCESS_KEY_ID!,
        secretAccessKey: env.AWS_SES_SECRET_ACCESS_KEY!,
      },
    });
  }
  return client;
}

export async function sendSesEmail(opts: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<void> {
  if (!isSesConfigured()) {
    throw new Error("SES_NOT_CONFIGURED");
  }

  await getClient().send(
    new SendEmailCommand({
      Source: env.SENDER_EMAIL!,
      Destination: { ToAddresses: [opts.to] },
      Message: {
        Subject: { Data: opts.subject, Charset: "UTF-8" },
        Body: {
          Text: { Data: opts.text, Charset: "UTF-8" },
          ...(opts.html ? { Html: { Data: opts.html, Charset: "UTF-8" } } : {}),
        },
      },
    })
  );
}
