import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Enable2FA } from './Enable2FA';
import { MFAService } from '@/services/mfaService';
import { useToast } from '@/hooks/use-toast';
import { ShieldCheck, ShieldOff, Loader2, AlertTriangle, Key, Download } from 'lucide-react';

export const MFASettings: React.FC = () => {
    const [mfaEnabled, setMfaEnabled] = useState(false);
    const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [showDisableDialog, setShowDisableDialog] = useState(false);
    const [disableCode, setDisableCode] = useState('');
    const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
    const [showRecoveryCodes, setShowRecoveryCodes] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        checkMFAStatus();
    }, []);

    const checkMFAStatus = async () => {
        setLoading(true);
        try {
            const factors = await MFAService.getActiveMFAFactors();
            const verifiedFactors = factors.filter(f => f.status === 'verified');

            if (verifiedFactors.length > 0) {
                setMfaEnabled(true);
                setMfaFactorId(verifiedFactors[0].id);
            } else {
                setMfaEnabled(false);
                setMfaFactorId(null);
            }
        } catch (error) {
            console.error('Error checking MFA status:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDisable2FA = async () => {
        if (!mfaFactorId || disableCode.length !== 6) {
            toast({
                title: 'Código requerido',
                description: 'Ingresa el código de 6 dígitos para desactivar 2FA',
                variant: 'destructive'
            });
            return;
        }

        setLoading(true);
        try {
            // Verify current code before disabling
            await MFAService.verifyAndEnableMFA(mfaFactorId, disableCode);

            // If verification succeeds, proceed to unenroll
            await MFAService.unenrollMFA(mfaFactorId);

            setMfaEnabled(false);
            setMfaFactorId(null);
            setShowDisableDialog(false);
            setDisableCode('');

            toast({
                title: '2FA Desactivado',
                description: 'La autenticación de dos factores ha sido desactivada'
            });
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'No se pudo desactivar 2FA. Verifica el código e intenta de nuevo.',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleViewRecoveryCodes = async () => {
        setLoading(true);
        try {
            const codes = await MFAService.getRecoveryCodes();
            setRecoveryCodes(codes);
            setShowRecoveryCodes(true);
        } catch (error: any) {
            toast({
                title: 'Error',
                description: 'No se pudieron cargar los códigos de recuperación',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    const downloadRecoveryCodes = () => {
        const content = [
            'CÓDIGOS DE RECUPERACIÓN DE OndAI - 2FA',
            '==========================================',
            '',
            'Códigos restantes: ' + recoveryCodes.length,
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

    if (loading && !mfaEnabled) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Autenticación de Dos Factores (2FA)</CardTitle>
                    <CardDescription>Cargando configuración...</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    {mfaEnabled ? (
                        <ShieldCheck className="h-5 w-5 text-green-600" />
                    ) : (
                        <ShieldOff className="h-5 w-5 text-muted-foreground" />
                    )}
                    Autenticación de Dos Factores (2FA)
                </CardTitle>
                <CardDescription>
                    Agrega una capa extra de seguridad a tu cuenta requiriendo un código de tu teléfono al iniciar sesión
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
                {mfaEnabled ? (
                    <>
                        <Alert className="border-green-200 bg-green-50">
                            <ShieldCheck className="h-4 w-4 text-green-600" />
                            <AlertDescription className="text-green-800">
                                ✓ La autenticación de dos factores está <strong>activada</strong>. Tu cuenta está protegida.
                            </AlertDescription>
                        </Alert>

                        <div className="flex flex-col gap-2">
                            <Button
                                variant="outline"
                                onClick={handleViewRecoveryCodes}
                                disabled={loading}
                                className="w-full sm:w-auto"
                            >
                                <Key className="mr-2 h-4 w-4" />
                                Ver Códigos de Recuperación
                            </Button>

                            <Button
                                variant="destructive"
                                onClick={() => setShowDisableDialog(true)}
                                disabled={loading}
                                className="w-full sm:w-auto"
                            >
                                <ShieldOff className="mr-2 h-4 w-4" />
                                Desactivar 2FA
                            </Button>
                        </div>
                    </>
                ) : (
                    <>
                        <Alert>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                                Tu cuenta no está protegida con 2FA. Se recomienda activarla para mayor seguridad.
                            </AlertDescription>
                        </Alert>

                        <Enable2FA onSuccess={checkMFAStatus} />
                    </>
                )}

                {/* Disable 2FA Dialog */}
                <Dialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>¿Desactivar 2FA?</DialogTitle>
                            <DialogDescription>
                                Para desactivar la autenticación de dos factores, ingresa el código actual de tu app
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                            <Alert variant="destructive">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription>
                                    ⚠️ Esto reducirá la seguridad de tu cuenta
                                </AlertDescription>
                            </Alert>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Código de verificación</label>
                                <Input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    maxLength={6}
                                    value={disableCode}
                                    onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, ''))}
                                    placeholder="000000"
                                    className="text-center text-2xl tracking-[0.5em] font-mono"
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => {
                                setShowDisableDialog(false);
                                setDisableCode('');
                            }}>
                                Cancelar
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleDisable2FA}
                                disabled={loading || disableCode.length !== 6}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Desactivando...
                                    </>
                                ) : (
                                    'Desactivar 2FA'
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Recovery Codes Dialog */}
                <Dialog open={showRecoveryCodes} onOpenChange={setShowRecoveryCodes}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Key className="h-5 w-5" />
                                Códigos de Recuperación
                            </DialogTitle>
                            <DialogDescription>
                                Estos códigos te permiten acceder si pierdes tu dispositivo
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                            {recoveryCodes.length > 0 ? (
                                <>
                                    <Alert>
                                        <AlertDescription>
                                            Tienes <strong>{recoveryCodes.length}</strong> código{recoveryCodes.length !== 1 ? 's' : ''} de recuperación restante{recoveryCodes.length !== 1 ? 's' : ''}.
                                            Cada código puede usarse una sola vez.
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

                                    <Button onClick={downloadRecoveryCodes} variant="outline" className="w-full">
                                        <Download className="mr-2 h-4 w-4" />
                                        Descargar Códigos
                                    </Button>
                                </>
                            ) : (
                                <Alert variant="destructive">
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertDescription>
                                        No quedan códigos de recuperación. Considera desactivar y reactivar 2FA para generar nuevos códigos.
                                    </AlertDescription>
                                </Alert>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    );
};
