import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { QrCode, CheckCircle, Loader2, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface GreenApiConnectProps {
    userId: string;
    onSuccess: () => void;
}

interface QRCodeData {
    message: string;
    type: 'qrCode';
}

export const GreenApiConnect: React.FC<GreenApiConnectProps> = ({ userId, onSuccess }) => {
    const [idInstance, setIdInstance] = useState('7107392654');
    const [apiToken, setApiToken] = useState('b1027b1fd5ba4266bb291adbb9e72c63309b3ed04bd640b692');
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<'disconnected' | 'waiting' | 'connected'>('disconnected');
    const { toast } = useToast();
    const qrRefreshInterval = useRef<NodeJS.Timeout | null>(null);
    const statusCheckInterval = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        return () => {
            // Cleanup intervals on unmount
            if (qrRefreshInterval.current) clearInterval(qrRefreshInterval.current);
            if (statusCheckInterval.current) clearInterval(statusCheckInterval.current);
        };
    }, []);

    const getQRCode = async () => {
        if (!idInstance || !apiToken) {
            toast({
                title: "Credenciales requeridas",
                description: "Por favor ingresa tu ID de Instancia y Token API",
                variant: "destructive"
            });
            return;
        }

        setLoading(true);
        try {
            const apiUrl = `https://7107.api.green-api.com`;
            const response = await fetch(`${apiUrl}/waInstance${idInstance}/qr/${apiToken}`);

            if (!response.ok) {
                throw new Error('Failed to get QR code');
            }

            const data: QRCodeData = await response.json();

            console.log('Green API QR Response:', data);

            if (data.type === 'qrCode' && data.message) {
                setQrCode(data.message);
                setStatus('waiting');

                // Start QR refresh interval (every 15 seconds)
                qrRefreshInterval.current = setInterval(() => {
                    refreshQR();
                }, 15000);

                // Start status check interval (every 3 seconds)
                statusCheckInterval.current = setInterval(() => {
                    checkStatus();
                }, 3000);

                toast({
                    title: "QR Code generado",
                    description: "Escanea el código con tu WhatsApp",
                });
            } else {
                console.error('Unexpected response from Green API:', data);
                toast({
                    title: "Error",
                    description: `Respuesta inesperada de Green API: ${JSON.stringify(data)}`,
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error('Error getting QR code:', error);
            toast({
                title: "Error",
                description: "No se pudo obtener el código QR",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const refreshQR = async () => {
        if (!idInstance || !apiToken) return;

        try {
            const apiUrl = `https://7107.api.green-api.com`;
            const response = await fetch(`${apiUrl}/waInstance${idInstance}/qr/${apiToken}`);

            if (response.ok) {
                const data: QRCodeData = await response.json();
                if (data.type === 'qrCode' && data.message) {
                    setQrCode(data.message);
                }
            }
        } catch (error) {
            console.error('Error refreshing QR:', error);
        }
    };

    const checkStatus = async () => {
        if (!idInstance || !apiToken) return;

        try {
            const apiUrl = `https://7107.api.green-api.com`;
            const response = await fetch(`${apiUrl}/waInstance${idInstance}/getStateInstance/${apiToken}`);

            if (response.ok) {
                const data = await response.json();

                console.log('Green API Status Response:', data);

                if (data.stateInstance === 'authorized') {
                    // Clear intervals
                    if (qrRefreshInterval.current) clearInterval(qrRefreshInterval.current);
                    if (statusCheckInterval.current) clearInterval(statusCheckInterval.current);

                    setStatus('connected');

                    // Save to Supabase
                    await saveToSupabase();
                } else {
                    console.log('Status not authorized yet:', data.stateInstance);
                }
            } else {
                console.error('Status check failed:', response.status);
            }
        } catch (error) {
            console.error('Error checking status:', error);
        }
    };

    const saveToSupabase = async () => {
        try {
            const { error } = await supabase
                .from('communication_channels')
                .insert({
                    user_id: userId,
                    channel_type: 'whatsapp_green_api',
                    channel_config: {
                        idInstance,
                        apiTokenInstance: apiToken,
                        apiUrl: 'https://7107.api.green-api.com',
                        connected_at: new Date().toISOString()
                    },
                    is_connected: true
                });

            if (error) throw error;

            toast({
                title: "¡Conectado!",
                description: "WhatsApp conectado exitosamente",
            });

            onSuccess();
        } catch (error) {
            console.error('Error saving to Supabase:', error);
            toast({
                title: "Error",
                description: "No se pudo guardar la configuración",
                variant: "destructive"
            });
        }
    };

    return (
        <div className="space-y-4">
            {status === 'disconnected' && (
                <>
                    <div className="text-center space-y-4">
                        <Button
                            onClick={getQRCode}
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-[#3a0caa] to-[#710db2] hover:from-[#270a59] hover:to-[#2b0a63] text-white"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Generando QR...
                                </>
                            ) : (
                                <>
                                    <QrCode className="h-4 w-4 mr-2" />
                                    Generar Código QR
                                </>
                            )}
                        </Button>

                        <div className="bg-blue-50 p-3 rounded-lg border">
                            <p className="text-blue-800 text-xs sm:text-sm">
                                Para conectar tu WhatsApp, simplemente genera el código QR y escanéalo con tu aplicación móvil.
                            </p>
                            <div className="mt-2 text-xs text-muted-foreground">
                                <p>Instancia: {idInstance}</p>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {status === 'waiting' && qrCode && (
                <Card className="p-6">
                    <div className="flex flex-col items-center space-y-4">
                        <h3 className="text-lg font-semibold">Escanea este código QR</h3>
                        <div className="bg-white p-4 rounded-lg">
                            <img
                                src={`data:image/png;base64,${qrCode}`}
                                alt="QR Code"
                                className="w-64 h-64"
                            />
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Esperando escaneo...
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={refreshQR}
                        >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Refrescar QR
                        </Button>
                    </div>
                </Card>
            )}

            {status === 'connected' && (
                <Card className="p-6 bg-green-50 border-green-200">
                    <div className="flex flex-col items-center space-y-4">
                        <CheckCircle className="h-16 w-16 text-green-600" />
                        <h3 className="text-lg font-semibold text-green-900">
                            ¡Conectado exitosamente!
                        </h3>
                        <p className="text-sm text-green-800 text-center">
                            Tu WhatsApp está ahora conectado
                        </p>
                    </div>
                </Card>
            )}
        </div>
    );
};
