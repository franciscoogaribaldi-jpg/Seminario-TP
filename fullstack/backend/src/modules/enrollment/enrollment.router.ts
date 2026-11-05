import { Router } from 'express';
import { getAllEnrollments, createEnrollment, updateEnrollment, deleteEnrollment, finalizeEnrollment } from './enrollment.controller.js';

const router = Router();

router.get('/', getAllEnrollments);
router.post('/', createEnrollment);
router.put('/:id', updateEnrollment);
router.put('/:id/finalize', finalizeEnrollment);
router.delete('/:id', deleteEnrollment);

export default router;
