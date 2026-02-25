import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { QrCode, CheckCircle, Loader2, RefreshCw, MessageSquare, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface GreenApiConnectProps {
    userId: string;
    onSuccess: () => void;
    initialIdInstance?: string;
    initialApiToken?: string;
}

interface QRCodeData {
    message: string;
    type: 'qrCode';
}

export const GreenApiConnect: React.FC<GreenApiConnectProps> = ({
    userId,
    onSuccess,
    initialIdInstance,
    initialApiToken
}) => {
    const [idInstance, setIdInstance] = useState(initialIdInstance || '7107392654');
    const [apiToken, setApiToken] = useState(initialApiToken || 'b1027b1fd5ba4266bb291adbb9e72c63309b3ed04bd640b692');
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<'disconnected' | 'waiting' | 'connected'>('disconnected');

    // Auto-generate QR if initial values are provided
    useEffect(() => {
        if (initialIdInstance && initialApiToken) {
            getQRCode();
        }
    }, [initialIdInstance, initialApiToken]);
    const { toast } = useToast();
    const qrRefreshInterval = useRef<any>(null);
    const statusCheckInterval = useRef<any>(null);

    useEffect(() => {
        return () => {
            // Cleanup intervals on unmount
            if (qrRefreshInterval.current) clearInterval(qrRefreshInterval.current);
            if (statusCheckInterval.current) clearInterval(statusCheckInterval.current);
        };
    }, []);

    const provisionInstance = async () => {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();

            // Call our Edge Function
            // @ts-ignore
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const response = await fetch(`${supabaseUrl}/functions/v1/create-green-api-instance`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session?.access_token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user_id: userId,
                    plan_type: 'manual_provision'
                })
            });

            const result = await response.json();
            if (result.success) {
                toast({
                    title: "¡Éxito!",
                    description: "Se ha asignado una nueva instancia automáticamente.",
                });

                // Actualizamos las credenciales localmente para que el componente las use
                if (result.idInstance) {
                    setIdInstance(result.idInstance);
                    // Nota: En un escenario real, el apiToken vendría en el resultado de la función.
                    // Si no viene, el usuario tendrá la instancia vinculada y solo deberá refrescar.
                }

                // Recargar página para asegurar que el estado sea el correcto
                window.location.reload();
            } else {
                throw new Error(result.error || "Error desconocido al crear instancia");
            }
        } catch (error: any) {
            console.error('Error provisioning instance:', error);
            toast({
                title: "Error de aprovisionamiento",
                description: error.message || "No pudimos crear tu instancia. Verifica tu saldo de partner.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

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
        <Card className="border-green-100 shadow-sm overflow-hidden">
            <CardHeader className="bg-green-50 pb-4">
                <CardTitle className="flex items-center gap-2 text-green-800">
                    <MessageSquare className="h-5 w-5" />
                    Conectar WhatsApp (Green API)
                </CardTitle>
                <CardDescription className="text-green-700">
                    Sincroniza tu cuenta de WhatsApp para empezar a usar el agente IA.
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
                {!initialIdInstance && (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-6">
                        <h4 className="font-semibold text-blue-900 mb-1">Aprovisionamiento Automático</h4>
                        <p className="text-sm text-blue-800 mb-4">
                            Como tienes un plan activo, puedes generar tu instancia oficial de WhatsApp con un solo clic.
                        </p>
                        <Button
                            onClick={provisionInstance}
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            {loading ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                                <PlusCircle className="h-4 w-4 mr-2" />
                            )}
                            Generar mi Instancia WhatsApp
                        </Button>
                    </div>
                )}

                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">ID de Instancia</label>
                            <Input
                                placeholder="Ejem: 1101821234"
                                value={idInstance}
                                onChange={(e) => setIdInstance(e.target.value)}
                                disabled={loading || !!initialIdInstance}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Token de Instancia</label>
                            <Input
                                placeholder="Ejem: d5f1e...456"
                                value={apiToken}
                                onChange={(e) => setApiToken(e.target.value)}
                                disabled={loading || !!initialApiToken}
                            />
                        </div>
                    </div>

                    {!initialIdInstance && (
                        <div className="flex gap-2">
                            <Button
                                onClick={getQRCode}
                                disabled={loading}
                                variant="outline"
                                className="flex-1"
                            >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Probar Conexión Manual"}
                            </Button>
                        </div>
                    )}
                </div>
                {status === 'disconnected' && (
                    <div className="bg-blue-50 p-3 rounded-lg border">
                        <h4 className="font-medium text-blue-900 text-xs sm:text-sm mb-1">Conexión mediante QR:</h4>
                        <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
                            <li>Genera el código QR con el botón</li>
                            <li>Escanea el código con tu celular</li>
                            <li>Instancia: {idInstance}</li>
                        </ul>
                    </div>
                )}
            </CardContent>

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
        </Card>
    );
};
