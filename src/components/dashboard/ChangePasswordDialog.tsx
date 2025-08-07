import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { 
  Eye, 
  EyeOff, 
  Key, 
  Lock, 
  CheckCircle, 
  AlertCircle,
  Shield
} from 'lucide-react';

interface ChangePasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface PasswordStrength {
  score: number;
  feedback: string[];
  color: string;
  text: string;
}

const ChangePasswordDialog = ({ open, onOpenChange }: ChangePasswordDialogProps) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  
  const { toast } = useToast();

  // Función para evaluar la fortaleza de la contraseña
  const evaluatePasswordStrength = (password: string): PasswordStrength => {
    if (!password) {
      return { score: 0, feedback: [], color: 'bg-gray-200', text: '' };
    }

    let score = 0;
    const feedback: string[] = [];

    // Longitud mínima
    if (password.length >= 8) {
      score += 1;
    } else {
      feedback.push('Debe tener al menos 8 caracteres');
    }

    // Incluye mayúsculas
    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Incluye al menos una letra mayúscula');
    }

    // Incluye minúsculas
    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Incluye al menos una letra minúscula');
    }

    // Incluye números
    if (/\d/.test(password)) {
      score += 1;
    } else {
      feedback.push('Incluye al menos un número');
    }

    // Incluye símbolos
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Incluye al menos un símbolo especial');
    }

    // Determinar color y texto
    let color, text;
    if (score <= 2) {
      color = 'bg-red-500';
      text = 'Débil';
    } else if (score <= 3) {
      color = 'bg-yellow-500';
      text = 'Regular';
    } else if (score <= 4) {
      color = 'bg-blue-500';
      text = 'Fuerte';
    } else {
      color = 'bg-green-500';
      text = 'Muy Fuerte';
    }

    return { score, feedback, color, text };
  };

  const passwordStrength = evaluatePasswordStrength(newPassword);

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    // Validar contraseña actual
    if (!currentPassword.trim()) {
      newErrors.currentPassword = 'La contraseña actual es requerida';
    }

    // Validar nueva contraseña
    if (!newPassword.trim()) {
      newErrors.newPassword = 'La nueva contraseña es requerida';
    } else if (newPassword.length < 8) {
      newErrors.newPassword = 'La nueva contraseña debe tener al menos 8 caracteres';
    } else if (passwordStrength.score < 3) {
      newErrors.newPassword = 'La contraseña debe ser más fuerte';
    }

    // Validar confirmación
    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = 'Confirma tu nueva contraseña';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    // Verificar que la nueva contraseña sea diferente
    if (currentPassword === newPassword) {
      newErrors.newPassword = 'La nueva contraseña debe ser diferente a la actual';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      // Obtener información del usuario actual
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.email) {
        throw new Error('No se pudo obtener el email del usuario');
      }

      // Método 1: Verificar contraseña actual mediante un sign in temporal
      // Crear una nueva instancia de Supabase para verificación
      const { createClient } = await import('@supabase/supabase-js');
      const tempSupabase = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY
      );

      // Verificar contraseña actual
      const { error: verificationError } = await tempSupabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (verificationError) {
        if (verificationError.message.includes('Invalid login credentials')) {
          setErrors({ currentPassword: 'La contraseña actual es incorrecta' });
        } else {
          setErrors({ currentPassword: 'Error al verificar la contraseña actual' });
        }
        return;
      }

      // Si llegamos aquí, la contraseña actual es correcta
      // Actualizar la contraseña usando la sesión principal
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) {
        throw updateError;
      }

      // Éxito
      toast({
        title: "✅ Contraseña actualizada",
        description: "Tu contraseña ha sido cambiada exitosamente. Por seguridad, se mantendrá tu sesión actual.",
      });

      // Limpiar formulario y cerrar dialog
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setErrors({});
      onOpenChange(false);

    } catch (error: any) {
      console.error('Error changing password:', error);
      
      if (error.message?.includes('Invalid login credentials')) {
        setErrors({ currentPassword: 'La contraseña actual es incorrecta' });
      } else if (error.message?.includes('Password should be at least')) {
        setErrors({ newPassword: 'La contraseña debe tener al menos 6 caracteres' });
      } else if (error.message?.includes('same as the old password')) {
        setErrors({ newPassword: 'La nueva contraseña debe ser diferente a la actual' });
      } else if (error.message?.includes('New password should be different')) {
        setErrors({ newPassword: 'La nueva contraseña debe ser diferente a la actual' });
      } else {
        toast({
          title: "Error al cambiar contraseña",
          description: error.message || 'Error desconocido al cambiar la contraseña',
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setErrors({});
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-blue-600" />
            Cambiar Contraseña
          </DialogTitle>
          <DialogDescription>
            Actualiza tu contraseña para mantener tu cuenta segura
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Contraseña Actual */}
          <div className="space-y-2">
            <Label htmlFor="current-password" className="text-sm font-medium">
              Contraseña Actual *
            </Label>
            <div className="relative">
              <Input
                id="current-password"
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={errors.currentPassword ? 'border-red-500' : ''}
                placeholder="Ingresa tu contraseña actual"
                disabled={loading}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                disabled={loading}
              >
                {showCurrentPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-500" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-500" />
                )}
              </Button>
            </div>
            {errors.currentPassword && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.currentPassword}
              </p>
            )}
          </div>

          {/* Nueva Contraseña */}
          <div className="space-y-2">
            <Label htmlFor="new-password" className="text-sm font-medium">
              Nueva Contraseña *
            </Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={errors.newPassword ? 'border-red-500' : ''}
                placeholder="Ingresa tu nueva contraseña"
                disabled={loading}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowNewPassword(!showNewPassword)}
                disabled={loading}
              >
                {showNewPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-500" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-500" />
                )}
              </Button>
            </div>
            
            {/* Indicador de fortaleza */}
            {newPassword && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Fortaleza:</span>
                  <span className={`text-xs font-medium ${
                    passwordStrength.score <= 2 ? 'text-red-600' :
                    passwordStrength.score <= 3 ? 'text-yellow-600' :
                    passwordStrength.score <= 4 ? 'text-blue-600' : 'text-green-600'
                  }`}>
                    {passwordStrength.text}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                    style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                  />
                </div>
                {passwordStrength.feedback.length > 0 && (
                  <ul className="text-xs text-gray-500 space-y-1">
                    {passwordStrength.feedback.map((item, index) => (
                      <li key={index} className="flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            
            {errors.newPassword && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.newPassword}
              </p>
            )}
          </div>

          {/* Confirmar Contraseña */}
          <div className="space-y-2">
            <Label htmlFor="confirm-password" className="text-sm font-medium">
              Confirmar Nueva Contraseña *
            </Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={errors.confirmPassword ? 'border-red-500' : ''}
                placeholder="Confirma tu nueva contraseña"
                disabled={loading}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={loading}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-500" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-500" />
                )}
              </Button>
            </div>
            {confirmPassword && newPassword === confirmPassword && (
              <p className="text-sm text-green-600 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Las contraseñas coinciden
              </p>
            )}
            {errors.confirmPassword && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.confirmPassword}
              </p>
            )}
          </div>

          {/* Información de seguridad */}
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Consejos de seguridad:</strong> Usa una combinación de letras mayúsculas y minúsculas, 
              números y símbolos especiales. No uses información personal.
            </AlertDescription>
          </Alert>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || !currentPassword || !newPassword || !confirmPassword}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Cambiando...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Cambiar Contraseña
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ChangePasswordDialog;