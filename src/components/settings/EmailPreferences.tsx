import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Mail, 
  Bell, 
  Bot, 
  Smartphone, 
  Settings, 
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { EmailService } from '@/services/emailService';
import type { EmailPreferences as EmailPreferencesType } from '@/services/emailService';

interface EmailPreferencesProps {
  className?: string;
}

export const EmailPreferences: React.FC<EmailPreferencesProps> = ({ className }) => {
  const [preferences, setPreferences] = useState<EmailPreferencesType>({
    notifications: true,
    marketing: false,
    system: true,
    aiAgent: true,
    channels: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Cargar preferencias del usuario
  useEffect(() => {
    const loadPreferences = async () => {
      if (!user?.id) return;

      try {
        const userPreferences = await EmailService.getUserEmailPreferences(user.id);
        if (userPreferences) {
          setPreferences(userPreferences);
        }
      } catch (error) {
        console.error('Error loading email preferences:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar las preferencias de email",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, [user?.id, toast]);

  // Guardar preferencias
  const savePreferences = async () => {
    if (!user?.id) return;

    setSaving(true);
    try {
      const success = await EmailService.updateUserEmailPreferences(user.id, preferences);
      
      if (success) {
        toast({
          title: "Preferencias guardadas",
          description: "Tus preferencias de email han sido actualizadas",
        });
      } else {
        throw new Error('Failed to save preferences');
      }
    } catch (error) {
      console.error('Error saving email preferences:', error);
      toast({
        title: "Error",
        description: "No se pudieron guardar las preferencias",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Actualizar preferencia individual
  const updatePreference = (key: keyof EmailPreferencesType, value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Cargando preferencias...</span>
        </CardContent>
      </Card>
    );
  }

  const preferenceItems = [
    {
      key: 'notifications' as keyof EmailPreferencesType,
      label: 'Notificaciones Generales',
      description: 'Recibe emails sobre notificaciones importantes del sistema',
      icon: Bell,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      key: 'aiAgent' as keyof EmailPreferencesType,
      label: 'Agente IA',
      description: 'Emails sobre activación, progreso de entrenamiento y errores críticos',
      icon: Bot,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      key: 'channels' as keyof EmailPreferencesType,
      label: 'Canales de Comunicación',
      description: 'Notificaciones sobre conexiones, desconexiones y verificaciones',
      icon: Smartphone,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      key: 'system' as keyof EmailPreferencesType,
      label: 'Sistema y Seguridad',
      description: 'Alertas críticas, errores del sistema y actualizaciones importantes',
      icon: Settings,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      key: 'marketing' as keyof EmailPreferencesType,
      label: 'Marketing y Promociones',
      description: 'Ofertas especiales, nuevas funcionalidades y tips de uso',
      icon: Mail,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50'
    }
  ];

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Preferencias de Email
        </CardTitle>
        <p className="text-sm text-gray-600">
          Configura qué tipos de emails quieres recibir de OndAI
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {preferenceItems.map((item, index) => {
          const IconComponent = item.icon;
          const isEnabled = preferences[item.key];
          
          return (
            <div key={item.key}>
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${item.bgColor}`}>
                    <IconComponent className={`h-5 w-5 ${item.color}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor={item.key} className="font-medium">
                        {item.label}
                      </Label>
                      {isEnabled && (
                        <Badge variant="secondary" className="text-xs">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Activo
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {item.description}
                    </p>
                  </div>
                </div>
                <Switch
                  id={item.key}
                  checked={isEnabled}
                  onCheckedChange={(checked) => updatePreference(item.key, checked)}
                  disabled={saving}
                />
              </div>
              {index < preferenceItems.length - 1 && <Separator className="my-4" />}
            </div>
          );
        })}

        <div className="pt-4 border-t">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <p className="font-medium">Email actual:</p>
              <p className="text-gray-500">{user?.email}</p>
            </div>
            <Button 
              onClick={savePreferences} 
              disabled={saving}
              className="gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Guardar Preferencias
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-900">Información importante:</p>
              <p className="text-blue-700 mt-1">
                Los emails críticos del sistema siempre se envían independientemente de estas preferencias 
                para mantener la seguridad de tu cuenta.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
