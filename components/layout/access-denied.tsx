'use client'

import { ShieldX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface AccessDeniedProps {
  onGoBack?: () => void
}

export function AccessDenied({ onGoBack }: AccessDeniedProps) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <ShieldX className="h-8 w-8 text-destructive" />
            </div>
          </div>
          <CardTitle className="text-xl">Acceso Denegado</CardTitle>
          <CardDescription>
            No tienes permisos para acceder a esta seccion.
            Contacta al administrador si crees que es un error.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {onGoBack && (
            <Button onClick={onGoBack} variant="outline">
              Volver al Dashboard
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
