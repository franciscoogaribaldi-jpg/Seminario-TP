import { type Request, type Response } from 'express';
import { EnrollmentService } from './enrollment.service.js';

const enrollmentService = new EnrollmentService();

export const getAllEnrollments = async (req: Request, res: Response): Promise<void> => {
  try {
    const enrollments = await enrollmentService.findAll();
    res.status(200).json({ status: 'ok', data: enrollments });
  } catch (error: any) {
    console.error('Error fetching enrollments:', error);
    res.status(500).json({ status: 'db_error', message: 'Error interno al obtener las inscripciones', data: [] });
  }
};

export const createEnrollment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { enrollment_date, final_grade, attendance_percentage, id_user, id_section } = req.body;

    if (!id_user || !id_section) {
      res.status(400).json({ status: 'error', message: 'Faltan campos obligatorios' });
      return;
    }

    const newEnrollment = await enrollmentService.create({
      enrollment_date,
      final_grade,
      attendance_percentage,
      id_user,
      id_section
    });

    res.status(201).json({ status: 'ok', message: 'Inscripción registrada exitosamente', data: newEnrollment });
  } catch (error: any) {
    console.error('Error creating enrollment:', error);
    const msg = error?.message || 'Error interno al registrar la inscripción';
    res.status(400).json({ status: 'error', message: msg });
  }
};

export const updateEnrollment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { enrollment_date, final_grade, attendance_percentage, id_user, id_section, status } = req.body;

    const existingEnrollment = await enrollmentService.update(id, {
      enrollment_date,
      final_grade,
      attendance_percentage,
      id_user,
      id_section,
      status
    });
    if (!existingEnrollment) {
      res.status(404).json({ status: 'error', message: 'Inscripción no encontrada' });
      return;
    }

    res.status(200).json({ status: 'ok', message: 'Inscripción actualizada exitosamente' });
  } catch (error: any) {
    console.error('Error updating enrollment:', error);
    res.status(500).json({ status: 'db_error', message: 'Error interno al actualizar la inscripción' });
  }
};

export const deleteEnrollment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const existingEnrollment = await enrollmentService.delete(id);
    if (!existingEnrollment) {
      res.status(404).json({ status: 'error', message: 'Inscripción no encontrada' });
      return;
    }

    res.status(200).json({ status: 'ok', message: 'Inscripción dada de baja exitosamente' });
  } catch (error: any) {
    console.error('Error deactivating enrollment:', error);
    res.status(500).json({ status: 'db_error', message: 'Error interno al desactivar la inscripción' });
  }
};


export const finalizeEnrollment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { final_grade, attendance_percentage } = req.body;

    if (final_grade === undefined || final_grade === null || final_grade === '' ||
        attendance_percentage === undefined || attendance_percentage === null || attendance_percentage === '') {
      res.status(400).json({ status: 'error', message: 'Por favor complete la nota final y el porcentaje de asistencia.' });
      return;
    }

    const numGrade = Number(final_grade);
    const numAttendance = Number(attendance_percentage);

    if (isNaN(numGrade) || numGrade < 0 || numGrade > 10) {
      res.status(400).json({ status: 'error', message: 'La nota final debe ser un valor numérico entre 0 y 10.' });
      return;
    }

    if (isNaN(numAttendance) || numAttendance < 0 || numAttendance > 100) {
      res.status(400).json({ status: 'error', message: 'El porcentaje de asistencia debe ser un valor numérico entre 0 y 100.' });
      return;
    }

    const result = await enrollmentService.finalize(id, {
      final_grade: numGrade,
      attendance_percentage: numAttendance
    });

    if (!result) {
      res.status(404).json({ status: 'error', message: 'Inscripción no encontrada' });
      return;
    }

    res.status(200).json({
      status: 'ok',
      message: 'Nota y asistencia de finalización registradas exitosamente',
      data: result
    });
  } catch (error: any) {
    console.error('Error finalizing enrollment:', error);
    res.status(400).json({ status: 'error', message: error?.message || 'Error al registrar finalización del curso' });
  }
};
