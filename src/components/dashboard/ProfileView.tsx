
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
import logoWhite from '@/assets/logo_white.png';
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
  Globe,
  MapPin,
  Flag
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRefreshListener } from '@/hooks/useDataRefresh';
import ChangePasswordDialog from './ChangePasswordDialog';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

interface Profile {
  id: string;
  company_name: string;
  email: string;
  phone?: string;
  phone_country_code?: string;
  country?: string;
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
    phone: '',
    country: ''
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
      const fullPhone = data.phone_country_code && data.phone 
        ? `${data.phone_country_code} ${data.phone}`
        : data.phone || '';
      
      setProfileData({
        company_name: data.company_name || '',
        email: data.email || '',
        phone: fullPhone,
        country: data.country || 'US'
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

  const parsePhoneNumber = (phoneNumber: string) => {
    if (!phoneNumber) return { countryCode: '+1', number: '' };
    
    const match = phoneNumber.match(/^(\+\d{1,4})\s?(.*)$/);
    if (match) {
      return { countryCode: match[1], number: match[2] };
    }
    
    return { countryCode: '+1', number: phoneNumber };
  };

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
      const { countryCode, number } = parsePhoneNumber(profileData.phone);
      
      await supabaseUpdate(
        supabase
          .from('profiles')
          .update({
            company_name: profileData.company_name.trim(),
            email: profileData.email.trim(),
            phone: number || null,
            phone_country_code: countryCode,
            country: profileData.country || 'US',
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user?.id)
      );

      await fetchProfile();
      setEditingProfile(false);
      toast({
        title: "Perfil actualizado",
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
      const fullPhone = profile.phone_country_code && profile.phone 
        ? `${profile.phone_country_code} ${profile.phone}`
        : profile.phone || '';
        
      setProfileData({
        company_name: profile.company_name || '',
        email: profile.email || '',
        phone: fullPhone,
        country: profile.country || 'US'
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
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 bg-gray-50 min-h-screen">
      {/* Header con Avatar */}
      <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <Avatar className="h-12 w-12 sm:h-16 sm:w-16 mx-auto sm:mx-0">
              <AvatarFallback className="text-sm sm:text-lg font-semibold bg-gradient-to-r from-[#3a0caa] to-[#710db2] text-white">
                {getInitials(profile.company_name)}
              </AvatarFallback>
            </Avatar>
            <div className="text-center sm:text-left">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{profile.company_name}</h1>
              <p className="text-sm sm:text-base text-gray-600 flex items-center justify-center sm:justify-start gap-1 mt-1">
                <Mail className="h-3 w-3 sm:h-4 sm:w-4" />
                {profile.email}
              </p>
              <p className="text-xs sm:text-sm text-gray-500 flex items-center justify-center sm:justify-start gap-1 mt-1">
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                Miembro desde {formatDate(profile.created_at)}
              </p>
              {profile.country && (
                <p className="text-xs sm:text-sm text-gray-500 flex items-center justify-center sm:justify-start gap-1 mt-1">
                  <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                  {profile.country}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
            <Badge className={`${getPlanColor(profile.plan_type)} border text-xs sm:text-sm`}>
              <PlanIcon className="h-3 w-3 mr-1" />
              <span className="hidden sm:inline">Plan {profile.plan_type?.charAt(0).toUpperCase()}{profile.plan_type?.slice(1)}</span>
              <span className="sm:hidden">{profile.plan_type?.charAt(0).toUpperCase()}{profile.plan_type?.slice(1)}</span>
            </Badge>
            {profile.is_active ? (
              <Badge variant="default" className="bg-gradient-to-r from-[#3a0caa]/10 to-[#710db2]/10 text-[#3a0caa] border-[#3a0caa]/20 text-xs sm:text-sm">
                <CheckCircle className="h-3 w-3 mr-1" />
                Activo
              </Badge>
            ) : (
              <Badge variant="destructive" className="text-xs sm:text-sm">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Inactivo
              </Badge>
            )}
          </div>
        </div>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 bg-white shadow-sm h-auto">
          <TabsTrigger value="profile" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#3a0caa]/10 data-[state=active]:to-[#710db2]/10 data-[state=active]:text-[#3a0caa] py-3 sm:py-2">
            <User2 className="h-4 w-4" />
            <span className="text-xs sm:text-sm">Perfil</span>
          </TabsTrigger>
          <TabsTrigger value="subscription" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#3a0caa]/10 data-[state=active]:to-[#710db2]/10 data-[state=active]:text-[#3a0caa] py-3 sm:py-2">
            <CreditCard className="h-4 w-4" />
            <span className="text-xs sm:text-sm">Suscripción</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#3a0caa]/10 data-[state=active]:to-[#710db2]/10 data-[state=active]:text-[#3a0caa] py-3 sm:py-2">
            <Bell className="h-4 w-4" />
            <span className="text-xs sm:text-sm">Notificaciones</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#3a0caa]/10 data-[state=active]:to-[#710db2]/10 data-[state=active]:text-[#3a0caa] py-3 sm:py-2">
            <Shield className="h-4 w-4" />
            <span className="text-xs sm:text-sm">Seguridad</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4 sm:space-y-6">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <Building className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                    Información de la Empresa
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-base">
                    Gestiona los datos principales de tu empresa
                  </CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  {editingProfile ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={cancelEdit}
                        disabled={loading}
                        className="w-full sm:w-auto"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancelar
                      </Button>
                      <Button
                        size="sm"
                        onClick={updateProfile}
                        disabled={loading}
                        className="w-full sm:w-auto bg-gradient-to-r from-[#3a0caa] to-[#710db2] hover:from-[#270a59] hover:to-[#2b0a63] text-white"
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
                      className="w-full sm:w-auto"
                    >
                      <Edit3 className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <Label htmlFor="company" className="text-sm font-medium flex items-center gap-1">
                    <Building className="h-3 w-3 sm:h-4 sm:w-4" />
                    Nombre de la Empresa *
                  </Label>
                  <Input
                    id="company"
                    value={profileData.company_name}
                    onChange={(e) => setProfileData(prev => ({ ...prev, company_name: e.target.value }))}
                    disabled={!editingProfile}
                    className={`text-sm sm:text-base ${editingProfile ? 'border-blue-300 focus:border-blue-500' : ''}`}
                    placeholder="Ej: Mi Empresa S.A."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium flex items-center gap-1">
                    <Mail className="h-3 w-3 sm:h-4 sm:w-4" />
                    Email de Contacto *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                    disabled={!editingProfile}
                    className={`text-sm sm:text-base ${editingProfile ? 'border-blue-300 focus:border-blue-500' : ''}`}
                    placeholder="contacto@empresa.com"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium flex items-center gap-1">
                    <Phone className="h-3 w-3 sm:h-4 sm:w-4" />
                    Teléfono de Contacto
                  </Label>
                  <PhoneInput
                    placeholder="Ingresa número de teléfono"
                    value={profileData.phone}
                    onChange={(value) => setProfileData(prev => ({ ...prev, phone: value || '' }))}
                    disabled={!editingProfile}
                    defaultCountry="US"
                    international
                    countryCallingCodeEditable={false}
                    className="text-sm sm:text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country" className="text-sm font-medium flex items-center gap-1">
                    <Flag className="h-3 w-3 sm:h-4 sm:w-4" />
                    País
                  </Label>
                  <Input
                    id="country"
                    value={profileData.country}
                    onChange={(e) => setProfileData(prev => ({ ...prev, country: e.target.value }))}
                    disabled={!editingProfile}
                    className={`text-sm sm:text-base ${editingProfile ? 'border-blue-300 focus:border-blue-500' : ''}`}
                    placeholder="US, MX, ES, etc."
                  />
                </div>
              </div>
              {editingProfile && (
                <div className="text-xs sm:text-sm text-gray-500 bg-blue-50 p-3 rounded-lg">
                  * Campos obligatorios. La información será utilizada para comunicaciones importantes.
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                  Estado de la Cuenta
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">Estado actual:</span>
                    {profile.is_active ? (
                      <Badge className="bg-green-100 text-green-800 border-green-300 text-xs sm:text-sm">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Activo
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="text-xs sm:text-sm">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Inactivo
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">Fecha de registro:</span>
                    <span className="text-sm text-gray-600">{formatDate(profile.created_at)}</span>
                  </div>
                  {profile.subscription_start && (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium">Suscripción desde:</span>
                      <span className="text-sm text-gray-600">{formatDate(profile.subscription_start)}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <PlanIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                  Plan Actual
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="space-y-3">
                  <div className={`p-3 sm:p-4 rounded-lg border-2 ${getPlanColor(profile.plan_type).split(' ').slice(0, 2).join(' ')} border-opacity-50`}>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-base sm:text-lg">
                          Plan {profile.plan_type?.charAt(0).toUpperCase()}{profile.plan_type?.slice(1)}
                        </h3>
                        <p className="text-xs sm:text-sm opacity-75">
                          {plans.find(p => p.current)?.description}
                        </p>
                      </div>
                      <div className="text-center sm:text-right">
                        <div className="text-lg sm:text-xl font-bold">
                          {plans.find(p => p.current)?.price}
                        </div>
                        <div className="text-xs sm:text-sm opacity-75">/mes</div>
                      </div>
                    </div>
                  </div>
                  {profile.subscription_end && (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 bg-orange-50 rounded-lg border border-orange-200">
                      <span className="text-sm font-medium text-orange-800">Renovación:</span>
                      <span className="text-sm text-orange-700">{formatDate(profile.subscription_end)}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="subscription" className="space-y-4 sm:space-y-6">
          {/* Plan Actual */}
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                Tu Plan Actual
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
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
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl">Cambiar Plan</CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Elige el plan que mejor se adapte a las necesidades de tu empresa
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
                      
                      <CardHeader className="text-center p-4 sm:p-6">
                        <div className={`mx-auto p-2 sm:p-3 rounded-full ${plan.bgColor} border mb-2`}>
                          <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${plan.color}`} />
                        </div>
                        <CardTitle className="text-lg sm:text-xl">{plan.name}</CardTitle>
                        <div className="text-2xl sm:text-3xl font-bold">
                          {plan.price}
                          <span className="text-xs sm:text-sm font-normal text-gray-500">/mes</span>
                        </div>
                        <CardDescription className="text-sm sm:text-base">{plan.description}</CardDescription>
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

        <TabsContent value="notifications" className="space-y-4 sm:space-y-6">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                Preferencias de Notificaciones
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
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
                      onClick={() => setChangePasswordOpen(true)}
                    >
                      <Key className="h-4 w-4 mr-1" />
                      Cambiar
                    </Button>
                  </div>
                  {/* TODO: Implementar autenticación de dos factores (2FA)
                      - Configurar TOTP (Time-based One-Time Password) en Supabase Auth
                      - Generar QR Code para configurar app autenticadora
                      - Validar códigos de 2FA
                      - Mostrar códigos de respaldo
                      - Gestionar estado de 2FA (habilitado/deshabilitado)
                      - Agregar campos en BD: two_factor_enabled, two_factor_secret, two_factor_backup_codes
                      - Instalar dependencias: npm install qrcode @types/qrcode
                      
                  <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50 opacity-50">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Smartphone className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <h5 className="font-medium">Autenticación de dos factores</h5>
                        <p className="text-sm text-gray-500">Agrega una capa extra de seguridad con 2FA</p>
                        <Badge variant="outline" className="mt-1 text-xs">
                          Próximamente
                        </Badge>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" disabled>
                      <Smartphone className="h-4 w-4 mr-1" />
                      Configurar
                    </Button>
                  </div>
                  */}
                </div>
              </div>

              <Separator />

              {/* TODO: Implementar gestión de sesiones activas
                  - Integrar con Supabase Auth para obtener sesiones del usuario
                  - Mostrar información de sesiones: dispositivo, ubicación, última actividad
                  - Permitir cerrar sesiones remotas
                  - Mostrar detalles de seguridad: IP, User Agent, etc.
                  - Implementar endpoint para obtener sesiones: supabase.auth.getSessions()
                  - Agregar funcionalidad para revocar sesiones específicas
                  - Mostrar alertas de seguridad para sesiones sospechosas
                  
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
              */}

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
