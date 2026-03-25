'use client'

import { cn } from '@/lib/utils'
import { SeccionActiva, RolSistema, Sesion } from '@/lib/types'
import { tieneAccesoSeccion } from '@/lib/permissions'
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  Shield, 
  CheckSquare, 
  MapPin, 
  FileText,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SidebarProps {
  seccionActiva: SeccionActiva
  onCambiarSeccion: (seccion: SeccionActiva) => void
  colapsado: boolean
  onToggleColapso: () => void
  sesion: Sesion
}

const menuItems: { id: SeccionActiva; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'empresas', label: 'Empresas', icon: Building2 },
  { id: 'usuarios', label: 'Usuarios', icon: Users },
  { id: 'roles', label: 'Roles / Perfiles', icon: Shield },
  { id: 'tareas', label: 'Tareas', icon: CheckSquare },
  { id: 'mapa', label: 'Mapa', icon: MapPin },
  { id: 'documentos', label: 'Documentos', icon: FileText },
]

export function Sidebar({ seccionActiva, onCambiarSeccion, colapsado, onToggleColapso, sesion }: SidebarProps) {
  // Filtrar items del menú según permisos del rol
  const menuItemsFiltrados = menuItems.filter(item => 
    tieneAccesoSeccion(sesion.rol, item.id)
  )

  return (
    <aside 
      className={cn(
        'h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300',
        colapsado ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo/Header */}
      <div className={cn(
        'h-16 border-b border-sidebar-border flex items-center px-4',
        colapsado ? 'justify-center' : 'justify-between'
      )}>
        {!colapsado && (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-sidebar-foreground">TaskAdmin</span>
          </div>
        )}
        {colapsado && (
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <Building2 className="h-5 w-5 text-primary-foreground" />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 overflow-y-auto">
        <ul className="flex flex-col gap-1">
          {menuItemsFiltrados.map((item) => {
            const Icon = item.icon
            const isActive = seccionActiva === item.id
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => onCambiarSeccion(item.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left',
                    isActive 
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium' 
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
                    colapsado && 'justify-center px-2'
                  )}
                  title={colapsado ? item.label : undefined}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {!colapsado && <span>{item.label}</span>}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Role indicator */}
      {!colapsado && (
        <div className="px-4 py-2 border-t border-sidebar-border">
          <p className="text-xs text-muted-foreground">Rol:</p>
          <p className="text-sm font-medium text-sidebar-foreground">{sesion.rol}</p>
        </div>
      )}

      {/* Toggle Button */}
      <div className="p-2 border-t border-sidebar-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleColapso}
          className={cn('w-full', colapsado ? 'justify-center' : 'justify-start')}
        >
          {colapsado ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 mr-2" />
              <span>Colapsar</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  )
}
