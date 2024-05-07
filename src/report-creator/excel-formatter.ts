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

  const totalMinutes = timeEntries.reduce<number>((total, timeEntry) => {
    const timeDetails = getTimeDetailsFromTimeEntry(timeEntry);
    return total + timeDetails.totalMinutes;
  }, 0);

  const holidayMinutes = timeEntries.reduce<number>((total, timeEntry) => {
    const timeDetails = getTimeDetailsFromTimeEntry(timeEntry);
    return total + timeDetails.holidayMinutes;
  }, 0);

  const notHolidayNightMinutes = timeEntries.reduce<number>(
    (total, timeEntry) => {
      const timeDetails = getTimeDetailsFromTimeEntry(timeEntry);
      return total + timeDetails.notHolidayNightMinutes;
    },
    0,
  );

  const scheduledMinutes = Math.floor(sheduledTime / (1000 * 60));

  const includedOvertime = Number.parseInt(user.secondaryEmployeeId ?? '0');
  let overTimeDeduction = includedOvertime * 60;
  let totalBillableTime = 0;

  if (overTimeDeduction > holidayMinutes) {
    overTimeDeduction -= holidayMinutes;
  } else {
    (totalBillableTime += holidayMinutes - overTimeDeduction) * 2;
  }

  if (overTimeDeduction > notHolidayNightMinutes) {
    overTimeDeduction -= notHolidayNightMinutes;
  } else {
    totalBillableTime += (notHolidayNightMinutes - overTimeDeduction) * 2;
  }

  const otherOvertime = Math.max(
    0,
    totalMinutes - scheduledMinutes - holidayMinutes - notHolidayNightMinutes,
  );

  totalBillableTime += totalMinutes - holidayMinutes - notHolidayNightMinutes;

  totalBillableTime = Math.max(totalBillableTime, scheduledMinutes);

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
  ws.cell(highestRow, 2).number(includedOvertime);

  ++highestRow;
  ws.cell(++highestRow, 1)
    .string('Überstunden')
    .style({ border: { bottom: { style: 'medium', color: 'black' } } });
  ws.cell(highestRow, 2)
    .string('Stunden')
    .style({ border: { bottom: { style: 'medium', color: 'black' } } });
  ws.cell(highestRow, 3)
    .string('Minuten')
    .style({ border: { bottom: { style: 'medium', color: 'black' } } });
  ws.cell(highestRow, 4)
    .string('Abgeltung')
    .style({ border: { bottom: { style: 'medium', color: 'black' } } });
  ws.cell(++highestRow, 1).string('Werktag Nachtzeit:');
  ws.cell(highestRow, 2).number(Math.floor(notHolidayNightMinutes / 60));
  ws.cell(highestRow, 3).number(notHolidayNightMinutes % 60);
  ws.cell(highestRow, 4).string('200%');
  ws.cell(++highestRow, 1).string('Sonn-/Feiertagszeit:');
  ws.cell(highestRow, 2).number(Math.floor(holidayMinutes / 60));
  ws.cell(highestRow, 3).number(holidayMinutes % 60);
  ws.cell(highestRow, 4).string('200%');
  ws.cell(++highestRow, 1).string('Sonstige Überstunden:');
  ws.cell(highestRow, 2).number(Math.floor(otherOvertime / 60));
  ws.cell(highestRow, 3).number(otherOvertime % 60);
  ws.cell(highestRow, 4).string('150%');

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

  /*
  highestRow++;
  ws.cell(++highestRow, 1).string('Ausbezahlte Überstunden');
  ws.cell(++highestRow, 1)
    .string('(ÜS abzüglich Pauschale inkl. 50%/00% Zuschlag)')
    .style({ border: { top: { style: 'medium', color: 'black' } } });
  ws.cell(highestRow, 2)
    .number(Math.floor(totalBillableTime / 60))
    .style({ border: { top: { style: 'medium', color: 'black' } } });
  ws.cell(highestRow, 3)
    .number(totalBillableTime % 60)
    .style({ border: { top: { style: 'medium', color: 'black' } } });
  */

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
