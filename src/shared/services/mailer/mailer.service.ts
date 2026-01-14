import { Injectable, Logger } from '@nestjs/common';
import type { SendMailOptions, Transporter } from 'nodemailer';
import nodemailer from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';

import { ApiConfigService } from '../api-config.service.ts';
import { buildWelcomeEmailTemplate } from './templates/welcome-email.template.ts';

interface IZeptoHeadersOptions {
  fileCacheKey?: string | string[];
  openTrack?: boolean;
  clickTrack?: boolean;
  clientRef?: string;
}

interface ISendOptions extends SendMailOptions {
  zepto?: IZeptoHeadersOptions;
}

type IHeaderValue = string | string[] | { prepared: boolean; value: string };
@Injectable()
export class MailerService {
  private readonly transporter: Transporter<SMTPTransport.SentMessageInfo>;

  private readonly defaultFrom: string;

  private readonly logger = new Logger(MailerService.name);

  constructor(private readonly configService: ApiConfigService) {
    const config = this.configService.mailerConfig;

    const transportOptions: SMTPTransport.Options = {
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.pass,
      },
      tls: {
        minVersion: 'TLSv1.2',
      },
    };

    this.transporter = nodemailer.createTransport(transportOptions);

    this.defaultFrom = config.fromName
      ? `"${config.fromName}" <${config.fromEmail}>`
      : config.fromEmail;
  }

  async sendMail(options: ISendOptions): Promise<void> {
    const { zepto, headers, ...mailOptions } = options;
    const zeptoHeaders = this.buildZeptoHeaders(zepto);
    const normalizedHeaders = this.normalizeHeaders(headers);

    await this.transporter.sendMail({
      ...mailOptions,
      from: mailOptions.from ?? this.defaultFrom,
      headers: {
        ...normalizedHeaders,
        ...zeptoHeaders,
      },
    });

    const recipient = this.formatRecipients(mailOptions.to) ?? 'unknown';
    this.logger.log(`email sent to ${recipient} successfully`);
  }

  async sendWelcomeEmail(params: {
    to: string;
    firstName: string;
    appName: string;
    loginUrl: string;
    supportEmail?: string;
    zepto?: IZeptoHeadersOptions;
  }): Promise<void> {
    const template = buildWelcomeEmailTemplate({
      firstName: params.firstName,
      appName: params.appName,
      loginUrl: params.loginUrl,
      supportEmail: params.supportEmail,
    });

    await this.sendMail({
      to: params.to,
      subject: template.subject,
      html: template.html,
      text: template.text,
      zepto: params.zepto,
    });
  }

  private buildZeptoHeaders(
    options?: IZeptoHeadersOptions,
  ): Record<string, string> {
    if (!options) {
      return {};
    }

    const headers: Record<string, string> = {};

    if (options.fileCacheKey) {
      const value = Array.isArray(options.fileCacheKey)
        ? options.fileCacheKey.join(',')
        : options.fileCacheKey;
      headers['X-TM-FILE-KEY'] = value;
    }

    if (options.openTrack !== undefined) {
      headers['X-TM-OPEN-TRACK'] = options.openTrack ? 'true' : 'false';
    }

    if (options.clickTrack !== undefined) {
      headers['X-TM-CLICK-TRACK'] = options.clickTrack ? 'true' : 'false';
    }

    if (options.clientRef) {
      headers['X-TM-CLIENT-REF'] = options.clientRef;
    }

    return headers;
  }

  private normalizeHeaders(
    headers: ISendOptions['headers'],
  ): Record<string, string> {
    if (!headers) {
      return {};
    }

    if (Array.isArray(headers)) {
      const normalized: Record<string, string> = {};

      for (const header of headers) {
        normalized[header.key] = header.value;
      }

      return normalized;
    }

    const normalized: Record<string, string> = {};
    const entries = Object.entries(headers) as Array<[string, IHeaderValue]>;

    for (const [key, value] of entries) {
      if (typeof value === 'string') {
        normalized[key] = value;
      } else if (Array.isArray(value)) {
        normalized[key] = value.join(',');
      } else if (typeof value === 'object' && 'value' in value) {
        normalized[key] = value.value;
      }
    }

    return normalized;
  }

  private formatRecipients(recipients: SendMailOptions['to']): string | null {
    if (!recipients) {
      return null;
    }

    if (Array.isArray(recipients)) {
      return recipients
        .map((recipient) => this.formatRecipient(recipient))
        .join(', ');
    }

    return this.formatRecipient(recipients);
  }

  private formatRecipient(recipient: unknown): string {
    if (typeof recipient === 'string') {
      return recipient;
    }

    if (recipient && typeof recipient === 'object') {
      const maybeRecipient = recipient as { name?: unknown; address?: unknown };

      if (typeof maybeRecipient.address === 'string') {
        if (typeof maybeRecipient.name === 'string' && maybeRecipient.name) {
          return `${maybeRecipient.name} <${maybeRecipient.address}>`;
        }

        return maybeRecipient.address;
      }
    }

    return 'unknown';
  }
}
