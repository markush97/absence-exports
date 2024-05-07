export interface TimeEntry {
  _id: string;
  userId: string;
  type: 'work' | 'break';
  start: Date;
  end: Date;
  effectiveStart: Date;
  effectiveEnd: Date;
  commentary: string;
  timezoneName: string;
  createdById: string;
  modifiedById: string;
  source: { sourceType: string; sourceId: string };
}

export interface TimeSpanFilter {
  userId?: string;
  start?: { $gte: string };
  end?: { $lt: string };
  type?: 'work' | 'break';
}

export interface TimeDetails {
  nightMinutes: number;
  holidayMinutes: number;
  normalMinutes: number;
  totalMinutes: number;
  notHolidayNightMinutes: number;
}
