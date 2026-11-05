import { useState, useEffect } from 'react';
import { enrollmentService, type Enrollment } from '../biz/services/enrollment.service';
import DataTable from '../shared/components/DataTable';
import Modal from '../shared/components/Modal';

const normalizeStatus = (s?: string) => {
  if (!s || s === 'Active' || s === 'Activo') return 'Activo';
  if (s === 'Pending' || s === 'Pendiente') return 'Pendiente';
  if (s === 'Aprobado') return 'Aprobado';
  if (s === 'Desaprobado') return 'Desaprobado';
  return 'Dado de Baja';
};

export default function Enrollments() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Modal para desactivar / baja
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [enrollmentToDelete, setEnrollmentToDelete] = useState<number | null>(null);

  // Modal para Finalización de Curso (Nota y Asistencia)
  const [finalizeModalOpen, setFinalizeModalOpen] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | null>(null);
  const [finalGrade, setFinalGrade] = useState<string>('');
  const [attendancePercentage, setAttendancePercentage] = useState<string>('');
  const [finalizeError, setFinalizeError] = useState<string | null>(null);
  const [isSubmittingFinalize, setIsSubmittingFinalize] = useState(false);

  // Modal genérico de edición previa
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    status: '',
    final_grade: '',
    attendance_percentage: ''
  });

  useEffect(() => {
    fetchEnrollments();
  }, []);

  const fetchEnrollments = async () => {
    try {
      const data = await enrollmentService.getEnrollments();
      setEnrollments(data);
    } catch (error) {
      console.error('Failed to fetch enrollments:', error);
    }
  };

  const showNotification = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => {
      setSuccessToast(null);
    }, 4000);
  };

  // Apertura del modal de finalización de curso
  const handleOpenFinalize = (enrollment: Enrollment) => {
    setSelectedEnrollment(enrollment);
    setFinalGrade(enrollment.final_grade !== undefined && enrollment.final_grade !== null ? String(enrollment.final_grade) : '');
    setAttendancePercentage(enrollment.attendance_percentage !== undefined && enrollment.attendance_percentage !== null ? String(enrollment.attendance_percentage) : '');
    setFinalizeError(null);
    setFinalizeModalOpen(true);
  };

  const handleFinalizeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEnrollment) return;

    setFinalizeError(null);

    // Validaciones en cliente
    if (finalGrade.trim() === '' || attendancePercentage.trim() === '') {
      setFinalizeError('Por favor complete la nota final y el porcentaje de asistencia.');
      return;
    }

    const grade = Number(finalGrade);
    const attendance = Number(attendancePercentage);

    if (isNaN(grade) || grade < 0 || grade > 10) {
      setFinalizeError('La nota final debe ser un valor numérico entre 0 y 10.');
      return;
    }

    if (isNaN(attendance) || attendance < 0 || attendance > 100) {
      setFinalizeError('El porcentaje de asistencia debe ser un valor numérico entre 0 y 100.');
      return;
    }

    try {
      setIsSubmittingFinalize(true);
      await enrollmentService.finalizeEnrollment(selectedEnrollment.id_enrollment, {
        final_grade: grade,
        attendance_percentage: attendance
      });

      setFinalizeModalOpen(false);
      setSelectedEnrollment(null);
      await fetchEnrollments();
      showNotification('Nota y asistencia de finalización registradas exitosamente.');
    } catch (err: any) {
      setFinalizeError(err.message || 'Error al registrar finalización del curso.');
    } finally {
      setIsSubmittingFinalize(false);
    }
  };

  const confirmDelete = (id: number) => {
    setEnrollmentToDelete(id);
    setDeleteModalOpen(true);
  };

  const executeDelete = async () => {
    if (!enrollmentToDelete) return;
    try {
      await enrollmentService.deleteEnrollment(enrollmentToDelete);
      fetchEnrollments();
      setDeleteModalOpen(false);
      setEnrollmentToDelete(null);
      showNotification('Inscripción dada de baja exitosamente.');
    } catch (error) {
      console.error('Error deactivating enrollment:', error);
      alert('Error al desactivar la inscripción.');
    }
  };

  const handleEdit = (enrollment: Enrollment) => {
    setEditingId(enrollment.id_enrollment);
    const normalized = normalizeStatus(enrollment.status);
    setFormData({
      status: normalized === 'Dado de Baja' ? 'Activo' : normalized,
      final_grade: enrollment.final_grade ? enrollment.final_grade.toString() : '',
      attendance_percentage: enrollment.attendance_percentage ? enrollment.attendance_percentage.toString() : ''
    });
    setUpdateModalOpen(true);
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;

    try {
      const dataToSave = {
        status: formData.status,
        final_grade: formData.final_grade ? Number(formData.final_grade) : null,
        attendance_percentage: formData.attendance_percentage ? Number(formData.attendance_percentage) : null
      };

      await enrollmentService.updateEnrollment(editingId, dataToSave);
      fetchEnrollments();
      setUpdateModalOpen(false);
      showNotification('Inscripción actualizada exitosamente.');
    } catch (error) {
      console.error("Error updating enrollment:", error);
      alert('Error al guardar la inscripción. Por favor verificá los datos.');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Cálculo en vivo de la condición en el modal
  const numG = Number(finalGrade);
  const numA = Number(attendancePercentage);
  const hasInputs = finalGrade.trim() !== '' && attendancePercentage.trim() !== '' && !isNaN(numG) && !isNaN(numA);
  const isPreviewApproved = hasInputs && numG >= 6 && numA >= 75;

  const columns = [
    {
      header: 'Alumno',
      render: (e: Enrollment) => <span className="font-semibold text-slate-700">{e.user?.last_name}, {e.user?.first_name}</span>,
    },
    {
      header: 'DNI',
      render: (e: Enrollment) => <span className="font-mono text-slate-500">{e.user?.dni}</span>,
    },
    {
      header: 'Comisión',
      render: (e: Enrollment) => <span className="text-slate-500">{e.section?.name}</span>,
    },
    {
      header: 'Nivel',
      render: (e: Enrollment) => (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-2xs font-semibold bg-indigo-50 text-indigo-500">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>{e.section?.course?.level?.name || '-'}
        </span>
      ),
    },
    {
      header: 'Fecha Inscripción',
      render: (e: Enrollment) => <span className="text-slate-500">{new Date(e.enrollment_date).toLocaleDateString('es-AR')}</span>,
    },
    {
      header: 'Asistencia',
      render: (e: Enrollment) => (
        <span className={`font-semibold ${e.attendance_percentage !== null && e.attendance_percentage !== undefined ? (e.attendance_percentage >= 75 ? 'text-emerald-600' : 'text-rose-600') : 'text-slate-400'}`}>
          {e.attendance_percentage !== null && e.attendance_percentage !== undefined ? `${e.attendance_percentage}%` : '-'}
        </span>
      ),
    },
    {
      header: 'Nota Final',
      render: (e: Enrollment) => (
        <span className={`font-semibold ${e.final_grade !== null && e.final_grade !== undefined ? (e.final_grade >= 6 ? 'text-emerald-600' : 'text-rose-600') : 'text-slate-400'}`}>
          {e.final_grade !== null && e.final_grade !== undefined ? e.final_grade : '-'}
        </span>
      ),
    },
    {
      header: 'Estado',
      render: (e: Enrollment) => {
        const statusLabel = normalizeStatus(e.status);
        let badgeColor = 'bg-slate-100 text-slate-600';
        let dotColor = 'bg-slate-400';

        if (statusLabel === 'Activo') {
          badgeColor = 'bg-blue-50 text-blue-700 border border-blue-200';
          dotColor = 'bg-blue-500';
        } else if (statusLabel === 'Aprobado') {
          badgeColor = 'bg-emerald-50 text-emerald-700 border border-emerald-200';
          dotColor = 'bg-emerald-500';
        } else if (statusLabel === 'Desaprobado') {
          badgeColor = 'bg-rose-50 text-rose-700 border border-rose-200';
          dotColor = 'bg-rose-500';
        } else if (statusLabel === 'Pendiente') {
          badgeColor = 'bg-amber-50 text-amber-700 border border-amber-200';
          dotColor = 'bg-amber-500';
        } else if (statusLabel === 'Dado de Baja') {
          badgeColor = 'bg-slate-100 text-slate-500 border border-slate-200';
          dotColor = 'bg-slate-400';
        }

        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-2xs font-semibold ${badgeColor}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></span>
            {statusLabel}
          </span>
        );
      },
    },
    {
      header: 'Acciones',
      render: (e: Enrollment) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenFinalize(e)}
            className="px-2 py-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-2xs rounded shadow-sm hover:shadow transition-all cursor-pointer flex items-center gap-1"
            title="Registrar Nota y Asistencia de Finalización"
          >
            <span>🎓</span>
            <span>Finalizar Cursado</span>
          </button>
          <button
            onClick={() => handleEdit(e)}
            className="text-slate-500 hover:text-indigo-600 font-semibold text-2xs cursor-pointer ml-1"
          >
            Editar
          </button>
          <span className="text-slate-300">|</span>
          <button
            onClick={() => confirmDelete(e.id_enrollment)}
            className="text-rose-500 hover:text-rose-700 font-semibold text-2xs cursor-pointer"
          >
            Desactivar
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Toast de Éxito Flotante */}
      {successToast && (
        <div className="fixed top-20 right-8 z-50 p-4 bg-emerald-600 text-white rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-200">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="text-xs font-semibold">{successToast}</span>
        </div>
      )}

      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800">Inscripciones y Calificaciones</h1>
          <p className="text-xs text-slate-500 mt-1">Gestión académica de alumnos inscriptos, carga de notas finales y registro de asistencia.</p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 text-blue-800 p-3 rounded-lg text-xs flex gap-2.5">
        <span className="text-sm">ℹ️</span>
        <div>
          Para registrar la condición de finalización de un alumno al concluir el período lectivo, haz clic en el botón <strong>"🎓 Finalizar Cursado"</strong> de la fila correspondiente.
        </div>
      </div>

      <DataTable
        title="Lista de Cursado e Inscripciones"
        columns={columns}
        data={enrollments}
        totalCount={enrollments.length}
      />

      {/* --- MODAL: REGISTRAR NOTA Y ASISTENCIA DE FINALIZACIÓN DE CURSO --- */}
      <Modal
        isOpen={finalizeModalOpen}
        onClose={() => {
          if (!isSubmittingFinalize) {
            setFinalizeModalOpen(false);
            setSelectedEnrollment(null);
          }
        }}
        title="🎓 Registrar Nota y Asistencia de Finalización"
        maxWidth="max-w-md"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <button
              type="button"
              onClick={() => {
                setFinalizeModalOpen(false);
                setSelectedEnrollment(null);
              }}
              disabled={isSubmittingFinalize}
              className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-semibold cursor-pointer transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleFinalizeSubmit}
              disabled={isSubmittingFinalize}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-sm hover:shadow transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSubmittingFinalize ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <span>Guardando...</span>
                </>
              ) : (
                'Guardar Finalización'
              )}
            </button>
          </div>
        }
      >
        <form onSubmit={handleFinalizeSubmit} className="space-y-4">
          {finalizeError && (
            <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0 text-rose-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>{finalizeError}</span>
            </div>
          )}

          {/* Tarjeta Informativa del Alumno y Curso */}
          {selectedEnrollment && (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs text-slate-700">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-medium">Alumno:</span>
                <span className="font-bold text-slate-800">
                  {selectedEnrollment.user?.last_name}, {selectedEnrollment.user?.first_name}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-medium">DNI:</span>
                <span className="font-mono text-slate-600">{selectedEnrollment.user?.dni}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-medium">Comisión / Curso:</span>
                <span className="font-semibold text-slate-700">{selectedEnrollment.section?.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-medium">Nivel Cursado:</span>
                <span className="font-semibold text-indigo-600">{selectedEnrollment.section?.course?.level?.name || '-'}</span>
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Nota Final (0 a 10) *
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="10"
              placeholder="Ej: 8.5"
              value={finalGrade}
              onChange={(e) => setFinalGrade(e.target.value)}
              className="w-full border border-slate-300 bg-white rounded-lg p-2.5 text-xs outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              required
            />
            <span className="text-[11px] text-slate-400 mt-0.5 block">Nota mínima de aprobación: 6.00</span>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Porcentaje de Asistencia (%) *
            </label>
            <input
              type="number"
              step="1"
              min="0"
              max="100"
              placeholder="Ej: 85"
              value={attendancePercentage}
              onChange={(e) => setAttendancePercentage(e.target.value)}
              className="w-full border border-slate-300 bg-white rounded-lg p-2.5 text-xs outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              required
            />
            <span className="text-[11px] text-slate-400 mt-0.5 block">Asistencia mínima requerida: 75%</span>
          </div>

          {/* Estado de aprobación previsualizado */}
          {hasInputs && (
            <div className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
              isPreviewApproved
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}>
              <span className="text-sm">{isPreviewApproved ? '✅' : '⚠️'}</span>
              <div>
                <strong>Condición calculada: {isPreviewApproved ? 'Aprobado' : 'Desaprobado'}</strong>
                <p className="text-[11px] opacity-80 mt-0.5">
                  {isPreviewApproved
                    ? 'El alumno acredita el nivel y queda habilitado para el nivel correlativo.'
                    : 'No cumple los requisitos mínimos (Nota ≥ 6 y Asistencia ≥ 75%).'}
                </p>
              </div>
            </div>
          )}
        </form>
      </Modal>

      {/* --- MODAL EDITAR GENERAL (PREVIO) --- */}
      <Modal
        isOpen={updateModalOpen}
        onClose={() => setUpdateModalOpen(false)}
        title="✏️ Editar Inscripción"
        maxWidth="max-w-sm"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <button
              type="button" onClick={() => setUpdateModalOpen(false)}
              className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 rounded text-xs font-medium cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit" form="editForm"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-medium cursor-pointer"
            >
              Guardar Cambios
            </button>
          </div>
        }
      >
        <form id="editForm" onSubmit={handleUpdateSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">Nota Final</label>
            <input
              type="number" step="0.01" min="0" max="10" placeholder="Ej: 8.5"
              name="final_grade"
              value={formData.final_grade}
              onChange={handleInputChange}
              className="w-full border border-slate-300 bg-slate-50 rounded p-2.5 text-xs outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">Porcentaje de Asistencia (%)</label>
            <input
              type="number" step="0.01" min="0" max="100" placeholder="Ej: 85"
              name="attendance_percentage"
              value={formData.attendance_percentage}
              onChange={handleInputChange}
              className="w-full border border-slate-300 bg-slate-50 rounded p-2.5 text-xs outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">Estado</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="w-full border border-slate-300 bg-slate-50 rounded p-2.5 text-xs outline-none focus:border-indigo-500"
            >
              <option value="Activo">Activo</option>
              <option value="Aprobado">Aprobado</option>
              <option value="Desaprobado">Desaprobado</option>
              <option value="Pendiente">Pendiente</option>
            </select>
          </div>
        </form>
      </Modal>

      {/* --- DELETE CONFIRMATION MODAL --- */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => { setDeleteModalOpen(false); setEnrollmentToDelete(null); }}
        isDanger={true}
        maxWidth="max-w-sm"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <button
              type="button"
              onClick={() => { setDeleteModalOpen(false); setEnrollmentToDelete(null); }}
              className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 rounded text-xs font-medium cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={executeDelete}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-medium cursor-pointer"
            >
              Sí, desactivar
            </button>
          </div>
        }
      >
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center mx-auto mb-4 text-rose-500 text-xl">
            ⚠️
          </div>
          <h2 className="text-lg font-bold text-slate-800 mb-2">¿Desactivar Inscripción?</h2>
          <p className="text-xs text-slate-500 mb-2">
            Esta acción cambiará el estado del alumno a "Dado de Baja" y perderá el acceso al curso.
          </p>
        </div>
      </Modal>
    </div>
  );
}
