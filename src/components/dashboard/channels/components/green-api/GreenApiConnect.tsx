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
    const [apiUrl, setApiUrl] = useState(initialIdInstance ? (String(initialIdInstance).startsWith('77') ? 'https://7700.api.green-api.com' : 'https://7107.api.green-api.com') : 'https://7107.api.green-api.com');
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [retryCount, setRetryCount] = useState(0);
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

    const getQRCode = async (isRetry = false) => {
        if (!idInstance || !apiToken) {
            toast({
                title: "Credenciales requeridas",
                description: "Por favor ingresa tu ID de Instancia y Token API",
                variant: "destructive"
            });
            return;
        }

        if (!isRetry) {
            setLoading(true);
            setRetryCount(0);
        }

        try {
            // Usar el host configurado o el autodetectado por el ID (asegurando que sea string)
            const idStr = String(idInstance);
            const host = idStr.startsWith('7700') || idStr.startsWith('7705') ? 'https://7700.api.green-api.com' : 'https://7107.api.green-api.com';

            console.log(`🔍 Intentando obtener QR de: ${host} (Intento: ${retryCount + 1}/6)`);
            const response = await fetch(`${host}/waInstance${idInstance}/qr/${apiToken}`);

            if (!response.ok) {
                if (retryCount < 5) {
                    console.log('⚠️ Fallo temporal al obtener QR, reintentando en 10s...');
                    setTimeout(() => {
                        setRetryCount(prev => prev + 1);
                        getQRCode(true);
                    }, 10000);
                    return;
                }
                throw new Error('Failed to get QR code after multiple retries');
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
        <div className="space-y-6">
            {!initialIdInstance && (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border border-green-100 shadow-sm">
                    <div className="flex items-start gap-4 mb-4">
                        <div className="bg-green-100 p-3 rounded-full">
                            <PlusCircle className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                            <h4 className="font-bold text-green-900 text-lg">Nueva Instancia WhatsApp</h4>
                            <p className="text-sm text-green-700 leading-relaxed">
                                Tu plan incluye una instancia dedicada de WhatsApp Business Pro.
                                Al activarla, podrás empezar a usar la IA inmediatamente.
                            </p>
                        </div>
                    </div>
                    <Button
                        onClick={provisionInstance}
                        disabled={loading}
                        className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-semibold transition-all shadow-md group"
                    >
                        {loading ? (
                            <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        ) : (
                            <CheckCircle className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
                        )}
                        {loading ? 'Inicializando instancia...' : 'Activar mi WhatsApp ahora'}
                    </Button>
                    {loading && (
                        <p className="text-[11px] text-green-700 mt-2 text-center animate-pulse">
                            Esto puede tardar hasta 45 segundos mientras Green API prepara tu línea.
                        </p>
                    )}
                    <p className="text-[10px] text-green-600 mt-4 text-center opacity-70">
                        * Al activar, se asignará una nueva instancia usando tu crédito de suscripción.
                    </p>
                </div>
            )}

            {initialIdInstance && status === 'disconnected' && !qrCode && (
                <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-100 flex flex-col items-center text-center">
                    <QrCode className="h-12 w-12 text-emerald-600 mb-4 animate-pulse" />
                    <h4 className="font-bold text-emerald-900 mb-2">Generar Código QR</h4>
                    <p className="text-sm text-emerald-700 mb-6 max-w-xs">
                        Tu instancia está lista. Haz clic abajo para ver el código QR de conexión.
                    </p>
                    <Button
                        onClick={getQRCode}
                        disabled={loading}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                {retryCount > 0 ? `Reintentando (${retryCount}/6)...` : "Cargando..."}
                            </>
                        ) : "Ver Código QR"}
                    </Button>
                    {loading && retryCount > 0 && (
                        <p className="text-[10px] text-emerald-600 mt-2 italic">
                            La instancia se está despertando, reintentando automáticamente.
                        </p>
                    )}
                </div>
            )}

            {status === 'waiting' && qrCode && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-lg flex flex-col items-center">
                    <div className="mb-4 text-center">
                        <h4 className="font-bold text-slate-900">Escanea el Código QR</h4>
                        <p className="text-xs text-slate-500">Abre WhatsApp en tu teléfono {`>`} Ajustes {`>`} Dispositivos vinculados</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border-2 border-emerald-500 mb-6 shadow-inner">
                        <img
                            src={`data:image/png;base64,${qrCode}`}
                            alt="QR Code"
                            className="w-64 h-64 object-contain"
                        />
                    </div>
                    <div className="flex flex-col items-center gap-3 w-full">
                        <div className="flex items-center gap-2 text-xs font-medium text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Esperando sincronización...
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 text-[10px]"
                            onClick={refreshQR}
                        >
                            <RefreshCw className="h-3 w-3 mr-1.5" />
                            Actualizar código manually
                        </Button>
                    </div>
                </div>
            )}

            {status === 'connected' && (
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-8 rounded-2xl shadow-xl flex flex-col items-center text-white text-center">
                    <div className="bg-white/20 p-4 rounded-full mb-4 backdrop-blur-sm">
                        <CheckCircle className="h-12 w-12" />
                    </div>
                    <h3 className="text-xl font-bold mb-1">¡WhatsApp Conectado!</h3>
                    <p className="text-sm opacity-90">Ya puedes empezar a recibir y enviar mensajes.</p>
                </div>
            )}
        </div>
    );
};
