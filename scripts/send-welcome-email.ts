import fs from 'node:fs';
import path from 'node:path';

import Mailgen from 'mailgen';
import { SendMailClient } from 'zeptomail';

const envPath = path.resolve(process.cwd(), '.env');

if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf8');

  for (const line of envFile.split('\n')) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();

    process.env[key] ??= value;
  }
}

const apiUrl =
  process.env.MAILER_API_URL ?? 'https://api.zeptomail.com/v1.1/email';
const apiToken = process.env.MAILER_API_TOKEN;
const fromEmail = process.env.MAILER_FROM_EMAIL;
const fromName = process.env.MAILER_FROM_NAME ?? 'prosev';
const appName = process.env.APP_NAME ?? fromName;
const loginUrl = process.env.APP_LOGIN_URL ?? 'https://example.com/login';
const supportEmail = process.env.SUPPORT_EMAIL ?? fromEmail;
const recipient = process.env.TEST_RECIPIENT ?? 'johndoe@gmail.com';

if (!apiToken) {
  throw new Error('MAILER_API_TOKEN is required.');
}

if (!fromEmail) {
  throw new Error('MAILER_FROM_EMAIL is required.');
}

const mailGenerator = new Mailgen({
  theme: 'default',
  product: {
    name: appName,
    link: loginUrl,
  },
});

const supportLine = supportEmail
  ? `If you need help, email us at ${supportEmail}.`
  : 'If you need help, reply to this email.';

const email = {
  body: {
    name: 'Don',
    intro: `Welcome to ${appName}. Your account is ready.`,
    action: {
      instructions: 'Sign in using the button below:',
      button: {
        color: '#1f2937',
        text: `Sign in to ${appName}`,
        link: loginUrl,
      },
    },
    outro: supportLine,
  },
};

const html = mailGenerator.generate(email);
const text = mailGenerator.generatePlaintext(email);

const client = new SendMailClient({ url: apiUrl, token: apiToken });

await client.sendMail({
  from: {
    address: fromEmail,
    name: fromName,
  },
  to: [
    {
      email_address: {
        address: recipient,
        name: 'Don',
      },
    },
  ],
  subject: `Welcome to ${appName}`,
  htmlbody: html,
  textbody: text,
});

console.info(`Welcome email sent to ${recipient}.`);
