
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Lock, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const AdminAuth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Verificar si ya hay una sesión de admin
    const checkAdminSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Verificar si el usuario es admin
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .eq('role', 'admin')
          .maybeSingle();

        if (roleData) {
          navigate('/admin');
        }
      }
    };

    checkAdminSession();
  }, [navigate]);

  const handleAdminSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Intentar login
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        // Verificar que el usuario tenga rol de admin
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', data.user.id)
          .eq('role', 'admin')
          .maybeSingle();

        if (roleError) {
          console.error('Error checking admin role:', roleError);
          throw new Error('Error al verificar permisos');
        }

        if (!roleData) {
          // No es admin, cerrar sesión inmediatamente
          await supabase.auth.signOut();
          throw new Error('Acceso denegado. Solo administradores pueden acceder.');
        }

        // Es admin, redirigir al panel
        toast({
          title: "Acceso autorizado",
          description: "Bienvenido al panel de administración.",
        });

        navigate('/admin');
      }
    } catch (error: any) {
      toast({
        title: "Error de acceso",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-900/50 to-zinc-950"></div>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-red-600/10 to-orange-600/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-orange-600/10 to-red-600/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-r from-red-600 to-orange-600 rounded-sm">
              <MessageSquare className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-black uppercase tracking-widest text-white">CHATBOT AI</h1>
          </div>
          
          <Badge className="bg-zinc-800/50 text-red-400 border-red-500/30 backdrop-blur-sm">
            <span className="font-mono text-xs tracking-wider uppercase">🔒 ACCESO ADMINISTRATIVO</span>
          </Badge>
        </div>

        <Card className="shadow-2xl border-zinc-700 bg-zinc-800/50 backdrop-blur-sm">
          <CardHeader className="text-center bg-gradient-to-r from-red-600/20 to-orange-600/20 rounded-t-lg border-b border-zinc-700">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 bg-gradient-to-r from-red-600 to-orange-600 rounded-sm">
                <Shield className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-black uppercase tracking-widest text-white">
              PANEL DE ADMINISTRACIÓN
            </CardTitle>
            <CardDescription className="font-mono text-zinc-400 tracking-wide">
              Acceso restringido solo para administradores
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-8">
            <form onSubmit={handleAdminSignIn} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-mono font-medium text-zinc-300 mb-2 block uppercase tracking-wider">
                    Email de Administrador
                  </label>
                  <Input
                    type="email"
                    placeholder="admin@ejemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-zinc-700/50 border-zinc-600 text-white placeholder:text-zinc-400 focus:border-red-500"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-mono font-medium text-zinc-300 mb-2 block uppercase tracking-wider">
                    Contraseña
                  </label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-zinc-700/50 border-zinc-600 text-white placeholder:text-zinc-400 focus:border-red-500"
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-mono tracking-wider uppercase transition-all duration-300"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    VERIFICANDO...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    ACCEDER AL PANEL
                  </div>
                )}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-zinc-700 text-center">
              <p className="text-sm font-mono text-zinc-400 tracking-wide">
                ¿No eres administrador?{' '}
                <button
                  onClick={() => navigate('/auth')}
                  className="text-red-400 hover:text-red-300 font-medium border-b border-transparent hover:border-red-400 transition-all duration-300"
                >
                  Ir al login de usuarios
                </button>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <div className="flex items-center justify-center gap-2 text-red-400">
            <Shield className="h-4 w-4" />
            <span className="text-sm font-mono font-medium uppercase tracking-wider">Sistema de acceso seguro</span>
          </div>
        </div>
      </div>

      {/* Floating elements */}
      <div className="absolute top-20 left-10 w-2 h-2 bg-red-400 rounded-full animate-pulse opacity-60"></div>
      <div className="absolute bottom-20 right-10 w-3 h-3 bg-orange-400 rounded-full animate-pulse opacity-40"></div>
      <div className="absolute top-1/3 right-20 w-1 h-1 bg-white rounded-full animate-pulse opacity-30"></div>
    </div>
  );
};

export default AdminAuth;
