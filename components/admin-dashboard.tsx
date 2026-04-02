'use client'

import { useState, useEffect } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { Topbar } from '@/components/layout/topbar'
import { LoginForm } from '@/components/auth/login-form'
import { AccessDenied } from '@/components/layout/access-denied'
import { Dashboard } from '@/components/modules/dashboard'
import { Empresas } from '@/components/modules/empresas'
import { Usuarios } from '@/components/modules/usuarios'
import { Roles } from '@/components/modules/roles'
import { Tareas } from '@/components/modules/tareas'
import { Mapa } from '@/components/modules/mapa'
import { Documentos } from '@/components/modules/documentos'
import { initializeStorage, getSesion, cerrarSesion } from '@/lib/storage'
import { tieneAccesoSeccion, getSeccionesPermitidas } from '@/lib/permissions'
import { SeccionActiva, Sesion } from '@/lib/types'
import { Toaster } from 'sonner'

const titulosSecciones: Record<SeccionActiva, string> = {
  dashboard: 'Dashboard',
  empresas: 'Gestion de Empresas',
  usuarios: 'Gestion de Usuarios',
  roles: 'Roles y Perfiles',
  tareas: 'Gestion de Tareas',
  mapa: 'Mapa de Tareas',
  documentos: 'Documentos / Evidencias',
}

export function AdminDashboard() {
  const [sesion, setSesion] = useState<Sesion | null>(null)
  const [seccionActiva, setSeccionActiva] = useState<SeccionActiva>('dashboard')
  const [sidebarColapsado, setSidebarColapsado] = useState(false)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    // Inicializar storage y verificar sesion
    initializeStorage()
    const sesionActual = getSesion()
    setSesion(sesionActual)
    
    // Si hay sesion, establecer seccion inicial válida
    if (sesionActual) {
      const seccionesPermitidas = getSeccionesPermitidas(sesionActual.rol)
      if (seccionesPermitidas.length > 0 && !seccionesPermitidas.includes(seccionActiva)) {
        setSeccionActiva(seccionesPermitidas[0])
      }
    }
    
    setCargando(false)
  }, [])

  const handleLoginSuccess = () => {
    const sesionActual = getSesion()
    setSesion(sesionActual)
    
    // Establecer seccion inicial válida para el rol
    if (sesionActual) {
      const seccionesPermitidas = getSeccionesPermitidas(sesionActual.rol)
      if (seccionesPermitidas.length > 0) {
        setSeccionActiva(seccionesPermitidas[0])
      }
    }
  }

  const handleLogout = () => {
    cerrarSesion()
    setSesion(null)
    setSeccionActiva('dashboard')
  }

  const handleCambiarSeccion = (seccion: SeccionActiva) => {
    if (sesion && tieneAccesoSeccion(sesion.rol, seccion)) {
      setSeccionActiva(seccion)
    }
  }

  // Pantalla de carga
  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  // Pantalla de login
  if (!sesion) {
    return (
      <>
        <LoginForm onLoginSuccess={handleLoginSuccess} />
        <Toaster position="top-right" richColors />
      </>
    )
  }

  // Verificar permisos para la seccion actual
  const tieneAcceso = tieneAccesoSeccion(sesion.rol, seccionActiva)

  // Renderizar seccion activa
  const renderSeccion = () => {
    if (!tieneAcceso) {
      return (
        <AccessDenied 
          onGoBack={() => {
            const seccionesPermitidas = getSeccionesPermitidas(sesion.rol)
            if (seccionesPermitidas.length > 0) {
              setSeccionActiva(seccionesPermitidas[0])
            }
          }} 
        />
      )
    }

    switch (seccionActiva) {
      case 'dashboard':
        return <Dashboard sesion={sesion} />
      case 'empresas':
        return <Empresas sesion={sesion} />
      case 'usuarios':
        return <Usuarios sesion={sesion} />
      case 'roles':
        return <Roles sesion={sesion} />
      case 'tareas':
        return <Tareas sesion={sesion} />
      case 'mapa':
        return <Mapa sesion={sesion} />
      case 'documentos':
        return <Documentos sesion={sesion} />
      default:
        return <Dashboard sesion={sesion} />
    }
  }

  return (
    <>
      <div className="flex h-screen overflow-hidden bg-background">
        {/* Sidebar */}
        <Sidebar
          seccionActiva={seccionActiva}
          onCambiarSeccion={handleCambiarSeccion}
          colapsado={sidebarColapsado}
          onToggleColapso={() => setSidebarColapsado(!sidebarColapsado)}
          sesion={sesion}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Topbar */}
          <Topbar
            sesion={sesion}
            onLogout={handleLogout}
            titulo={titulosSecciones[seccionActiva]}
          />

          {/* Content Area */}
          <main className="flex-1 overflow-auto p-6">
            {renderSeccion()}
          </main>
        </div>
      </div>
      <Toaster position="top-right" richColors />
    </>
  )
}
