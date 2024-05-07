export interface Absence {
  _id: string;
  status: number;
  startDateTime: Date;
  endDateTime: Date;
  commentary: string;
  daysCount: number;
}
