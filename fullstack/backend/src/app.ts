import express, { type Request, type Response } from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import { sequelize, User, Level } from './models/index.js';

async function seedDefaultUsers() {
  try {
    // 1. Admin user
    const admin: any = await User.findOne({ where: { username: 'admin' } });
    if (!admin) {
      const adminPasswordHash = await bcrypt.hash('12345', 10);
      await User.create({
        dni: '00000000',
        first_name: 'Secretaría',
        last_name: 'Administración',
        email: 'admin@instituto.com',
        username: 'admin',
        password: adminPasswordHash,
        role: 'ADMIN',
        active: true
      });
      console.log('👤 Usuario admin inicial creado (admin / 12345)');
    } else if (typeof admin.password === 'string' && !admin.password.startsWith('$2')) {
      const adminPasswordHash = await bcrypt.hash('12345', 10);
      await admin.update({ password: adminPasswordHash });
      console.log('🔑 Contraseña de admin actualizada a hash');
    }

    // 2. Student demo user
    const student: any = await User.findOne({ where: { username: 'user' } });
    if (!student) {
      const studentPasswordHash = await bcrypt.hash('12345', 10);
      await User.create({
        dni: '11223344',
        first_name: 'Alumno',
        last_name: 'Prueba',
        email: 'user@instituto.com',
        username: 'user',
        password: studentPasswordHash,
        role: 'STUDENT',
        active: true
      });
      console.log('👤 Usuario estudiante inicial creado (user / 12345)');
    } else if (typeof student.password === 'string' && !student.password.startsWith('$2')) {
      const studentPasswordHash = await bcrypt.hash('12345', 10);
      await student.update({ password: studentPasswordHash });
      console.log('🔑 Contraseña de estudiante actualizada a hash');
    }
  } catch (error) {
    console.error('❌ Error inicializando usuarios por defecto:', error);
  }
}

async function seedDefaultLevels() {
  try {
    const count = await Level.count();
    if (count === 0) {
      const levelsData = ['A1 - Principiante', 'A2 - Elemental', 'B1 - Intermedio', 'B2 - Intermedio Alto', 'C1 - Avanzado', 'C2 - Maestria'];
      const createdLevels: any[] = [];
      for (const name of levelsData) {
        const level: any = await Level.create({ name });
        createdLevels.push(level);
      }
      for (let i = 0; i < createdLevels.length - 1; i++) {
        await createdLevels[i].update({ next_level_code: createdLevels[i + 1].level_code });
      }
      console.log('📚 Niveles iniciales creados exitosamente');
    }
  } catch (error) {
    console.error('❌ Error inicializando niveles:', error);
  }
}

// Sync models with the database (creates missing tables automatically)
sequelize.sync({ alter: true })
  .then(async () => {
    console.log('✅ Database tables synchronized');
    await seedDefaultUsers();
    await seedDefaultLevels();
  })
  .catch((err) => console.error('❌ Error synchronizing tables:', err));

import userRouter from './routes/user.router.js';
import professorRouter from './modules/professor/professor.router.js';
import levelRoutes from './modules/level/level.router.js';
import courseRoutes from './modules/course/course.router.js';
import enrollmentRoutes from './modules/enrollment/enrollment.router.js';
import tuitionFeeRoutes from './modules/tuition_fee/tuition_fee.router.js';
import classroomRoutes from './modules/classroom/classroom.router.js';
import academicYearRoutes from './modules/academic_year/academic_year.router.js';
import scheduleRoutes from './modules/schedule/schedule.router.js';
import sectionRoutes from './routes/section.router.js';
import paymentRouter from './routes/payment.router.js';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Configure routes
app.use('/api/users', userRouter);
app.use('/api/professors', professorRouter);
app.use('/api/levels', levelRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/tuition-fees', tuitionFeeRoutes);
app.use('/api/classrooms', classroomRoutes);
app.use('/api/academic-years', academicYearRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/sections', sectionRoutes);
app.use('/api/payments', paymentRouter);

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Backend connected successfully 🚀' });
});

app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'The Backend now runs 100% with TypeScript! 🚀',
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend server running on: http://localhost:${PORT}`);
});
