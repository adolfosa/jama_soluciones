'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Empty, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getUsuarios, crearUsuario, actualizarUsuario, eliminarUsuario, getEmpresas, getRoles } from '@/lib/storage'
import { Usuario, Empresa, Rol } from '@/lib/types'
import { Plus, Pencil, Trash2, Users } from 'lucide-react'
import { toast } from 'sonner'

export function Usuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [roles, setRoles] = useState<Rol[]>([])
  const [modalAbierto, setModalAbierto] = useState(false)
  const [usuarioEditando, setUsuarioEditando] = useState<Usuario | null>(null)
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    nombre: '',
    rut: '',
    email: '',
    rol: '',
    empresaId: null as number | null,
  })

  useEffect(() => {
    setUsuarios(getUsuarios())
    setEmpresas(getEmpresas())
    setRoles(getRoles())
  }, [])

  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      nombre: '',
      rut: '',
      email: '',
      rol: '',
      empresaId: null,
    })
    setUsuarioEditando(null)
  }

  const abrirModal = (usuario?: Usuario) => {
    if (usuario) {
      setUsuarioEditando(usuario)
      setFormData({
        username: usuario.username,
        password: '',
        nombre: usuario.nombre,
        rut: usuario.rut,
        email: usuario.email,
        rol: usuario.rol,
        empresaId: usuario.empresaId,
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.username || !formData.nombre || !formData.rol) {
      toast.error('Por favor completa todos los campos requeridos')
      return
    }

    if (!usuarioEditando && !formData.password) {
      toast.error('La contraseña es requerida para nuevos usuarios')
      return
    }

    if (usuarioEditando) {
      const datosActualizar = formData.password 
        ? formData 
        : { ...formData, password: usuarioEditando.password }
      actualizarUsuario(usuarioEditando.id, datosActualizar)
      toast.success('Usuario actualizado correctamente')
    } else {
      crearUsuario(formData)
      toast.success('Usuario creado correctamente')
    }

    setUsuarios(getUsuarios())
    cerrarModal()
  }

  const handleEliminar = (id: number) => {
    const usuario = usuarios.find(u => u.id === id)
    if (usuario?.rol === 'SUPERADMIN') {
      toast.error('No puedes eliminar al usuario SUPERADMIN')
      return
    }
    if (confirm('¿Estas seguro de eliminar este usuario?')) {
      eliminarUsuario(id)
      setUsuarios(getUsuarios())
      toast.success('Usuario eliminado correctamente')
    }
  }

  const getEmpresaNombre = (id: number | null) => {
    if (!id) return 'Sin asignar'
    const empresa = empresas.find(e => e.id === id)
    return empresa?.nombre || 'No encontrada'
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Usuarios</h2>
          <p className="text-muted-foreground">Gestiona los usuarios del sistema</p>
        </div>
        <Button onClick={() => abrirModal()}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Usuario
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listado de Usuarios</CardTitle>
          <CardDescription>Total: {usuarios.length} usuarios registrados</CardDescription>
        </CardHeader>
        <CardContent>
          {usuarios.length === 0 ? (
            <Empty>
              <EmptyMedia variant="icon">
                <Users className="h-6 w-6" />
              </EmptyMedia>
              <EmptyTitle>No hay usuarios</EmptyTitle>
              <EmptyDescription>
                Comienza creando tu primer usuario
              </EmptyDescription>
              <Button onClick={() => abrirModal()} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Crear Usuario
              </Button>
            </Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usuarios.map((usuario) => (
                  <TableRow key={usuario.id}>
                    <TableCell className="font-medium">{usuario.username}</TableCell>
                    <TableCell>{usuario.nombre}</TableCell>
                    <TableCell>{usuario.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{usuario.rol}</Badge>
                    </TableCell>
                    <TableCell>{getEmpresaNombre(usuario.empresaId)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => abrirModal(usuario)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleEliminar(usuario.id)}
                          disabled={usuario.rol === 'SUPERADMIN'}
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

      {/* Modal Crear/Editar */}
      <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{usuarioEditando ? 'Editar Usuario' : 'Nuevo Usuario'}</DialogTitle>
            <DialogDescription>
              {usuarioEditando ? 'Modifica los datos del usuario' : 'Completa los datos para crear un nuevo usuario'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-4 py-4 max-h-[60vh] overflow-y-auto">
              <div className="flex flex-col gap-2">
                <Label htmlFor="username">Usuario *</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="nombre.usuario"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="password">
                  Contraseña {usuarioEditando ? '(dejar vacio para mantener)' : '*'}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="********"
                  required={!usuarioEditando}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="nombre">Nombre Completo *</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Juan Perez"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="rut">RUT</Label>
                <Input
                  id="rut"
                  value={formData.rut}
                  onChange={(e) => setFormData({ ...formData, rut: e.target.value })}
                  placeholder="12.345.678-9"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="usuario@empresa.cl"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="rol">Rol *</Label>
                <Select
                  value={formData.rol}
                  onValueChange={(value) => setFormData({ ...formData, rol: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un rol" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((rol) => (
                      <SelectItem key={rol.id} value={rol.nombre}>
                        {rol.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="empresa">Empresa</Label>
                <Select
                  value={formData.empresaId?.toString() || 'sin_empresa'}
                  onValueChange={(value) => setFormData({ ...formData, empresaId: value === 'sin_empresa' ? null : parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sin_empresa">Sin asignar</SelectItem>
                    {empresas.map((empresa) => (
                      <SelectItem key={empresa.id} value={empresa.id.toString()}>
                        {empresa.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={cerrarModal}>
                Cancelar
              </Button>
              <Button type="submit">
                {usuarioEditando ? 'Guardar Cambios' : 'Crear Usuario'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
