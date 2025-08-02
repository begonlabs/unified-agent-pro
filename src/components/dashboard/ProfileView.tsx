
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User2, CreditCard, Bell, Shield, CheckCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  company_name: string;
  email: string;
  phone?: string;
  plan_type: string;
  subscription_start?: string;
  subscription_end?: string;
  is_active: boolean;
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
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      
      setProfile(data);
      setProfileData({
        company_name: data.company_name || '',
        email: data.email || '',
        phone: data.phone || ''
      });
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      const isConnectionError = error.message?.includes('upstream connect error') || error.message?.includes('503');
      toast({
        title: "Error de conexión",
        description: isConnectionError 
          ? "Problemas de conectividad. Reintentando automáticamente..." 
          : "No se pudo cargar el perfil",
        variant: "destructive",
      });
      
      if (isConnectionError) {
        setTimeout(() => {
          fetchProfile();
        }, 3000);
      }
    }
  };

  const updateProfile = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          company_name: profileData.company_name,
          email: profileData.email,
          phone: profileData.phone,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user?.id);

      if (error) throw error;

      await fetchProfile();
      setEditingProfile(false);
      toast({
        title: "Perfil actualizado",
        description: "Tu perfil ha sido actualizado exitosamente",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el perfil",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const plans = [
    {
      name: 'Free',
      price: '$0',
      description: '7 días gratis para probar',
      features: ['1 canal de comunicación', '100 mensajes/mes', 'Soporte básico'],
      current: profile?.plan_type === 'free'
    },
    {
      name: 'Professional',
      price: '$29',
      description: 'Perfecto para pequeñas empresas',
      features: ['3 canales de comunicación', '1,000 mensajes/mes', 'IA personalizada', 'Soporte prioritario'],
      current: profile?.plan_type === 'professional'
    },
    {
      name: 'Enterprise',
      price: '$99',
      description: 'Para empresas en crecimiento',
      features: ['Canales ilimitados', 'Mensajes ilimitados', 'IA avanzada', 'Soporte 24/7', 'API personalizada'],
      current: profile?.plan_type === 'enterprise'
    }
  ];

  const getPlanColor = (planType: string) => {
    switch (planType) {
      case 'free': return 'bg-gray-100 text-gray-800';
      case 'professional': return 'bg-blue-100 text-blue-800';
      case 'enterprise': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Mi Perfil</h1>
        <Badge className={getPlanColor(profile?.plan_type || 'free')}>
          Plan {profile?.plan_type?.charAt(0).toUpperCase()}{profile?.plan_type?.slice(1)}
        </Badge>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User2 className="h-4 w-4" />
            Datos
          </TabsTrigger>
          <TabsTrigger value="subscription" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Suscripción
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notificaciones
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Seguridad
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Información Personal</CardTitle>
              <Button
                variant={editingProfile ? "default" : "outline"}
                onClick={() => editingProfile ? updateProfile() : setEditingProfile(true)}
                disabled={loading}
              >
                {editingProfile ? (loading ? 'Guardando...' : 'Guardar') : 'Editar'}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company">Nombre de la Empresa</Label>
                  <Input
                    id="company"
                    value={profileData.company_name}
                    onChange={(e) => setProfileData(prev => ({ ...prev, company_name: e.target.value }))}
                    disabled={!editingProfile}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                    disabled={!editingProfile}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  value={profileData.phone}
                  onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                  disabled={!editingProfile}
                  placeholder="+1234567890"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Estado de la Cuenta</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                {profile?.is_active ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-green-600 font-medium">Cuenta Activa</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <span className="text-red-600 font-medium">Cuenta Inactiva</span>
                  </>
                )}
              </div>
              {profile?.subscription_start && (
                <p className="text-sm text-gray-500 mt-2">
                  Suscripción iniciada: {new Date(profile.subscription_start).toLocaleDateString()}
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscription" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Plan Actual</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-semibold text-lg">
                    Plan {profile?.plan_type?.charAt(0).toUpperCase()}{profile?.plan_type?.slice(1)}
                  </h3>
                  <p className="text-gray-500">
                    {plans.find(p => p.current)?.description}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">
                    {plans.find(p => p.current)?.price}/mes
                  </div>
                  {profile?.subscription_end && (
                    <p className="text-sm text-gray-500">
                      Vence: {new Date(profile.subscription_end).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <Card key={plan.name} className={plan.current ? 'ring-2 ring-blue-500' : ''}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    {plan.current && <Badge>Actual</Badge>}
                  </div>
                  <div className="text-2xl font-bold">{plan.price}<span className="text-sm font-normal">/mes</span></div>
                  <p className="text-gray-500">{plan.description}</p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mb-4">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  {!plan.current && (
                    <Button className="w-full">
                      Cambiar a {plan.name}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Historial de Pagos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No hay historial de pagos disponible</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Preferencias de Notificaciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Nuevos mensajes</h4>
                  <p className="text-sm text-gray-500">Recibir notificaciones por nuevos mensajes</p>
                </div>
                <input type="checkbox" className="toggle" defaultChecked />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Límites de plan</h4>
                  <p className="text-sm text-gray-500">Avisos cuando te acerques a los límites</p>
                </div>
                <input type="checkbox" className="toggle" defaultChecked />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Actualizaciones del producto</h4>
                  <p className="text-sm text-gray-500">Noticias sobre nuevas funciones</p>
                </div>
                <input type="checkbox" className="toggle" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Seguridad de la Cuenta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Cambiar contraseña</h4>
                  <p className="text-sm text-gray-500">Actualizar tu contraseña de acceso</p>
                </div>
                <Button variant="outline">Cambiar</Button>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Autenticación de dos factores</h4>
                  <p className="text-sm text-gray-500">Agregar una capa extra de seguridad</p>
                </div>
                <Button variant="outline">Configurar</Button>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Sesiones activas</h4>
                  <p className="text-sm text-gray-500">Ver y gestionar dispositivos conectados</p>
                </div>
                <Button variant="outline">Ver sesiones</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProfileView;
