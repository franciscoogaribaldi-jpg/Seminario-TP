import { SIDEBAR_TABS } from '../shared/Sidebar.const'
import { useEffect, useState } from 'react'
import { studentService } from '../biz/services/student.service'
import { paymentService } from '../biz/services/payment.service'
import { enrollmentService } from '../biz/services/enrollment.service'
import { API_BASE_URL } from '../biz/config'
import { theme } from '../shared/theme'

interface DashboardProps {
  setActiveTab: (tab: import('../shared/Sidebar.const').SidebarTab) => void
}

const normalizeStatus = (s?: string) => {
  if (!s || s === 'Active' || s === 'Activo') return 'Activo';
  if (s === 'Pending' || s === 'Pendiente') return 'Pendiente';
  return 'Dado de Baja';
};

export default function Dashboard({ setActiveTab }: DashboardProps) {
  const [studentsCount, setStudentsCount] = useState<number>(0)
  const [enrollmentsList, setEnrollmentsList] = useState<any[]>([])
  const [sectionsCount, setSectionsCount] = useState<number>(0)
  const [debtorsCount, setDebtorsCount] = useState<number>(0)

  useEffect(() => {
    studentService.getStudents().then(data => setStudentsCount(data.length)).catch(() => setStudentsCount(0))

    enrollmentService.getEnrollments()
      .then(data => setEnrollmentsList(data || []))
      .catch(() => setEnrollmentsList([]))

    fetch(`${API_BASE_URL}/sections`)
      .then(res => res.json())
      .then(json => setSectionsCount(json.data?.length || 0))
      .catch(() => setSectionsCount(0))

    paymentService.getDebtors()
      .then(data => setDebtorsCount(data.length))
      .catch(() => setDebtorsCount(0))
  }, [])

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-start">
        <div>
          <h1 className={`text-xl font-bold tracking-tight ${theme.layout.pageHeader}`}>Panel</h1>
          <p className={`text-xs mt-1 ${theme.layout.pageSubheader}`}>Resumen general del instituto de inglés.</p>
        </div>
        <button
          onClick={() => setActiveTab(SIDEBAR_TABS.ENROLLMENTS)}
          className={theme.button.primary}
        >
          Ir a Inscripciones ➔
        </button>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className={`${theme.card.wrapper} p-4 flex items-center gap-4`}>
          <div className="w-11 h-11 rounded bg-blue-100 flex items-center justify-center text-lg">👦</div>
          <div>
            <div className="text-xl font-bold text-slate-800">{studentsCount}</div>
            <div className="text-[11px] text-slate-500 font-medium mt-1">Alumnos activos</div>
          </div>
        </div>
        <div className={`${theme.card.wrapper} p-4 flex items-center gap-4`}>
          <div className="w-11 h-11 rounded bg-cyan-100 flex items-center justify-center text-lg">📝</div>
          <div>
            <div className="text-xl font-bold text-slate-800">{enrollmentsList.length}</div>
            <div className="text-[11px] text-slate-500 font-medium mt-1">Inscripciones</div>
          </div>
        </div>
        <div 
          onClick={() => setActiveTab(SIDEBAR_TABS.REPORTS)} 
          className={`${theme.card.wrapper} p-4 flex items-center gap-4 cursor-pointer hover:border-emerald-300 transition-all`}
          title="Ver comisiones y cupos"
        >
          <div className="w-11 h-11 rounded bg-emerald-100 flex items-center justify-center text-lg">🏫</div>
          <div>
            <div className="text-xl font-bold text-slate-800">{sectionsCount}</div>
            <div className="text-[11px] text-slate-500 font-medium mt-1">Comisiones activas ➔</div>
          </div>
        </div>
        <div 
          onClick={() => setActiveTab(SIDEBAR_TABS.REPORTS)} 
          className={`${theme.card.wrapper} p-4 flex items-center gap-4 cursor-pointer hover:border-rose-300 transition-all`}
          title="Ver reporte de alumnos morosos"
        >
          <div className="w-11 h-11 rounded bg-rose-100 flex items-center justify-center text-lg">⚠️</div>
          <div>
            <div className="text-xl font-bold text-slate-800">{debtorsCount}</div>
            <div className="text-[11px] text-slate-500 font-medium mt-1">Deudores / Impagos ➔</div>
          </div>
        </div>
      </div>

      {/* Recent Enrollments */}
      <div className={`${theme.card.wrapper} overflow-hidden`}>
        <div className={`p-4 border-b border-slate-200 flex justify-between items-center`}>
          <div>
            <h3 className={`text-sm font-semibold ${theme.card.header}`}>Inscripciones Recientes</h3>
            <p className="text-[11px] text-slate-500">Lista de alumnos inscriptos recientemente</p>
          </div>
          <button onClick={() => setActiveTab(SIDEBAR_TABS.ENROLLMENTS)} className="cursor-pointer text-xs text-indigo-600 hover:text-indigo-700 font-medium">Ver todo →</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`bg-slate-50 border-b border-slate-200`}>
                <th className={`p-3 text-[10px] uppercase font-bold ${theme.table.header} tracking-wider`}>Alumno</th>
                <th className={`p-3 text-[10px] uppercase font-bold ${theme.table.header} tracking-wider`}>Comisión</th>
                <th className={`p-3 text-[10px] uppercase font-bold ${theme.table.header} tracking-wider`}>Nivel</th>
                <th className={`p-3 text-[10px] uppercase font-bold ${theme.table.header} tracking-wider`}>Fecha</th>
                <th className={`p-3 text-[10px] uppercase font-bold ${theme.table.header} tracking-wider`}>Estado</th>
              </tr>
            </thead>
            <tbody className={`divide-y divide-slate-200`}>
              {enrollmentsList.length === 0 ? (
                <tr><td colSpan={5} className="p-4 text-center text-slate-500 text-xs">No hay inscripciones para mostrar</td></tr>
              ) : (
                enrollmentsList.slice(0, 5).map((e) => {
                  const statusLabel = normalizeStatus(e.status);
                  return (
                    <tr key={e.id_enrollment} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 text-xs font-semibold text-slate-700">{e.user?.last_name}, {e.user?.first_name}</td>
                      <td className="p-3 text-xs text-slate-500">{e.section?.name}</td>
                      <td className="p-3 text-xs">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-2xs font-semibold bg-indigo-50 text-indigo-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>{e.section?.course?.level?.name || '-'}
                        </span>
                      </td>
                      <td className="p-3 text-xs text-slate-500">{new Date(e.enrollment_date).toLocaleDateString('es-AR')}</td>
                      <td className="p-3 text-xs">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-2xs font-semibold ${
                          statusLabel === 'Activo' ? 'bg-emerald-50 text-emerald-700' :
                          statusLabel === 'Pendiente' ? 'bg-amber-50 text-amber-700' : 'bg-rose-950/30 text-rose-700'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            statusLabel === 'Activo' ? 'bg-emerald-500' :
                            statusLabel === 'Pendiente' ? 'bg-amber-500' : 'bg-rose-500'
                          }`}></span>
                          {statusLabel}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
