import { Permiso, RolSistema, ROLE_PERMISSIONS, SeccionActiva, SECCION_PERMISOS, Sesion } from './types'

/**
 * Verifica si un rol tiene un permiso específico
 */
export function tienePermiso(rol: RolSistema, permiso: Permiso): boolean {
  const permisos = ROLE_PERMISSIONS[rol]
  if (!permisos) return false
  
  // SUPERADMIN tiene todos los permisos
  if (permisos.includes('*')) return true
  
  return permisos.includes(permiso)
}

/**
 * Verifica si un rol tiene alguno de los permisos especificados
 */
export function tieneAlgunPermiso(rol: RolSistema, permisos: Permiso[]): boolean {
  return permisos.some(permiso => tienePermiso(rol, permiso))
}

/**
 * Verifica si un rol tiene acceso a una sección
 */
export function tieneAccesoSeccion(rol: RolSistema, seccion: SeccionActiva): boolean {
  // SUPERADMIN tiene acceso a todo
  if (ROLE_PERMISSIONS[rol]?.includes('*')) return true
  
  const permisosRequeridos = SECCION_PERMISOS[seccion] as Permiso[]
  return tieneAlgunPermiso(rol, permisosRequeridos)
}

/**
 * Obtiene las secciones permitidas para un rol
 */
export function getSeccionesPermitidas(rol: RolSistema): SeccionActiva[] {
  const secciones: SeccionActiva[] = ['dashboard', 'empresas', 'usuarios', 'roles', 'tareas', 'mapa', 'documentos']
  return secciones.filter(seccion => tieneAccesoSeccion(rol, seccion))
}

/**
 * Verifica si el usuario puede ver datos de todas las empresas
 */
export function puedeVerTodasEmpresas(rol: RolSistema): boolean {
  return rol === 'SUPERADMIN'
}

/**
 * Verifica si el usuario puede gestionar empresas
 */
export function puedeGestionarEmpresas(rol: RolSistema): boolean {
  return tienePermiso(rol, 'GESTIONAR_EMPRESAS') || ROLE_PERMISSIONS[rol]?.includes('*')
}

/**
 * Verifica si el usuario puede gestionar usuarios
 */
export function puedeGestionarUsuarios(rol: RolSistema): boolean {
  return tienePermiso(rol, 'GESTIONAR_USUARIOS') || ROLE_PERMISSIONS[rol]?.includes('*')
}

/**
 * Verifica si el usuario puede gestionar roles
 */
export function puedeGestionarRoles(rol: RolSistema): boolean {
  return tienePermiso(rol, 'GESTIONAR_ROLES') || ROLE_PERMISSIONS[rol]?.includes('*')
}

/**
 * Verifica si el usuario puede gestionar tareas
 */
export function puedeGestionarTareas(rol: RolSistema): boolean {
  return tienePermiso(rol, 'GESTIONAR_TAREAS') || ROLE_PERMISSIONS[rol]?.includes('*')
}

/**
 * Verifica si el usuario puede asignar tareas
 */
export function puedeAsignarTareas(rol: RolSistema): boolean {
  return tienePermiso(rol, 'ASIGNAR_TAREAS') || ROLE_PERMISSIONS[rol]?.includes('*')
}

/**
 * Verifica si el usuario solo puede ver sus propias tareas
 */
export function soloVerPropiasTareas(rol: RolSistema): boolean {
  return rol === 'OPERADOR'
}

/**
 * Verifica si el usuario solo puede ver sus propios documentos
 */
export function soloVerPropiosDocumentos(rol: RolSistema): boolean {
  return rol === 'OPERADOR'
}

/**
 * Verifica si el usuario puede subir documentos
 */
export function puedeSubirDocumentos(rol: RolSistema): boolean {
  return tienePermiso(rol, 'SUBIR_DOCUMENTOS') || ROLE_PERMISSIONS[rol]?.includes('*')
}

/**
 * Verifica si el usuario puede eliminar documentos
 */
export function puedeEliminarDocumentos(rol: RolSistema): boolean {
  return tienePermiso(rol, 'GESTIONAR_DOCUMENTOS') || ROLE_PERMISSIONS[rol]?.includes('*')
}

/**
 * Filtra datos por empresa según el rol del usuario
 */
export function filtrarPorEmpresa<T extends { empresaId: number | null }>(
  datos: T[],
  sesion: Sesion
): T[] {
  // SUPERADMIN ve todo
  if (sesion.rol === 'SUPERADMIN') return datos
  
  // Los demás solo ven datos de su empresa
  if (sesion.empresaId === null) return []
  
  return datos.filter(d => d.empresaId === sesion.empresaId)
}

/**
 * Filtra datos por usuario (para OPERADOR)
 */
export function filtrarPorUsuario<T extends { usuarioId?: number; usuarioAsignadoId?: number | null }>(
  datos: T[],
  sesion: Sesion
): T[] {
  return datos.filter(d => {
    if ('usuarioId' in d) return d.usuarioId === sesion.userId
    if ('usuarioAsignadoId' in d) return d.usuarioAsignadoId === sesion.userId
    return false
  })
}

/**
 * Genera coordenadas GPS aleatorias simuladas (Santiago, Chile)
 */
export function generarCoordenadasSimuladas(): { latitud: number; longitud: number } {
  return {
    latitud: -33.4 + (Math.random() * -0.1),
    longitud: -70.6 + (Math.random() * -0.1),
  }
}