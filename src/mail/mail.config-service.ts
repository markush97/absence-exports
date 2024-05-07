import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailConfigService {
  constructor(private readonly config: ConfigService) {}

  public get transport(): SmtpOptions {
    const options: SmtpOptions = {
      pool: false,
      ignoreTLS: this.ignoreTls,
      host: this.host,
      port: this.port,
      secure: this.secure,
      connectionTimeout: this.timeout,
    };

    // only provide auth-credentials if username is defined. This is needed since setting auth as undefined alone is not enough
    if (this.username) {
      options.auth = {
        user: this.username,
        pass: this.password,
      };
    }

    return options;
  }
  private get host(): string {
    return this.config.get('MAIL_HOST', 'cwi-at.mail.protection.outlook.com');
  }

  private get port(): number {
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    return this.config.get('MAIL_PORT', 25);
  }

  private get password(): string | undefined {
    return this.config.get('MAIL_PASSWORD');
  }

  private get secure(): boolean {
    return this.config.get<boolean>('MAIL_SECURE', false);
  }

  private get ignoreTls(): boolean {
    return this.config.get<boolean>('MAIL_IGNORE_TLS', false);
  }

  public get from(): string {
    return this.config.get('MAIL_FROM', 'Zeiterfassung CWI <no_reply@cwi.at>');
  }

  private get username(): string | undefined {
    return this.config.get('MAIL_USERNAME');
  }

  private get timeout(): number {
    return this.config.get('MAIL_TIMEOUT', 5000);
  }
}

// Defined manually since nodemailer does not export this interface. Duh.
interface SmtpOptions {
  pool: boolean;
  host: string;
  port: number;
  secure: boolean;
  connectionTimeout: number;
  ignoreTLS: boolean;
  auth?: {
    user?: string;
    pass?: string;
  };
}
