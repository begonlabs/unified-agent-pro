import React from 'react';
import { TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Shield, 
  Key, 
  AlertTriangle 
} from 'lucide-react';
import { ChangePasswordDialogProps } from '../types';

interface SecurityTabProps {
  onChangePasswordOpen: (open: boolean) => void;
  changePasswordOpen: boolean;
}

export const SecurityTab: React.FC<SecurityTabProps> = ({
  onChangePasswordOpen,
  changePasswordOpen
}) => {
  return (
    <TabsContent value="security" className="space-y-4 sm:space-y-6">
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
            Seguridad de la Cuenta
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Gestiona la seguridad y acceso a tu cuenta
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Configuración de Contraseña */}
          <div>
            <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
              <Key className="h-4 w-4" />
              Autenticación
            </h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Key className="h-4 w-4 text-red-600" />
                  </div>
                  <div>
                    <h5 className="font-medium">Cambiar contraseña</h5>
                    <p className="text-sm text-gray-500">Actualiza tu contraseña para mantener tu cuenta segura</p>
                    <p className="text-xs text-gray-400 mt-1">Última actualización: Hace 2 meses</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onChangePasswordOpen(true)}
                >
                  <Key className="h-4 w-4 mr-1" />
                  Cambiar
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          {/* Zona de Peligro */}
          <div>
            <h4 className="font-medium text-red-900 mb-4 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Zona de Peligro
            </h4>
            <div className="border border-red-200 rounded-lg p-4 bg-red-50">
              <div className="flex items-start justify-between">
                <div>
                  <h5 className="font-medium text-red-900">Eliminar cuenta</h5>
                  <p className="text-sm text-red-700 mt-1">
                    Esta acción eliminará permanentemente tu cuenta y todos los datos asociados.
                  </p>
                  <p className="text-xs text-red-600 mt-2">
                    Esta acción no se puede deshacer
                  </p>
                </div>
                <Button variant="destructive" size="sm" className="ml-4">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  Eliminar
                </Button>
              </div>
            </div>
          </div>

          {/* Información de Seguridad */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Consejos de Seguridad
            </h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Usa una contraseña fuerte y única</li>
              <li>• Habilita la autenticación de dos factores</li>
              <li>• Revisa regularmente las sesiones activas</li>
              <li>• No compartas tus credenciales con nadie</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
};
