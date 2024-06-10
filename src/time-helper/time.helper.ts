import { TimeDetails, TimeEntry } from 'src/absence-client/timeentry';

const HOLIDAY_LIST = [new Date('2023-01-06'), new Date('2024-01-06'), new Date('2024-04-01'), new Date('2024-05-01'),new Date('2024-05-009'), new Date('2024-05-20'), new Date('2024-05-30'), new Date('2024-08-15'), new Date('2024-10-26'), new Date('2024-11-01'), new Date('2024-12-08'), new Date('2024-12-25'), new Date('2024-12-26')];

/**
 *
 * @returns worked time in minutes
 */
export const getTimeDetailsFromTimeEntry = (
  timeEntry: TimeEntry,
): TimeDetails => {
  const endHour = new Date(timeEntry.end).getHours();
  const startHour = new Date(timeEntry.start).getHours();

  const startsHoliday = isHoliday(timeEntry.start);
  const endsHoliday = isHoliday(timeEntry.end);

  let nightMinutes = 0;
  let holidayMinutes = 0;
  let notHolidayNightMinutes = 0;

  const totalMinutes = calculateTimeSpan(timeEntry);

  let holidayStartTime = new Date(timeEntry.start.getTime());
  let holidayEndTime = new Date(timeEntry.end.getTime());

  if (startsHoliday || endsHoliday) {
    // Holiday Workingtime

    if (!startsHoliday) {
      holidayStartTime = new Date(
        new Date(timeEntry.start).setHours(23, 59, 59, 999),
      );
    }

    if (!endsHoliday) {
      holidayEndTime = new Date(new Date(timeEntry.start).setHours(0, 0, 0, 0));
    }

    holidayMinutes = calculateTimeSpan({
      start: holidayStartTime,
      end: holidayEndTime,
    });
  }

  if (endHour > 20 || startHour < 6 || startHour > 20 || startHour < 6) {
    // Night-Hours
    let nightStartTime = new Date(timeEntry.start.getTime());
    let nightEndTime = new Date(timeEntry.end.getTime());

    let noHolidayNightStartTime = nightStartTime;
    let noHolidayNightEndTime = nightEndTime;

    if (startHour >= 6) {
      nightStartTime = new Date(
        Math.max(
          new Date(timeEntry.start).setHours(20, 0, 0, 0),
          nightStartTime.getTime(),
        ),
      );
    }

    if (endHour < 20) {
      nightEndTime = new Date(
        Math.min(
          timeEntry.end.getTime(),
          new Date(timeEntry.end).setHours(6, 0, 0, 0),
        ),
      );
    }

    nightMinutes = calculateTimeSpan({
      start: nightStartTime,
      end: nightEndTime,
    });

    notHolidayNightMinutes = Math.max(0, nightMinutes - holidayMinutes);
  }

  return {
    totalMinutes,
    nightMinutes,
    holidayMinutes,
    normalMinutes: 0,
    notHolidayNightMinutes,
  };
};

export const calculateTimeSpan = (
  timeEntry: TimeEntry | { start: Date; end: Date },
): number => {
  return Math.round(
    (timeEntry.end.getTime() - timeEntry.start.getTime()) / 1000 / 60,
  );
};

const isHoliday = (date: Date): boolean => {
  if (date.getDay() === 0) {
    return true;
  }

  return HOLIDAY_LIST.some(
    (holiday) =>
      date.getFullYear() === holiday.getFullYear() &&
      date.getMonth() === holiday.getMonth() &&
      date.getDate() === holiday.getDate(),
  );
};
