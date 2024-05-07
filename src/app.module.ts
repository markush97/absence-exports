import { Module } from '@nestjs/common';
import { AbsenceClientModule } from './absence-client/absence-client.module';
import { CoreConfigModule } from './config/config.module';
import { MailModule } from './mail/mail.module';

@Module({
  imports: [AbsenceClientModule, CoreConfigModule, MailModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
