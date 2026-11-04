import { API_BASE_URL } from '../config';
import type { Course } from './course.service';
import type { Professor as User } from './professor.service';

const API_URL = `${API_BASE_URL}/sections`;

export interface Schedule {
  id_schedule?: number;
  day: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY';
  start_time: string;
  end_time: string;
}

export interface Classroom {
  id?: number;
  name: string;
  capacity: number;
}

export interface Section {
  id_section?: number;
  name?: string;
  id_course: number;
  id_classroom: number;
  id_academic_year: number;
  course?: Course;
  classroom?: Classroom;
  academic_year?: any;
  schedules?: Schedule[];
  professors?: User[];
  enrollments?: any[];
}

export const sectionService = {
  getSections: async (id_academic_year?: number): Promise<Section[]> => {
    const url = id_academic_year ? `${API_URL}?id_academic_year=${id_academic_year}` : API_URL;
    const res = await fetch(url);
    const json = await res.json();
    return json.data || [];
  },

  createSection: async (sectionData: any): Promise<Section> => {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sectionData)
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Error desconocido al crear la comisión');
    return json.data;
  },

  deleteSection: async (id: number): Promise<void> => {
    const res = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE'
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
  }
};
