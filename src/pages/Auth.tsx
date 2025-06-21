
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Bot, BarChart3, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/dashboard');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        navigate('/dashboard');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      toast({
        title: "¡Bienvenido de vuelta!",
        description: "Has iniciado sesión exitosamente.",
      });
    } catch (error: any) {
      toast({
        title: "Error al iniciar sesión",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            company_name: companyName,
          }
        }
      });

      if (error) throw error;

      toast({
        title: "¡Registro exitoso!",
        description: "Te has registrado correctamente. Revisa tu email para confirmar tu cuenta.",
      });
    } catch (error: any) {
      toast({
        title: "Error en el registro",
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
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-purple-600/10 to-blue-600/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
        {/* Hero Section */}
        <div className="text-center lg:text-left space-y-8">
          <Badge className="mb-6 bg-zinc-800/50 text-blue-400 border-blue-500/30 hover:bg-zinc-700/50 hover:border-blue-400 transition-all duration-300 backdrop-blur-sm">
            <span className="font-mono text-xs tracking-wider">🚀 7 DÍAS GRATIS + 50% DESCUENTO</span>
          </Badge>

          <div className="flex items-center justify-center lg:justify-start gap-4 mb-8">
            <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-sm">
              <MessageSquare className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-black uppercase tracking-widest text-white">CHATBOT AI</h1>
          </div>
          
          <h2 className="text-4xl lg:text-5xl font-black uppercase tracking-widest text-white leading-tight">
            <span className="block">CENTRALIZA</span>
            <span className="block text-transparent bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text">Y AUTOMATIZA</span>
            <span className="block text-transparent bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text">TUS CONVERSACIONES</span>
          </h2>
          
          <p className="text-lg font-mono text-zinc-300 leading-relaxed tracking-wide opacity-80">
            Unifica WhatsApp, Facebook e Instagram en una sola plataforma con inteligencia artificial avanzada
          </p>

          <div className="grid grid-cols-3 gap-4 pt-8">
            <div className="text-center group cursor-pointer">
              <div className="p-4 bg-zinc-800/50 rounded-sm border border-zinc-700 group-hover:border-blue-500/50 transition-all duration-300">
                <MessageSquare className="h-6 w-6 text-blue-400 mx-auto mb-2" />
                <p className="text-xs font-mono text-zinc-400 uppercase tracking-wider">OMNICANAL</p>
              </div>
            </div>
            <div className="text-center group cursor-pointer">
              <div className="p-4 bg-zinc-800/50 rounded-sm border border-zinc-700 group-hover:border-emerald-500/50 transition-all duration-300">
                <Bot className="h-6 w-6 text-emerald-400 mx-auto mb-2" />
                <p className="text-xs font-mono text-zinc-400 uppercase tracking-wider">IA AVANZADA</p>
              </div>
            </div>
            <div className="text-center group cursor-pointer">
              <div className="p-4 bg-zinc-800/50 rounded-sm border border-zinc-700 group-hover:border-violet-500/50 transition-all duration-300">
                <BarChart3 className="h-6 w-6 text-violet-400 mx-auto mb-2" />
                <p className="text-xs font-mono text-zinc-400 uppercase tracking-wider">ANALYTICS</p>
              </div>
            </div>
          </div>
        </div>

        {/* Auth Form */}
        <Card className="w-full max-w-md mx-auto bg-zinc-800/50 border-zinc-700 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-black uppercase tracking-widest text-white">
              COMIENZA GRATIS
            </CardTitle>
            <CardDescription className="font-mono text-zinc-400 tracking-wide">
              7 días gratis + descuentos en los primeros 3 meses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-zinc-700/50">
                <TabsTrigger value="signin" className="font-mono tracking-wider uppercase text-xs data-[state=active]:bg-zinc-600 data-[state=active]:text-white">
                  INICIAR SESIÓN
                </TabsTrigger>
                <TabsTrigger value="signup" className="font-mono tracking-wider uppercase text-xs data-[state=active]:bg-zinc-600 data-[state=active]:text-white">
                  REGISTRARSE
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin" className="space-y-6 mt-6">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div>
                    <Input
                      type="email"
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-zinc-700/50 border-zinc-600 text-white placeholder:text-zinc-400 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <Input
                      type="password"
                      placeholder="Contraseña"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="bg-zinc-700/50 border-zinc-600 text-white placeholder:text-zinc-400 focus:border-blue-500"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-mono tracking-wider uppercase transition-all duration-300"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        INICIANDO...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        INICIAR SESIÓN
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    )}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup" className="space-y-6 mt-6">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div>
                    <Input
                      type="text"
                      placeholder="Nombre de la empresa"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      required
                      className="bg-zinc-700/50 border-zinc-600 text-white placeholder:text-zinc-400 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <Input
                      type="email"
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-zinc-700/50 border-zinc-600 text-white placeholder:text-zinc-400 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <Input
                      type="password"
                      placeholder="Contraseña"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="bg-zinc-700/50 border-zinc-600 text-white placeholder:text-zinc-400 focus:border-blue-500"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-mono tracking-wider uppercase transition-all duration-300"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        REGISTRANDO...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        CREAR CUENTA GRATIS
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Floating elements */}
      <div className="absolute top-20 left-10 w-2 h-2 bg-blue-400 rounded-full animate-pulse opacity-60"></div>
      <div className="absolute bottom-20 right-10 w-3 h-3 bg-purple-400 rounded-full animate-pulse opacity-40"></div>
      <div className="absolute top-1/3 right-20 w-1 h-1 bg-white rounded-full animate-pulse opacity-30"></div>
    </div>
  );
};

export default Auth;
