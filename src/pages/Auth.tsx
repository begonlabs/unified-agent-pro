import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, 
  Bot, 
  BarChart3, 
  Zap, 
  Shield, 
  Sparkles,
  CheckCircle,
  ArrowRight,
  Mail,
  Lock,
  Building,
  Eye,
  EyeOff,
  ArrowLeft
} from 'lucide-react';
import logoWhite from '@/assets/logo_white.png';
import { useToast } from '@/hooks/use-toast';
import { prepareForSignIn } from '@/lib/utils';
import { Link } from 'react-router-dom';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  // Password validation functions
  const getPasswordStrength = (password: string) => {
    let score = 0;
    const requirements = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    Object.values(requirements).forEach(req => {
      if (req) score++;
    });

    return { score, requirements };
  };

  const getPasswordStrengthColor = (score: number) => {
    if (score <= 2) return 'bg-red-500';
    if (score <= 3) return 'bg-yellow-500';
    if (score <= 4) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = (score: number) => {
    if (score <= 2) return 'Débil';
    if (score <= 3) return 'Regular';
    if (score <= 4) return 'Buena';
    return 'Fuerte';
  };

  useEffect(() => {
    console.log('Auth component mounted, checking session...');
    
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log('Session check result:', { session: session?.user?.email, error });
      if (session) {
        navigate('/dashboard');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      if (event === 'SIGNED_IN' && session) {
        navigate('/dashboard');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Attempting sign in with email:', email);
    setLoading(true);

    try {
      // Preparar para login limpio
      await prepareForSignIn();
      
      console.log('Calling supabase.auth.signInWithPassword...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('Sign in response:', { data: data?.user?.email, error });

      if (error) {
        console.error('Sign in error:', error);
        
        // Manejo específico de errores
        let errorMessage = "Error desconocido";
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = "Email o contraseña incorrectos";
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = "Por favor confirma tu email antes de iniciar sesión";
        } else if (error.message.includes('Too many requests')) {
          errorMessage = "Demasiados intentos. Intenta de nuevo en unos minutos";
        } else {
          errorMessage = error.message;
        }
        
        throw new Error(errorMessage);
      }
      
      if (data.user) {
        console.log('Sign in successful, forcing page reload for clean state');
        toast({
          title: "¡Bienvenido de vuelta!",
          description: "Has iniciado sesión exitosamente.",
        });
        
        // Forzar recarga completa para estado limpio
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 500);
      }
    } catch (error: unknown) {
      console.error('Sign in catch block:', error);
      toast({
        title: "Error al iniciar sesión",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Attempting sign up with email:', email, 'company:', companyName);
    
    // Validate password confirmation
    if (password !== confirmPassword) {
      toast({
        title: "Error en la contraseña",
        description: "Las contraseñas no coinciden",
        variant: "destructive",
      });
      return;
    }

    // Validate password strength
    const { score, requirements } = getPasswordStrength(password);
    if (score < 4) {
      toast({
        title: "Contraseña muy débil",
        description: "La contraseña debe cumplir todos los requisitos de seguridad",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Preparar para registro limpio
      await prepareForSignIn();
      
      console.log('Calling supabase.auth.signUp...');
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            company_name: companyName,
          }
        }
      });

      console.log('Sign up response:', { data: data?.user?.email, error });

      if (error) {
        console.error('Sign up error:', error);
        
        // Manejo específico de errores de registro
        let errorMessage = "Error desconocido";
        if (error.message.includes('User already registered')) {
          errorMessage = "Este email ya está registrado. Intenta iniciar sesión";
        } else if (error.message.includes('Password should be at least')) {
          errorMessage = "La contraseña debe tener al menos 6 caracteres";
        } else if (error.message.includes('Invalid email')) {
          errorMessage = "El formato del email no es válido";
        } else {
          errorMessage = error.message;
        }
        
        throw new Error(errorMessage);
      }

      console.log('Sign up successful');
      
      // Mensaje diferente dependiendo si necesita confirmación
      const needsConfirmation = !data.user?.email_confirmed_at;
      
      toast({
        title: "¡Registro exitoso!",
        description: needsConfirmation 
          ? "Te has registrado correctamente. Revisa tu email para confirmar tu cuenta."
          : "Te has registrado correctamente. Puedes iniciar sesión ahora.",
      });

      // Si no necesita confirmación, cambiar a tab de login
      if (!needsConfirmation) {
        setTimeout(() => {
          const signInTab = document.querySelector('[value="signin"]') as HTMLElement;
          signInTab?.click();
        }, 1000);
      }
      
    } catch (error: unknown) {
      console.error('Sign up catch block:', error);
      toast({
        title: "Error en el registro",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Attempting password reset for email:', forgotPasswordEmail);
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotPasswordEmail, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        console.error('Password reset error:', error);
        throw new Error(error.message);
      }

      toast({
        title: "Email enviado",
        description: "Revisa tu correo electrónico para restablecer tu contraseña.",
      });

      // Volver al formulario de login
      setShowForgotPassword(false);
      setForgotPasswordEmail('');
      
    } catch (error: unknown) {
      console.error('Forgot password catch block:', error);
      toast({
        title: "Error al enviar email",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Elementos de fondo decorativos */}
      <div className="absolute inset-0">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
          </div>
          
      {/* Botón de vuelta */}
      <Link 
        to="/" 
        className="fixed top-6 left-6 z-50 group"
      >
        <button className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-lg rounded-full border border-white/20 hover:border-white/40 text-white transition-all duration-300 hover:scale-105">
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          <span className="text-sm font-medium">Volver al inicio</span>
        </button>
      </Link>

      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Hero Section */}
          <div className="text-center lg:text-left space-y-8">
            {/* Logo y Marca */}
            <div className="flex items-center justify-center lg:justify-start gap-4 mb-8">
              <div className="relative">
                <img src={logoWhite} alt="OndAI Logo" className="h-16 w-16 rounded-lg" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  OndAI
                </h1>
                <p className="text-sm text-gray-400 font-medium">Powered by AI</p>
              </div>
            </div>
            
            {/* Título Principal */}
            <div className="space-y-4">
              <Badge className="bg-gradient-to-r from-[#3a0caa]/20 to-[#710db2]/20 text-[#3a0caa] border-[#3a0caa]/30 px-4 py-1">
                Revoluciona tu comunicación empresarial
              </Badge>
              <h2 className="text-4xl lg:text-6xl font-bold text-white leading-tight">
                Centraliza y 
                <span className="bg-gradient-to-r from-[#3a0caa] to-[#710db2] bg-clip-text text-transparent"> automatiza </span>
                tus conversaciones
              </h2>
              <p className="text-xl text-gray-300 leading-relaxed">
                Unifica WhatsApp, Facebook e Instagram en una sola plataforma con inteligencia artificial de última generación
              </p>
            </div>

            {/* Características destacadas */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8">
              <div className="group hover:scale-105 transition-transform duration-300">
                <div className="p-6 bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 hover:border-purple-400/50 transition-colors">
                  <div className="p-3 bg-gradient-to-r from-[#3a0caa] to-[#710db2] rounded-lg w-fit mb-4 group-hover:scale-110 transition-transform">
                    <MessageSquare className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-white mb-2">Omnicanal</h3>
                  <p className="text-gray-300 text-sm">Gestiona todos tus canales desde un solo lugar</p>
                </div>
              </div>
              
              <div className="group hover:scale-105 transition-transform duration-300">
                <div className="p-6 bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 hover:border-purple-400/50 transition-colors">
                  <div className="p-3 bg-gradient-to-r from-[#710db2] to-[#3a0caa] rounded-lg w-fit mb-4 group-hover:scale-110 transition-transform">
                    <Bot className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-white mb-2">IA Avanzada</h3>
                  <p className="text-gray-300 text-sm">Respuestas inteligentes y automatización completa</p>
                </div>
              </div>
              
              <div className="group hover:scale-105 transition-transform duration-300">
                <div className="p-6 bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 hover:border-purple-400/50 transition-colors">
                  <div className="p-3 bg-gradient-to-r from-[#3a0caa] to-[#710db2] rounded-lg w-fit mb-4 group-hover:scale-110 transition-transform">
                    <BarChart3 className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-white mb-2">Analytics</h3>
                  <p className="text-gray-300 text-sm">Métricas avanzadas y reportes detallados</p>
                </div>
              </div>
            </div>

            {/* Beneficios adicionales */}
            <div className="space-y-3 pt-6">
              <div className="flex items-center gap-3 text-gray-300">
                <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
                <span>Configuración en menos de 5 minutos</span>
              </div>
              <div className="flex items-center gap-3 text-gray-300">
                <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
                <span>Soporte 24/7 en español</span>
              </div>
              <div className="flex items-center gap-3 text-gray-300">
                <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
                <span>Sin permanencia, cancela cuando quieras</span>
            </div>
          </div>
        </div>

        {/* Auth Form */}
          <div className="flex justify-center lg:justify-end">
            <Card className="w-full max-w-md bg-white/95 backdrop-blur-lg shadow-2xl border-0">
              <CardHeader className="text-center space-y-2 pb-8">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <div className="p-1.5 rounded-lg bg-gradient-to-r from-[#3a0caa] to-[#710db2]">
                    <Zap className="h-4 w-4 text-white" />
                  </div>
                  <Badge className="bg-gradient-to-r from-[#3a0caa]/10 to-[#710db2]/10 text-[#3a0caa] border-[#3a0caa]/20 px-3 py-1">
                    Prueba Gratuita
                  </Badge>
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900">
                  Comienza ahora
                </CardTitle>
                <CardDescription className="text-gray-600">
                  7 días gratis • No se requiere tarjeta de crédito
            </CardDescription>
          </CardHeader>
              
              <CardContent className="space-y-6">
            <Tabs defaultValue="signin" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-gray-100">
                    <TabsTrigger value="signin" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                      Iniciar Sesión
                    </TabsTrigger>
                    <TabsTrigger value="signup" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                      Registrarse
                    </TabsTrigger>
              </TabsList>
              
                  <TabsContent value="signin" className="space-y-4 mt-6">
                <form onSubmit={handleSignIn} className="space-y-4">
                      <div className="space-y-2">
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="email"
                            placeholder="tu@empresa.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                            className="pl-10 h-12 border-gray-200 focus:border-purple-400"
                      required
                    />
                  </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Tu contraseña"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                            className="pl-10 pr-10 h-12 border-gray-200 focus:border-purple-400"
                      required
                    />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      
                      {/* Forgot Password Link */}
                      <div className="text-right">
                        <button
                          type="button"
                          onClick={() => setShowForgotPassword(true)}
                          className="text-sm text-[#3a0caa] hover:text-[#710db2] font-medium transition-colors"
                        >
                          ¿Olvidaste tu contraseña?
                        </button>
                      </div>
                      
                      <Button 
                        type="submit" 
                        className="w-full h-12 bg-gradient-to-r from-[#3a0caa] to-[#710db2] hover:from-[#270a59] hover:to-[#2b0a63] text-white font-semibold"
                        disabled={loading}
                      >
                        {loading ? (
                          <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Iniciando...
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            Iniciar Sesión
                            <ArrowRight className="h-4 w-4" />
                  </div>
                        )}
                  </Button>
                </form>
              </TabsContent>
              
                  <TabsContent value="signup" className="space-y-4 mt-6">
                <form onSubmit={handleSignUp} className="space-y-4">
                      <div className="space-y-2">
                        <div className="relative">
                          <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="text"
                            placeholder="Nombre de tu empresa"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                            className="pl-10 h-12 border-gray-200 focus:border-purple-400"
                      required
                    />
                  </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="email"
                            placeholder="tu@empresa.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                            className="pl-10 h-12 border-gray-200 focus:border-purple-400"
                      required
                    />
                  </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Crea una contraseña segura"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                            className="pl-10 pr-10 h-12 border-gray-200 focus:border-purple-400"
                      required
                    />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        
                        {/* Password Strength Meter */}
                        {password && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor(getPasswordStrength(password).score)}`}
                                  style={{ width: `${(getPasswordStrength(password).score / 5) * 100}%` }}
                                ></div>
                              </div>
                              <span className="text-xs font-medium text-gray-600">
                                {getPasswordStrengthText(getPasswordStrength(password).score)}
                              </span>
                            </div>
                            
                            {/* Password Requirements */}
                            <div className="grid grid-cols-2 gap-1 text-xs">
                              <div className={`flex items-center gap-1 ${getPasswordStrength(password).requirements.length ? 'text-green-600' : 'text-gray-400'}`}>
                                <CheckCircle className="h-3 w-3" />
                                <span>Mínimo 8 caracteres</span>
                              </div>
                              <div className={`flex items-center gap-1 ${getPasswordStrength(password).requirements.lowercase ? 'text-green-600' : 'text-gray-400'}`}>
                                <CheckCircle className="h-3 w-3" />
                                <span>Letra minúscula</span>
                              </div>
                              <div className={`flex items-center gap-1 ${getPasswordStrength(password).requirements.uppercase ? 'text-green-600' : 'text-gray-400'}`}>
                                <CheckCircle className="h-3 w-3" />
                                <span>Letra mayúscula</span>
                              </div>
                              <div className={`flex items-center gap-1 ${getPasswordStrength(password).requirements.number ? 'text-green-600' : 'text-gray-400'}`}>
                                <CheckCircle className="h-3 w-3" />
                                <span>Número</span>
                              </div>
                              <div className={`flex items-center gap-1 col-span-2 ${getPasswordStrength(password).requirements.special ? 'text-green-600' : 'text-gray-400'}`}>
                                <CheckCircle className="h-3 w-3" />
                                <span>Carácter especial</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Confirm Password Field */}
                      <div className="space-y-2">
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                            type={showConfirmPassword ? 'text' : 'password'}
                            placeholder="Confirma tu contraseña"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                            className="pl-10 pr-10 h-12 border-gray-200 focus:border-purple-400"
                      required
                    />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        
                        {/* Password Match Indicator */}
                        {confirmPassword && (
                          <div className={`flex items-center gap-1 text-xs ${password === confirmPassword ? 'text-green-600' : 'text-red-500'}`}>
                            <CheckCircle className="h-3 w-3" />
                            <span>{password === confirmPassword ? 'Las contraseñas coinciden' : 'Las contraseñas no coinciden'}</span>
                          </div>
                        )}
                      </div>
                      
                      <Button 
                        type="submit" 
                        className="w-full h-12 bg-gradient-to-r from-[#710db2] to-[#3a0caa] hover:from-[#2b0a63] hover:to-[#270a59] text-white font-semibold"
                        disabled={loading || password !== confirmPassword || getPasswordStrength(password).score < 4}
                      >
                        {loading ? (
                          <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Creando cuenta...
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4" />
                            Crear Cuenta Gratis
                  </div>
                        )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

                {/* Trust indicators */}
                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      <span>Seguro</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      <span>Rápido</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      <span>Confiable</span>
                    </div>
                  </div>
                </div>
          </CardContent>
        </Card>
      </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-white shadow-2xl">
            <CardHeader className="text-center space-y-2">
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-gradient-to-r from-[#3a0caa] to-[#710db2]">
                  <Lock className="h-5 w-5 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-gray-900">
                  Restablecer Contraseña
                </CardTitle>
              </div>
              <CardDescription className="text-gray-600">
                Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="email"
                      placeholder="tu@empresa.com"
                      value={forgotPasswordEmail}
                      onChange={(e) => setForgotPasswordEmail(e.target.value)}
                      className="pl-10 h-12 border-gray-200 focus:border-purple-400"
                      required
                    />
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setForgotPasswordEmail('');
                    }}
                    className="flex-1 h-12"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 h-12 bg-gradient-to-r from-[#3a0caa] to-[#710db2] hover:from-[#270a59] hover:to-[#2b0a63] text-white font-semibold"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Enviando...
                      </div>
                    ) : (
                      'Enviar Email'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Animaciones CSS - agregadas al componente como classes de Tailwind personalizadas */}
      <style>
        {`
          @keyframes blob {
            0% {
              transform: translate(0px, 0px) scale(1);
            }
            33% {
              transform: translate(30px, -50px) scale(1.1);
            }
            66% {
              transform: translate(-20px, 20px) scale(0.9);
            }
            100% {
              transform: translate(0px, 0px) scale(1);
            }
          }
          .animate-blob {
            animation: blob 7s infinite;
          }
          .animation-delay-2000 {
            animation-delay: 2s;
          }
          .animation-delay-4000 {
            animation-delay: 4s;
          }
        `}
      </style>
    </div>
  );
};

export default Auth;
