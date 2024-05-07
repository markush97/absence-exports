import { Global, Module } from '@nestjs/common';
import { CoreConfigService } from './core.config-service';
import { ConfigModule } from '@nestjs/config';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      isGlobal: true,
      expandVariables: true,
    }),
  ],
  providers: [CoreConfigService],
  exports: [CoreConfigService],
})
export class CoreConfigModule {}
