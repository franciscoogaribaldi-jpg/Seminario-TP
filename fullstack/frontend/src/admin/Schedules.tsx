import { useState, useEffect, useMemo } from 'react'
import {
  scheduleService,
  SCHEDULE_DAYS,
  DAY_LABELS,
  type Schedule,
  type ScheduleDay
} from '../biz/services/schedule.service'
import Modal from '../shared/components/Modal'
import { theme } from '../shared/theme'

export default function Schedules() {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [scheduleToDelete, setScheduleToDelete] = useState<Schedule | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [selectedDayFilter, setSelectedDayFilter] = useState<string>('ALL')

  const [toast, setToast] = useState<{ text: string; type: 'success' | 'danger' } | null>(null)
  const [formError, setFormError] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState<{
    day: ScheduleDay
    start_time: string
    end_time: string
  }>({
    day: 'MONDAY',
    start_time: '08:00',
    end_time: '10:00'
  })

  const fetchSchedules = async () => {
    setLoading(true)
    try {
      const data = await scheduleService.getSchedules()
      setSchedules(data)
    } catch (error: any) {
      console.error(error)
      showToast(error.message || 'Error al cargar los horarios', 'danger')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSchedules()
  }, [])

  const showToast = (text: string, type: 'success' | 'danger') => {
    setToast({ text, type })
    setTimeout(() => {
      setToast(null)
    }, 3500)
  }

  const handleOpenCreateModal = () => {
    setEditingId(null)
    setFormData({
      day: 'MONDAY',
      start_time: '08:00',
      end_time: '10:00'
    })
    setFormError('')
    setModalOpen(true)
  }

  const handleOpenEditModal = (schedule: Schedule) => {
    setEditingId(schedule.id_schedule || null)
    // Extraer formato HH:mm por si viene "08:00:00"
    const start = schedule.start_time.slice(0, 5)
    const end = schedule.end_time.slice(0, 5)
    setFormData({
      day: schedule.day,
      start_time: start,
      end_time: end
    })
    setFormError('')
    setModalOpen(true)
  }

  const handleOpenDeleteModal = (schedule: Schedule) => {
    setScheduleToDelete(schedule)
    setDeleteModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    if (!formData.day || !formData.start_time || !formData.end_time) {
      setFormError('Por favor completá todos los campos requeridos.')
      return
    }

    if (formData.start_time >= formData.end_time) {
      setFormError('La hora de inicio debe ser anterior a la hora de fin.')
      return
    }

    setSubmitting(true)
    try {
      if (editingId) {
        await scheduleService.updateSchedule(editingId, formData)
        showToast('Horario actualizado correctamente', 'success')
      } else {
        await scheduleService.createSchedule(formData)
        showToast('Horario registrado con éxito', 'success')
      }
      setModalOpen(false)
      fetchSchedules()
    } catch (error: any) {
      setFormError(error.message || 'Error al guardar el horario.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!scheduleToDelete?.id_schedule) return
    setSubmitting(true)
    try {
      await scheduleService.deleteSchedule(scheduleToDelete.id_schedule)
      showToast('Horario eliminado correctamente', 'success')
      setDeleteModalOpen(false)
      setScheduleToDelete(null)
      fetchSchedules()
    } catch (error: any) {
      showToast(error.message || 'Error al eliminar el horario', 'danger')
      setDeleteModalOpen(false)
    } finally {
      setSubmitting(false)
    }
  }

  // Helper para formatear hora "08:00:00" -> "08:00"
  const formatTime = (timeStr: string) => {
    if (!timeStr) return ''
    return timeStr.slice(0, 5)
  }

  // Helper para calcular duración
  const calculateDuration = (start: string, end: string) => {
    const [startH, startM] = start.split(':').map(Number)
    const [endH, endM] = end.split(':').map(Number)
    const diffMin = (endH * 60 + endM) - (startH * 60 + startM)
    if (diffMin <= 0) return ''
    const hours = Math.floor(diffMin / 60)
    const minutes = diffMin % 60
    if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`
    if (hours > 0) return `${hours} hs`
    return `${minutes} min`
  }

  const filteredSchedules = useMemo(() => {
    if (selectedDayFilter === 'ALL') return schedules
    return schedules.filter(s => s.day === selectedDayFilter)
  }, [schedules, selectedDayFilter])

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800">Gestión de Horarios</h1>
          <p className="text-xs text-slate-500 mt-1">
            Administración de franjas horarias y turnos para la asignación de clases.
          </p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className={`${theme.button.primary} flex items-center justify-center gap-2`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Registrar Horario
        </button>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 bg-white border px-5 py-4 rounded-xl shadow-2xl flex items-center gap-3 transition-all duration-300 ${
            toast.type === 'success'
              ? 'border-emerald-500/50 text-emerald-600'
              : 'border-rose-500/50 text-rose-600'
          }`}
        >
          {toast.type === 'success' ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-rose-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          )}
          <span className="font-medium text-sm text-slate-700">{toast.text}</span>
        </div>
      )}

      {/* Filtros por Día */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1">
        <button
          onClick={() => setSelectedDayFilter('ALL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            selectedDayFilter === 'ALL'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Todos ({schedules.length})
        </button>
        {SCHEDULE_DAYS.map(dayObj => {
          const count = schedules.filter(s => s.day === dayObj.value).length
          const isSelected = selectedDayFilter === dayObj.value
          return (
            <button
              key={dayObj.value}
              onClick={() => setSelectedDayFilter(dayObj.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>{dayObj.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Listado de Horarios */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
          <div className="text-xs font-semibold text-slate-700">Franjas Horarias Registradas</div>
          <span className="text-2xs text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded font-mono">
            Total: {filteredSchedules.length}
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">Cargando horarios...</div>
        ) : filteredSchedules.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            No se encontraron horarios registrados para el filtro seleccionado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="p-3.5">Día</th>
                  <th className="p-3.5">Franja Horaria</th>
                  <th className="p-3.5">Duración</th>
                  <th className="p-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredSchedules.map((schedule) => {
                  const startTime = formatTime(schedule.start_time)
                  const endTime = formatTime(schedule.end_time)
                  const duration = calculateDuration(startTime, endTime)

                  return (
                    <tr key={schedule.id_schedule} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 font-medium text-slate-800">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 border border-indigo-100 text-indigo-700 font-semibold text-xs">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {DAY_LABELS[schedule.day] || schedule.day}
                        </span>
                      </td>

                      <td className="p-3.5">
                        <span className="font-semibold text-slate-700 text-sm">
                          {startTime} <span className="text-slate-400 font-normal">a</span> {endTime}
                        </span>
                        <span className="text-[11px] text-slate-400 ml-1">hs</span>
                      </td>

                      <td className="p-3.5 text-slate-500">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[11px]">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {duration}
                        </span>
                      </td>

                      <td className="p-3.5 text-right space-x-2">
                        <button
                          onClick={() => handleOpenEditModal(schedule)}
                          className="text-indigo-600 hover:text-indigo-800 font-medium px-2 py-1 rounded hover:bg-indigo-50 transition-colors"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleOpenDeleteModal(schedule)}
                          className="text-rose-600 hover:text-rose-800 font-medium px-2 py-1 rounded hover:bg-rose-50 transition-colors"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Crear / Editar Horario */}
      <Modal
        isOpen={modalOpen}
        onClose={() => !submitting && setModalOpen(false)}
        title={editingId ? 'Editar Horario' : 'Registrar Nuevo Horario'}
        footer={
          <>
            <button
              type="button"
              disabled={submitting}
              onClick={() => setModalOpen(false)}
              className="flex-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium cursor-pointer transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="scheduleForm"
              disabled={submitting}
              className="flex-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium cursor-pointer shadow-sm transition-colors disabled:opacity-50"
            >
              {submitting ? 'Guardando...' : editingId ? 'Guardar Cambios' : 'Registrar'}
            </button>
          </>
        }
      >
        <form id="scheduleForm" onSubmit={handleSubmit} className="flex flex-col gap-4">
          {formError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0 text-rose-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>{formError}</span>
            </div>
          )}

          {/* Selector de Día */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700">Día de la semana *</label>
            <select
              required
              value={formData.day}
              onChange={(e) => setFormData({ ...formData, day: e.target.value as ScheduleDay })}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            >
              {SCHEDULE_DAYS.map((day) => (
                <option key={day.value} value={day.value}>
                  {day.label}
                </option>
              ))}
            </select>
          </div>

          {/* Horas */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700">Hora de Inicio *</label>
              <input
                type="time"
                required
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700">Hora de Fin *</label>
              <input
                type="time"
                required
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-500 flex items-start gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>
              Este horario quedará disponible en el sistema para ser asignado a las comisiones y cursos del instituto.
            </span>
          </div>
        </form>
      </Modal>

      {/* Modal Confirmación de Eliminación */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => !submitting && setDeleteModalOpen(false)}
        title="Confirmar Eliminación"
        footer={
          <>
            <button
              type="button"
              disabled={submitting}
              onClick={() => setDeleteModalOpen(false)}
              className="flex-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium cursor-pointer transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={handleConfirmDelete}
              className="flex-1 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-medium cursor-pointer shadow-sm transition-colors disabled:opacity-50"
            >
              {submitting ? 'Eliminando...' : 'Eliminar Horario'}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-xs text-slate-600">
            ¿Estás seguro de que deseas eliminar este horario?
          </p>
          {scheduleToDelete && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800">
              {DAY_LABELS[scheduleToDelete.day]} de {formatTime(scheduleToDelete.start_time)} a {formatTime(scheduleToDelete.end_time)} hs
            </div>
          )}
          <p className="text-[11px] text-slate-400">
            Esta acción no se puede deshacer. Si el horario está en uso por alguna comisión, el sistema impedirá su eliminación.
          </p>
        </div>
      </Modal>
    </div>
  )
}
