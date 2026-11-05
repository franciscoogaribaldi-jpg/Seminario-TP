import { type Request, type Response } from 'express';
import { Op } from 'sequelize';
import { User } from '../models/user.js';
import { sequelize, Level, UserLevel } from '../models/index.js';
import bcrypt from 'bcryptjs';

export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, level } = req.query;

    let searchConditions: any = {
      role: 'STUDENT',
      active: true
    };

    if (search) {
      searchConditions = {
        ...searchConditions,
        [Op.or]: [
          { dni: { [Op.like]: "%" + search + "%" } },
          { first_name: { [Op.like]: "%" + search + "%" } },
          { last_name: { [Op.like]: "%" + search + "%" } }
        ]
      };
    }

    if (level) {
      searchConditions = {
        ...searchConditions,
        [Op.and]: [
          sequelize.literal(`(
            SELECT level_code 
            FROM user_level 
            WHERE user_level.id_user = User.id 
            ORDER BY start_date DESC 
            LIMIT 1
          ) = ${sequelize.escape(level as string)}`)
        ]
      };
    }

    const users = await User.findAll({
      where: searchConditions,
      include: [{
        model: Level,
        as: 'levels',
      }],
      order: [
        [{ model: Level, as: 'levels' }, UserLevel, 'start_date', 'DESC']
      ]
    });

    const cleanUsers = users.map(u => {
      const data = u.toJSON();
      const lastLevel = data.levels && data.levels.length > 0 ? data.levels[0] : null;

      return {
        ...data,
        current_level: lastLevel ? lastLevel.name : 'Sin nivel asignado',
        level_code: lastLevel ? String(lastLevel.level_code) : '',
        levels: undefined
      };
    });

    res.status(200).json({ status: 'ok', message: 'Lista obtenida exitosamente', data: cleanUsers });

  } catch (error: any) {
    console.error('Error querying users:', error?.message || error);
    res.status(500).json({ status: 'db_error', message: 'Error interno del servidor', data: [] });
  }
};

export const checkStudentDni = async (req: Request, res: Response): Promise<void> => {
  try {
    const { dni } = req.params;

    // First, search active
    let student: any = await User.findOne({
      where: { dni, role: 'STUDENT', active: true },
      include: [{ model: Level, as: 'levels' }]
    });
    if (student) {
      const data = student.toJSON();
      const lastLevel = data.levels && data.levels.length > 0 ? data.levels[0] : null;
      res.status(200).json({
        status: 'ok',
        data: {
          ...data,
          level_code: lastLevel ? String(lastLevel.level_code) : '',
          current_level: lastLevel ? lastLevel.name : 'Sin nivel asignado',
        }
      });
      return;
    }

    // Second, search inactive
    student = await User.findOne({
      where: {
        dni: { [Op.like]: `${dni}_deleted_%` },
        role: 'STUDENT',
        active: false
      },
      include: [{ model: Level, as: 'levels' }]
    });

    if (student) {
      const data = student.toJSON();
      const lastLevel = data.levels && data.levels.length > 0 ? data.levels[0] : null;
      res.status(200).json({
        status: 'ok',
        data: {
          ...data,
          level_code: lastLevel ? String(lastLevel.level_code) : '',
          current_level: lastLevel ? lastLevel.name : 'Sin nivel asignado',
        }
      });
      return;
    }

    res.status(200).json({ status: 'not_found', data: null });
  } catch (error: any) {
    console.error('Error checking student DNI:', error?.message || error);
    res.status(500).json({ status: 'db_error', message: 'Error interno del servidor', data: null });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({
        status: 'error',
        message: 'Por favor ingresa usuario y contraseña',
        data: null
      });
      return;
    }

    const foundUser: any = await User.findOne({
      where: {
        username: username,
        active: true
      }
    });

    if (!foundUser) {
      res.status(401).json({
        status: 'error',
        message: 'Usuario o contraseña incorrectos',
        data: null
      });
      return;
    }


    const isPasswordValid = await bcrypt.compare(password, foundUser.password).catch(() => false)
      || (foundUser.password === password); // por si la contraseña no esta encriptada

    if (!isPasswordValid) {
      res.status(401).json({
        status: 'error',
        message: 'Usuario o contraseña incorrectos',
        data: null
      });
      return;
    }

    const userData = foundUser.toJSON();
    delete userData.password;

    res.status(200).json({
      status: 'ok',
      message: 'Inicio de sesión exitoso',
      data: userData
    });
  } catch (error: any) {
    console.error('Error logging in:', error?.message || error);
    res.status(500).json({
      status: 'db_error',
      message: 'Error interno al iniciar sesión',
      data: null
    });
  }
};

export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const foundUser = await User.findOne({
      where: {
        id: id,
        role: 'STUDENT',
        active: true
      }
    });
    if (!foundUser) {
      res.status(404).json({ status: 'error', message: 'No se encontró un alumno activo con ID: ' + id, data: null });
      return;
    }
    res.status(200).json({ status: 'ok', message: 'Alumno encontrado exitosamente', data: foundUser });
  } catch (error: any) {
    console.error('Error finding student with ID ' + req.params.id + ':', error?.message || error);
    res.status(500).json({ status: 'db_error', message: 'Error interno al buscar el alumno', data: null });
  }
};

export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { dni, first_name, last_name, phone, birth_date, email, level_code } = req.body;

    if (!dni || !first_name || !last_name) {
      res.status(400).json({ status: 'error', message: 'Faltan campos obligatorios', data: null });
      return;
    }

    const username = first_name.toLowerCase().trim();
    const hashedPassword = await bcrypt.hash(dni.toString(), 10);


    const activeExistingUser: any = await User.findOne({ where: { dni } });
    if (activeExistingUser) {
      res.status(409).json({ status: 'error', message: 'Ya existe un usuario activo con el DNI: ' + dni, data: null });
      return;
    }

    const inactiveUser: any = await User.findOne({
      where: {
        dni: { [Op.like]: `${dni}_deleted_%` },
        role: 'STUDENT',
        active: false
      }
    });

    if (inactiveUser) {
      await inactiveUser.update({
        first_name,
        last_name,
        phone,
        birth_date,
        email,
        username,
        password: hashedPassword,
        dni,
        active: true
      });
      if (level_code !== undefined) {
        await UserLevel.destroy({ where: { id_user: inactiveUser.id } });
        if (level_code !== '' && level_code !== null) {
          const actualDate = new Date().toISOString().split('T')[0];
          await UserLevel.create({ id_user: inactiveUser.id, level_code: Number(level_code), start_date: actualDate });
        }
      }
      res.status(200).json({ status: 'ok', message: 'Alumno reactivado exitosamente', data: inactiveUser });
      return;
    }


    const newUser = await User.create({
      dni,
      first_name,
      last_name,
      phone,
      birth_date,
      email, username,
      password: hashedPassword,
      role: 'STUDENT',
      active: true
    });

    if (level_code) {
      const actualDate = new Date().toISOString().split('T')[0];
      await UserLevel.create({ id_user: newUser.dataValues.id, level_code: Number(level_code), start_date: actualDate });
    }

    res.status(201).json({ status: 'ok', message: 'Alumno registrado exitosamente', data: newUser });
  } catch (error: any) {
    console.error('Error creating student:', error?.message || error);
    res.status(500).json({ status: 'db_error', message: 'Error interno del servidor', data: null });
  }
};

export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { dni, first_name, last_name, phone, birth_date, email, username, password, level_code } = req.body;

    const existingUser = await User.findOne({ where: { id: id, role: 'STUDENT', active: true } });
    if (!existingUser) {
      res.status(404).json({ status: 'error', message: 'No se encontró un alumno activo con ID ' + id, data: null });
      return;
    }

    const dataToUpdate: any = {};
    if (dni !== undefined) dataToUpdate.dni = dni;
    if (first_name !== undefined) dataToUpdate.first_name = first_name;
    if (last_name !== undefined) dataToUpdate.last_name = last_name;
    if (phone !== undefined) dataToUpdate.phone = phone;
    if (birth_date !== undefined) dataToUpdate.birth_date = birth_date;
    if (email !== undefined) dataToUpdate.email = email;
    if (username !== undefined) dataToUpdate.username = username;
    if (password !== undefined && password.trim() !== '') {
      dataToUpdate.password = await bcrypt.hash(password, 10);
    }

    await User.update(dataToUpdate, { where: { id: id, role: 'STUDENT', active: true } });

    if (level_code !== undefined) {
      await UserLevel.destroy({ where: { id_user: id } });
      if (level_code !== '' && level_code !== null) {
        const actualDate = new Date().toISOString().split('T')[0];
        await UserLevel.create({ id_user: id, level_code: Number(level_code), start_date: actualDate });
      }
    }

    res.status(200).json({ status: 'ok', message: 'Alumno actualizado exitosamente', data: { dni, ...dataToUpdate, level_code } });
  } catch (error: any) {
    console.error('Error updating student:', error?.message || error);
    res.status(500).json({ status: 'db_error', message: 'Error interno del servidor', data: null });
  }
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const student: any = await User.findOne({ where: { id: id, role: 'STUDENT', active: true } });

    if (!student) {
      res.status(404).json({ status: 'error', message: 'No se encontró un alumno activo con ID ' + id, data: null });
      return;
    }

    const ts = Date.now();
    await User.update(
      {
        active: false,
        email: student.email ? `${student.email}_deleted_${ts}` : null,
        username: `${student.username}_deleted_${ts}`,
        dni: `${student.dni}_deleted_${ts}`
      },
      { where: { id: id, role: 'STUDENT', active: true } }
    );

    res.status(200).json({ status: 'ok', message: 'Alumno desactivado exitosamente', data: null });
  } catch (error: any) {
    console.error('Error deactivating student:', error?.message || error);
    res.status(500).json({ status: 'db_error', message: 'Error interno del servidor', data: null });
  }
};


export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.id || req.body.userId;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!userId) {
      res.status(400).json({ status: 'error', message: 'Identificador de usuario no proporcionado', data: null });
      return;
    }

    if (!currentPassword || !newPassword || !confirmPassword) {
      res.status(400).json({ status: 'error', message: 'Todos los campos son obligatorios', data: null });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ status: 'error', message: 'La nueva contraseña debe tener al menos 6 caracteres', data: null });
      return;
    }

    if (newPassword !== confirmPassword) {
      res.status(400).json({ status: 'error', message: 'La nueva contraseña y su confirmación no coinciden', data: null });
      return;
    }

    const user: any = await User.findOne({
      where: { id: userId, active: true }
    });

    if (!user) {
      res.status(404).json({ status: 'error', message: 'Usuario no encontrado o inactivo', data: null });
      return;
    }

    const isCurrentValid = await bcrypt.compare(currentPassword, user.password).catch(() => false)
      || (user.password === currentPassword);

    if (!isCurrentValid) {
      res.status(400).json({ status: 'error', message: 'La contraseña actual es incorrecta', data: null });
      return;
    }

    const isSameAsCurrent = await bcrypt.compare(newPassword, user.password).catch(() => false)
      || (user.password === newPassword);

    if (isSameAsCurrent) {
      res.status(400).json({ status: 'error', message: 'La nueva contraseña no puede ser igual a la contraseña actual', data: null });
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await user.update({ password: hashedPassword });

    res.status(200).json({
      status: 'ok',
      message: 'Contraseña actualizada exitosamente',
      data: null
    });
  } catch (error: any) {
    console.error('Error changing password:', error?.message || error);
    res.status(500).json({ status: 'db_error', message: 'Error interno al cambiar la contraseña', data: null });
  }
};
