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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { getTareas, crearTarea, actualizarTarea, eliminarTarea, getUsuarios, getEmpresas, getDocumentosPorTarea, getDocumentos } from '@/lib/storage'
import { puedeGestionarTareas, puedeAsignarTareas, soloVerPropiasTareas, puedeVerTodasEmpresas } from '@/lib/permissions'
import { Tarea, Usuario, Empresa, Sesion, Documento } from '@/lib/types'
import { Plus, Pencil, Trash2, CheckSquare, AlertTriangle, FileText, Eye, Download, X, FolderOpen } from 'lucide-react'
import { toast } from 'sonner'

interface TareasProps {
  sesion: Sesion
}

const estadoColors: Record<string, string> = {
  pendiente: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 transition-colors',
  en_progreso: 'bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors',
  completada: 'bg-green-100 text-green-800 hover:bg-green-200 transition-colors',
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
  const [hoveredButton, setHoveredButton] = useState<string | null>(null)
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
    <TooltipProvider>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Tareas</h2>
            <p className="text-muted-foreground">
              {soloVerPropiasTareas(sesion.rol) ? 'Tus tareas asignadas' : 'Gestiona las tareas del sistema'}
            </p>
          </div>
          {puedeGestionar && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={() => abrirModal()} className="shadow-sm hover:shadow-md transition-all duration-200">
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Tarea
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Crear una nueva tarea</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
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
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold">Título</TableHead>
                      {esSuperAdmin && <TableHead className="font-semibold">Empresa</TableHead>}
                      <TableHead className="font-semibold">Asignado a</TableHead>
                      <TableHead className="font-semibold">Estado</TableHead>
                      <TableHead className="font-semibold">Evidencia</TableHead>
                      <TableHead className="font-semibold">Fecha Inicio</TableHead>
                      {(puedeGestionar || puedeAsignar) && <TableHead className="text-right font-semibold">Acciones</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tareas.map((tarea, index) => {
                      const docsCount = getDocumentosCount(tarea.id)
                      const necesitaEvidencia = tarea.requiereEvidencia && docsCount === 0
                      
                      return (
                        <TableRow 
                          key={tarea.id} 
                          className="hover:bg-muted/30 transition-colors duration-150"
                          style={{
                            animationDelay: `${index * 50}ms`,
                            animation: 'fadeIn 0.3s ease-out forwards'
                          }}
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{tarea.titulo}</span>
                              {necesitaEvidencia && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <AlertTriangle className="h-4 w-4 text-orange-500 animate-pulse" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Esta tarea requiere evidencia documental</p>
                                  </TooltipContent>
                                </Tooltip>
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
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className={`
                                      h-8 w-8 p-0 rounded-full 
                                      transition-all duration-200 
                                      hover:scale-110 hover:bg-primary/10
                                      ${docsCount > 0 ? 'hover:text-primary' : 'hover:text-muted-foreground'}
                                    `}
                                    onClick={() => handleVerDocumentos(tarea)}
                                    onMouseEnter={() => setHoveredButton(`doc-${tarea.id}`)}
                                    onMouseLeave={() => setHoveredButton(null)}
                                  >
                                    <Eye 
                                      className={`
                                        h-4 w-4 transition-all duration-200
                                        ${hoveredButton === `doc-${tarea.id}` ? 'scale-110' : 'scale-100'}
                                        ${docsCount > 0 ? 'text-primary' : 'text-muted-foreground'}
                                      `} 
                                    />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{docsCount > 0 ? `Ver ${docsCount} documento${docsCount !== 1 ? 's' : ''} adjunto${docsCount !== 1 ? 's' : ''}` : 'No hay documentos adjuntos'}</p>
                                </TooltipContent>
                              </Tooltip>
                              <span className="text-sm font-medium">{docsCount}</span>
                              {tarea.requiereEvidencia && (
                                <Badge variant="outline" className="ml-1 text-xs bg-orange-50 text-orange-700 border-orange-200">
                                  Requerida
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(tarea.fechaInicio).toLocaleDateString('es-CL')}
                          </TableCell>
                          {(puedeGestionar || puedeAsignar) && (
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      className="h-8 w-8 p-0 rounded-full hover:scale-110 transition-all duration-200 hover:bg-blue-100"
                                      onClick={() => abrirModal(tarea)}
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Editar tarea</p>
                                  </TooltipContent>
                                </Tooltip>
                                {puedeGestionar && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        className="h-8 w-8 p-0 rounded-full hover:scale-110 transition-all duration-200 hover:bg-red-100"
                                        onClick={() => handleEliminar(tarea.id)}
                                      >
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Eliminar tarea</p>
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal de Documentos de la Tarea - Mejorado */}
        <Dialog open={documentosModalAbierto} onOpenChange={setDocumentosModalAbierto}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto shadow-xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-primary" />
                Documentos Adjuntos
              </DialogTitle>
              <DialogDescription className="text-base font-medium text-foreground">
                Tarea: {tareaSeleccionada?.titulo}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              {documentosTarea.length === 0 ? (
                <div className="text-center p-12 bg-gradient-to-b from-muted/50 to-muted rounded-lg border-2 border-dashed">
                  <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                  <p className="text-muted-foreground font-medium">No hay documentos adjuntos</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Los documentos subidos aparecerán aquí
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-4 pb-2 border-b">
                    <h3 className="text-sm font-semibold text-muted-foreground">
                      {documentosTarea.length} documento{documentosTarea.length !== 1 ? 's' : ''} encontrado{documentosTarea.length !== 1 ? 's' : ''}
                    </h3>
                  </div>
                  {documentosTarea.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-all duration-200 hover:bg-muted/30 group"
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="p-2 rounded-lg bg-primary/10 group-hover:scale-110 transition-transform duration-200">
                          {getTipoIcono(doc.tipo)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate group-hover:text-primary transition-colors" title={doc.nombre}>
                            {doc.nombre.length > 35 ? `${doc.nombre.substring(0, 35)}...` : doc.nombre}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            <span className="inline-flex items-center gap-1">
                              👤 {getUsuarioDocumentoNombre(doc.usuarioId)}
                            </span>
                            <span className="mx-2">•</span>
                            <span className="inline-flex items-center gap-1">
                              📅 {new Date(doc.fechaSubida).toLocaleDateString('es-CL', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-9 w-9 p-0 rounded-full hover:scale-110 transition-all duration-200 hover:bg-primary/10"
                              onClick={() => handleVerDocumento(doc)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Ver documento</p>
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-9 w-9 p-0 rounded-full hover:scale-110 transition-all duration-200 hover:bg-green-100"
                              onClick={() => handleDescargarDocumento(doc)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Descargar documento</p>
                          </TooltipContent>
                        </Tooltip>
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

        {/* Modal de Visualización de Documento - Mejorado */}
        <Dialog open={previewModalAbierto} onOpenChange={setPreviewModalAbierto}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto shadow-xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                {documentoPreview?.nombre}
              </DialogTitle>
              <DialogDescription>
                Tipo: {documentoPreview?.tipo === 'image' ? '🖼️ Imagen' : documentoPreview?.tipo === 'pdf' ? '📄 PDF' : '📁 Documento'}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              {documentoPreview?.tipo === 'image' && documentoPreview.fileBase64 ? (
                <div className="flex justify-center bg-muted/30 rounded-lg p-4">
                  <img 
                    src={documentoPreview.fileBase64} 
                    alt={documentoPreview.nombre}
                    className="max-w-full max-h-[65vh] object-contain rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300"
                  />
                </div>
              ) : documentoPreview?.tipo === 'pdf' && documentoPreview.fileBase64 ? (
                <div className="w-full rounded-lg overflow-hidden shadow-lg">
                  <iframe
                    src={documentoPreview.fileBase64}
                    className="w-full h-[70vh] rounded-lg"
                    title={documentoPreview.nombre}
                  />
                </div>
              ) : documentoPreview?.fileBase64 ? (
                <div className="text-center p-12 bg-gradient-to-b from-muted/50 to-muted rounded-lg border-2 border-dashed">
                  <FileText className="h-20 w-20 mx-auto text-muted-foreground mb-4 opacity-50" />
                  <p className="text-muted-foreground mb-4">
                    Este tipo de archivo no se puede visualizar directamente
                  </p>
                  <Button onClick={() => handleDescargarDocumento(documentoPreview)} size="lg">
                    <Download className="h-5 w-5 mr-2" />
                    Descargar Archivo
                  </Button>
                </div>
              ) : (
                <div className="text-center p-12 bg-gradient-to-b from-muted/50 to-muted rounded-lg">
                  <FileText className="h-20 w-20 mx-auto text-muted-foreground mb-4 animate-pulse" />
                  <p className="text-muted-foreground">
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
          <DialogContent className="max-w-lg shadow-xl">
            <DialogHeader>
              <DialogTitle>{tareaEditando ? 'Editar Tarea' : 'Nueva Tarea'}</DialogTitle>
              <DialogDescription>
                {tareaEditando ? 'Modifica los datos de la tarea' : 'Completa los datos para crear una nueva tarea'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="flex flex-col gap-4 py-4 max-h-[60vh] overflow-y-auto">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="titulo">Título *</Label>
                  <Input
                    id="titulo"
                    value={formData.titulo}
                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                    placeholder="Título de la tarea"
                    required
                    className="transition-all focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="descripcion">Descripción</Label>
                  <Textarea
                    id="descripcion"
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    placeholder="Descripción detallada de la tarea"
                    rows={3}
                    className="transition-all focus:ring-2 focus:ring-primary"
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

                <div className="flex items-center gap-2 p-4 border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer">
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
                      La tarea no podrá completarse sin adjuntar documentos
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
    </TooltipProvider>
  )
}