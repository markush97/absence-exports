import { Global, Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { MailConfigService } from './mail.config-service';

@Global()
@Module({
  imports: [],
  providers: [MailService, MailConfigService],
  exports: [MailService],
})
export class MailModule {}
