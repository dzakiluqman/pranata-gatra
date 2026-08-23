export const DAYS_OF_WEEK = [
  {
    value: 1,
    label: "Senin",
    shortLabel: "Sen",
  },
  {
    value: 2,
    label: "Selasa",
    shortLabel: "Sel",
  },
  {
    value: 3,
    label: "Rabu",
    shortLabel: "Rab",
  },
  {
    value: 4,
    label: "Kamis",
    shortLabel: "Kam",
  },
  {
    value: 5,
    label: "Jumat",
    shortLabel: "Jum",
  },
  {
    value: 6,
    label: "Sabtu",
    shortLabel: "Sab",
  },
  {
    value: 0,
    label: "Minggu",
    shortLabel: "Min",
  },
] as const;

export interface SubjectSchedule {
  scheduleEnabled: boolean;
  startTime: string | null;
  endTime: string | null;
  scheduleStartDate: string | null;
  recurrenceEnabled: boolean;
  recurrenceDays: number[];
  room: string | null;
  lecturer: string | null;
  reminderEnabled: boolean;
  reminderMinutes: number;
}
