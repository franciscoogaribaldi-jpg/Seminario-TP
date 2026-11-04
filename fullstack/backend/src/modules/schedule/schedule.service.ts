import { Schedule, SectionSchedule } from '../../models/index.js';

export type ScheduleDay = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY';

export interface CreateScheduleDTO {
  day: ScheduleDay;
  start_time: string;
  end_time: string;
}

export interface UpdateScheduleDTO {
  day?: ScheduleDay;
  start_time?: string;
  end_time?: string;
}

export class ScheduleService {
  async findAll() {
    return await Schedule.findAll({
      order: [
        ['day', 'ASC'],
        ['start_time', 'ASC']
      ]
    });
  }

  async findById(id: number) {
    return await Schedule.findByPk(id);
  }

  async create(data: CreateScheduleDTO) {
    // Normalizar horas (por ejemplo "08:00" -> "08:00:00")
    const startTime = data.start_time.length === 5 ? `${data.start_time}:00` : data.start_time;
    const endTime = data.end_time.length === 5 ? `${data.end_time}:00` : data.end_time;

    return await Schedule.create({
      day: data.day,
      start_time: startTime,
      end_time: endTime
    });
  }

  async update(id: number, data: UpdateScheduleDTO) {
    const schedule = await Schedule.findByPk(id);
    if (!schedule) {
      return null;
    }

    const updatedData: any = { ...data };
    if (data.start_time && data.start_time.length === 5) {
      updatedData.start_time = `${data.start_time}:00`;
    }
    if (data.end_time && data.end_time.length === 5) {
      updatedData.end_time = `${data.end_time}:00`;
    }

    return await schedule.update(updatedData);
  }

  async delete(id: number) {
    const schedule = await Schedule.findByPk(id);
    if (!schedule) {
      return { success: false, reason: 'NOT_FOUND' };
    }

    // Verificar si el horario está asignado a alguna comisión (sección)
    const linkedSections = await SectionSchedule.count({ where: { id_schedule: id } });
    if (linkedSections > 0) {
      return { 
        success: false, 
        reason: 'IN_USE', 
        message: 'No se puede eliminar el horario porque está asignado a una o más comisiones activas.' 
      };
    }

    await schedule.destroy();
    return { success: true };
  }
}
