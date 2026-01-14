import { Injectable, Logger } from '@nestjs/common';
import { SendMailClient } from 'zeptomail';

import { ApiConfigService } from '../api-config.service.ts';

interface IZeptoHeadersOptions {
  fileCacheKey?: string | string[];
  openTrack?: boolean;
  clickTrack?: boolean;
  clientRef?: string;
}

type MailAddress = string | { address: string; name?: string };

type IHeaderValue = string | string[] | { prepared: boolean; value: string };

type MailHeaders =
  | Record<string, IHeaderValue>
  | Array<{ key: string; value: string }>;

type SendMailRequest = Parameters<SendMailClient['sendMail']>[0];
type SendMailRequestWithHeaders = SendMailRequest & {
  headers?: Record<string, string>;
};

interface ISendOptions {
  to: MailAddress | MailAddress[];
  from?: MailAddress;
  subject: string;
  html?: string;
  text?: string;
  headers?: MailHeaders;
  zepto?: IZeptoHeadersOptions;
}

@Injectable()
export class MailerService {
  private readonly client: SendMailClient;

  private readonly defaultFrom: { address: string; name: string };

  private readonly logger = new Logger(MailerService.name);

  constructor(private readonly configService: ApiConfigService) {
    const config = this.configService.mailerConfig;

    this.client = new SendMailClient({
      url: config.apiUrl,
      token: config.apiToken,
    });

    this.defaultFrom = {
      address: config.fromEmail,
      name: config.fromName,
    };
  }

  async sendMail(options: ISendOptions): Promise<void> {
    const { zepto, headers, ...mailOptions } = options;
    const zeptoHeaders = this.buildZeptoHeaders(zepto);
    const normalizedHeaders = this.normalizeHeaders(headers);
    const mergedHeaders = { ...normalizedHeaders, ...zeptoHeaders };

    if (!mailOptions.html && !mailOptions.text) {
      throw new Error('Either html or text body must be provided.');
    }

    const from = this.ensureName(
      this.normalizeAddress(mailOptions.from ?? this.defaultFrom),
    );
    const to = this.normalizeRecipients(mailOptions.to);

    const payload: SendMailRequestWithHeaders = {
      from,
      to,
      subject: mailOptions.subject,
      htmlbody: mailOptions.html,
      textbody: mailOptions.text,
      headers:
        Object.keys(mergedHeaders).length > 0 ? mergedHeaders : undefined,
    };

    await this.client.sendMail(payload);

    const recipient = this.formatRecipients(mailOptions.to);
    this.logger.log(`email sent to ${recipient} successfully`);
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

  private normalizeHeaders(headers?: MailHeaders): Record<string, string> {
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
    const entries = Object.entries(headers);

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

  private normalizeRecipients(
    recipients: MailAddress | MailAddress[],
  ): Array<{ email_address: { address: string; name: string } }> {
    const list = Array.isArray(recipients) ? recipients : [recipients];

    return list.map((recipient) => ({
      email_address: this.ensureName(this.normalizeAddress(recipient)),
    }));
  }

  private normalizeAddress(address: MailAddress): {
    address: string;
    name?: string;
  } {
    if (typeof address === 'string') {
      return this.parseAddressString(address);
    }

    return address.name
      ? { address: address.address, name: address.name }
      : { address: address.address };
  }

  private parseAddressString(value: string): {
    address: string;
    name?: string;
  } {
    const trimmed = value.trim();
    const ltIndex = trimmed.lastIndexOf('<');
    const gtIndex = trimmed.lastIndexOf('>');

    if (ltIndex !== -1 && gtIndex > ltIndex) {
      const namePart = trimmed.slice(0, ltIndex).trim();
      const addressPart = trimmed.slice(ltIndex + 1, gtIndex).trim();

      if (addressPart) {
        const cleanName = this.stripQuotes(namePart);

        return cleanName
          ? { address: addressPart, name: cleanName }
          : { address: addressPart };
      }
    }

    return { address: trimmed };
  }

  private formatRecipients(
    recipients: MailAddress | MailAddress[],
  ): string | null {
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

  private formatRecipient(recipient: MailAddress): string {
    if (typeof recipient === 'string') {
      const parsed = this.parseAddressString(recipient);

      return parsed.name
        ? `${parsed.name} <${parsed.address}>`
        : parsed.address;
    }

    if (recipient.name) {
      return `${recipient.name} <${recipient.address}>`;
    }

    return recipient.address;
  }

  private ensureName(address: { address: string; name?: string }): {
    address: string;
    name: string;
  } {
    if (address.name) {
      return { address: address.address, name: address.name };
    }

    return {
      address: address.address,
      name: this.defaultFrom.name,
    };
  }

  private stripQuotes(value: string): string {
    return value.replaceAll('"', '');
  }
}
