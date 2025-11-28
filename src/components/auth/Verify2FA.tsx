import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MFAService } from '@/services/mfaService';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Shield, AlertCircle, Key } from 'lucide-react';

interface Verify2FAProps {
    factorId: string;
    onSuccess: () => void;
    onCancel?: () => void;
}

export const Verify2FA: React.FC<Verify2FAProps> = ({ factorId, onSuccess, onCancel }) => {
    const [code, setCode] = useState('');
    const [useRecovery, setUseRecovery] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [attempts, setAttempts] = useState(0);
    const { toast } = useToast();

    const MAX_ATTEMPTS = 3;

    const handleVerify = async () => {
        const minLength = useRecovery ? 8 : 6;

        if (code.length < minLength) {
            setError(`Ingresa un código de ${minLength} caracteres`);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            if (useRecovery) {
                // Verify recovery code
                const valid = await MFAService.verifyRecoveryCode(code);

                if (valid) {
                    toast({
                        title: 'Verificación exitosa',
                        description: 'Código de recuperación aceptado'
                    });
                    onSuccess();
                } else {
                    throw new Error('Código de recuperación inválido o ya usado');
                }
            } else {
                // Verify TOTP code
                await MFAService.verifyAndEnableMFA(factorId, code);
                toast({
                    title: 'Verificación exitosa',
                    description: 'Autenticación completada'
                });
                onSuccess();
            }
        } catch (err: any) {
            const newAttempts = attempts + 1;
            setAttempts(newAttempts);

            if (newAttempts >= MAX_ATTEMPTS) {
                setError(`Máximo de intentos alcanzado. ${useRecovery ? 'Contacta con soporte.' : 'Intenta usar un código de recuperación.'}`);
            } else {
                setError(`Código incorrecto. Te quedan ${MAX_ATTEMPTS - newAttempts} intento${MAX_ATTEMPTS - newAttempts !== 1 ? 's' : ''}.`);
            }

            toast({
                title: 'Código incorrecto',
                description: err.message || 'El código ingresado no es válido',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && code.length >= (useRecovery ? 8 : 6)) {
            handleVerify();
        }
    };

    return (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                    {useRecovery ? (
                        <Key className="h-6 w-6 text-primary" />
                    ) : (
                        <Shield className="h-6 w-6 text-primary" />
                    )}
                </div>
                <h2 className="text-2xl font-bold">Verificación de Dos Factores</h2>
                <p className="text-sm text-muted-foreground">
                    {useRecovery
                        ? 'Ingresa uno de tus códigos de recuperación'
                        : 'Ingresa el código de 6 dígitos de tu app de autenticación'}
                </p>
            </div>

            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <div className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">
                        {useRecovery ? 'Código de Recuperación' : 'Código de Autenticación'}
                    </label>
                    <Input
                        type="text"
                        inputMode={useRecovery ? 'text' : 'numeric'}
                        pattern={useRecovery ? '[A-Z0-9]*' : '[0-9]*'}
                        maxLength={useRecovery ? 8 : 6}
                        value={code}
                        onChange={(e) => {
                            const value = useRecovery
                                ? e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')
                                : e.target.value.replace(/\D/g, '');
                            setCode(value);
                            setError(null);
                        }}
                        onKeyPress={handleKeyPress}
                        placeholder={useRecovery ? 'ABCD1234' : '000000'}
                        className={`text-center text-2xl tracking-[0.5em] font-mono ${useRecovery ? 'tracking-wider' : ''}`}
                        autoFocus
                        disabled={attempts >= MAX_ATTEMPTS}
                    />
                    <p className="text-xs text-muted-foreground text-center">
                        {useRecovery
                            ? 'Código de 8 caracteres alfanuméricos'
                            : 'Código de 6 dígitos'}
                    </p>
                </div>

                <Button
                    onClick={handleVerify}
                    disabled={loading || code.length < (useRecovery ? 8 : 6) || attempts >= MAX_ATTEMPTS}
                    className="w-full"
                >
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Verificando...
                        </>
                    ) : (
                        'Verificar Código'
                    )}
                </Button>

                {attempts < MAX_ATTEMPTS && (
                    <button
                        type="button"
                        onClick={() => {
                            setUseRecovery(!useRecovery);
                            setCode('');
                            setError(null);
                            setAttempts(0);
                        }}
                        className="text-sm text-primary hover:underline w-full text-center"
                    >
                        {useRecovery
                            ? '← Usar código de la app de autenticación'
                            : '¿Perdiste tu dispositivo? Usa un código de recuperación →'}
                    </button>
                )}

                {onCancel && (
                    <Button
                        variant="ghost"
                        onClick={onCancel}
                        className="w-full"
                    >
                        Cancelar
                    </Button>
                )}
            </div>

            {!useRecovery && (
                <Alert>
                    <AlertDescription className="text-xs">
                        💡 Asegúrate de que la hora de tu dispositivo esté sincronizada correctamente.
                        Los códigos TOTP dependen de la hora exacta.
                    </AlertDescription>
                </Alert>
            )}
        </div>
    );
};
