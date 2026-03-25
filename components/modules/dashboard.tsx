'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Empty, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty'
import { getEmpresas, getTareas, getUsuarios, getDocumentos } from '@/lib/storage'
import { soloVerPropiasTareas, puedeVerTodasEmpresas } from '@/lib/permissions'
import { Empresa, Tarea, Usuario, Documento, Sesion } from '@/lib/types'
import { Building2, Users, CheckSquare, FileText, Clock, AlertCircle } from 'lucide-react'

interface DashboardProps {
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

export function Dashboard({ sesion }: DashboardProps) {
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [tareas, setTareas] = useState<Tarea[]>([])
  const [documentos, setDocumentos] = useState<Documento[]>([])

  useEffect(() => {
    let empresasData = getEmpresas()
    let usuariosData = getUsuarios()
    let tareasData = getTareas()
    let documentosData = getDocumentos()

    // Filtrar según rol
    if (!puedeVerTodasEmpresas(sesion.rol)) {
      if (sesion.empresaId) {
        usuariosData = usuariosData.filter(u => u.empresaId === sesion.empresaId)
        tareasData = tareasData.filter(t => t.empresaId === sesion.empresaId)
        documentosData = documentosData.filter(d => d.empresaId === sesion.empresaId)
      }
    }

    // OPERADOR solo ve sus propias tareas
    if (soloVerPropiasTareas(sesion.rol)) {
      tareasData = tareasData.filter(t => t.usuarioAsignadoId === sesion.userId)
      documentosData = documentosData.filter(d => d.usuarioId === sesion.userId)
    }

    setEmpresas(empresasData)
    setUsuarios(usuariosData)
    setTareas(tareasData)
    setDocumentos(documentosData)
  }, [sesion])

  const tareasRecientes = tareas
    .sort((a, b) => new Date(b.fechaInicio).getTime() - new Date(a.fechaInicio).getTime())
    .slice(0, 5)

  const tareasPendientes = tareas.filter(t => t.estado === 'pendiente').length
  const tareasEnProgreso = tareas.filter(t => t.estado === 'en_progreso').length
  const tareasCompletadas = tareas.filter(t => t.estado === 'completada').length

  const tareasRequierenEvidencia = tareas.filter(t => {
    if (!t.requiereEvidencia) return false
    const docs = documentos.filter(d => d.tareaId === t.id)
    return docs.length === 0 && t.estado !== 'completada'
  })

  return (
    <div className="flex flex-col gap-6">
      {/* Bienvenida */}
      <div>
        <h2 className="text-2xl font-bold">Bienvenido, {sesion.nombre}</h2>
        <p className="text-muted-foreground">
          Panel de control - Rol: {sesion.rol}
          {sesion.empresaId && ` | Empresa ID: ${sesion.empresaId}`}
        </p>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {puedeVerTodasEmpresas(sesion.rol) && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-blue-50">
                  <Building2 className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{empresas.length}</p>
                  <p className="text-sm text-muted-foreground">
                    Empresas ({empresas.filter(e => e.estado === 'activa').length} activas)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {sesion.rol !== 'OPERADOR' && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-green-50">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{usuarios.length}</p>
                  <p className="text-sm text-muted-foreground">Usuarios</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-orange-50">
                <CheckSquare className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{tareas.length}</p>
                <div className="flex gap-2 text-xs text-muted-foreground">
                  <span className="text-yellow-600">{tareasPendientes} pend.</span>
                  <span className="text-blue-600">{tareasEnProgreso} prog.</span>
                  <span className="text-green-600">{tareasCompletadas} comp.</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-purple-50">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{documentos.length}</p>
                <p className="text-sm text-muted-foreground">Documentos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas de tareas sin evidencia */}
      {tareasRequierenEvidencia.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Tareas pendientes de evidencia
            </CardTitle>
            <CardDescription className="text-orange-700">
              Estas tareas requieren evidencia documental antes de completarse
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              {tareasRequierenEvidencia.slice(0, 5).map(tarea => (
                <div key={tarea.id} className="flex items-center justify-between p-2 bg-white rounded border">
                  <span className="font-medium">{tarea.titulo}</span>
                  <Badge variant="outline" className="text-orange-700 border-orange-300">
                    Sin evidencia
                  </Badge>
                </div>
              ))}
              {tareasRequierenEvidencia.length > 5 && (
                <p className="text-sm text-orange-600 text-center">
                  Y {tareasRequierenEvidencia.length - 5} mas...
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tareas recientes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Tareas Recientes
          </CardTitle>
          <CardDescription>Ultimas tareas registradas en el sistema</CardDescription>
        </CardHeader>
        <CardContent>
          {tareasRecientes.length === 0 ? (
            <Empty>
              <EmptyMedia variant="icon">
                <CheckSquare className="h-6 w-6" />
              </EmptyMedia>
              <EmptyTitle>No hay tareas</EmptyTitle>
              <EmptyDescription>
                Aun no se han creado tareas en el sistema
              </EmptyDescription>
            </Empty>
          ) : (
            <div className="flex flex-col gap-3">
              {tareasRecientes.map((tarea) => (
                <div
                  key={tarea.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex-1">
                    <p className="font-medium">{tarea.titulo}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(tarea.fechaInicio).toLocaleDateString('es-CL')}
                      {tarea.requiereEvidencia && (
                        <span className="ml-2 text-orange-600">(Requiere evidencia)</span>
                      )}
                    </p>
                  </div>
                  <Badge variant="secondary" className={estadoColors[tarea.estado]}>
                    {estadoLabels[tarea.estado]}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
