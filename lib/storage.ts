import { Usuario, Empresa, Rol, Tarea, Documento, Sesion, RolSistema } from './types'

// Claves de localStorage
const KEYS = {
  USERS: 'users',
  COMPANIES: 'companies',
  ROLES: 'roles',
  TASKS: 'tasks',
  DOCUMENTS: 'documents',
  SESSION: 'session',
}

// Usuario SUPERADMIN por defecto
const DEFAULT_SUPERADMIN: Usuario = {
  id: 1,
  username: 'superadmin',
  password: 'superadmin',
  nombre: 'Super Administrador',
  rut: '11.111.111-1',
  email: 'superadmin@sistema.cl',
  rol: 'SUPERADMIN',
  empresaId: null,
}

// Roles por defecto ACTUALIZADOS con permisos en español
const DEFAULT_ROLES: Rol[] = [
  { id: 1, nombre: 'SUPERADMIN', permisos: ['*'] },
  { 
    id: 2, 
    nombre: 'ADMIN', 
    permisos: [
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
      'SUBIR_DOCUMENTOS'
    ] 
  },
  { 
    id: 3, 
    nombre: 'SUPERVISOR', 
    permisos: [
      'VER_DASHBOARD', 
      'VER_USUARIOS', 
      'VER_TAREAS', 
      'ASIGNAR_TAREAS', 
      'VER_MAPA', 
      'VER_DOCUMENTOS', 
      'SUBIR_DOCUMENTOS'
    ] 
  },
  { 
    id: 4, 
    nombre: 'OPERADOR', 
    permisos: [
      'VER_TAREAS_PROPIAS', 
      'VER_DOCUMENTOS_PROPIOS', 
      'SUBIR_DOCUMENTOS'
    ] 
  },
]

// Inicializar datos por defecto
export function initializeStorage(): void {
  if (typeof window === 'undefined') return

  // Verificar si ya existen usuarios
  const existingUsers = localStorage.getItem(KEYS.USERS)
  if (!existingUsers) {
    localStorage.setItem(KEYS.USERS, JSON.stringify([DEFAULT_SUPERADMIN]))
  }

  // Verificar si ya existen roles
  const existingRoles = localStorage.getItem(KEYS.ROLES)
  if (!existingRoles) {
    localStorage.setItem(KEYS.ROLES, JSON.stringify(DEFAULT_ROLES))
  }

  // Inicializar empresas vacías si no existen
  if (!localStorage.getItem(KEYS.COMPANIES)) {
    localStorage.setItem(KEYS.COMPANIES, JSON.stringify([]))
  }

  // Inicializar tareas vacías si no existen
  if (!localStorage.getItem(KEYS.TASKS)) {
    localStorage.setItem(KEYS.TASKS, JSON.stringify([]))
  }

  // Inicializar documentos vacíos si no existen
  if (!localStorage.getItem(KEYS.DOCUMENTS)) {
    localStorage.setItem(KEYS.DOCUMENTS, JSON.stringify([]))
  }
}

// ============ USUARIOS ============

export function getUsuarios(): Usuario[] {
  if (typeof window === 'undefined') return []
  const data = localStorage.getItem(KEYS.USERS)
  return data ? JSON.parse(data) : []
}

export function getUsuario(id: number): Usuario | undefined {
  return getUsuarios().find(u => u.id === id)
}

export function getUsuariosPorEmpresa(empresaId: number): Usuario[] {
  return getUsuarios().filter(u => u.empresaId === empresaId)
}

export function crearUsuario(usuario: Omit<Usuario, 'id'>): Usuario {
  const usuarios = getUsuarios()
  const newId = usuarios.length > 0 ? Math.max(...usuarios.map(u => u.id)) + 1 : 1
  const nuevoUsuario = { ...usuario, id: newId }
  usuarios.push(nuevoUsuario)
  localStorage.setItem(KEYS.USERS, JSON.stringify(usuarios))
  return nuevoUsuario
}

export function actualizarUsuario(id: number, datos: Partial<Usuario>): Usuario | null {
  const usuarios = getUsuarios()
  const index = usuarios.findIndex(u => u.id === id)
  if (index === -1) return null
  usuarios[index] = { ...usuarios[index], ...datos }
  localStorage.setItem(KEYS.USERS, JSON.stringify(usuarios))
  return usuarios[index]
}

export function eliminarUsuario(id: number): boolean {
  const usuarios = getUsuarios()
  const filtered = usuarios.filter(u => u.id !== id)
  if (filtered.length === usuarios.length) return false
  localStorage.setItem(KEYS.USERS, JSON.stringify(filtered))
  return true
}

// ============ EMPRESAS ============

export function getEmpresas(): Empresa[] {
  if (typeof window === 'undefined') return []
  const data = localStorage.getItem(KEYS.COMPANIES)
  return data ? JSON.parse(data) : []
}

export function getEmpresa(id: number): Empresa | undefined {
  return getEmpresas().find(e => e.id === id)
}

export function crearEmpresa(empresa: Omit<Empresa, 'id'>): Empresa {
  const empresas = getEmpresas()
  const newId = empresas.length > 0 ? Math.max(...empresas.map(e => e.id)) + 1 : 1
  const nuevaEmpresa = { ...empresa, id: newId }
  empresas.push(nuevaEmpresa)
  localStorage.setItem(KEYS.COMPANIES, JSON.stringify(empresas))
  return nuevaEmpresa
}

export function actualizarEmpresa(id: number, datos: Partial<Empresa>): Empresa | null {
  const empresas = getEmpresas()
  const index = empresas.findIndex(e => e.id === id)
  if (index === -1) return null
  empresas[index] = { ...empresas[index], ...datos }
  localStorage.setItem(KEYS.COMPANIES, JSON.stringify(empresas))
  return empresas[index]
}

export function eliminarEmpresa(id: number): boolean {
  const empresas = getEmpresas()
  const filtered = empresas.filter(e => e.id !== id)
  if (filtered.length === empresas.length) return false
  localStorage.setItem(KEYS.COMPANIES, JSON.stringify(filtered))
  return true
}

// ============ ROLES ============

export function getRoles(): Rol[] {
  if (typeof window === 'undefined') return []
  const data = localStorage.getItem(KEYS.ROLES)
  return data ? JSON.parse(data) : DEFAULT_ROLES
}

export function getRol(id: number): Rol | undefined {
  return getRoles().find(r => r.id === id)
}

export function crearRol(rol: Omit<Rol, 'id'>): Rol {
  const roles = getRoles()
  const newId = roles.length > 0 ? Math.max(...roles.map(r => r.id)) + 1 : 1
  const nuevoRol = { ...rol, id: newId }
  roles.push(nuevoRol)
  localStorage.setItem(KEYS.ROLES, JSON.stringify(roles))
  return nuevoRol
}

export function actualizarRol(id: number, datos: Partial<Rol>): Rol | null {
  const roles = getRoles()
  const index = roles.findIndex(r => r.id === id)
  if (index === -1) return null
  roles[index] = { ...roles[index], ...datos }
  localStorage.setItem(KEYS.ROLES, JSON.stringify(roles))
  return roles[index]
}

export function eliminarRol(id: number): boolean {
  const roles = getRoles()
  const filtered = roles.filter(r => r.id !== id)
  if (filtered.length === roles.length) return false
  localStorage.setItem(KEYS.ROLES, JSON.stringify(filtered))
  return true
}

// ============ TAREAS ============

export function getTareas(): Tarea[] {
  if (typeof window === 'undefined') return []
  const data = localStorage.getItem(KEYS.TASKS)
  const tareas = data ? JSON.parse(data) : []
  // Migrar tareas antiguas sin requiereEvidencia
  return tareas.map((t: Tarea) => ({
    ...t,
    requiereEvidencia: t.requiereEvidencia ?? false,
    empresaId: t.empresaId ?? null,
  }))
}

export function getTarea(id: number): Tarea | undefined {
  return getTareas().find(t => t.id === id)
}

export function getTareasPorEmpresa(empresaId: number): Tarea[] {
  return getTareas().filter(t => t.empresaId === empresaId)
}

export function getTareasPorUsuario(usuarioId: number): Tarea[] {
  return getTareas().filter(t => t.usuarioAsignadoId === usuarioId)
}

export function crearTarea(tarea: Omit<Tarea, 'id'>): Tarea {
  const tareas = getTareas()
  const newId = tareas.length > 0 ? Math.max(...tareas.map(t => t.id)) + 1 : 1
  const nuevaTarea = { ...tarea, id: newId }
  tareas.push(nuevaTarea)
  localStorage.setItem(KEYS.TASKS, JSON.stringify(tareas))
  return nuevaTarea
}

export function actualizarTarea(id: number, datos: Partial<Tarea>): Tarea | null {
  const tareas = getTareas()
  const index = tareas.findIndex(t => t.id === id)
  if (index === -1) return null
  tareas[index] = { ...tareas[index], ...datos }
  localStorage.setItem(KEYS.TASKS, JSON.stringify(tareas))
  return tareas[index]
}

export function eliminarTarea(id: number): boolean {
  const tareas = getTareas()
  const filtered = tareas.filter(t => t.id !== id)
  if (filtered.length === tareas.length) return false
  localStorage.setItem(KEYS.TASKS, JSON.stringify(filtered))
  return true
}

// ============ DOCUMENTOS ============

export function getDocumentos(): Documento[] {
  if (typeof window === 'undefined') return []
  const data = localStorage.getItem(KEYS.DOCUMENTS)
  const docs = data ? JSON.parse(data) : []
  // Migrar documentos antiguos
  return docs.map((d: Documento) => ({
    ...d,
    usuarioId: d.usuarioId ?? 0,
    empresaId: d.empresaId ?? null,
    fileBase64: d.fileBase64 ?? '',
    latitud: d.latitud ?? 0,
    longitud: d.longitud ?? 0,
    timestamp: d.timestamp ?? d.fechaSubida,
  }))
}

export function getDocumento(id: number): Documento | undefined {
  return getDocumentos().find(d => d.id === id)
}

export function getDocumentosPorTarea(tareaId: number): Documento[] {
  return getDocumentos().filter(d => d.tareaId === tareaId)
}

export function getDocumentosPorEmpresa(empresaId: number): Documento[] {
  return getDocumentos().filter(d => d.empresaId === empresaId)
}

export function getDocumentosPorUsuario(usuarioId: number): Documento[] {
  return getDocumentos().filter(d => d.usuarioId === usuarioId)
}

export function crearDocumento(documento: Omit<Documento, 'id'>): Documento {
  const documentos = getDocumentos()
  const newId = documentos.length > 0 ? Math.max(...documentos.map(d => d.id)) + 1 : 1
  const nuevoDocumento = { ...documento, id: newId }
  documentos.push(nuevoDocumento)
  localStorage.setItem(KEYS.DOCUMENTS, JSON.stringify(documentos))
  return nuevoDocumento
}

export function eliminarDocumento(id: number): boolean {
  const documentos = getDocumentos()
  const filtered = documentos.filter(d => d.id !== id)
  if (filtered.length === documentos.length) return false
  localStorage.setItem(KEYS.DOCUMENTS, JSON.stringify(filtered))
  return true
}

export function tareaRequiereEvidenciaYNoTiene(tareaId: number): boolean {
  const tarea = getTarea(tareaId)
  if (!tarea || !tarea.requiereEvidencia) return false
  const docs = getDocumentosPorTarea(tareaId)
  return docs.length === 0
}

// ============ SESIÓN ============

export function getSesion(): Sesion | null {
  if (typeof window === 'undefined') return null
  const data = localStorage.getItem(KEYS.SESSION)
  return data ? JSON.parse(data) : null
}

export function iniciarSesion(username: string, password: string): Sesion | null {
  const usuarios = getUsuarios()
  const usuario = usuarios.find(u => u.username === username && u.password === password)
  if (!usuario) return null

  const sesion: Sesion = {
    userId: usuario.id,
    username: usuario.username,
    rol: usuario.rol as RolSistema,
    empresaId: usuario.empresaId,
    nombre: usuario.nombre,
  }
  localStorage.setItem(KEYS.SESSION, JSON.stringify(sesion))
  return sesion
}

export function cerrarSesion(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(KEYS.SESSION)
}