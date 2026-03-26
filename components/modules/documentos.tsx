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
import { getDocumentos, crearDocumento, eliminarDocumento, getTareas, getUsuario } from '@/lib/storage'
import { Documento, Tarea, Sesion } from '@/lib/types'
import { Plus, Trash2, FileText, Upload, File, FileImage, FileArchive, Download, Eye, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { puedeVerTodasEmpresas, soloVerPropiosDocumentos, puedeEliminarDocumentos } from '@/lib/permissions'

interface DocumentosProps {
  sesion: Sesion
}

const tipoIconos: Record<string, React.ComponentType<{ className?: string }>> = {
  pdf: FileText,
  image: FileImage,
  zip: FileArchive,
  default: File,
}

const getTipoIcono = (tipo: string) => {
  if (tipo === 'pdf') return tipoIconos.pdf
  if (tipo === 'image') return tipoIconos.image
  return tipoIconos.default
}

export function Documentos({ sesion }: DocumentosProps) {
  const [documentos, setDocumentos] = useState<Documento[]>([])
  const [tareas, setTareas] = useState<Tarea[]>([])
  const [modalAbierto, setModalAbierto] = useState(false)
  const [previewModalAbierto, setPreviewModalAbierto] = useState(false)
  const [documentoPreview, setDocumentoPreview] = useState<Documento | null>(null)
  const [subiendo, setSubiendo] = useState(false)
  const [archivoSeleccionado, setArchivoSeleccionado] = useState<File | null>(null)
  const [formData, setFormData] = useState({
    tareaId: 0,
  })

  const esSuperAdmin = puedeVerTodasEmpresas(sesion.rol)
  const soloPropios = soloVerPropiosDocumentos(sesion.rol)
  const puedeEliminar = puedeEliminarDocumentos(sesion.rol)

  useEffect(() => {
    cargarDatos()
  }, [sesion])

  const cargarDatos = () => {
    let documentosData = getDocumentos()
    let tareasData = getTareas()

    // Filtrar por empresa si no es SUPERADMIN
    if (!esSuperAdmin && sesion.empresaId) {
      documentosData = documentosData.filter(d => d.empresaId === sesion.empresaId)
      tareasData = tareasData.filter(t => t.empresaId === sesion.empresaId)
    }

    // OPERADOR solo ve sus propios documentos
    if (soloPropios) {
      documentosData = documentosData.filter(d => d.usuarioId === sesion.userId)
      tareasData = tareasData.filter(t => t.usuarioAsignadoId === sesion.userId)
    }

    setDocumentos(documentosData)
    setTareas(tareasData)
  }

  const resetForm = () => {
    setArchivoSeleccionado(null)
    setFormData({ tareaId: 0 })
  }

  const cerrarModal = () => {
    setModalAbierto(false)
    resetForm()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validar tamaño máximo (10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('El archivo no puede superar los 10MB')
        return
      }
      setArchivoSeleccionado(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!archivoSeleccionado || !formData.tareaId) {
      toast.error('Por favor selecciona un archivo y una tarea')
      return
    }

    setSubiendo(true)

    try {
      // Leer el archivo como Base64
      const fileBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
          const result = reader.result as string
          resolve(result)
        }
        reader.onerror = () => reject(reader.error)
        reader.readAsDataURL(archivoSeleccionado)
      })

      // Determinar tipo
      let tipo: 'image' | 'pdf' | 'other' = 'other'
      const extension = archivoSeleccionado.name.split('.').pop()?.toLowerCase()
      
      if (archivoSeleccionado.type.includes('pdf') || extension === 'pdf') {
        tipo = 'pdf'
      } else if (archivoSeleccionado.type.includes('image') || 
                 ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(extension || '')) {
        tipo = 'image'
      }

      crearDocumento({
        nombre: archivoSeleccionado.name,
        tareaId: formData.tareaId,
        usuarioId: sesion.userId,
        empresaId: sesion.empresaId,
        tipo: tipo,
        fileBase64: fileBase64,
        latitud: 0,
        longitud: 0,
        timestamp: new Date().toISOString(),
        fechaSubida: new Date().toISOString(),
      })

      toast.success('Documento adjuntado correctamente')
      cargarDatos()
      cerrarModal()
    } catch (error) {
      console.error('Error al subir archivo:', error)
      toast.error('Error al procesar el archivo')
    } finally {
      setSubiendo(false)
    }
  }

  const handleEliminar = (id: number) => {
    if (confirm('¿Estas seguro de eliminar este documento?')) {
      eliminarDocumento(id)
      cargarDatos()
      toast.success('Documento eliminado correctamente')
    }
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

  const getTareaTitulo = (id: number) => {
    const tarea = tareas.find(t => t.id === id)
    return tarea?.titulo || 'Tarea no encontrada'
  }

  const getUsuarioNombre = (id: number) => {
    const usuario = getUsuario(id)
    return usuario?.nombre || 'Usuario no encontrado'
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Documentos / Evidencias</h2>
          <p className="text-muted-foreground">
            {soloPropios ? 'Tus documentos adjuntos' : 'Gestiona los documentos adjuntos a tareas'}
          </p>
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
                {soloPropios 
                  ? 'Comienza adjuntando tu primer documento a una tarea asignada' 
                  : 'Comienza adjuntando tu primer documento a una tarea'}
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
                  <TableHead>Subido por</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Tamaño</TableHead>
                  <TableHead>Fecha de Subida</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documentos.map((documento) => {
                  const Icono = getTipoIcono(documento.tipo)
                  // Calcular tamaño aproximado del archivo (en KB)
                  const fileSize = documento.fileBase64 ? Math.round(documento.fileBase64.length * 0.75 / 1024) : 0
                  const fileSizeStr = fileSize > 1024 ? `${(fileSize / 1024).toFixed(1)} MB` : `${fileSize} KB`
                  
                  return (
                    <TableRow key={documento.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Icono className="h-5 w-5 text-muted-foreground" />
                          <span className="font-medium truncate max-w-[200px]" title={documento.nombre}>
                            {documento.nombre}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{getTareaTitulo(documento.tareaId)}</TableCell>
                      <TableCell>{getUsuarioNombre(documento.usuarioId)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {documento.tipo === 'image' ? 'Imagen' : documento.tipo === 'pdf' ? 'PDF' : 'Otro'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {fileSize > 0 ? fileSizeStr : '-'}
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
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleVerDocumento(documento)}
                            title="Ver documento"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleDescargarDocumento(documento)}
                            title="Descargar documento"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          {puedeEliminar && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleEliminar(documento.id)}
                              title="Eliminar documento"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

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
                <File className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
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

      {/* Resumen por Tarea */}
      <Card>
        <CardHeader>
          <CardTitle>Documentos por Tarea</CardTitle>
          <CardDescription>Resumen de documentos adjuntos a cada tarea</CardDescription>
        </CardHeader>
        <CardContent>
          {tareas.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay tareas disponibles
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
              Selecciona un archivo (máx. 10MB) y asocialo a una tarea
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
                    accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx,.xls,.xlsx"
                    className="cursor-pointer"
                  />
                </div>
                {archivoSeleccionado && (
                  <p className="text-xs text-muted-foreground">
                    Archivo: {archivoSeleccionado.name} ({(archivoSeleccionado.size / 1024).toFixed(1)} KB)
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
              <Button type="submit" disabled={!archivoSeleccionado || !formData.tareaId || subiendo}>
                {subiendo ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Subiendo...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Adjuntar
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}