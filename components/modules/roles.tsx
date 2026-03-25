'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Empty, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { getRoles, crearRol, actualizarRol, eliminarRol } from '@/lib/storage'
import { Rol } from '@/lib/types'
import { Plus, Pencil, Trash2, Shield } from 'lucide-react'
import { toast } from 'sonner'

/* ======================================================
   MAPA DE PERMISOS (TÉCNICO → VISUAL)
====================================================== */

const PERMISOS_LABELS: Record<string, string> = {
  VER_DASHBOARD: 'Ver Dashboard',
  VER_EMPRESAS: 'Ver Empresas',
  GESTIONAR_EMPRESAS: 'Gestionar Empresas',
  VER_USUARIOS: 'Ver Usuarios',
  GESTIONAR_USUARIOS: 'Gestionar Usuarios',
  VER_ROLES: 'Ver Roles',
  GESTIONAR_ROLES: 'Gestionar Roles',
  VER_TAREAS: 'Ver Tareas',
  VER_TAREAS_PROPIAS: 'Ver Tareas Propias',
  GESTIONAR_TAREAS: 'Gestionar Tareas',
  ASIGNAR_TAREAS: 'Asignar Tareas',
  VER_MAPA: 'Ver Mapa',
  VER_DOCUMENTOS: 'Ver Documentos',
  VER_DOCUMENTOS_PROPIOS: 'Ver Documentos Propios',
  SUBIR_DOCUMENTOS: 'Subir Documentos',
  GESTIONAR_DOCUMENTOS: 'Gestionar Documentos',
}

/* ======================================================
   PERMISOS DISPONIBLES PARA SELECCIÓN
====================================================== */

const PERMISOS_DISPONIBLES = [
  { id: 'VER_DASHBOARD', label: 'Ver Dashboard' },
  { id: 'VER_EMPRESAS', label: 'Ver Empresas' },
  { id: 'GESTIONAR_EMPRESAS', label: 'Gestionar Empresas' },
  { id: 'VER_USUARIOS', label: 'Ver Usuarios' },
  { id: 'GESTIONAR_USUARIOS', label: 'Gestionar Usuarios' },
  { id: 'VER_ROLES', label: 'Ver Roles' },
  { id: 'GESTIONAR_ROLES', label: 'Gestionar Roles' },
  { id: 'VER_TAREAS', label: 'Ver Tareas' },
  { id: 'VER_TAREAS_PROPIAS', label: 'Ver Tareas Propias' },
  { id: 'GESTIONAR_TAREAS', label: 'Gestionar Tareas' },
  { id: 'ASIGNAR_TAREAS', label: 'Asignar Tareas' },
  { id: 'VER_MAPA', label: 'Ver Mapa' },
  { id: 'VER_DOCUMENTOS', label: 'Ver Documentos' },
  { id: 'VER_DOCUMENTOS_PROPIOS', label: 'Ver Documentos Propios' },
  { id: 'SUBIR_DOCUMENTOS', label: 'Subir Documentos' },
  { id: 'GESTIONAR_DOCUMENTOS', label: 'Gestionar Documentos' },
]

export function Roles() {
  const [roles, setRoles] = useState<Rol[]>([])
  const [modalAbierto, setModalAbierto] = useState(false)
  const [rolEditando, setRolEditando] = useState<Rol | null>(null)
  const [formData, setFormData] = useState({
    nombre: '',
    permisos: [] as string[],
  })

  useEffect(() => {
    setRoles(getRoles())
  }, [])

  const resetForm = () => {
    setFormData({ nombre: '', permisos: [] })
    setRolEditando(null)
  }

  const abrirModal = (rol?: Rol) => {
    if (rol) {
      setRolEditando(rol)
      setFormData({
        nombre: rol.nombre,
        permisos: rol.permisos,
      })
    } else {
      resetForm()
    }
    setModalAbierto(true)
  }

  const cerrarModal = () => {
    setModalAbierto(false)
    resetForm()
  }

  const handlePermisoChange = (permisoId: string, checked: boolean) => {
    if (checked) {
      setFormData({ ...formData, permisos: [...formData.permisos, permisoId] })
    } else {
      setFormData({ ...formData, permisos: formData.permisos.filter(p => p !== permisoId) })
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.nombre) {
      toast.error('El nombre del rol es requerido')
      return
    }

    if (rolEditando) {
      actualizarRol(rolEditando.id, formData)
      toast.success('Rol actualizado correctamente')
    } else {
      crearRol(formData)
      toast.success('Rol creado correctamente')
    }

    setRoles(getRoles())
    cerrarModal()
  }

  const handleEliminar = (id: number) => {
    const rol = roles.find(r => r.id === id)

    if (rol?.nombre === 'SUPERADMIN') {
      toast.error('No puedes eliminar el rol SUPERADMIN')
      return
    }

    if (confirm('¿Estás seguro de eliminar este rol?')) {
      eliminarRol(id)
      setRoles(getRoles())
      toast.success('Rol eliminado correctamente')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Roles / Perfiles</h2>
          <p className="text-muted-foreground">Gestiona los roles y permisos del sistema</p>
        </div>
        <Button onClick={() => abrirModal()}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Rol
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listado de Roles</CardTitle>
          <CardDescription>Total: {roles.length} roles configurados</CardDescription>
        </CardHeader>

        <CardContent>
          {roles.length === 0 ? (
            <Empty>
              <EmptyMedia variant="icon">
                <Shield className="h-6 w-6" />
              </EmptyMedia>
              <EmptyTitle>No hay roles</EmptyTitle>
              <EmptyDescription>
                Comienza creando tu primer rol
              </EmptyDescription>
              <Button onClick={() => abrirModal()} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Crear Rol
              </Button>
            </Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Permisos</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {roles.map((rol) => (
                  <TableRow key={rol.id}>
                    <TableCell className="font-medium">{rol.nombre}</TableCell>

                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {rol.permisos.includes('*') ? (
                          <Badge variant="default">Todos los permisos</Badge>
                        ) : (
                          rol.permisos.map((permiso) => (
                            <Badge key={permiso} variant="secondary">
                              {PERMISOS_LABELS[permiso] || permiso}
                            </Badge>
                          ))
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => abrirModal(rol)}
                          disabled={rol.nombre === 'SUPERADMIN'}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEliminar(rol.id)}
                          disabled={rol.nombre === 'SUPERADMIN'}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* MODAL */}
      <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{rolEditando ? 'Editar Rol' : 'Nuevo Rol'}</DialogTitle>
            <DialogDescription>
              {rolEditando
                ? 'Modifica los datos del rol'
                : 'Completa los datos para crear un nuevo rol'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-4 py-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="nombre">Nombre del Rol *</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) =>
                    setFormData({ ...formData, nombre: e.target.value })
                  }
                  placeholder="Administrador"
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label>Permisos</Label>

                <div className="grid grid-cols-2 gap-3 p-3 border rounded-lg">
                  {PERMISOS_DISPONIBLES.map((permiso) => (
                    <div key={permiso.id} className="flex items-center gap-2">
                      <Checkbox
                        id={permiso.id}
                        checked={formData.permisos.includes(permiso.id)}
                        onCheckedChange={(checked) =>
                          handlePermisoChange(permiso.id, checked as boolean)
                        }
                      />

                      <Label
                        htmlFor={permiso.id}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {permiso.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={cerrarModal}>
                Cancelar
              </Button>
              <Button type="submit">
                {rolEditando ? 'Guardar Cambios' : 'Crear Rol'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}