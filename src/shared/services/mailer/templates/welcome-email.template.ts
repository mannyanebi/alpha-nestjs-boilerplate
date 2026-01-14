import Mailgen from 'mailgen';

interface IWelcomeEmailTemplateInput {
  firstName: string;
  appName: string;
  loginUrl: string;
  supportEmail?: string;
}

interface IWelcomeEmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export function buildWelcomeEmailTemplate(
  data: IWelcomeEmailTemplateInput,
): IWelcomeEmailTemplate {
  const firstName = data.firstName.trim() || 'there';
  const subject = `Welcome to ${data.appName}`;
  const supportLine = data.supportEmail
    ? `If you need help, email us at ${data.supportEmail}.`
    : 'If you need help, reply to this email.';

  const mailGenerator = new Mailgen({
    theme: 'default',
    product: {
      name: data.appName,
      link: data.loginUrl,
    },
  });

  const email = {
    body: {
      name: firstName,
      intro: `Welcome to ${data.appName}. Your account is ready.`,
      action: {
        instructions: 'Sign in using the button below:',
        button: {
          color: '#1f2937',
          text: `Sign in to ${data.appName}`,
          link: data.loginUrl,
        },
      },
      outro: supportLine,
    },
  };

  const html = mailGenerator.generate(email);
  const text = mailGenerator.generatePlaintext(email);

  return {
    subject,
    html,
    text,
  };
}
