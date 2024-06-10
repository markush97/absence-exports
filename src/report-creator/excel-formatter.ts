import { AbsenceUser } from 'src/absence-client/absence-user';
import { TimeEntry } from 'src/absence-client/timeentry';
import { HEADER_STYLE, HOLIDAY_STYLE, NIGHT_STYLE } from './excel-styles';
import { getTimeDetailsFromTimeEntry } from 'src/time-helper/time.helper';

type UserMap = { [id: string]: AbsenceUser };

export const createUserReport = (
  user: AbsenceUser,
  workbook: any,
  userMap: UserMap,
  title: string,
  timeEntries: TimeEntry[],
  sheduledTime: number,
) => {
  const headerStyle = workbook.createStyle(HEADER_STYLE);
  const nightStyle = workbook.createStyle(NIGHT_STYLE);
  const holidayStyle = workbook.createStyle(HOLIDAY_STYLE);

  const ws = workbook.addWorksheet(
    `${user.employeeId} (${user.firstName} ${user.lastName})`,
  );

  // Get the Raw total minutes
  const totalMinutes = timeEntries.reduce<number>((total, timeEntry) => {
    const timeDetails = getTimeDetailsFromTimeEntry(timeEntry);
    return total + timeDetails.totalMinutes;
  }, 0);

  // Get the holiday Minutes
  const holidayMinutes = timeEntries.reduce<number>((total, timeEntry) => {
    const timeDetails = getTimeDetailsFromTimeEntry(timeEntry);
    return total + timeDetails.holidayMinutes;
  }, 0);

  // Get Minutes at night not on a holiday
  const notHolidayNightMinutes = timeEntries.reduce<number>(
    (total, timeEntry) => {
      const timeDetails = getTimeDetailsFromTimeEntry(timeEntry);
      return total + timeDetails.notHolidayNightMinutes;
    },
    0,
  );

  const notHolidayNightMinutesAdjusted = notHolidayNightMinutes * 1.5;
  const holidayMinutesAdjusted = holidayMinutes * 2;

  // Calculate sheduled Minutes to work
  const scheduledMinutes = Math.floor(sheduledTime / (1000 * 60));

  // Fetch included overtime in the contract from absence
  const includedOvertimeMinutes = Number.parseInt(user.secondaryEmployeeId ?? '0');
  let overTimeDeduction = includedOvertimeMinutes * 60;

  const otherOvertime = Math.max(
    0,
    totalMinutes - scheduledMinutes - holidayMinutes - notHolidayNightMinutes,
  );

  const totalTimeAdjusted = (totalMinutes - holidayMinutes - notHolidayNightMinutes) + holidayMinutesAdjusted + notHolidayNightMinutesAdjusted;

  let totalExtraHoliday = Math.max(0, Math.ceil(holidayMinutesAdjusted - overTimeDeduction));
  const totalExtraHolidaySub = holidayMinutesAdjusted - totalExtraHoliday;
  overTimeDeduction = Math.max(0, overTimeDeduction - holidayMinutesAdjusted);
  totalExtraHoliday = totalExtraHoliday / 2

  let totalExtraNight = Math.max(0, Math.ceil(notHolidayNightMinutesAdjusted - overTimeDeduction));
  const totalExtraNightSub = notHolidayNightMinutesAdjusted - totalExtraNight;
  overTimeDeduction = Math.max(0, overTimeDeduction - notHolidayNightMinutesAdjusted);
  totalExtraNight = totalExtraNight / 1.5

  const totalExtraOther = Math.max(0, Math.ceil(otherOvertime - overTimeDeduction));
  const totalExtraOtherSub = otherOvertime - totalExtraOther;
  overTimeDeduction = Math.max(0, overTimeDeduction - otherOvertime);

  let highestRow = 0;

  // Column widths
  ws.column(1).setWidth(30);
  ws.column(2).setWidth(13);
  ws.column(3).setWidth(13);
  ws.column(4).setWidth(13);
  ws.column(5).setWidth(9);
  ws.column(6).setWidth(10);
  ws.column(7).setWidth(14);
  ws.column(8).setWidth(18);
  ws.column(9).setWidth(30);
  ws.column(10).setWidth(15);
  ws.column(14).setWidth(19);

  ws.cell(++highestRow, 1)
    .string(`${title}: ${user.employeeId}`)
    .style(headerStyle);
  highestRow += 2;

  ++highestRow;
  ws.cell(++highestRow, 1).string('Informationen');
  ws.cell(++highestRow, 1).string('Einträge:');
  ws.cell(highestRow, 2).number(timeEntries.length);
  ws.cell(++highestRow, 1).string('Pauschale ÜS:');
  ws.cell(highestRow, 2).number(includedOvertimeMinutes);

  ws.cell(++highestRow, 2)
    .string('Raw')
    .style({ border: { bottom: { style: 'medium', color: 'black' } } });
  ws.cell(highestRow, 4)
    .string('Wertigkeit')
    .style({ border: { bottom: { style: 'medium', color: 'black' } } });
  ws.cell(highestRow, 5)
    .string('inkl. Wertigkeit')
    .style({ border: { bottom: { style: 'medium', color: 'black' } } });
    ws.cell(highestRow, 7)
    .string('Pauschal abgegolten')
    .style({ border: { bottom: { style: 'medium', color: 'black' } } });
    ws.cell(highestRow, 9)
    .string('Raw auszuzahlen')
    .style({ border: { bottom: { style: 'medium', color: 'black' } } });

  ++highestRow;
  ++highestRow;
  ++highestRow;
  ws.cell(++highestRow, 1)
    .string('Kategorie')
    .style({ border: { bottom: { style: 'medium', color: 'black' } } });
  ws.cell(highestRow, 2)
    .string('Stunden')
    .style({ border: { bottom: { style: 'medium', color: 'black' } } });
  ws.cell(highestRow, 3)
    .string('Minuten')
    .style({ border: { bottom: { style: 'medium', color: 'black' } } });
  ws.cell(highestRow, 4)
    .string('Wertigkeit')
    .style({ border: { bottom: { style: 'medium', color: 'black' } } });
  ws.cell(highestRow, 5)
    .string('Stunden')
    .style({ border: { bottom: { style: 'medium', color: 'black' } } });
    ws.cell(highestRow, 6)
    .string('Minuten')
    .style({ border: { bottom: { style: 'medium', color: 'black' } } });
    ws.cell(highestRow, 7)
    .string('Stunden')
    .style({ border: { bottom: { style: 'medium', color: 'black' } } });
    ws.cell(highestRow, 8)
    .string('Minuten')
    .style({ border: { bottom: { style: 'medium', color: 'black' } } });
    ws.cell(highestRow, 9)
    .string('Stunden')
    .style({ border: { bottom: { style: 'medium', color: 'black' } } });
    ws.cell(highestRow, 10)
    .string('Minuten')
    .style({ border: { bottom: { style: 'medium', color: 'black' } } });

  ws.cell(++highestRow, 1).string('Werktag Nachtzeit:');
  ws.cell(highestRow, 2).number(Math.floor(notHolidayNightMinutes / 60));
  ws.cell(highestRow, 3).number(notHolidayNightMinutes % 60).style({font: {align: "left"}});
  ws.cell(highestRow, 4).string('150%');
  ws.cell(highestRow, 5).number(Math.floor(notHolidayNightMinutesAdjusted / 60));
  ws.cell(highestRow, 6).number(notHolidayNightMinutesAdjusted % 60).style({font: {align: "left"}});
  ws.cell(highestRow, 7).number(Math.floor(totalExtraNightSub / 60));
  ws.cell(highestRow, 8).number(totalExtraNightSub % 60).style({font: {align: "left"}});
  ws.cell(highestRow, 9).number(Math.floor(totalExtraNight / 60));
  ws.cell(highestRow, 10).number(totalExtraNight % 60).style({font: {align: "left"}});
  ws.cell(++highestRow, 1).string('Sonn-/Feiertagszeit:');
  ws.cell(highestRow, 2).number(Math.floor(holidayMinutes / 60));
  ws.cell(highestRow, 3).number(holidayMinutes % 60).style({font: {align: "left"}});
  ws.cell(highestRow, 4).string('200%');
  ws.cell(highestRow, 5).number(Math.floor(holidayMinutesAdjusted / 60));
  ws.cell(highestRow, 6).number(holidayMinutesAdjusted % 60).style({font: {align: "left"}});
  ws.cell(highestRow, 7).number(Math.floor(totalExtraHolidaySub / 60));
  ws.cell(highestRow, 8).number(totalExtraHolidaySub % 60).style({font: {align: "left"}});
  ws.cell(highestRow, 9).number(Math.floor(totalExtraHoliday / 60));
  ws.cell(highestRow, 10).number(totalExtraHoliday % 60).style({font: {align: "left"}});
  ws.cell(++highestRow, 1).string('Sonstige Überstunden:');
  ws.cell(highestRow, 2).number(Math.floor(otherOvertime / 60));
  ws.cell(highestRow, 3).number(otherOvertime % 60).style({font: {align: "left"}});
  ws.cell(highestRow, 4).string('100%');
  ws.cell(highestRow, 5).number(Math.floor(otherOvertime / 60));
  ws.cell(highestRow, 6).number(otherOvertime % 60).style({font: {align: "left"}});
  ws.cell(highestRow, 7).number(Math.floor(totalExtraOtherSub / 60));
  ws.cell(highestRow, 8).number(totalExtraOtherSub % 60).style({font: {align: "left"}});
  ws.cell(highestRow, 9).number(Math.floor(totalExtraOther / 60));
  ws.cell(highestRow, 10).number(totalExtraOther % 60).style({font: {align: "left"}});

  ++highestRow;
  ws.cell(++highestRow, 1)
    .string('Zusammenfassung')
    .style({ border: { bottom: { style: 'medium', color: 'black' } } });
  ws.cell(highestRow, 2)
    .string('Stunden')
    .style({ border: { bottom: { style: 'medium', color: 'black' } } });
  ws.cell(highestRow, 3)
    .string('Minuten')
    .style({ border: { bottom: { style: 'medium', color: 'black' } } });
  ws.cell(++highestRow, 1).string('Geplante Arbeitszeit:');
  ws.cell(highestRow, 2).number(Math.floor(sheduledTime / (1000 * 60 * 60)));
  ws.cell(highestRow, 3).number(Math.floor(sheduledTime / (1000 * 60)) % 60);
  ws.cell(++highestRow, 1).string('Gesamte Arbeitszeit:');
  ws.cell(highestRow, 2).number(Math.floor(totalMinutes / 60));
  ws.cell(highestRow, 3).number(totalMinutes % 60);
  ws.cell(++highestRow, 1).string('Gesamte Arbeitszeit angepasst:');
  ws.cell(highestRow, 2).number(Math.floor(totalTimeAdjusted / 60));
  ws.cell(highestRow, 3).number(totalTimeAdjusted % 60);

  highestRow += 2;

  // Time Entry Table
  ws.cell(++highestRow, 1).string('ID').style(headerStyle);
  ws.cell(highestRow, 2).string('Startdatum').style(headerStyle);
  ws.cell(highestRow, 3).string('Startzeit').style(headerStyle);
  ws.cell(highestRow, 4).string('Endzeit').style(headerStyle);
  ws.cell(highestRow, 5).string('Stunden').style(headerStyle);
  ws.cell(highestRow, 6).string('Minuten').style(headerStyle);
  ws.cell(highestRow, 7).string('Nacht').style(headerStyle);
  ws.cell(highestRow, 8).string('Sonn-/Feiertags').style(headerStyle);
  ws.cell(highestRow, 9).string('Nacht ohne Sonn-/Feiertag').style(headerStyle);
  ws.cell(highestRow, 10).string('Kommentar').style(headerStyle);
  ws.cell(highestRow, 11).string('Gerät').style(headerStyle);
  ws.cell(highestRow, 12).string('Art').style(headerStyle);
  ws.cell(highestRow, 13).string('Ersteller').style(headerStyle);
  ws.cell(highestRow, 14).string('Bearbeiter').style(headerStyle);

  // TimeEntries
  timeEntries.forEach((entry) => {
    const timeDetails = getTimeDetailsFromTimeEntry(entry);

    ws.cell(++highestRow, 1).string(entry._id);
    ws.cell(highestRow, 2).string(entry.start.toLocaleDateString());
    ws.cell(highestRow, 3).string(entry.start.toLocaleTimeString());
    ws.cell(highestRow, 4).string(entry.end.toLocaleTimeString());
    ws.cell(highestRow, 5).number(Math.floor(timeDetails.totalMinutes / 60));
    ws.cell(highestRow, 6).number(timeDetails.totalMinutes % 60);

    if (timeDetails.nightMinutes > 0) {
      ws.cell(highestRow, 7).number(timeDetails.nightMinutes).style(nightStyle);
      ws.cell(highestRow, 9)
        .number(timeDetails.notHolidayNightMinutes)
        .style(nightStyle);
    } else {
      ws.cell(highestRow, 7).number(timeDetails.nightMinutes);
      ws.cell(highestRow, 9).number(timeDetails.notHolidayNightMinutes);
    }

    if (timeDetails.holidayMinutes > 0) {
      ws.cell(highestRow, 8)
        .number(timeDetails.holidayMinutes)
        .style(holidayStyle);
    } else {
      ws.cell(highestRow, 8).number(timeDetails.holidayMinutes);
    }

    ws.cell(highestRow, 10).string(entry.commentary ?? '');
    ws.cell(highestRow, 11).string(entry.source.sourceType);
    ws.cell(highestRow, 12).string(entry.source.sourceId ?? 'Terminal');
    ws.cell(highestRow, 13).string(userMap[entry.createdById].employeeId);
    ws.cell(highestRow, 14).string(userMap[entry.modifiedById].employeeId);
  });
};
