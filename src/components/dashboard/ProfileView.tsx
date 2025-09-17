
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { supabaseSelect, supabaseUpdate, handleSupabaseError } from '@/lib/supabaseUtils';
import { User } from '@supabase/supabase-js';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  User2, 
  CreditCard, 
  Bell, 
  Shield, 
  CheckCircle, 
  AlertTriangle, 
  Edit3, 
  Save, 
  X, 
  Building, 
  Mail, 
  Phone, 
  Calendar,
  Crown,
  Star,
  Zap,
  Key,
  Smartphone,
  Globe
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRefreshListener } from '@/hooks/useDataRefresh';
import ChangePasswordDialog from './ChangePasswordDialog';

interface Profile {
  id: string;
  company_name: string;
  email: string;
  phone?: string;
  plan_type: string;
  subscription_start?: string;
  subscription_end?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

interface NotificationSettings {
  new_messages: boolean;
  plan_limits: boolean;
  product_updates: boolean;
  email_notifications: boolean;
}

interface ProfileViewProps {
  user: User | null;
}

const ProfileView = ({ user }: ProfileViewProps) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    company_name: '',
    email: '',
    phone: ''
  });
  const [notifications, setNotifications] = useState<NotificationSettings>({
    new_messages: true,
    plan_limits: true,
    product_updates: false,
    email_notifications: true
  });
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const { toast } = useToast();

  const fetchProfile = useCallback(async () => {
    try {
      const { data } = await supabaseSelect(
        supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user?.id)
          .single()
      );
      
      if (data) {
      setProfile(data);
      setProfileData({
        company_name: data.company_name || '',
        email: data.email || '',
        phone: data.phone || ''
      });
      }
    } catch (error: unknown) {
      const errorInfo = handleSupabaseError(error, "No se pudo cargar el perfil");
      toast({
        title: errorInfo.title,
        description: errorInfo.description,
        variant: "destructive",
      });
    }
  }, [user?.id, toast]);

  // 🔄 Escuchar eventos de refresh de datos
  useRefreshListener(
    async () => {
      console.log('🔄 ProfileView: Refreshing profile data');
      if (user) {
        await fetchProfile();
      }
    },
    'profile'
  );

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user, fetchProfile]);

  const updateProfile = async () => {
    if (!profileData.company_name.trim() || !profileData.email.trim()) {
      toast({
        title: "Campos requeridos",
        description: "Nombre de empresa y email son obligatorios",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await supabaseUpdate(
        supabase
          .from('profiles')
          .update({
            company_name: profileData.company_name.trim(),
            email: profileData.email.trim(),
            phone: profileData.phone.trim() || null,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user?.id)
      );

      await fetchProfile();
      setEditingProfile(false);
      toast({
        title: "✅ Perfil actualizado",
        description: "Tu información ha sido guardada exitosamente",
      });
    } catch (error: unknown) {
      const errorInfo = handleSupabaseError(error, "No se pudo actualizar el perfil");
      toast({
        title: errorInfo.title,
        description: errorInfo.description,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const cancelEdit = () => {
    setEditingProfile(false);
    if (profile) {
      setProfileData({
        company_name: profile.company_name || '',
        email: profile.email || '',
        phone: profile.phone || ''
      });
    }
  };

  const plans = [
    {
      name: 'Free',
      price: '$0',
      description: 'Perfecto para comenzar',
      features: ['1 canal de comunicación', '100 mensajes/mes', 'IA básica', 'Soporte por email'],
      current: profile?.plan_type === 'free',
      icon: Star,
      color: 'text-gray-500',
      bgColor: 'bg-gray-50'
    },
    {
      name: 'Premium',
      price: '$29',
      description: 'Para empresas en crecimiento',
      features: ['3 canales', '2,000 mensajes/mes', 'IA avanzada', 'Soporte prioritario', 'Análisis detallados'],
      current: profile?.plan_type === 'premium',
      icon: Zap,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50'
    },
    {
      name: 'Enterprise',
      price: '$99',
      description: 'Solución completa',
      features: ['Canales ilimitados', 'Mensajes ilimitados', 'IA personalizada', 'Soporte 24/7', 'API completa', 'Integraciones avanzadas'],
      current: profile?.plan_type === 'enterprise',
      icon: Crown,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50'
    }
  ];

  const getPlanColor = (planType: string) => {
    switch (planType) {
      case 'free': return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'premium': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'enterprise': return 'bg-purple-100 text-purple-800 border-purple-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getPlanIcon = (planType: string) => {
    switch (planType) {
      case 'free': return Star;
      case 'premium': return Zap;
      case 'enterprise': return Crown;
      default: return Star;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No disponible';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const updateNotificationSetting = (key: keyof NotificationSettings, value: boolean) => {
    setNotifications(prev => ({ ...prev, [key]: value }));
    // Aquí podrías agregar lógica para guardar en la base de datos
    toast({
      title: "Configuración actualizada",
      description: `Notificaciones ${value ? 'activadas' : 'desactivadas'} para ${key.replace('_', ' ')}`,
    });
  };

  if (!profile) {
    return (
      <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  const PlanIcon = getPlanIcon(profile.plan_type);

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header con Avatar */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-lg font-semibold bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                {getInitials(profile.company_name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{profile.company_name}</h1>
              <p className="text-gray-600 flex items-center gap-1">
                <Mail className="h-4 w-4" />
                {profile.email}
              </p>
              <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                <Calendar className="h-4 w-4" />
                Miembro desde {formatDate(profile.created_at)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge className={`${getPlanColor(profile.plan_type)} border`}>
              <PlanIcon className="h-3 w-3 mr-1" />
              Plan {profile.plan_type?.charAt(0).toUpperCase()}{profile.plan_type?.slice(1)}
            </Badge>
            {profile.is_active ? (
              <Badge variant="default" className="bg-green-100 text-green-800 border-green-300">
                <CheckCircle className="h-3 w-3 mr-1" />
                Activo
              </Badge>
            ) : (
              <Badge variant="destructive">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Inactivo
        </Badge>
            )}
          </div>
        </div>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-white shadow-sm">
          <TabsTrigger value="profile" className="flex items-center gap-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
            <User2 className="h-4 w-4" />
            <span className="hidden sm:inline">Perfil</span>
          </TabsTrigger>
          <TabsTrigger value="subscription" className="flex items-center gap-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Suscripción</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notificaciones</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Seguridad</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5 text-blue-600" />
                    Información de la Empresa
                  </CardTitle>
                  <CardDescription>
                    Gestiona los datos principales de tu empresa
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  {editingProfile ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={cancelEdit}
                        disabled={loading}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancelar
                      </Button>
              <Button
                        size="sm"
                        onClick={updateProfile}
                disabled={loading}
              >
                        {loading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                            Guardando...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-1" />
                            Guardar
                          </>
                        )}
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingProfile(true)}
                    >
                      <Edit3 className="h-4 w-4 mr-1" />
                      Editar
              </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="company" className="text-sm font-medium flex items-center gap-1">
                    <Building className="h-4 w-4" />
                    Nombre de la Empresa *
                  </Label>
                  <Input
                    id="company"
                    value={profileData.company_name}
                    onChange={(e) => setProfileData(prev => ({ ...prev, company_name: e.target.value }))}
                    disabled={!editingProfile}
                    className={editingProfile ? 'border-blue-300 focus:border-blue-500' : ''}
                    placeholder="Ej: Mi Empresa S.A."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    Email de Contacto *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                    disabled={!editingProfile}
                    className={editingProfile ? 'border-blue-300 focus:border-blue-500' : ''}
                    placeholder="contacto@empresa.com"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  Teléfono de Contacto
                </Label>
                <Input
                  id="phone"
                  value={profileData.phone}
                  onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                  disabled={!editingProfile}
                  className={editingProfile ? 'border-blue-300 focus:border-blue-500' : ''}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              {editingProfile && (
                <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-lg">
                  * Campos obligatorios. La información será utilizada para comunicaciones importantes.
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Estado de la Cuenta
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">Estado actual:</span>
                    {profile.is_active ? (
                      <Badge className="bg-green-100 text-green-800 border-green-300">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Activo
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Inactivo
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">Fecha de registro:</span>
                    <span className="text-sm text-gray-600">{formatDate(profile.created_at)}</span>
                  </div>
                  {profile.subscription_start && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium">Suscripción desde:</span>
                      <span className="text-sm text-gray-600">{formatDate(profile.subscription_start)}</span>
                    </div>
                )}
              </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PlanIcon className="h-5 w-5" />
                  Plan Actual
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className={`p-4 rounded-lg border-2 ${getPlanColor(profile.plan_type).split(' ').slice(0, 2).join(' ')} border-opacity-50`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">
                          Plan {profile.plan_type?.charAt(0).toUpperCase()}{profile.plan_type?.slice(1)}
                        </h3>
                        <p className="text-sm opacity-75">
                          {plans.find(p => p.current)?.description}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold">
                          {plans.find(p => p.current)?.price}
                        </div>
                        <div className="text-sm opacity-75">/mes</div>
                      </div>
                    </div>
                  </div>
                  {profile.subscription_end && (
                    <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                      <span className="text-sm font-medium text-orange-800">Renovación:</span>
                      <span className="text-sm text-orange-700">{formatDate(profile.subscription_end)}</span>
                    </div>
                  )}
                </div>
            </CardContent>
          </Card>
          </div>
        </TabsContent>

        <TabsContent value="subscription" className="space-y-6">
          {/* Plan Actual */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-blue-600" />
                Tu Plan Actual
              </CardTitle>
              <CardDescription>
                Información detallada sobre tu suscripción actual
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative overflow-hidden">
                <div className={`p-6 rounded-xl border-2 ${plans.find(p => p.current)?.bgColor} ${getPlanColor(profile.plan_type)} border-opacity-50`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-lg ${plans.find(p => p.current)?.bgColor} border`}>
                        <PlanIcon className={`h-6 w-6 ${plans.find(p => p.current)?.color}`} />
                      </div>
                <div>
                        <h3 className="text-xl font-bold">
                          Plan {profile.plan_type?.charAt(0).toUpperCase()}{profile.plan_type?.slice(1)}
                  </h3>
                        <p className="text-gray-600">
                    {plans.find(p => p.current)?.description}
                  </p>
                      </div>
                </div>
                <div className="text-right">
                      <div className="text-3xl font-bold">
                        {plans.find(p => p.current)?.price}
                      </div>
                      <div className="text-sm text-gray-500">/mes</div>
                    </div>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Estado:</span>
                      <p className="font-medium">{profile.is_active ? 'Activo' : 'Inactivo'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Inicio:</span>
                      <p className="font-medium">{formatDate(profile.subscription_start)}</p>
                    </div>
                    {profile.subscription_end && (
                      <>
                        <div>
                          <span className="text-gray-500">Próxima renovación:</span>
                          <p className="font-medium">{formatDate(profile.subscription_end)}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Auto-renovación:</span>
                          <p className="font-medium text-green-600">Activada</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cambiar Plan */}
          <Card>
                <CardHeader>
              <CardTitle>Cambiar Plan</CardTitle>
              <CardDescription>
                Elige el plan que mejor se adapte a las necesidades de tu empresa
              </CardDescription>
                </CardHeader>
                <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map((plan) => {
                  const Icon = plan.icon;
                  return (
                    <Card 
                      key={plan.name} 
                      className={`relative transition-all duration-200 ${
                        plan.current 
                          ? 'ring-2 ring-blue-500 shadow-lg' 
                          : 'hover:shadow-md hover:scale-105'
                      }`}
                    >
                      {plan.current && (
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                          <Badge className="bg-blue-500 text-white border-blue-600">
                            Plan Actual
                          </Badge>
                        </div>
                      )}
                      
                      <CardHeader className="text-center">
                        <div className={`mx-auto p-3 rounded-full ${plan.bgColor} border mb-2`}>
                          <Icon className={`h-6 w-6 ${plan.color}`} />
                        </div>
                        <CardTitle className="text-xl">{plan.name}</CardTitle>
                        <div className="text-3xl font-bold">
                          {plan.price}
                          <span className="text-sm font-normal text-gray-500">/mes</span>
                        </div>
                        <CardDescription>{plan.description}</CardDescription>
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm">
                              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                              <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                        
                        <div className="pt-4">
                          {plan.current ? (
                            <Button variant="outline" className="w-full" disabled>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Plan Actual
                            </Button>
                          ) : (
                            <Button className="w-full" variant={plan.name === 'Enterprise' ? 'default' : 'outline'}>
                      Cambiar a {plan.name}
                    </Button>
                  )}
                        </div>
                </CardContent>
              </Card>
                  );
                })}
          </div>
            </CardContent>
          </Card>

          {/* Historial de Facturación */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Historial de Facturación
              </CardTitle>
              <CardDescription>
                Revisa tus pagos y facturas anteriores
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <CreditCard className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay historial de pagos</h3>
                <p className="text-gray-500 mb-4">
                  Las facturas y recibos aparecerán aquí una vez que realices tu primer pago.
                </p>
                <Button variant="outline" size="sm">
                  <Globe className="h-4 w-4 mr-2" />
                  Ver métodos de pago
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-blue-600" />
                Preferencias de Notificaciones
              </CardTitle>
              <CardDescription>
                Personaliza cómo y cuándo recibir notificaciones de la plataforma
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Notificaciones por Email */}
              <div>
                <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Notificaciones por Email
                </h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Mail className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <h5 className="font-medium">Notificaciones por email</h5>
                        <p className="text-sm text-gray-500">Recibir notificaciones importantes por correo electrónico</p>
                      </div>
                    </div>
                    <Switch
                      checked={notifications.email_notifications}
                      onCheckedChange={(checked) => updateNotificationSetting('email_notifications', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Bell className="h-4 w-4 text-green-600" />
                      </div>
                <div>
                        <h5 className="font-medium">Nuevos mensajes</h5>
                        <p className="text-sm text-gray-500">Alertas cuando recibas nuevos mensajes de clientes</p>
                      </div>
                    </div>
                    <Switch
                      checked={notifications.new_messages}
                      onCheckedChange={(checked) => updateNotificationSetting('new_messages', checked)}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Notificaciones del Sistema */}
              <div>
                <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Notificaciones del Sistema
                </h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <AlertTriangle className="h-4 w-4 text-orange-600" />
                      </div>
                      <div>
                        <h5 className="font-medium">Límites de plan</h5>
                        <p className="text-sm text-gray-500">Avisos cuando te acerques a los límites de tu plan</p>
                      </div>
                    </div>
                    <Switch
                      checked={notifications.plan_limits}
                      onCheckedChange={(checked) => updateNotificationSetting('plan_limits', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Star className="h-4 w-4 text-purple-600" />
                      </div>
                <div>
                        <h5 className="font-medium">Actualizaciones del producto</h5>
                        <p className="text-sm text-gray-500">Noticias sobre nuevas funciones y mejoras</p>
                      </div>
                    </div>
                    <Switch
                      checked={notifications.product_updates}
                      onCheckedChange={(checked) => updateNotificationSetting('product_updates', checked)}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Resumen de configuración */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Resumen de Configuración
                </h4>
                <div className="text-sm text-blue-700 space-y-1">
                  <p>• Notificaciones por email: <span className="font-medium">{notifications.email_notifications ? 'Activadas' : 'Desactivadas'}</span></p>
                  <p>• Nuevos mensajes: <span className="font-medium">{notifications.new_messages ? 'Activadas' : 'Desactivadas'}</span></p>
                  <p>• Límites de plan: <span className="font-medium">{notifications.plan_limits ? 'Activadas' : 'Desactivadas'}</span></p>
                  <p>• Actualizaciones: <span className="font-medium">{notifications.product_updates ? 'Activadas' : 'Desactivadas'}</span></p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                Seguridad de la Cuenta
              </CardTitle>
              <CardDescription>
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
                      onClick={() => setChangePasswordOpen(true)}
                    >
                      <Key className="h-4 w-4 mr-1" />
                      Cambiar
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Smartphone className="h-4 w-4 text-green-600" />
                      </div>
                <div>
                        <h5 className="font-medium">Autenticación de dos factores</h5>
                        <p className="text-sm text-gray-500">Agrega una capa extra de seguridad con 2FA</p>
                        <Badge variant="outline" className="mt-1 text-xs">
                          No configurado
                        </Badge>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <Smartphone className="h-4 w-4 mr-1" />
                      Configurar
                    </Button>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Sesiones Activas */}
              <div>
                <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Sesiones Activas
                </h4>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Globe className="h-4 w-4 text-blue-600" />
                        </div>
                <div>
                          <h5 className="font-medium flex items-center gap-2">
                            Navegador Actual
                            <Badge className="bg-green-100 text-green-800 text-xs">Activa</Badge>
                          </h5>
                          <p className="text-sm text-gray-500">Chrome en Windows</p>
                          <p className="text-xs text-gray-400 mt-1">
                            IP: 192.168.1.100 • Última actividad: Ahora
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" disabled>
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Actual
                      </Button>
                    </div>
                  </div>
                  <div className="text-center p-4">
                    <Button variant="outline" size="sm">
                      <Globe className="h-4 w-4 mr-1" />
                      Ver todas las sesiones
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
                        ⚠️ Esta acción no se puede deshacer
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
      </Tabs>

      {/* Dialog de cambio de contraseña */}
      <ChangePasswordDialog 
        open={changePasswordOpen}
        onOpenChange={setChangePasswordOpen}
      />
    </div>
  );
};

export default ProfileView;
