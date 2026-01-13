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

  const text = `Hi ${firstName},

Welcome to ${data.appName}. Your account is ready.

Sign in: ${data.loginUrl}

${supportLine}

Thanks,
${data.appName} Team`;

  const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${subject}</title>
  </head>
  <body
    style="
      margin: 0;
      padding: 0;
      background-color: #f5f7fb;
      color: #1f2937;
    "
  >
    <table
      role="presentation"
      cellpadding="0"
      cellspacing="0"
      width="100%"
      style="
        background-color: #f5f7fb;
        padding: 24px;
      "
    >
      <tr>
        <td align="center">
          <table
            role="presentation"
            cellpadding="0"
            cellspacing="0"
            width="100%"
            style="
              max-width: 560px;
              background-color: #ffffff;
              border-radius: 12px;
              padding: 28px;
            "
          >
            <tr>
              <td
                style="
                  font-family: Arial, Helvetica, sans-serif;
                  font-size: 20px;
                  font-weight: 700;
                  padding-bottom: 12px;
                "
              >
                Welcome to ${data.appName}
              </td>
            </tr>
            <tr>
              <td
                style="
                  font-family: Arial, Helvetica, sans-serif;
                  font-size: 16px;
                  line-height: 1.6;
                  padding-bottom: 20px;
                "
              >
                Hi ${firstName},<br />
                Your account is ready. You can sign in using the button below.
              </td>
            </tr>
            <tr>
              <td align="center" style="padding-bottom: 24px;">
                <a
                  href="${data.loginUrl}"
                  style="
                    display: inline-block;
                    padding: 12px 20px;
                    background-color: #1f2937;
                    color: #ffffff;
                    text-decoration: none;
                    border-radius: 6px;
                    font-family: Arial, Helvetica, sans-serif;
                    font-size: 14px;
                    font-weight: 600;
                  "
                >
                  Sign in to ${data.appName}
                </a>
              </td>
            </tr>
            <tr>
              <td
                style="
                  font-family: Arial, Helvetica, sans-serif;
                  font-size: 14px;
                  line-height: 1.6;
                  color: #4b5563;
                "
              >
                ${supportLine}
              </td>
            </tr>
            <tr>
              <td
                style="
                  font-family: Arial, Helvetica, sans-serif;
                  font-size: 12px;
                  line-height: 1.6;
                  color: #9ca3af;
                  padding-top: 24px;
                "
              >
                This email was sent by ${data.appName}.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return {
    subject,
    html,
    text,
  };
}
