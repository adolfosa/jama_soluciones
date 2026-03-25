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
import { getDocumentos, crearDocumento, eliminarDocumento, getTareas } from '@/lib/storage'
import { Documento, Tarea } from '@/lib/types'
import { Plus, Trash2, FileText, Upload, File, FileImage, FileArchive } from 'lucide-react'
import { toast } from 'sonner'

const tipoIconos: Record<string, React.ComponentType<{ className?: string }>> = {
  pdf: FileText,
  image: FileImage,
  zip: FileArchive,
  default: File,
}

const getTipoIcono = (tipo: string) => {
  if (tipo.includes('pdf')) return tipoIconos.pdf
  if (tipo.includes('image') || tipo.includes('jpg') || tipo.includes('png')) return tipoIconos.image
  if (tipo.includes('zip') || tipo.includes('rar')) return tipoIconos.zip
  return tipoIconos.default
}

export function Documentos() {
  const [documentos, setDocumentos] = useState<Documento[]>([])
  const [tareas, setTareas] = useState<Tarea[]>([])
  const [modalAbierto, setModalAbierto] = useState(false)
  const [formData, setFormData] = useState({
    nombre: '',
    tareaId: 0,
    tipo: '',
  })

  useEffect(() => {
    setDocumentos(getDocumentos())
    setTareas(getTareas())
  }, [])

  const resetForm = () => {
    setFormData({ nombre: '', tareaId: 0, tipo: '' })
  }

  const cerrarModal = () => {
    setModalAbierto(false)
    resetForm()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData({
        ...formData,
        nombre: file.name,
        tipo: file.type || 'application/octet-stream',
      })
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.nombre || !formData.tareaId) {
      toast.error('Por favor selecciona un archivo y una tarea')
      return
    }

    crearDocumento({
      nombre: formData.nombre,
      tareaId: formData.tareaId,
      tipo: formData.tipo,
      fechaSubida: new Date().toISOString(),
    })

    toast.success('Documento adjuntado correctamente')
    setDocumentos(getDocumentos())
    cerrarModal()
  }

  const handleEliminar = (id: number) => {
    if (confirm('¿Estas seguro de eliminar este documento?')) {
      eliminarDocumento(id)
      setDocumentos(getDocumentos())
      toast.success('Documento eliminado correctamente')
    }
  }

  const getTareaTitulo = (id: number) => {
    const tarea = tareas.find(t => t.id === id)
    return tarea?.titulo || 'Tarea no encontrada'
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Documentos / Evidencias</h2>
          <p className="text-muted-foreground">Gestiona los documentos adjuntos a tareas</p>
        </div>
        <Button onClick={() => setModalAbierto(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Adjuntar Documento
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listado de Documentos</CardTitle>
          <CardDescription>Total: {documentos.length} documentos adjuntados</CardDescription>
        </CardHeader>
        <CardContent>
          {documentos.length === 0 ? (
            <Empty>
              <EmptyMedia variant="icon">
                <FileText className="h-6 w-6" />
              </EmptyMedia>
              <EmptyTitle>No hay documentos</EmptyTitle>
              <EmptyDescription>
                Comienza adjuntando tu primer documento a una tarea
              </EmptyDescription>
              <Button onClick={() => setModalAbierto(true)} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Adjuntar Documento
              </Button>
            </Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Archivo</TableHead>
                  <TableHead>Tarea Asociada</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Fecha de Subida</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documentos.map((documento) => {
                  const Icono = getTipoIcono(documento.tipo)
                  return (
                    <TableRow key={documento.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Icono className="h-5 w-5 text-muted-foreground" />
                          <span className="font-medium">{documento.nombre}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getTareaTitulo(documento.tareaId)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{documento.tipo.split('/').pop()}</Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(documento.fechaSubida).toLocaleDateString('es-CL', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleEliminar(documento.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Resumen por Tarea */}
      <Card>
        <CardHeader>
          <CardTitle>Documentos por Tarea</CardTitle>
          <CardDescription>Resumen de documentos adjuntos a cada tarea</CardDescription>
        </CardHeader>
        <CardContent>
          {tareas.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay tareas creadas
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {tareas.map((tarea) => {
                const docsCount = documentos.filter(d => d.tareaId === tarea.id).length
                return (
                  <div
                    key={tarea.id}
                    className="p-3 rounded-lg border flex items-center justify-between"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{tarea.titulo}</p>
                      <p className="text-xs text-muted-foreground">
                        {docsCount} documento{docsCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <Badge variant={docsCount > 0 ? 'default' : 'secondary'}>
                      {docsCount}
                    </Badge>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Adjuntar Documento */}
      <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjuntar Documento</DialogTitle>
            <DialogDescription>
              Selecciona un archivo y asocialo a una tarea (simulado - solo guarda metadatos)
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-4 py-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="archivo">Archivo *</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="archivo"
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('archivo')?.click()}
                    className="w-full"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {formData.nombre || 'Seleccionar archivo'}
                  </Button>
                </div>
                {formData.nombre && (
                  <p className="text-xs text-muted-foreground">
                    Archivo seleccionado: {formData.nombre}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="tarea">Tarea Asociada *</Label>
                <Select
                  value={formData.tareaId?.toString() || ''}
                  onValueChange={(value) => setFormData({ ...formData, tareaId: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una tarea" />
                  </SelectTrigger>
                  <SelectContent>
                    {tareas.length === 0 ? (
                      <SelectItem value="0" disabled>
                        No hay tareas disponibles
                      </SelectItem>
                    ) : (
                      tareas.map((tarea) => (
                        <SelectItem key={tarea.id} value={tarea.id.toString()}>
                          {tarea.titulo}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={cerrarModal}>
                Cancelar
              </Button>
              <Button type="submit" disabled={tareas.length === 0}>
                Adjuntar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
