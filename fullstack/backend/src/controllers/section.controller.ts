import type { Request, Response } from 'express';
import { Section, Schedule, SectionSchedule, UserSection, Course, Classroom, AcademicYear, User, Level, Enrollment } from '../models/index.js';
import { Op } from 'sequelize';
import { sequelize } from '../config/database.js';
import { DAY_LABELS } from '../constants.js';

export const getSections = async (req: Request, res: Response) => {
  try {
    const { id_academic_year } = req.query;
    
    const filter: any = {};
    if (id_academic_year) {
      filter.id_academic_year = id_academic_year;
    }

    const sections = await Section.findAll({
      where: filter,
      include: [
        { model: Course, as: 'course', include: [{ model: Level, as: 'level' }] },
        { model: Classroom, as: 'classroom' },
        { model: AcademicYear, as: 'academic_year' },
        { model: Schedule, as: 'schedules' },
        { model: User, as: 'professors', attributes: ['id', 'first_name', 'last_name', 'email', 'dni', 'phone'] },
        {
          model: Enrollment,
          as: 'enrollments',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'first_name', 'last_name', 'dni', 'email', 'phone', 'active']
            }
          ]
        }
      ]
    });
    res.json({ success: true, data: sections });
  } catch (error) {
    console.error('Error fetching sections:', error);
    res.status(500).json({ success: false, message: 'Error al obtener las comisiones' });
  }
};

export const getSectionById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const section = await Section.findByPk(Number(id), {
      include: [
        { model: Course, as: 'course', include: [{ model: Level, as: 'level' }] },
        { model: Classroom, as: 'classroom' },
        { model: AcademicYear, as: 'academic_year' },
        { model: Schedule, as: 'schedules' },
        { model: User, as: 'professors', attributes: ['id', 'first_name', 'last_name', 'email', 'dni', 'phone'] },
        {
          model: Enrollment,
          as: 'enrollments',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'first_name', 'last_name', 'dni', 'email', 'phone', 'active']
            }
          ]
        }
      ]
    });
    if (!section) {
      res.status(404).json({ success: false, message: 'Comisión no encontrada' });
      return;
    }
    res.json({ success: true, data: section });
  } catch (error) {
    console.error('Error fetching section:', error);
    res.status(500).json({ success: false, message: 'Error al obtener la comisión' });
  }
};

export const createSection = async (req: Request, res: Response): Promise<void> => {
  const t = await sequelize.transaction();
  try {
    const { id_course, id_classroom, id_academic_year, schedules, id_professor } = req.body;

    // Validar que la hora de inicio sea anterior a la de fin
    if (schedules && schedules.length > 0) {
      for (const reqSchedule of schedules) {
        if (reqSchedule.start_time >= reqSchedule.end_time) {
          await t.rollback();
          const dayName = DAY_LABELS[reqSchedule.day] || reqSchedule.day;
          res.status(400).json({ 
            success: false, 
            message: `Horario inválido el día ${dayName}: la hora de fin debe ser posterior a la hora de inicio.` 
          });
          return;
        }
      }
    }

    // Verificar superposición de aulas
    if (schedules && schedules.length > 0) {
      const overlaps: string[] = [];
      
      for (const reqSchedule of schedules) {
        const overlapping = await Section.findAll({
          where: { id_classroom, id_academic_year },
          include: [{
            model: Schedule,
            as: 'schedules',
            where: {
              day: reqSchedule.day,
              [Op.or]: [
                {
                  start_time: { [Op.lt]: reqSchedule.end_time },
                  end_time: { [Op.gt]: reqSchedule.start_time }
                }
              ]
            }
          }],
          transaction: t
        });

        if (overlapping.length > 0) {
          for (const overlapSection of overlapping) {
            const block = (overlapSection as any).schedules[0];
            const dayName = DAY_LABELS[reqSchedule.day] || reqSchedule.day;
            overlaps.push(`El ${dayName} de ${block.start_time.slice(0,5)} a ${block.end_time.slice(0,5)} (ocupada por "${(overlapSection as any).name}")`);
          }
        }
      }

      if (overlaps.length > 0) {
        await t.rollback();
        res.status(409).json({ 
          success: false, 
          message: `El aula ya se encuentra ocupada en los siguientes horarios:\n- ${overlaps.join('\n- ')}` 
        });
        return;
      }
    }

    // Generar el nombre de la comisión automáticamente
    const previousSections = await Section.count({ where: { id_course, id_academic_year }, transaction: t });
    const courseData: any = await Course.findByPk(id_course, { transaction: t });
    const generatedName = `Comisión ${previousSections + 1} - ${courseData?.course_name || ''}`;

    // Crear la comisión
    const newSection: any = await Section.create({ name: generatedName, id_course, id_classroom, id_academic_year }, { transaction: t });

    // Vincular horarios
    if (schedules && schedules.length > 0) {
      for (const h of schedules) {
        const [scheduleObj] = await Schedule.findOrCreate({
          where: { day: h.day, start_time: h.start_time, end_time: h.end_time },
          transaction: t
        });
        await SectionSchedule.create({
          id_section: newSection.id_section,
          id_schedule: (scheduleObj as any).id_schedule
        }, { transaction: t });
      }
    }

    // Vincular profesor
    if (id_professor) {
      await UserSection.create({
        id_user: id_professor,
        id_section: newSection.id_section
      }, { transaction: t });
    }

    await t.commit();
    res.status(201).json({ success: true, data: newSection });
  } catch (error) {
    await t.rollback();
    console.error('Error creating section:', error);
    res.status(500).json({ success: false, message: 'Error al crear la comisión' });
  }
};

export const updateSection = async (req: Request, res: Response): Promise<void> => {
  res.status(501).json({ success: false, message: 'No implementado. Por favor eliminá y creá una nueva comisión.' });
};

export const deleteSection = async (req: Request, res: Response): Promise<void> => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const section = await Section.findByPk(Number(id));
    if (!section) {
      await t.rollback();
      res.status(404).json({ success: false, message: 'Comisión no encontrada' });
      return;
    }
    
    await SectionSchedule.destroy({ where: { id_section: id }, transaction: t });
    await UserSection.destroy({ where: { id_section: id }, transaction: t });
    await section.destroy({ transaction: t });
    
    await t.commit();
    res.json({ success: true, message: 'Comisión eliminada exitosamente' });
  } catch (error) {
    await t.rollback();
    console.error('Error deleting section:', error);
    res.status(500).json({ success: false, message: 'Error al eliminar la comisión' });
  }
};
