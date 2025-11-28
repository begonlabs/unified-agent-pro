import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MFAService } from '@/services/mfaService';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Shield, Download, CheckCircle, AlertCircle, Smartphone } from 'lucide-react';

type Step = 'initial' | 'qr' | 'verify' | 'codes' | 'success';

interface Enable2FAProps {
    onSuccess?: () => void;
}

export const Enable2FA: React.FC<Enable2FAProps> = ({ onSuccess }) => {
    const [step, setStep] = useState<Step>('initial');
    const [qrData, setQRData] = useState<{ qr_code: string; secret: string; id: string } | null>(null);
    const [verificationCode, setVerificationCode] = useState('');
    const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    const handleEnableClick = async () => {
        setLoading(true);
        setError(null);

        try {
            // First, check for existing factors and clean them up
            const existingFactors = await MFAService.getActiveMFAFactors();

            // Remove any unverified factors (leftover from previous attempts)
            const unverifiedFactors = existingFactors.filter(f => f.status === 'unverified');

            for (const factor of unverifiedFactors) {
                try {
                    await MFAService.unenrollMFA(factor.id);
                    console.log('Cleaned up unverified factor:', factor.id);
                } catch (err) {
                    console.warn('Failed to clean up factor:', err);
                }
            }

            // Now enroll a fresh MFA factor
            const data = await MFAService.enrollMFA();
            setQRData(data);
            setStep('qr');
        } catch (err: any) {
            setError(err.message || 'Error al configurar 2FA');
            toast({
                title: 'Error',
                description: err.message || 'No se pudo iniciar la configuración de 2FA',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyCode = async () => {
        if (!qrData || verificationCode.length !== 6) {
            setError('Ingresa un código de 6 dígitos');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await MFAService.verifyAndEnableMFA(qrData.id, verificationCode);

            // Generate recovery codes
            const codes = await MFAService.generateRecoveryCodes(10);
            setRecoveryCodes(codes);
            setStep('codes');

            toast({
                title: '✅ 2FA Activado',
                description: 'Autenticación de dos factores configurada correctamente'
            });
        } catch (err: any) {
            setError('Código incorrecto. Verifica el código en tu app e intenta de nuevo.');
            toast({
                title: 'Código incorrecto',
                description: 'El código ingresado no es válido',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    const downloadCodes = () => {
        const content = [
            'CÓDIGOS DE RECUPERACIÓN DE OndAI - 2FA',
            '==========================================',
            '',
            'Guarda estos códigos en un lugar seguro.',
            'Cada código puede usarse UNA SOLA VEZ para acceder si pierdes tu dispositivo.',
            '',
            '==========================================',
            '',
            ...recoveryCodes
        ].join('\n');

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ondai-recovery-codes-${new Date().toISOString().split('T')[0]}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleComplete = () => {
        setStep('success');
        if (onSuccess) {
            setTimeout(() => onSuccess(), 2000);
        }
    };

    return (
        <>
            {step === 'initial' && (
                <div className="space-y-4">
                    <Alert>
                        <Shield className="h-4 w-4" />
                        <AlertDescription>
                            La autenticación de dos factores agrega una capa extra de seguridad a tu cuenta.
                            Necesitarás tu teléfono con Google Authenticator u otra app compatible.
                        </AlertDescription>
                    </Alert>

                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <Button onClick={handleEnableClick} disabled={loading} className="w-full">
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Configurando...
                            </>
                        ) : (
                            <>
                                <Shield className="mr-2 h-4 w-4" />
                                Activar Autenticación de Dos Factores
                            </>
                        )}
                    </Button>
                </div>
            )}

            {step === 'qr' && qrData && (
                <Dialog open={true} onOpenChange={() => setStep('initial')}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Smartphone className="h-5 w-5" />
                                Configurar Google Authenticator
                            </DialogTitle>
                            <DialogDescription>
                                Escanea el código QR con tu app de autenticación
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">
                                    Paso 1: Abre Google Authenticator (o Authy, Microsoft Authenticator, etc.)
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Paso 2: Toca el botón "+" y selecciona "Escanear código QR"
                                </p>
                            </div>

                            <div className="flex justify-center p-6 bg-white rounded-lg border-2">
                                <QRCodeSVG value={qrData.qr_code} size={220} level="H" />
                            </div>

                            <div className="bg-muted p-4 rounded-lg space-y-2">
                                <p className="text-xs font-medium text-muted-foreground">
                                    ¿No puedes escanear? Ingresa este código manualmente:
                                </p>
                                <div className="flex items-center gap-2">
                                    <code className="flex-1 text-sm bg-background p-2 rounded border break-all">
                                        {qrData.secret}
                                    </code>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                            navigator.clipboard.writeText(qrData.secret);
                                            toast({ title: 'Copiado', description: 'Código copiado al portapapeles' });
                                        }}
                                    >
                                        Copiar
                                    </Button>
                                </div>
                            </div>

                            {error && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            <div className="space-y-2">
                                <label className="text-sm font-medium">
                                    Paso 3: Ingresa el código de 6 dígitos que aparece en la app
                                </label>
                                <Input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    maxLength={6}
                                    value={verificationCode}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, '');
                                        setVerificationCode(value);
                                        setError(null);
                                    }}
                                    placeholder="000000"
                                    className="text-center text-2xl tracking-[0.5em] font-mono"
                                    autoFocus
                                />
                            </div>

                            <Button
                                onClick={handleVerifyCode}
                                disabled={loading || verificationCode.length !== 6}
                                className="w-full"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Verificando...
                                    </>
                                ) : (
                                    'Verificar y Activar 2FA'
                                )}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            )}

            {step === 'codes' && (
                <Dialog open={true} onOpenChange={handleComplete}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-yellow-600">
                                <AlertCircle className="h-5 w-5" />
                                Códigos de Recuperación
                            </DialogTitle>
                            <DialogDescription>
                                ⚠️ Importante: Guarda estos códigos en un lugar seguro
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                            <Alert>
                                <AlertDescription>
                                    Estos códigos te permitirán acceder a tu cuenta si pierdes tu dispositivo.
                                    Cada código puede usarse <strong>una sola vez</strong>.
                                </AlertDescription>
                            </Alert>

                            <div className="grid grid-cols-2 gap-2 bg-muted p-4 rounded-lg max-h-[200px] overflow-auto">
                                {recoveryCodes.map((code, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <span className="text-xs text-muted-foreground w-6">{i + 1}.</span>
                                        <code className="text-sm font-mono bg-background px-2 py-1 rounded border flex-1">
                                            {code}
                                        </code>
                                    </div>
                                ))}
                            </div>

                            <div className="flex flex-col gap-2">
                                <Button onClick={downloadCodes} variant="outline" className="w-full">
                                    <Download className="mr-2 h-4 w-4" />
                                    Descargar Códigos
                                </Button>
                                <Button onClick={handleComplete} className="w-full">
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    He Guardado los Códigos de Forma Segura
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}

            {step === 'success' && (
                <div className="flex flex-col items-center justify-center p-6 space-y-4">
                    <div className="rounded-full bg-green-100 p-3">
                        <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <div className="text-center">
                        <h3 className="text-lg font-semibold">¡2FA Activado Correctamente!</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            Tu cuenta ahora está protegida con autenticación de dos factores
                        </p>
                    </div>
                </div>
            )}
        </>
    );
};
