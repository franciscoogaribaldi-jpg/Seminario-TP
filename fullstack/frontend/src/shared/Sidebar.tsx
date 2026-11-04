import SidebarButton from "./SidebarButton"
import { SIDEBAR_TABS, type SidebarTab } from "./Sidebar.const"
import { theme } from "./theme"

interface SidebarProps {
  activeTab: SidebarTab
  setActiveTab: (tab: SidebarTab) => void
  onLogout: () => void
  isSidebarOpen: boolean
  setIsSidebarOpen: (isOpen: boolean) => void
}

export default function Sidebar({ activeTab, setActiveTab, onLogout, isSidebarOpen, setIsSidebarOpen }: SidebarProps) {
  const tabs = [
    { 
      id: SIDEBAR_TABS.DASHBOARD, 
      label: 'Panel Principal', 
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> 
    },
    { 
      id: SIDEBAR_TABS.COURSES, 
      label: 'Cursos', 
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg> 
    },
    { 
      id: SIDEBAR_TABS.CLASSROOMS, 
      label: 'Aulas', 
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg> 
    },
    { 
      id: SIDEBAR_TABS.ACADEMIC_YEARS, 
      label: 'Ciclos Lectivos', 
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> 
    },
    { 
      id: SIDEBAR_TABS.SCHEDULES, 
      label: 'Horarios', 
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> 
    },
    { 
      id: SIDEBAR_TABS.ENROLLMENTS, 
      label: 'Inscripciones', 
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> 
    },
    { 
      id: SIDEBAR_TABS.STUDENTS, 
      label: 'Alumnos', 
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg> 
    },
    { 
      id: SIDEBAR_TABS.PROFESSORS, 
      label: 'Profesores', 
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg> 
    },
    { 
      id: SIDEBAR_TABS.REPORTS, 
      label: 'Listados y Reportes', 
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> 
    },
  ] as const;

  return (
    <>
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      
      <aside className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 md:relative md:translate-x-0 w-[260px] flex flex-col shrink-0 ${theme.sidebar.wrapper} ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      
      <div className={`p-5 flex items-center gap-3 border-b ${theme.sidebar.header} shrink-0`}>
        <div className="w-10 h-10 rounded bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg border border-white/20">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
          </svg>
        </div>
        <div>
          <strong className="block text-sm text-white font-bold tracking-wide">Instituto de Inglés</strong>
          <span className="block text-[11px] text-white/60 font-medium tracking-wider uppercase mt-0.5">Portal Administrativo</span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 hover:[&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded-full">
        <span className="px-3 pt-2 pb-2 text-[10px] uppercase tracking-wider font-bold text-white/40">Menu Principal</span>
        {tabs.map((tab) => (
          <SidebarButton 
            key={tab.id}
            icon={tab.icon} 
            label={tab.label} 
            isActive={activeTab === tab.id} 
            onClick={() => {
              setActiveTab(tab.id as any)
              setIsSidebarOpen(false)
            }} 
          />
        ))}
      </nav>

      <div className={`p-4 border-t ${theme.sidebar.header} flex items-center justify-between gap-2 shrink-0 bg-black/10`}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-inner border border-white/10">
            SC
          </div>
          <div className="text-left">
            <strong className="block text-xs text-white font-semibold">Secretaria</strong>
            <span className="block text-[10px] text-white/50">Administrador</span>
          </div>
        </div>
        <button 
          onClick={onLogout}
          title="Cerrar Sesion" 
          className="cursor-pointer w-8 h-8 rounded-full hover:bg-white/10 text-white/50 hover:text-white flex items-center justify-center transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </aside>
    </>
  )
}
