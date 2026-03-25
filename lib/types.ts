// Tipos para el sistema de gestión de tareas

// Roles del sistema
export type RolSistema = 'SUPERADMIN' | 'ADMIN' | 'SUPERVISOR' | 'OPERADOR'

// Permisos disponibles
export type Permiso =
  | '*'
  | 'VER_DASHBOARD'
  | 'VER_EMPRESAS'
  | 'GESTIONAR_EMPRESAS'
  | 'VER_USUARIOS'
  | 'GESTIONAR_USUARIOS'
  | 'VER_ROLES'
  | 'GESTIONAR_ROLES'
  | 'VER_TAREAS'
  | 'VER_TAREAS_PROPIAS'
  | 'GESTIONAR_TAREAS'
  | 'ASIGNAR_TAREAS'
  | 'VER_MAPA'
  | 'VER_DOCUMENTOS'
  | 'VER_DOCUMENTOS_PROPIOS'
  | 'SUBIR_DOCUMENTOS'
  | 'GESTIONAR_DOCUMENTOS'

// Mapa de permisos por rol
export const ROLE_PERMISSIONS: Record<RolSistema, Permiso[]> = {
  SUPERADMIN: ['*'],
  ADMIN: [
    'VER_DASHBOARD',
    'VER_USUARIOS',
    'GESTIONAR_USUARIOS',
    'VER_ROLES',
    'VER_TAREAS',
    'GESTIONAR_TAREAS',
    'ASIGNAR_TAREAS',
    'VER_MAPA',
    'VER_DOCUMENTOS',
    'GESTIONAR_DOCUMENTOS',
    'SUBIR_DOCUMENTOS',
  ],
  SUPERVISOR: [
    'VER_DASHBOARD',
    'VER_USUARIOS',
    'VER_TAREAS',
    'GESTIONAR_TAREAS',
    'ASIGNAR_TAREAS',
    'VER_MAPA',
    'VER_DOCUMENTOS',
    'SUBIR_DOCUMENTOS',
  ],
  OPERADOR: [
    'VER_TAREAS_PROPIAS',
    'VER_DOCUMENTOS_PROPIOS',
    'SUBIR_DOCUMENTOS',
  ],
}

export interface Usuario {
  id: number
  username: string
  password: string
  nombre: string
  rut: string
  email: string
  rol: RolSistema
  empresaId: number | null
}

export interface Empresa {
  id: number
  nombre: string
  rut: string
  estado: 'activa' | 'inactiva'
}

export interface Rol {
  id: number
  nombre: string
  permisos: string[]
}

export interface Tarea {
  id: number
  titulo: string
  descripcion: string
  usuarioAsignadoId: number | null
  empresaId: number | null
  estado: 'pendiente' | 'en_progreso' | 'completada'
  fechaInicio: string
  fechaFin: string
  coordenadas?: { lat: number; lng: number }
  requiereEvidencia: boolean
}

export interface Documento {
  id: number
  nombre: string
  tareaId: number
  usuarioId: number
  empresaId: number | null
  tipo: 'image' | 'pdf' | 'other'
  fileBase64: string
  latitud: number
  longitud: number
  timestamp: string
  fechaSubida: string
}

export interface Sesion {
  userId: number
  username: string
  rol: RolSistema
  empresaId: number | null
  nombre: string
}

export type SeccionActiva = 'dashboard' | 'empresas' | 'usuarios' | 'roles' | 'tareas' | 'mapa' | 'documentos'

// Configuración de secciones por permisos
export const SECCION_PERMISOS = {
  dashboard: ['VER_DASHBOARD'],
  empresas: ['VER_EMPRESAS', 'GESTIONAR_EMPRESAS'],
  usuarios: ['VER_USUARIOS', 'GESTIONAR_USUARIOS'],
  roles: ['VER_ROLES', 'GESTIONAR_ROLES'],
  tareas: ['VER_TAREAS', 'VER_TAREAS_PROPIAS', 'GESTIONAR_TAREAS'],
  mapa: ['VER_MAPA'],
  documentos: ['VER_DOCUMENTOS', 'VER_DOCUMENTOS_PROPIOS', 'SUBIR_DOCUMENTOS'],
}
