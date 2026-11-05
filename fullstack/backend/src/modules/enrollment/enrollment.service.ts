import { Enrollment, User, Section, Course, Level, UserLevel } from '../../models/index.js';

export class EnrollmentService {
  async findAll() {
    return await Enrollment.findAll({
      include: [
        { model: User, as: 'user' },
        {
          model: Section, as: 'section',
          include: [
            {
              model: Course, as: 'course',
              include: [{ model: Level, as: 'level' }]
            }
          ]
        }
      ]
    });
  }

  async getAllowedLevelForStudent(id_user: number) {
    const allLevels: any[] = await Level.findAll();
    if (allLevels.length === 0) return { currentLevel: null, allowedLevel: null };

    const userWithLevels: any = await User.findByPk(id_user, {
      include: [{ model: Level, as: 'levels' }],
      order: [[{ model: Level, as: 'levels' }, UserLevel, 'start_date', 'DESC']]
    });

    const currentLevel = userWithLevels?.levels?.length > 0 ? userWithLevels.levels[0] : null;

    if (!currentLevel) {
      // Sin nivel previo -> le corresponde el primer nivel (el que no es next_level_code de ningún otro)
      const referencedNextCodes = new Set(allLevels.map(l => l.next_level_code).filter(Boolean));
      const initialLevel = allLevels.find(l => !referencedNextCodes.has(l.level_code)) || allLevels[0];
      return { currentLevel: null, allowedLevel: initialLevel };
    }

    // Tiene nivel X -> le corresponde únicamente X.next_level_code
    if (!currentLevel.next_level_code) {
      return { currentLevel, allowedLevel: null };
    }

    const nextLevel = allLevels.find(l => l.level_code === currentLevel.next_level_code) || null;
    return { currentLevel, allowedLevel: nextLevel };
  }

  async create(data: {
    enrollment_date: any;
    final_grade: any;
    attendance_percentage: any;
    id_user: any;
    id_section: any;
  }) {
    const section: any = await Section.findByPk(data.id_section, {
      include: [{ model: Course, as: 'course', include: [{ model: Level, as: 'level' }] }]
    });

    if (!section || !section.course) {
      throw new Error('La comisión o el curso seleccionado no existe.');
    }

    const { currentLevel, allowedLevel } = await this.getAllowedLevelForStudent(Number(data.id_user));

    if (!allowedLevel) {
      throw new Error(
        `El alumno ya posee el nivel máximo (${currentLevel?.name || 'C2'}) y no tiene un nivel siguiente para cursar.`
      );
    }

    if (Number(section.course.level_code) !== Number(allowedLevel.level_code)) {
      const currentDesc = currentLevel ? `tiene aprobado ${currentLevel.name}` : 'no tiene nivel previo';
      throw new Error(
        `El alumno ${currentDesc}, por lo que solo puede inscribirse a cursos de nivel "${allowedLevel.name}" (el curso "${section.course.course_name}" es de nivel "${section.course.level?.name || section.course.level_code}").`
      );
    }

    const newEnrollment: any = await Enrollment.create({
      enrollment_date: data.enrollment_date || new Date(),
      final_grade: data.final_grade,
      attendance_percentage: data.attendance_percentage,
      id_user: data.id_user,
      id_section: data.id_section,
      status: 'Activo'
    });

    return newEnrollment;
  }

  async update(id: any, data: {
    enrollment_date: any;
    final_grade: any;
    attendance_percentage: any;
    id_user: any;
    id_section: any;
    status: any;
  }) {
    const existingEnrollment = await Enrollment.findOne({ where: { id_enrollment: id } });
    if (!existingEnrollment) {
      return null;
    }

    await Enrollment.update({
      enrollment_date: data.enrollment_date,
      final_grade: data.final_grade,
      attendance_percentage: data.attendance_percentage,
      id_user: data.id_user,
      id_section: data.id_section,
      status: data.status,
    }, { where: { id_enrollment: id } });

    return existingEnrollment;
  }

  async finalize(id: any, data: { final_grade: number; attendance_percentage: number }) {
    const existingEnrollment: any = await Enrollment.findOne({
      where: { id_enrollment: id },
      include: [
        { model: User, as: 'user' },
        {
          model: Section, as: 'section',
          include: [{ model: Course, as: 'course', include: [{ model: Level, as: 'level' }] }]
        }
      ]
    });

    if (!existingEnrollment) {
      return null;
    }

    const grade = Number(data.final_grade);
    const attendance = Number(data.attendance_percentage);

    if (isNaN(grade) || grade < 0 || grade > 10) {
      throw new Error('La nota final debe ser un valor numérico entre 0 y 10.');
    }

    if (isNaN(attendance) || attendance < 0 || attendance > 100) {
      throw new Error('El porcentaje de asistencia debe ser un valor numérico entre 0 y 100.');
    }

    const isPassed = grade >= 6 && attendance >= 75;
    const newStatus = isPassed ? 'Aprobado' : 'Desaprobado';

    await existingEnrollment.update({
      final_grade: grade,
      attendance_percentage: attendance,
      status: newStatus
    });

    // Si aprobó el curso, se acredita el nivel en su historial académico
    if (isPassed && existingEnrollment.section?.course?.level_code) {
      const levelCode = Number(existingEnrollment.section.course.level_code);
      const userId = Number(existingEnrollment.id_user);
      const existingUserLevel = await UserLevel.findOne({
        where: { id_user: userId, level_code: levelCode }
      });
      if (!existingUserLevel) {
        const actualDate = new Date().toISOString().split('T')[0];
        await UserLevel.create({
          id_user: userId,
          level_code: levelCode,
          start_date: actualDate
        });
      }
    }

    return existingEnrollment;
  }

  async delete(id: any) {
    const existingEnrollment = await Enrollment.findOne({ where: { id_enrollment: id } });
    if (!existingEnrollment) {
      return null;
    }

    await Enrollment.update(
      { status: 'Dado de Baja' },
      { where: { id_enrollment: id } }
    );

    return existingEnrollment;
  }
}
