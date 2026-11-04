import { type Request, type Response } from 'express';
import { ScheduleService, type ScheduleDay } from './schedule.service.js';

const scheduleService = new ScheduleService();

const VALID_DAYS: ScheduleDay[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

export const getSchedules = async (req: Request, res: Response) => {
  try {
    const schedules = await scheduleService.findAll();
    res.json({ success: true, data: schedules });
  } catch (error) {
    console.error('Error fetching schedules:', error);
    res.status(500).json({ success: false, message: 'Error al obtener los horarios' });
  }
};

export const getScheduleById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const schedule = await scheduleService.findById(Number(id));
    if (!schedule) {
      res.status(404).json({ success: false, message: 'Horario no encontrado' });
      return;
    }
    res.json({ success: true, data: schedule });
  } catch (error) {
    console.error('Error fetching schedule by id:', error);
    res.status(500).json({ success: false, message: 'Error al obtener el horario' });
  }
};

export const createSchedule = async (req: Request, res: Response): Promise<void> => {
  try {
    const { day, start_time, end_time } = req.body;

    if (!day || !start_time || !end_time) {
      res.status(400).json({ 
        success: false, 
        message: 'Todos los campos son obligatorios: día, hora de inicio y hora de fin.' 
      });
      return;
    }

    if (!VALID_DAYS.includes(day)) {
      res.status(400).json({ 
        success: false, 
        message: `Día inválido. Debe ser uno de: ${VALID_DAYS.join(', ')}` 
      });
      return;
    }

    if (start_time >= end_time) {
      res.status(400).json({ 
        success: false, 
        message: 'La hora de inicio debe ser anterior a la hora de fin.' 
      });
      return;
    }

    const newSchedule = await scheduleService.create({ day, start_time, end_time });
    res.status(201).json({ success: true, data: newSchedule });
  } catch (error) {
    console.error('Error creating schedule:', error);
    res.status(500).json({ success: false, message: 'Error al registrar el horario' });
  }
};

export const updateSchedule = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { day, start_time, end_time } = req.body;

    if (day && !VALID_DAYS.includes(day)) {
      res.status(400).json({ 
        success: false, 
        message: `Día inválido. Debe ser uno de: ${VALID_DAYS.join(', ')}` 
      });
      return;
    }

    if (start_time && end_time && start_time >= end_time) {
      res.status(400).json({ 
        success: false, 
        message: 'La hora de inicio debe ser anterior a la hora de fin.' 
      });
      return;
    }

    const updated = await scheduleService.update(Number(id), { day, start_time, end_time });
    if (!updated) {
      res.status(404).json({ success: false, message: 'Horario no encontrado' });
      return;
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating schedule:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar el horario' });
  }
};

export const deleteSchedule = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await scheduleService.delete(Number(id));

    if (!result.success) {
      if (result.reason === 'NOT_FOUND') {
        res.status(404).json({ success: false, message: 'Horario no encontrado' });
        return;
      }
      if (result.reason === 'IN_USE') {
        res.status(409).json({ success: false, message: result.message });
        return;
      }
    }

    res.json({ success: true, message: 'Horario eliminado correctamente' });
  } catch (error) {
    console.error('Error deleting schedule:', error);
    res.status(500).json({ success: false, message: 'Error al eliminar el horario' });
  }
};
