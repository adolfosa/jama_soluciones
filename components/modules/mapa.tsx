'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Empty, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty'
import { getTareas, getUsuarios } from '@/lib/storage'
import { Tarea, Usuario } from '@/lib/types'
import { MapPin, CheckSquare } from 'lucide-react'

const estadoColors = {
  pendiente: 'bg-yellow-500',
  en_progreso: 'bg-blue-500',
  completada: 'bg-green-500',
}

const estadoLabels = {
  pendiente: 'Pendiente',
  en_progreso: 'En Progreso',
  completada: 'Completada',
}

export function Mapa() {
  const [tareas, setTareas] = useState<Tarea[]>([])
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [tareaSeleccionada, setTareaSeleccionada] = useState<Tarea | null>(null)

  useEffect(() => {
    setTareas(getTareas())
    setUsuarios(getUsuarios())
  }, [])

  const tareasConCoordenadas = tareas.filter(t => t.coordenadas)

  const getUsuarioNombre = (id: number | null) => {
    if (!id) return 'Sin asignar'
    const usuario = usuarios.find(u => u.id === id)
    return usuario?.nombre || 'No encontrado'
  }

  // Convertir coordenadas a posiciones en el mapa simulado
  const getMarkerPosition = (lat: number, lng: number) => {
    // Santiago centro aproximado: -33.45, -70.67
    // Rango del mapa: lat (-33.5 a -33.4), lng (-70.75 a -70.6)
    const x = ((lng + 70.75) / 0.15) * 100
    const y = ((lat + 33.5) / 0.1) * 100
    return { 
      left: `${Math.max(5, Math.min(95, x))}%`, 
      top: `${Math.max(5, Math.min(95, y))}%` 
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold">Mapa / Geolocalizacion</h2>
        <p className="text-muted-foreground">Visualiza la ubicacion de las tareas</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mapa Simulado */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Vista de Mapa</CardTitle>
            <CardDescription>Ubicaciones de tareas en Santiago, Chile (Simulado)</CardDescription>
          </CardHeader>
          <CardContent>
            {tareasConCoordenadas.length === 0 ? (
              <Empty>
                <EmptyMedia variant="icon">
                  <MapPin className="h-6 w-6" />
                </EmptyMedia>
                <EmptyTitle>No hay ubicaciones</EmptyTitle>
                <EmptyDescription>
                  Las tareas creadas apareceran aqui con sus ubicaciones
                </EmptyDescription>
              </Empty>
            ) : (
              <div className="relative w-full h-[400px] bg-muted rounded-lg overflow-hidden">
                {/* Fondo del mapa simulado */}
                <div className="absolute inset-0 bg-gradient-to-br from-green-100 to-blue-100 opacity-50" />
                
                {/* Grid de calles simulado */}
                <svg className="absolute inset-0 w-full h-full opacity-20">
                  {/* Lineas horizontales */}
                  {[0, 20, 40, 60, 80, 100].map(y => (
                    <line key={`h-${y}`} x1="0" y1={`${y}%`} x2="100%" y2={`${y}%`} stroke="currentColor" strokeWidth="1" />
                  ))}
                  {/* Lineas verticales */}
                  {[0, 20, 40, 60, 80, 100].map(x => (
                    <line key={`v-${x}`} x1={`${x}%`} y1="0" x2={`${x}%`} y2="100%" stroke="currentColor" strokeWidth="1" />
                  ))}
                </svg>

                {/* Etiqueta del mapa */}
                <div className="absolute top-2 left-2 bg-background/80 px-2 py-1 rounded text-xs font-medium">
                  Santiago, Chile
                </div>

                {/* Marcadores */}
                {tareasConCoordenadas.map((tarea) => {
                  const pos = getMarkerPosition(tarea.coordenadas!.lat, tarea.coordenadas!.lng)
                  const isSelected = tareaSeleccionada?.id === tarea.id
                  
                  return (
                    <button
                      key={tarea.id}
                      className={`absolute transform -translate-x-1/2 -translate-y-full transition-all ${isSelected ? 'z-20 scale-125' : 'z-10 hover:scale-110'}`}
                      style={{ left: pos.left, top: pos.top }}
                      onClick={() => setTareaSeleccionada(tarea)}
                    >
                      <div className="flex flex-col items-center">
                        <div className={`w-6 h-6 rounded-full ${estadoColors[tarea.estado]} flex items-center justify-center shadow-lg border-2 border-white`}>
                          <MapPin className="h-4 w-4 text-white" />
                        </div>
                        {isSelected && (
                          <div className="mt-1 bg-background shadow-lg rounded px-2 py-1 text-xs max-w-[120px] truncate">
                            {tarea.titulo}
                          </div>
                        )}
                      </div>
                    </button>
                  )
                })}

                {/* Leyenda */}
                <div className="absolute bottom-2 right-2 bg-background/90 p-2 rounded-lg shadow">
                  <p className="text-xs font-medium mb-1">Leyenda</p>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      <span className="text-xs">Pendiente</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      <span className="text-xs">En Progreso</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <span className="text-xs">Completada</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Panel de detalle */}
        <Card>
          <CardHeader>
            <CardTitle>Detalle de Tarea</CardTitle>
            <CardDescription>
              {tareaSeleccionada ? 'Informacion de la tarea seleccionada' : 'Selecciona un marcador en el mapa'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {tareaSeleccionada ? (
              <div className="flex flex-col gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Titulo</p>
                  <p className="font-medium">{tareaSeleccionada.titulo}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Descripcion</p>
                  <p className="text-sm">{tareaSeleccionada.descripcion || 'Sin descripcion'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Estado</p>
                  <Badge variant="secondary" className={`${estadoColors[tareaSeleccionada.estado]} text-white mt-1`}>
                    {estadoLabels[tareaSeleccionada.estado]}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Asignado a</p>
                  <p className="font-medium">{getUsuarioNombre(tareaSeleccionada.usuarioAsignadoId)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Coordenadas</p>
                  <p className="text-xs font-mono">
                    Lat: {tareaSeleccionada.coordenadas?.lat.toFixed(4)}, 
                    Lng: {tareaSeleccionada.coordenadas?.lng.toFixed(4)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fecha Inicio</p>
                  <p className="font-medium">
                    {new Date(tareaSeleccionada.fechaInicio).toLocaleDateString('es-CL')}
                  </p>
                </div>
              </div>
            ) : (
              <Empty>
                <EmptyMedia variant="icon">
                  <CheckSquare className="h-6 w-6" />
                </EmptyMedia>
                <EmptyTitle>Sin seleccion</EmptyTitle>
                <EmptyDescription>
                  Haz clic en un marcador del mapa para ver los detalles
                </EmptyDescription>
              </Empty>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Lista de tareas */}
      <Card>
        <CardHeader>
          <CardTitle>Tareas con Ubicacion</CardTitle>
          <CardDescription>Total: {tareasConCoordenadas.length} tareas geolocalizadas</CardDescription>
        </CardHeader>
        <CardContent>
          {tareasConCoordenadas.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay tareas con ubicacion registrada
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {tareasConCoordenadas.map((tarea) => (
                <button
                  key={tarea.id}
                  onClick={() => setTareaSeleccionada(tarea)}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    tareaSeleccionada?.id === tarea.id 
                      ? 'border-primary bg-primary/5' 
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <div className={`w-3 h-3 rounded-full mt-1 ${estadoColors[tarea.estado]}`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{tarea.titulo}</p>
                      <p className="text-xs text-muted-foreground">
                        {getUsuarioNombre(tarea.usuarioAsignadoId)}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
