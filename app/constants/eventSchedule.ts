// constants/eventSchedule.ts

export interface CampEvent {
  id: string;
  name: string;
  poiId: string;       // links to POIS in mapData.ts
  startTime: string;   // "HH:mm" 24hr, camp-local time
  endTime: string;
  daysOfWeek: number[]; // 0=Sun ... 6=Sat
  doorsOpenMinsBefore?: number;
}

export const CAMP_EVENTS: CampEvent[] = [
  {
    id: 'evt-sun-main',
    name: 'Sunday Main Service',
    poiId: '1', // The Arena
    startTime: '08:00',
    endTime: '11:30',
    daysOfWeek: [0],
    doorsOpenMinsBefore: 60,
  },
  {
    id: 'evt-evening-service',
    name: 'Evening Service',
    poiId: '1',
    startTime: '18:00',
    endTime: '20:30',
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    doorsOpenMinsBefore: 45,
  },
  {
    id: 'evt-bible-study',
    name: 'Bible College Evening Class',
    poiId: '3', // Redeemed Christian Bible College
    startTime: '16:00',
    endTime: '17:30',
    daysOfWeek: [1, 3, 5],
    doorsOpenMinsBefore: 15,
  },
  {
    id: 'evt-market-hours',
    name: 'Redemption Market Trading Hours',
    poiId: '4',
    startTime: '07:00',
    endTime: '20:00',
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
  },
  {
    id: 'evt-bank-hours',
    name: 'CRM Bank & ATM Service Hours',
    poiId: '5',
    startTime: '09:00',
    endTime: '16:00',
    daysOfWeek: [1, 2, 3, 4, 5],
  },
  {
    id: 'evt-clinic-hours',
    name: 'Health Centre Walk-in Hours',
    poiId: '6',
    startTime: '08:00',
    endTime: '22:00',
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
  },
];

/** Get events happening at/around a given POI today */
export function getEventsForPoi(poiId: string, now: Date = new Date()): CampEvent[] {
  const day = now.getDay();
  return CAMP_EVENTS.filter((e) => e.poiId === poiId && e.daysOfWeek.includes(day));
}

/** Get all events active or upcoming today, sorted by start time */
export function getTodaysSchedule(now: Date = new Date()): CampEvent[] {
  const day = now.getDay();
  return CAMP_EVENTS
    .filter((e) => e.daysOfWeek.includes(day))
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
}

/** Minutes from now until a "HH:mm" time today (negative if already passed) */
export function minsUntil(time: string, now: Date = new Date()): number {
  const [h, m] = time.split(':').map(Number);
  const target = new Date(now);
  target.setHours(h, m, 0, 0);
  return Math.round((target.getTime() - now.getTime()) / 60000);
}