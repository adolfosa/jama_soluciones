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
import { getEmpresas, crearEmpresa, actualizarEmpresa, eliminarEmpresa } from '@/lib/storage'
import { Empresa } from '@/lib/types'
import { Plus, Pencil, Trash2, Building2 } from 'lucide-react'
import { toast } from 'sonner'

export function Empresas() {
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [modalAbierto, setModalAbierto] = useState(false)
  const [empresaEditando, setEmpresaEditando] = useState<Empresa | null>(null)
  const [formData, setFormData] = useState({
    nombre: '',
    rut: '',
    estado: 'activa' as 'activa' | 'inactiva',
  })

  useEffect(() => {
    setEmpresas(getEmpresas())
  }, [])

  const resetForm = () => {
    setFormData({ nombre: '', rut: '', estado: 'activa' })
    setEmpresaEditando(null)
  }

  const abrirModal = (empresa?: Empresa) => {
    if (empresa) {
      setEmpresaEditando(empresa)
      setFormData({
        nombre: empresa.nombre,
        rut: empresa.rut,
        estado: empresa.estado,
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
    
    if (!formData.nombre || !formData.rut) {
      toast.error('Por favor completa todos los campos requeridos')
      return
    }

    if (empresaEditando) {
      actualizarEmpresa(empresaEditando.id, formData)
      toast.success('Empresa actualizada correctamente')
    } else {
      crearEmpresa(formData)
      toast.success('Empresa creada correctamente')
    }

    setEmpresas(getEmpresas())
    cerrarModal()
  }

  const handleEliminar = (id: number) => {
    if (confirm('¿Estas seguro de eliminar esta empresa?')) {
      eliminarEmpresa(id)
      setEmpresas(getEmpresas())
      toast.success('Empresa eliminada correctamente')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Empresas</h2>
          <p className="text-muted-foreground">Gestiona las empresas del sistema</p>
        </div>
        <Button onClick={() => abrirModal()}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Empresa
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listado de Empresas</CardTitle>
          <CardDescription>Total: {empresas.length} empresas registradas</CardDescription>
        </CardHeader>
        <CardContent>
          {empresas.length === 0 ? (
            <Empty>
              <EmptyMedia variant="icon">
                <Building2 className="h-6 w-6" />
              </EmptyMedia>
              <EmptyTitle>No hay empresas</EmptyTitle>
              <EmptyDescription>
                Comienza creando tu primera empresa
              </EmptyDescription>
              <Button onClick={() => abrirModal()} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Crear Empresa
              </Button>
            </Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>RUT</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {empresas.map((empresa) => (
                  <TableRow key={empresa.id}>
                    <TableCell className="font-medium">{empresa.nombre}</TableCell>
                    <TableCell>{empresa.rut}</TableCell>
                    <TableCell>
                      <Badge variant={empresa.estado === 'activa' ? 'default' : 'secondary'}>
                        {empresa.estado === 'activa' ? 'Activa' : 'Inactiva'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => abrirModal(empresa)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleEliminar(empresa.id)}>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{empresaEditando ? 'Editar Empresa' : 'Nueva Empresa'}</DialogTitle>
            <DialogDescription>
              {empresaEditando ? 'Modifica los datos de la empresa' : 'Completa los datos para crear una nueva empresa'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-4 py-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="nombre">Nombre *</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Nombre de la empresa"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="rut">RUT *</Label>
                <Input
                  id="rut"
                  value={formData.rut}
                  onChange={(e) => setFormData({ ...formData, rut: e.target.value })}
                  placeholder="12.345.678-9"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="estado">Estado</Label>
                <Select
                  value={formData.estado}
                  onValueChange={(value: 'activa' | 'inactiva') => setFormData({ ...formData, estado: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="activa">Activa</SelectItem>
                    <SelectItem value="inactiva">Inactiva</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={cerrarModal}>
                Cancelar
              </Button>
              <Button type="submit">
                {empresaEditando ? 'Guardar Cambios' : 'Crear Empresa'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
