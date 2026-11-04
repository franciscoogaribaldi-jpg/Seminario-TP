export const SIDEBAR_TABS = {
  DASHBOARD: 'dashboard',
  ENROLLMENTS: 'enrollments',
  STUDENTS: 'students',
  PROFESSORS: 'professors',
  COURSES: 'courses',
  CLASSROOMS: 'classrooms',
  ACADEMIC_YEARS: 'academic-years',
  SCHEDULES: 'schedules',
  LEVELS: 'levels',
  REPORTS: 'reports',
} as const;

export type SidebarTab = typeof SIDEBAR_TABS[keyof typeof SIDEBAR_TABS];
