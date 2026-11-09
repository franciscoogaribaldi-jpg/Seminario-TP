import { useState, useEffect, useRef } from 'react'
import { API_BASE_URL } from '../biz/config'
import { type SidebarTab } from "./Sidebar.const"
import { theme } from './theme'
import ChangePasswordModal from './ChangePasswordModal'

interface TopbarProps {
  activeTab: SidebarTab;
  setIsSidebarOpen: (isOpen: boolean) => void;
  userData?: any;
}

export default function Topbar({ activeTab, setIsSidebarOpen, userData }: TopbarProps) {
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/health`)
        if (res.ok) {
          setBackendStatus('connected')
        } else {
          setBackendStatus('disconnected')
        }
      } catch {
        setBackendStatus('disconnected')
      }
    }
    checkBackend()
    const interval = setInterval(checkBackend, 10000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Obtener datos del usuario desde props o de localStorage como fallback
  const currentUser = userData || (() => {
    try {
      const saved = localStorage.getItem('userData')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })()

  const currentUserId = currentUser?.id || currentUser?.id_user || currentUser?.userId || (currentUser?.role === 'ADMIN' ? 1 : undefined)

  const userInitial = currentUser?.first_name ? currentUser.first_name.charAt(0).toUpperCase() : 'SC'
  const displayName = currentUser?.first_name ? `${currentUser.first_name} ${currentUser.last_name || ''}`.trim() : 'Secretaría'
  const displayRole = currentUser?.role === 'ADMIN' ? 'Secretaría / Admin' : currentUser?.role || 'Secretaría'

  return (
    <>
      <header className={`h-16 ${theme.topbar.wrapper} px-6 flex items-center justify-between shrink-0 relative z-30`}>
        <div className="flex items-center gap-3 text-sm text-slate-100/70">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="md:hidden w-8 h-8 flex items-center justify-center rounded border border-white/20 hover:bg-white/10 text-white mr-2 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          </button>
          <span className="hidden sm:inline">Inicio</span>
          <span className="hidden sm:inline opacity-50">/</span>
          <strong className="text-white font-semibold capitalize tracking-wide">{activeTab.replace('-', ' ')}</strong>
        </div>
        
        <div className="flex items-center gap-4">

          {/* Backend status indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-full bg-white/10 border border-white/10 backdrop-blur-sm">
            <span className={`w-2 h-2 rounded-full ${
              backendStatus === 'connected' ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]' :
              backendStatus === 'disconnected' ? 'bg-rose-400' : 'bg-amber-400'
            }`} />
            <span className="hidden md:block text-white/90">
              {backendStatus === 'connected' ? 'API Conectada' :
               backendStatus === 'disconnected' ? 'API Desconectada' : 'Verificando...'}
            </span>
          </div>

          <button className="w-8 h-8 rounded-full flex items-center justify-center text-sm hover:bg-white/10 text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
            </svg>
          </button>

          {/* User profile dropdown container */}
          <div className="relative" ref={dropdownRef}>
            <div
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 px-2 py-1 rounded-full hover:bg-white/10 cursor-pointer transition-colors border border-transparent hover:border-white/10 select-none"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-sm border border-white/20">
                {userInitial}
              </div>
              <span className="hidden md:block text-sm font-semibold text-white mr-1">{displayName}</span>
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 text-white/70 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-slate-100 py-2 z-50 text-slate-700 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-xs font-semibold text-slate-800">{displayName}</p>
                  <p className="text-[11px] text-slate-400 font-medium">{displayRole}</p>
                </div>

                <button
                  onClick={() => {
                    setIsDropdownOpen(false)
                    setIsChangePasswordOpen(true)
                  }}
                  className="w-full text-left px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400 group-hover:text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                  Cambiar Contraseña
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Modal para cambio de contraseña */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
        userId={currentUserId}
      />
    </>
  )
}
