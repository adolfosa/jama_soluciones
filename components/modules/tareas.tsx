'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
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
import { getTareas, crearTarea, actualizarTarea, eliminarTarea, getUsuarios, getEmpresas, getDocumentosPorTarea, getDocumentos } from '@/lib/storage'
import { puedeGestionarTareas, puedeAsignarTareas, soloVerPropiasTareas, puedeVerTodasEmpresas } from '@/lib/permissions'
import { Tarea, Usuario, Empresa, Sesion, Documento } from '@/lib/types'
import { Plus, Pencil, Trash2, CheckSquare, AlertTriangle, FileText, Eye, Download, X } from 'lucide-react'
import { toast } from 'sonner'

interface TareasProps {
  sesion: Sesion
}

const estadoColors: Record<string, string> = {
  pendiente: 'bg-yellow-100 text-yellow-800',
  en_progreso: 'bg-blue-100 text-blue-800',
  completada: 'bg-green-100 text-green-800',
}

const estadoLabels: Record<string, string> = {
  pendiente: 'Pendiente',
  en_progreso: 'En Progreso',
  completada: 'Completada',
}

export function Tareas({ sesion }: TareasProps) {
  const [tareas, setTareas] = useState<Tarea[]>([])
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [modalAbierto, setModalAbierto] = useState(false)
  const [tareaEditando, setTareaEditando] = useState<Tarea | null>(null)
  const [documentosModalAbierto, setDocumentosModalAbierto] = useState(false)
  const [tareaSeleccionada, setTareaSeleccionada] = useState<Tarea | null>(null)
  const [documentosTarea, setDocumentosTarea] = useState<Documento[]>([])
  const [previewModalAbierto, setPreviewModalAbierto] = useState(false)
  const [documentoPreview, setDocumentoPreview] = useState<Documento | null>(null)
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    usuarioAsignadoId: null as number | null,
    empresaId: null as number | null,
    estado: 'pendiente' as 'pendiente' | 'en_progreso' | 'completada',
    fechaInicio: '',
    fechaFin: '',
    coordenadas: undefined as { lat: number; lng: number } | undefined,
    requiereEvidencia: false,
  })

  const puedeGestionar = puedeGestionarTareas(sesion.rol)
  const puedeAsignar = puedeAsignarTareas(sesion.rol)
  const esSuperAdmin = puedeVerTodasEmpresas(sesion.rol)

  useEffect(() => {
    cargarDatos()
  }, [sesion])

  const cargarDatos = () => {
    let tareasData = getTareas()
    let usuariosData = getUsuarios()
    const empresasData = getEmpresas()

    // Filtrar por empresa si no es SUPERADMIN
    if (!esSuperAdmin && sesion.empresaId) {
      tareasData = tareasData.filter(t => t.empresaId === sesion.empresaId)
      usuariosData = usuariosData.filter(u => u.empresaId === sesion.empresaId)
    }

    // OPERADOR solo ve sus propias tareas
    if (soloVerPropiasTareas(sesion.rol)) {
      tareasData = tareasData.filter(t => t.usuarioAsignadoId === sesion.userId)
    }

    setTareas(tareasData)
    setUsuarios(usuariosData)
    setEmpresas(empresasData)
  }

  const resetForm = () => {
    const hoy = new Date().toISOString().split('T')[0]
    setFormData({
      titulo: '',
      descripcion: '',
      usuarioAsignadoId: null,
      empresaId: esSuperAdmin ? null : sesion.empresaId,
      estado: 'pendiente',
      fechaInicio: hoy,
      fechaFin: '',
      coordenadas: undefined,
      requiereEvidencia: false,
    })
    setTareaEditando(null)
  }

  const abrirModal = (tarea?: Tarea) => {
    if (tarea) {
      setTareaEditando(tarea)
      setFormData({
        titulo: tarea.titulo,
        descripcion: tarea.descripcion,
        usuarioAsignadoId: tarea.usuarioAsignadoId,
        empresaId: tarea.empresaId,
        estado: tarea.estado,
        fechaInicio: tarea.fechaInicio,
        fechaFin: tarea.fechaFin,
        coordenadas: tarea.coordenadas,
        requiereEvidencia: tarea.requiereEvidencia,
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
    
    if (!formData.titulo || !formData.fechaInicio) {
      toast.error('Por favor completa todos los campos requeridos')
      return
    }

    // Validar evidencia al completar tarea
    if (tareaEditando && formData.estado === 'completada' && tareaEditando.requiereEvidencia) {
      const docs = getDocumentosPorTarea(tareaEditando.id)
      if (docs.length === 0) {
        toast.error('Esta tarea requiere evidencia documental antes de completarse')
        return
      }
    }

    // Generar coordenadas aleatorias para simular ubicacion (Chile)
    const coordenadasAleatorias = {
      lat: -33.4489 + (Math.random() - 0.5) * 0.1,
      lng: -70.6693 + (Math.random() - 0.5) * 0.1,
    }

    const datosGuardar = {
      ...formData,
      empresaId: esSuperAdmin ? formData.empresaId : sesion.empresaId,
      coordenadas: formData.coordenadas || coordenadasAleatorias,
    }

    if (tareaEditando) {
      actualizarTarea(tareaEditando.id, datosGuardar)
      toast.success('Tarea actualizada correctamente')
    } else {
      crearTarea(datosGuardar)
      toast.success('Tarea creada correctamente')
    }

    cargarDatos()
    cerrarModal()
  }

  const handleEliminar = (id: number) => {
    if (confirm('¿Estas seguro de eliminar esta tarea?')) {
      eliminarTarea(id)
      cargarDatos()
      toast.success('Tarea eliminada correctamente')
    }
  }

  const handleVerDocumentos = (tarea: Tarea) => {
    const docs = getDocumentosPorTarea(tarea.id)
    setTareaSeleccionada(tarea)
    setDocumentosTarea(docs)
    setDocumentosModalAbierto(true)
  }

  const handleVerDocumento = (documento: Documento) => {
    setDocumentoPreview(documento)
    setPreviewModalAbierto(true)
  }

  const handleDescargarDocumento = (documento: Documento) => {
    if (documento.fileBase64) {
      const link = document.createElement('a')
      link.href = documento.fileBase64
      link.download = documento.nombre
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success(`Descargando: ${documento.nombre}`)
    } else {
      toast.error('No se pudo descargar el archivo')
    }
  }

  const getUsuarioNombre = (id: number | null) => {
    if (!id) return 'Sin asignar'
    const usuario = usuarios.find(u => u.id === id)
    return usuario?.nombre || 'No encontrado'
  }

  const getEmpresaNombre = (id: number | null) => {
    if (!id) return '-'
    const empresa = empresas.find(e => e.id === id)
    return empresa?.nombre || 'No encontrada'
  }

  const getDocumentosCount = (tareaId: number) => {
    return getDocumentosPorTarea(tareaId).length
  }

  const getUsuarioDocumentoNombre = (id: number) => {
    const usuario = usuarios.find(u => u.id === id)
    return usuario?.nombre || 'Usuario no encontrado'
  }

  const getTipoIcono = (tipo: string) => {
    switch (tipo) {
      case 'pdf': return <FileText className="h-5 w-5 text-red-500" />
      case 'image': return <FileText className="h-5 w-5 text-green-500" />
      default: return <FileText className="h-5 w-5 text-muted-foreground" />
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Tareas</h2>
          <p className="text-muted-foreground">
            {soloVerPropiasTareas(sesion.rol) ? 'Tus tareas asignadas' : 'Gestiona las tareas del sistema'}
          </p>
        </div>
        {puedeGestionar && (
          <Button onClick={() => abrirModal()}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Tarea
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listado de Tareas</CardTitle>
          <CardDescription>Total: {tareas.length} tareas</CardDescription>
        </CardHeader>
        <CardContent>
          {tareas.length === 0 ? (
            <Empty>
              <EmptyMedia variant="icon">
                <CheckSquare className="h-6 w-6" />
              </EmptyMedia>
              <EmptyTitle>No hay tareas</EmptyTitle>
              <EmptyDescription>
                {puedeGestionar ? 'Comienza creando tu primera tarea' : 'No tienes tareas asignadas'}
              </EmptyDescription>
              {puedeGestionar && (
                <Button onClick={() => abrirModal()} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Tarea
                </Button>
              )}
            </Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titulo</TableHead>
                  {esSuperAdmin && <TableHead>Empresa</TableHead>}
                  <TableHead>Asignado a</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Evidencia</TableHead>
                  <TableHead>Fecha Inicio</TableHead>
                  {(puedeGestionar || puedeAsignar) && <TableHead className="text-right">Acciones</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {tareas.map((tarea) => {
                  const docsCount = getDocumentosCount(tarea.id)
                  const necesitaEvidencia = tarea.requiereEvidencia && docsCount === 0
                  
                  return (
                    <TableRow key={tarea.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{tarea.titulo}</span>
                          {necesitaEvidencia && (
                            <AlertTriangle className="h-4 w-4 text-orange-500" />
                          )}
                        </div>
                      </TableCell>
                      {esSuperAdmin && <TableCell>{getEmpresaNombre(tarea.empresaId)}</TableCell>}
                      <TableCell>{getUsuarioNombre(tarea.usuarioAsignadoId)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={estadoColors[tarea.estado]}>
                          {estadoLabels[tarea.estado]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleVerDocumentos(tarea)}
                            title="Ver documentos adjuntos"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <span>{docsCount}</span>
                          {tarea.requiereEvidencia && (
                            <Badge variant="outline" className="ml-1 text-xs">
                              Requerida
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{new Date(tarea.fechaInicio).toLocaleDateString('es-CL')}</TableCell>
                      {(puedeGestionar || puedeAsignar) && (
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => abrirModal(tarea)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            {puedeGestionar && (
                              <Button variant="ghost" size="sm" onClick={() => handleEliminar(tarea.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal de Documentos de la Tarea */}
      <Dialog open={documentosModalAbierto} onOpenChange={setDocumentosModalAbierto}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Documentos Adjuntos</DialogTitle>
            <DialogDescription>
              Tarea: {tareaSeleccionada?.titulo}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {documentosTarea.length === 0 ? (
              <div className="text-center p-8 bg-muted rounded-lg">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No hay documentos adjuntos a esta tarea</p>
              </div>
            ) : (
              <div className="space-y-2">
                {documentosTarea.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {getTipoIcono(doc.tipo)}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate" title={doc.nombre}>
                          {doc.nombre}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Subido por: {getUsuarioDocumentoNombre(doc.usuarioId)} | 
                          Fecha: {new Date(doc.fechaSubida).toLocaleDateString('es-CL')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleVerDocumento(doc)}
                        title="Ver documento"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDescargarDocumento(doc)}
                        title="Descargar documento"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDocumentosModalAbierto(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Visualización de Documento */}
      <Dialog open={previewModalAbierto} onOpenChange={setPreviewModalAbierto}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{documentoPreview?.nombre}</DialogTitle>
            <DialogDescription>
              Tipo: {documentoPreview?.tipo === 'image' ? 'Imagen' : documentoPreview?.tipo === 'pdf' ? 'PDF' : 'Documento'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {documentoPreview?.tipo === 'image' && documentoPreview.fileBase64 ? (
              <div className="flex justify-center">
                <img 
                  src={documentoPreview.fileBase64} 
                  alt={documentoPreview.nombre}
                  className="max-w-full max-h-[60vh] object-contain rounded-lg"
                />
              </div>
            ) : documentoPreview?.tipo === 'pdf' && documentoPreview.fileBase64 ? (
              <div className="w-full">
                <iframe
                  src={documentoPreview.fileBase64}
                  className="w-full h-[60vh] rounded-lg border"
                  title={documentoPreview.nombre}
                />
              </div>
            ) : documentoPreview?.fileBase64 ? (
              <div className="text-center p-8 bg-muted rounded-lg">
                <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground mb-4">
                  Este archivo no se puede visualizar directamente
                </p>
                <Button onClick={() => handleDescargarDocumento(documentoPreview)}>
                  <Download className="h-4 w-4 mr-2" />
                  Descargar Archivo
                </Button>
              </div>
            ) : (
              <div className="text-center p-8 bg-muted rounded-lg">
                <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">
                  No se pudo cargar la vista previa
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewModalAbierto(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Crear/Editar Tarea */}
      <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{tareaEditando ? 'Editar Tarea' : 'Nueva Tarea'}</DialogTitle>
            <DialogDescription>
              {tareaEditando ? 'Modifica los datos de la tarea' : 'Completa los datos para crear una nueva tarea'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-4 py-4 max-h-[60vh] overflow-y-auto">
              <div className="flex flex-col gap-2">
                <Label htmlFor="titulo">Titulo *</Label>
                <Input
                  id="titulo"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  placeholder="Titulo de la tarea"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="descripcion">Descripcion</Label>
                <Textarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Descripcion detallada de la tarea"
                  rows={3}
                />
              </div>
              
              {esSuperAdmin && (
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
                      <SelectItem value="sin_empresa">Sin empresa</SelectItem>
                      {empresas.map((empresa) => (
                        <SelectItem key={empresa.id} value={empresa.id.toString()}>
                          {empresa.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <Label htmlFor="usuario">Asignar a</Label>
                <Select
                  value={formData.usuarioAsignadoId?.toString() || 'sin_asignar'}
                  onValueChange={(value) => setFormData({ ...formData, usuarioAsignadoId: value === 'sin_asignar' ? null : parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un usuario" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sin_asignar">Sin asignar</SelectItem>
                    {usuarios.map((usuario) => (
                      <SelectItem key={usuario.id} value={usuario.id.toString()}>
                        {usuario.nombre} ({usuario.rol})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex flex-col gap-2">
                <Label htmlFor="estado">Estado</Label>
                <Select
                  value={formData.estado}
                  onValueChange={(value: 'pendiente' | 'en_progreso' | 'completada') => setFormData({ ...formData, estado: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendiente">Pendiente</SelectItem>
                    <SelectItem value="en_progreso">En Progreso</SelectItem>
                    <SelectItem value="completada">Completada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="fechaInicio">Fecha Inicio *</Label>
                  <Input
                    id="fechaInicio"
                    type="date"
                    value={formData.fechaInicio}
                    onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })}
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="fechaFin">Fecha Fin</Label>
                  <Input
                    id="fechaFin"
                    type="date"
                    value={formData.fechaFin}
                    onChange={(e) => setFormData({ ...formData, fechaFin: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/50">
                <Checkbox
                  id="requiereEvidencia"
                  checked={formData.requiereEvidencia}
                  onCheckedChange={(checked) => setFormData({ ...formData, requiereEvidencia: checked === true })}
                />
                <div className="flex-1">
                  <Label htmlFor="requiereEvidencia" className="font-medium cursor-pointer">
                    Requiere evidencia documental
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    La tarea no podra completarse sin adjuntar documentos
                  </p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={cerrarModal}>
                Cancelar
              </Button>
              <Button type="submit">
                {tareaEditando ? 'Guardar Cambios' : 'Crear Tarea'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}