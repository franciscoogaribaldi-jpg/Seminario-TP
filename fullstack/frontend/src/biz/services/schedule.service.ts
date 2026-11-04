import { API_BASE_URL } from '../config';

export type ScheduleDay = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY';

export const SCHEDULE_DAYS: { value: ScheduleDay; label: string }[] = [
  { value: 'MONDAY', label: 'Lunes' },
  { value: 'TUESDAY', label: 'Martes' },
  { value: 'WEDNESDAY', label: 'Miércoles' },
  { value: 'THURSDAY', label: 'Jueves' },
  { value: 'FRIDAY', label: 'Viernes' },
  { value: 'SATURDAY', label: 'Sábado' },
];

export const DAY_LABELS: Record<ScheduleDay, string> = {
  MONDAY: 'Lunes',
  TUESDAY: 'Martes',
  WEDNESDAY: 'Miércoles',
  THURSDAY: 'Jueves',
  FRIDAY: 'Viernes',
  SATURDAY: 'Sábado',
};

export interface Schedule {
  id_schedule?: number;
  day: ScheduleDay;
  start_time: string;
  end_time: string;
}

export const scheduleService = {
  getSchedules: async (): Promise<Schedule[]> => {
    const res = await fetch(`${API_BASE_URL}/schedules`);
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Error al obtener horarios');
    return json.data;
  },

  getScheduleById: async (id: number): Promise<Schedule> => {
    const res = await fetch(`${API_BASE_URL}/schedules/${id}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Error al obtener el horario');
    return json.data;
  },

  createSchedule: async (schedule: Omit<Schedule, 'id_schedule'>): Promise<Schedule> => {
    const res = await fetch(`${API_BASE_URL}/schedules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(schedule),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Error al registrar el horario');
    return json.data;
  },

  updateSchedule: async (id: number, schedule: Partial<Schedule>): Promise<Schedule> => {
    const res = await fetch(`${API_BASE_URL}/schedules/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(schedule),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Error al actualizar el horario');
    return json.data;
  },

  deleteSchedule: async (id: number): Promise<void> => {
    const res = await fetch(`${API_BASE_URL}/schedules/${id}`, {
      method: 'DELETE',
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Error al eliminar el horario');
  },
};
