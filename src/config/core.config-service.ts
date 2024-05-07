import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CoreConfigService {
  constructor(private readonly config: ConfigService) {}

  get absenceToken(): string {
    return this.config.getOrThrow<string>('ABSENCE_API_TOKEN');
  }

  get absenceId(): string {
    return this.config.getOrThrow<string>('ABSENCE_API_ID');
  }

  get absenceApiUrl(): string {
    return this.config.get<string>(
      'ABSENCE_API_URL',
      'https://app.absence.io/api/v2/',
    );
  }

  get absenceInternalApiUrl(): string {
    return this.config.get<string>(
      'ABSENCE_INTERNAL_API_URL',
      'https://app.absence.io/api/',
    );
  }

  get reportStorageLocation(): string {
    return this.config.get<string>(
      'REPORT_FOLTER_PATH',
      'C:\\Users\\Markus Hinkel\\projekte\\absence-exports\\reports',
    );
  }
}
