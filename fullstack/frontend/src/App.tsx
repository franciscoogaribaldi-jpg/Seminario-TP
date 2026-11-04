import { SIDEBAR_TABS, type SidebarTab } from './shared/Sidebar.const'
import { useState, useEffect } from 'react'
import Sidebar from './shared/Sidebar'
import Topbar from './shared/Topbar'
import Dashboard from './admin/Dashboard'
import Enrollments from './admin/Enrollments'
import Students from './admin/Students/Students'
import Professors from './admin/Professors'
import Courses from './admin/Courses'
import Classrooms from './admin/Classrooms'
import AcademicYears from './admin/AcademicYears'
import Schedules from './admin/Schedules'
import Reports from './admin/Reports'
import Login from './auth/Login'
import StudentDashboard from './student/StudentDashboard'

import { theme } from './shared/theme'

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('isLoggedIn') === 'true'
  })

  const [userRole, setUserRole] = useState<'ADMIN' | 'STUDENT'>(() => {
    return (localStorage.getItem('userRole') as any) || 'ADMIN'
  })

  const [userData, setUserData] = useState<any>(() => {
    const saved = localStorage.getItem('userData')
    return saved ? JSON.parse(saved) : null
  })

  const [activeTab, setActiveTab] = useState<SidebarTab>(() => {
    return (localStorage.getItem('activeTab') as any) || 'dashboard'
  })

  useEffect(() => {
    if (isLoggedIn) {
      localStorage.setItem('isLoggedIn', 'true')
      localStorage.setItem('userRole', userRole)
      if (userData) localStorage.setItem('userData', JSON.stringify(userData))
    } else {
      //limpia el localStorage
      localStorage.removeItem('isLoggedIn')
      localStorage.removeItem('userRole')
      localStorage.removeItem('userData')
      localStorage.removeItem('activeTab')
    }
  }, [isLoggedIn, userRole, userData]) 
  //se ejecuta cuando cambia alguno de estos estados
  //tambien se ejecuta al comienzo pero no entra porq isLoggedIn es false

  useEffect(() => {
    localStorage.setItem('activeTab', activeTab)
  }, [activeTab])

  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  if (!isLoggedIn) {
    //si isLoggedIn es false, le mando el formulario y la funcion onLogin
    //y espero la respuesta
    return <Login onLogin={(role, data) => {
      //Login seria como una funcion en donde se le envia el parametro onLogin, 
      // lo unico que se envia es la funcion pero no se ejecuta todavia, 
      // la ejecuta login.tsx en caso de que inicie sesion correctamente

      //asiganamos los datos recibidos a los estados que creamos
      setUserRole(role);
      setUserData(data);
      setIsLoggedIn(true);
      setActiveTab(SIDEBAR_TABS.DASHBOARD);//seteamos en el principio
    }} />
  }

  if (userRole === 'STUDENT') {
    return <StudentDashboard userData={userData} onLogout={() => setIsLoggedIn(false)} />
  }

  return (
    <div className={`flex h-screen text-slate-800 font-sans overflow-hidden ${theme.layout.appBackground}`}>
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={() => setIsLoggedIn(false)} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

      <main className="flex-1 flex flex-col overflow-hidden">
        <Topbar activeTab={activeTab} setIsSidebarOpen={setIsSidebarOpen} />

        <div className={`flex-1 overflow-y-auto p-6 ${theme.layout.mainContainer}`}>
          {activeTab === SIDEBAR_TABS.DASHBOARD && (
            <Dashboard
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === SIDEBAR_TABS.ENROLLMENTS && (
            <Enrollments />
          )}

          {activeTab === SIDEBAR_TABS.STUDENTS && (
            <Students />
          )}

          {activeTab === SIDEBAR_TABS.PROFESSORS && (
            <Professors />
          )}

          {activeTab === SIDEBAR_TABS.COURSES && (
            <Courses />
          )}

          {activeTab === SIDEBAR_TABS.CLASSROOMS && (
            <Classrooms />
          )}

          {activeTab === SIDEBAR_TABS.ACADEMIC_YEARS && (
            <AcademicYears />
          )}

          {activeTab === SIDEBAR_TABS.SCHEDULES && (
            <Schedules />
          )}

          {activeTab === SIDEBAR_TABS.REPORTS && (
            <Reports />
          )}
        </div>
      </main>
    </div>
  )
}
