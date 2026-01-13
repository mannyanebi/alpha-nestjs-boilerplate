import { Injectable } from '@nestjs/common';
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
type NodemailerModule = typeof import('nodemailer');

@Injectable()
export class MailerService {
  private readonly transporter: Transporter<SMTPTransport.SentMessageInfo>;

  private readonly defaultFrom: string;

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

    const nodemailerClient = nodemailer as NodemailerModule;

    this.transporter = nodemailerClient.createTransport(transportOptions);

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
      return headers.reduce<Record<string, string>>((acc, header) => {
        acc[header.key] = header.value;

        return acc;
      }, {});
    }

    const normalized: Record<string, string> = {};
    const entries = Object.entries(headers) as Array<[string, IHeaderValue]>;

    for (const [key, value] of entries) {
      if (typeof value === 'string') {
        normalized[key] = value;
      } else if (Array.isArray(value)) {
        normalized[key] = value.join(',');
      } else if (value && typeof value === 'object' && 'value' in value) {
        normalized[key] = value.value;
      }
    }

    return normalized;
  }
}
