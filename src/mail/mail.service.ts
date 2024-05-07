import { Injectable, Logger } from '@nestjs/common';
import { MailConfigService } from './mail.config-service';
import { createTransport, Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private mailer!: Transporter;
  private readonly logger = new Logger('MailService');

  constructor(private readonly mailConfig: MailConfigService) {}

  /**
   * Hook called on App initialization
   *
   * Starts and tests smtp connection
   */
  async onModuleInit(): Promise<void> {
    this.logger.log(
      `Connecting to Email-Server: '${this.mailConfig.transport.host}:${this.mailConfig.transport.port}'`,
    );
    // this.mailer = createTransport(this.mailConfig.transport);

    /*if (await this.verifyConnection(this.mailer)) {
      this.logger.log('Connecting to Email-Server successful!');
    } else {
      this.logger.error('Connecting to Email-Server failed! Shutting down...');
       process.exit(5);
    }*/
  }

  async sendEmail(
    subject: string,
    text: string,
    reportPath: string,
    reportName: string,
    receiver: string | string[],
  ): Promise<void> {
    const info = this.mailer.sendMail({
      from: this.mailConfig.from,
      to: receiver,
      subject: subject,
      text: text,
      attachments: {
        path: reportPath,
        filename: reportName,
      },
    });

    info.then((res) => this.logger.debug(`Sending email successful`, res));
  }

  private async verifyConnection(mailer: Transporter): Promise<boolean> {
    try {
      return await mailer.verify();
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(error.message);
      }
    }
    return false;
  }
}
