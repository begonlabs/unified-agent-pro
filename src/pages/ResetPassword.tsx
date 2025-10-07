import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  ArrowLeft,
  Shield
} from 'lucide-react';
import logoWhite from '@/assets/logo_white.png';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
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
    // Verificar si hay parámetros de acceso en la URL
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');
    
    if (accessToken && refreshToken) {
      // Establecer la sesión con los tokens de recuperación
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      }).then(({ error }) => {
        if (error) {
          console.error('Error setting session:', error);
          toast({
            title: "Error de sesión",
            description: "El enlace de recuperación no es válido o ha expirado.",
            variant: "destructive",
          });
          navigate('/auth');
        }
      });
    } else {
      // Si no hay tokens, verificar si ya hay una sesión activa
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session) {
          toast({
            title: "Acceso no autorizado",
            description: "Debes acceder desde el enlace enviado por email.",
            variant: "destructive",
          });
          navigate('/auth');
        }
      });
    }
  }, [searchParams, navigate, toast]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
    const { score } = getPasswordStrength(password);
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
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        console.error('Password reset error:', error);
        throw new Error(error.message);
      }

      toast({
        title: "¡Contraseña actualizada!",
        description: "Tu contraseña ha sido restablecida exitosamente.",
      });

      // Redirigir al dashboard después de un breve delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
      
    } catch (error: unknown) {
      console.error('Reset password catch block:', error);
      toast({
        title: "Error al restablecer contraseña",
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
        to="/auth" 
        className="fixed top-6 left-6 z-50 group"
      >
        <button className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-lg rounded-full border border-white/20 hover:border-white/40 text-white transition-all duration-300 hover:scale-105">
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          <span className="text-sm font-medium">Volver al login</span>
        </button>
      </Link>

      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="bg-white/95 backdrop-blur-lg shadow-2xl border-0">
            <CardHeader className="text-center space-y-2 pb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="relative">
                  <img src={logoWhite} alt="OndAI Logo" className="h-12 w-12 rounded-lg" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-[#3a0caa] to-[#710db2] bg-clip-text text-transparent">
                    OndAI
                  </h1>
                </div>
              </div>
              
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-gradient-to-r from-[#3a0caa] to-[#710db2]">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-gray-900">
                  Restablecer Contraseña
                </CardTitle>
              </div>
              <CardDescription className="text-gray-600">
                Crea una nueva contraseña segura para tu cuenta
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Nueva contraseña"
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
                
                <div className="space-y-2">
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirma tu nueva contraseña"
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
                  className="w-full h-12 bg-gradient-to-r from-[#3a0caa] to-[#710db2] hover:from-[#270a59] hover:to-[#2b0a63] text-white font-semibold"
                  disabled={loading || password !== confirmPassword || getPasswordStrength(password).score < 4}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Restableciendo...
                    </div>
                  ) : (
                    'Restablecer Contraseña'
                  )}
                </Button>
              </form>

              {/* Trust indicators */}
              <div className="pt-4 border-t border-gray-100">
                <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    <span>Seguro</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    <span>Encriptado</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Animaciones CSS */}
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

export default ResetPassword;
