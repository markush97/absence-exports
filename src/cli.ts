import { CommandFactory } from 'nest-commander';
import { Logger } from '@nestjs/common';
import { AppCliModule } from './app-cli.module';

async function bootstrap() {
  await CommandFactory.run(AppCliModule, new Logger());
  //await CommandFactory.run(AppCliModule);
}

bootstrap();
