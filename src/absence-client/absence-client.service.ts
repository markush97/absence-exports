import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { CoreConfigService } from 'src/config/core.config-service';
import { client as hawk } from 'hawk';
import { Credentials } from 'hawk/lib/client';
import { firstValueFrom } from 'rxjs';
import { Absence } from './absence';
import { TimeEntry, TimeSpanFilter } from './timeentry';
import { Workbook } from 'excel4node';
import { AbsenceUser } from './absence-user';
import { resolve } from 'path';
import { getWeekNumber } from './weeknumber.helper';
import { AbsenceDepartment } from './absence-department';
import { existsSync, mkdirSync } from 'fs';
import { MailService } from 'src/mail/mail.service';
import { createUserReport } from 'src/report-creator/excel-formatter';
import { Cron, CronExpression } from '@nestjs/schedule';

type UserMap = { [id: string]: AbsenceUser };

const TEAMLEADS = {
  MSO: ['markus.hinkel@cwi.at', 'sueleyman.simsek@cwi.at'],
  ITIS: ['mario.herold@cwi.at'],
  GESAMT: [
    'andrea.bichlmaier@cwi.at',
    'markus.hinkel@cwi.at',
    'markus.hoffelner@cwi.at',
  ],
  Verwaltung: ['andrea.bichlmaier@cwi.at'],
};

@Injectable()
export class AbsenceClientService {
  private readonly logger = new Logger('AbsenceClientService');

  private readonly HAWK_CREDENTIALS: Credentials = {
    id: this.coreConfig.absenceId,
    key: this.coreConfig.absenceToken,
    algorithm: 'sha256',
  };

  private readonly ABSENCE_BASE_URL = this.coreConfig.absenceApiUrl;
  private readonly ABSENCE_INTERNAL_BASE_URL =
    this.coreConfig.absenceInternalApiUrl;

  constructor(
    private readonly httpService: HttpService,
    private readonly coreConfig: CoreConfigService,
    private readonly mail: MailService,
  ) {
    const folder = resolve(
      this.coreConfig.reportStorageLocation,
      new Date().getUTCFullYear().toString(),
    );

    if (!existsSync(folder)) {
      mkdirSync(folder);
    }

    this.createMonthlyReportSheets().then();
  }

  // Every Monday
  @Cron('0 0 * * MON')
  async createWeeklyReportSheets() {
    const weeknumber = getWeekNumber(
      new Date(Date.now() - 24 * 60 * 60 * 1000),
    );

    this.createReport(
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      new Date(),
      `Wöchentlicher Zeiterfassungsbericht`,
      `Wochenbericht_KW-${new Date().getUTCFullYear()}-${weeknumber}_{{subject}}.xlsx`,
      'week',
    );
  }

  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
  async createMonthlyReportSheets() {
    const firstLastMonth = new Date();
    firstLastMonth.setDate(1);
    firstLastMonth.setMonth(firstLastMonth.getMonth() - 1);

    const lastLastMonth = new Date();
    lastLastMonth.setDate(1);
    lastLastMonth.setHours(-1);

    this.createReport(
      firstLastMonth,
      lastLastMonth,
      `Monatlicher Zeiterfassungsbericht`,
      `Monatsbericht-${new Date().getUTCFullYear()}-${new Date().getUTCMonth()}_{{subject}}.xlsx`,
      'month',
    );
  }

  private async createReport(
    start: Date,
    end: Date,
    title: string,
    fileName: string,
    sheduledTimeMode: 'month' | 'week' | 'day' | 'none',
  ) {
    // Get all users
    const users = await this.fetchUsers();
    const userMap = users.reduce<UserMap>((userMap, user) => {
      userMap[user._id] = user;
      return userMap;
    }, {});

    // Get all departments
    const departments = await this.fetchDepartments();

    // Create Global Report
    await this.createSummaryReport(
      start,
      end,
      users,
      userMap,
      title,
      fileName,
      sheduledTimeMode,
    );

    await Promise.all(
      departments.map(async (department: AbsenceDepartment) =>
        this.createDepartmentReport(
          start,
          end,
          department,
          userMap,
          title,
          fileName,
          sheduledTimeMode,
        ),
      ),
    );

    await Promise.all(
      users.map(async (user) => {
        return this.createUserReport(
          start,
          end,
          user,
          userMap,
          title,
          fileName,
          sheduledTimeMode,
        );
      }),
    );
  }

  private async createDepartmentReport(
    start: Date,
    end: Date,
    department: AbsenceDepartment,
    userMap: UserMap,
    title: string,
    fileName: string,
    sheduledTimeMode: 'month' | 'week' | 'day' | 'none',
  ) {
    this.logger.debug(
      `Creating department report for department ${department.name}`,
    );
    const departmentReport = new Workbook();

    const departmentMembers: AbsenceUser[] = Object.keys(userMap)
      .filter((userId) => userMap[userId].departmentId === department._id)
      .map((key) => userMap[key]);

    for (let index = 0; index < departmentMembers.length; index++) {
      await this.createUserReportSheet(
        start,
        end,
        departmentMembers[index],
        departmentReport,
        userMap,
        title,
        sheduledTimeMode,
      );
    }

    const path = resolve(
      this.coreConfig.reportStorageLocation,
      end.getUTCFullYear().toString(),
      fileName.replace('{{subject}}', `TEAM-${department.name}`),
    );

    /*this.mail.sendEmail(
      title,
      'Anbei ist die Arbeitszeitsübersicht für das Team ' + department.name,
      path,
      fileName.replace('{{subject}}', `TEAM-${department.name}`),
      TEAMLEADS[department.name],
    );*/

    await departmentReport.write(path);
  }

  private async createUserReport(
    start: Date,
    end: Date,
    user: AbsenceUser,
    userMap: UserMap,
    title: string,
    fileName: string,
    sheduledTimeMode: 'month' | 'week' | 'day' | 'none',
  ) {
    this.logger.debug(`Creating user report for ${user.employeeId}`);
    const userReport = new Workbook();

    await this.createUserReportSheet(
      start,
      end,
      user,
      userReport,
      userMap,
      title,
      sheduledTimeMode,
    );

    const path = resolve(
      this.coreConfig.reportStorageLocation,
      end.getUTCFullYear().toString(),
      fileName.replace('{{subject}}', user.employeeId),
    );

    await userReport.write(path);
    /*this.mail.sendEmail(
      title,
      'Anbei ist die Arbeitszeitsübersicht',
      path,
      fileName.replace('{{subject}}', user.employeeId),
      user.email,
    );*/
  }

  private async createSummaryReport(
    start: Date,
    end: Date,
    users: AbsenceUser[],
    userMap: UserMap,
    title: string,
    fileName: string,
    sheduledTimeMode: 'month' | 'week' | 'day' | 'none',
  ) {
    this.logger.debug(`Createing summary report`);
    const summaryReport = new Workbook();
    for (let i = 0; i < users.length; i++) {
      await this.createUserReportSheet(
        start,
        end,
        users[i],
        summaryReport,
        userMap,
        title,
        sheduledTimeMode,
      );
    }

    const path = resolve(
      this.coreConfig.reportStorageLocation,
      end.getUTCFullYear().toString(),
      fileName.replace('{{subject}}', 'GESAMT'),
    );

    /*this.mail.sendEmail(
      title,
      'Anbei ist die Arbeitszeitsübersicht für alle CWI Mitarbeiter',
      path,
      fileName.replace('{{subject}}', 'GESAMT'),
      TEAMLEADS.GESAMT,
    );*/

    await summaryReport.write(path);
  }

  private async createUserReportSheet(
    start: Date,
    end: Date,
    user: AbsenceUser,
    workbook: any,
    userMap: UserMap,
    title: string,
    sheduledTimeMode: 'month' | 'week' | 'day' | 'none',
  ): Promise<any> {
    const timeEntries = await this.fetchTimeSpans(start, end, user._id);
    const sheduledTime = await this.fetchSheduledTimeOfUser(
      user,
      start,
      sheduledTimeMode,
    );

    createUserReport(user, workbook, userMap, title, timeEntries, sheduledTime);
  }

  private async fetchAbsences(): Promise<Absence[]> {
    const url = this.ABSENCE_BASE_URL + 'absences';
    this.logger.debug(`Fetching Absences from ${url}`);

    return (
      await firstValueFrom(
        this.httpService.post(url, undefined, {
          headers: { Authorization: this.composeAuthHeader(url) },
        }),
      )
    ).data;
  }

  private async fetchTimeSpans(
    start: Date,
    end: Date,
    userId?: string,
  ): Promise<TimeEntry[]> {
    const url = this.ABSENCE_BASE_URL + 'timespans';
    this.logger.debug(`Fetching Absences from ${url}`);

    const filter: TimeSpanFilter = {};

    filter.end = { $lt: end.toISOString() };
    filter.start = { $gte: start.toISOString() };
    filter.type = 'work';
    filter.userId = userId;

    return (
      await firstValueFrom(
        this.httpService.post(
          url,
          { filter },
          {
            headers: { Authorization: this.composeAuthHeader(url) },
          },
        ),
      )
    ).data.data.map((entry: TimeEntry) => {
      entry.end = new Date(entry.end);
      entry.start = new Date(entry.start);
      entry.effectiveEnd = new Date(entry.effectiveEnd);
      entry.effectiveStart = new Date(entry.effectiveStart);
      return entry;
    });
  }

  private async fetchUsers(): Promise<AbsenceUser[]> {
    const url = this.ABSENCE_BASE_URL + 'users';
    this.logger.debug(`Fetching Users from ${url}`);

    return (
      await firstValueFrom(
        this.httpService.post(url, undefined, {
          headers: { Authorization: this.composeAuthHeader(url) },
        }),
      )
    ).data.data;
  }

  private async fetchDepartments() {
    const url = this.ABSENCE_BASE_URL + 'departments';
    this.logger.debug(`Fetching departments from ${url}`);

    return (
      await firstValueFrom(
        this.httpService.post(
          url,
          { relations: ['approverIds'] },
          {
            headers: { Authorization: this.composeAuthHeader(url) },
          },
        ),
      )
    ).data.data;
  }

  private async fetchSheduledWeekTimeOfUser(user: AbsenceUser, date: Date) {
    const url = this.ABSENCE_INTERNAL_BASE_URL + 'timetracking/stats';
    this.logger.debug(`Fetching sehduledTime from ${url}`);

    return (
      await firstValueFrom(
        this.httpService.post(
          url,
          { userId: user._id, date: date.toISOString() },
          {
            headers: { Authorization: this.composeAuthHeader(url) },
          },
        ),
      )
    ).data.week.scheduledTime;
  }

  private async fetchSheduledTimeOfUser(
    user: AbsenceUser,
    date: Date,
    sheduledTimeMode: 'month' | 'week' | 'day' | 'none',
  ) {
    const url = this.ABSENCE_INTERNAL_BASE_URL + 'timetracking/stats';
    this.logger.debug(`Fetching sehduledTime from ${url}`);

    if (sheduledTimeMode === 'none') {
      return -1;
    }

    console.log({ userId: user._id, date: date.toISOString() });

    return (
      await firstValueFrom(
        this.httpService.post(
          url,
          { userId: user._id, date: date.toISOString() },
          {
            headers: { Authorization: this.composeAuthHeader(url) },
          },
        ),
      )
    ).data[sheduledTimeMode].scheduledTime;
  }

  private composeAuthHeader(
    url: string,
    method: 'POST' | 'GET' | 'PUT' | 'DELETE' = 'POST',
  ): string {
    return hawk.header(url, method, {
      credentials: this.HAWK_CREDENTIALS,
    }).header;
  }
}
