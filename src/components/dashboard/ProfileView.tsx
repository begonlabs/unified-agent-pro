
import React, { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  User as UserIcon, 
  Mail, 
  Phone, 
  Building, 
  Calendar,
  Edit,
  Save,
  Camera,
  Shield,
  Settings
} from 'lucide-react';

interface ProfileViewProps {
  user: User | null;
}

const ProfileView = ({ user }: ProfileViewProps) => {
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.user_metadata?.name || '',
    company: user?.user_metadata?.company || '',
    phone: user?.user_metadata?.phone || '',
    bio: user?.user_metadata?.bio || ''
  });
  const { toast } = useToast();

  const handleSave = () => {
    // Aquí iría la lógica para actualizar el perfil
    setEditing(false);
    toast({
      title: "Perfil actualizado",
      description: "Tu información ha sido guardada exitosamente.",
    });
  };

  const userInitials = user?.user_metadata?.name
    ? user.user_metadata.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()
    : user?.email?.substring(0, 2).toUpperCase() || 'US';

  return (
    <div className="p-6 space-y-6 bg-zinc-900 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-mono font-black uppercase tracking-widest text-white mb-2">Mi Perfil</h1>
        <p className="text-zinc-400 font-mono tracking-wide">
          Gestiona tu información personal y configuración de cuenta
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <Card className="lg:col-span-2 bg-zinc-800/50 border-zinc-700 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="h-20 w-20 border-2 border-zinc-600">
                    <AvatarImage src={user?.user_metadata?.avatar_url} />
                    <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xl font-mono font-bold">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <Button size="sm" className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-zinc-700 hover:bg-zinc-600 border border-zinc-600">
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
                <div>
                  <CardTitle className="text-2xl font-mono text-white uppercase tracking-wider">
                    {user?.user_metadata?.name || 'Usuario'}
                  </CardTitle>
                  <CardDescription className="text-zinc-400 font-mono flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {user?.email}
                  </CardDescription>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className="bg-green-600 text-white font-mono">
                      <Shield className="h-3 w-3 mr-1" />
                      Usuario Activo
                    </Badge>
                    <Badge variant="outline" className="border-zinc-600 text-zinc-300 font-mono">
                      Miembro desde {new Date(user?.created_at || '').getFullYear()}
                    </Badge>
                  </div>
                </div>
              </div>
              <Button
                onClick={() => editing ? handleSave() : setEditing(true)}
                className={editing 
                  ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700" 
                  : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                }
              >
                {editing ? (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Guardar
                  </>
                ) : (
                  <>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-zinc-300 font-mono uppercase tracking-wider">Nombre Completo</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={!editing}
                  className="bg-zinc-700/50 border-zinc-600 text-white placeholder:text-zinc-400 font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company" className="text-zinc-300 font-mono uppercase tracking-wider">Empresa</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  disabled={!editing}
                  className="bg-zinc-700/50 border-zinc-600 text-white placeholder:text-zinc-400 font-mono"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-zinc-300 font-mono uppercase tracking-wider">Teléfono</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                disabled={!editing}
                className="bg-zinc-700/50 border-zinc-600 text-white placeholder:text-zinc-400 font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio" className="text-zinc-300 font-mono uppercase tracking-wider">Biografía</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                disabled={!editing}
                className="min-h-[100px] bg-zinc-700/50 border-zinc-600 text-white placeholder:text-zinc-400 font-mono"
                placeholder="Cuéntanos un poco sobre ti..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Account Info */}
        <div className="space-y-6">
          <Card className="bg-zinc-800/50 border-zinc-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="font-mono text-white uppercase tracking-wider flex items-center gap-2">
                <UserIcon className="h-5 w-5" />
                Información de Cuenta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-zinc-700/50 rounded-sm">
                  <Mail className="h-4 w-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-mono font-medium text-white">Email</p>
                  <p className="text-sm text-zinc-400 font-mono">{user?.email}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="p-2 bg-zinc-700/50 rounded-sm">
                  <Calendar className="h-4 w-4 text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-mono font-medium text-white">Miembro desde</p>
                  <p className="text-sm text-zinc-400 font-mono">
                    {new Date(user?.created_at || '').toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-zinc-700/50 rounded-sm">
                  <Shield className="h-4 w-4 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-mono font-medium text-white">Estado</p>
                  <p className="text-sm text-green-400 font-mono">Verificado</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-800/50 border-zinc-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="font-mono text-white uppercase tracking-wider flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configuración
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start border-zinc-600 text-zinc-300 hover:text-white hover:border-zinc-500 font-mono">
                Cambiar Contraseña
              </Button>
              <Button variant="outline" className="w-full justify-start border-zinc-600 text-zinc-300 hover:text-white hover:border-zinc-500 font-mono">
                Notificaciones
              </Button>
              <Button variant="outline" className="w-full justify-start border-zinc-600 text-zinc-300 hover:text-white hover:border-zinc-500 font-mono">
                Privacidad
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfileView;
