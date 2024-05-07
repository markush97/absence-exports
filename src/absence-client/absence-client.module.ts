import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AbsenceClientService } from './absence-client.service';

@Module({
  imports: [HttpModule],
  providers: [AbsenceClientService],
})
export class AbsenceClientModule {}
