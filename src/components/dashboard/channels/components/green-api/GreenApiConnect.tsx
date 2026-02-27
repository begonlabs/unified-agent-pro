import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { QrCode, CheckCircle, Loader2, RefreshCw, MessageSquare, PlusCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getGreenApiHost } from '@/utils/greenApiUtils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface GreenApiConnectProps {
    userId: string;
    onSuccess: () => void;
    initialIdInstance?: string;
    initialApiToken?: string;
    onInvalidInstance?: () => void;
}

interface QRCodeData {
    message: string;
    type: 'qrCode';
}

export const GreenApiConnect: React.FC<GreenApiConnectProps> = ({
    userId,
    onSuccess,
    initialIdInstance,
    initialApiToken,
    onInvalidInstance
}) => {
    const [idInstance, setIdInstance] = useState(initialIdInstance || '');
    const [apiToken, setApiToken] = useState(initialApiToken || '');
    const [apiUrl, setApiUrl] = useState(() => {
        if (initialIdInstance) {
            const idStr = String(initialIdInstance);
            if (idStr.startsWith('77')) return 'https://7700.api.green-api.com';
            if (idStr.startsWith('71')) return 'https://7107.api.green-api.com';
        }
        return 'https://7107.api.green-api.com';
    });
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [retryCount, setRetryCount] = useState(0);
    const [status, setStatus] = useState<'disconnected' | 'waiting' | 'connected'>('disconnected');
    const [isStarting, setIsStarting] = useState(false);
    const [startingTimeLeft, setStartingTimeLeft] = useState(120);
    const [isInvalid, setIsInvalid] = useState(false);
    const [hasSynced, setHasSynced] = useState(false);

    // Auto-generate QR if initial values are provided
    useEffect(() => {
        if (initialIdInstance && initialApiToken) {
            // Primero verificamos el estado antes de pedir QR
            // Esto evita fallos si la cuenta ya está autorizada o está iniciando
            checkStatus();
        }
    }, [initialIdInstance, initialApiToken]);
    const { toast } = useToast();
    const qrRefreshInterval = useRef<any>(null);
    const statusCheckInterval = useRef<any>(null);
    const isSyncing = useRef(false); // Ref para evitar ejecuciones paralelas

    useEffect(() => {
        return () => {
            // Cleanup intervals on unmount
            if (qrRefreshInterval.current) clearInterval(qrRefreshInterval.current);
            if (statusCheckInterval.current) clearInterval(statusCheckInterval.current);
        };
    }, []);

    // Countdown for starting state
    useEffect(() => {
        let timer: any;
        if (isStarting && startingTimeLeft > 0) {
            timer = setInterval(() => {
                setStartingTimeLeft(prev => prev - 1);
            }, 1000);
        }
        return () => {
            if (timer) clearInterval(timer);
        };
    }, [isStarting, startingTimeLeft]);

    const provisionInstance = async () => {
        if (loading) return;
        setLoading(true);
        try {
            console.log('🚀 Iniciando aprovisionamiento de instancia...');

            const { data, error } = await supabase.functions.invoke('create-green-api-instance', {
                body: {
                    user_id: userId,
                    plan_type: 'manual_provision'
                }
            });

            if (error) throw error;

            if (data?.success) {
                toast({
                    title: "¡Éxito!",
                    description: "Se ha asignado una nueva instancia automáticamente.",
                });

                if (data.idInstance && data.apiTokenInstance) {
                    setIdInstance(data.idInstance);
                    setApiToken(data.apiTokenInstance);
                    if (data.apiUrl) setApiUrl(data.apiUrl);

                    // Iniciar polling de estado en lugar de recargar
                    setIsStarting(true);
                    setStartingTimeLeft(120);
                    setQrCode(null);

                    // Limpiar cualquier intervalo previo antes de iniciar uno nuevo
                    if (statusCheckInterval.current) clearInterval(statusCheckInterval.current);

                    // Iniciar chequeo de estado inmediatamente
                    statusCheckInterval.current = setInterval(() => {
                        checkStatus();
                    }, 5000);
                } else {
                    // Fallback si algo falló en el retorno pero se creó
                    window.location.reload();
                }
            } else {
                throw new Error(data?.error || "Error desconocido al crear instancia");
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

    const getQRCode = async (isRetry = false, currentRetry = 0) => {
        if (!idInstance || !apiToken) {
            toast({
                title: "Credenciales requeridas",
                description: "Por favor ingresa tu ID de Instancia y Token API",
                variant: "destructive"
            });
            return;
        }

        setLoading(true);
        if (!isRetry) {
            setRetryCount(0);
        }

        try {
            // Usar el host configurado o el autodetectado por el ID (asegurando que sea string)
            const idStr = String(idInstance);
            // Host a usar (forzamos 7700 si empieza con 77, 7107 si empieza con 71)
            const host = getGreenApiHost(idStr, apiUrl);

            setApiUrl(host); // Sincronizar apiUrl con el host detectado

            console.log(`🔍 Intentando obtener QR de: ${host} (Intento: ${currentRetry + 1}/6)`);
            const response = await fetch(`${host}/waInstance${idInstance}/qr/${apiToken}`);

            if (response.status === 401 || response.status === 404) {
                setIsInvalid(true);
                throw new Error('INSTANCIA_INVALIDA');
            }

            if (response.status === 466) {
                throw new Error('Instancia en espera. Inténtalo de nuevo en unos segundos.');
            }

            if (!response.ok) {
                if (currentRetry < 5) {
                    console.log('⚠️ Fallo temporal al obtener QR, reintentando en 10s...');
                    setTimeout(() => {
                        setRetryCount(currentRetry + 1);
                        getQRCode(true, currentRetry + 1);
                    }, 10000);
                    return; // No ejecutamos el catch/finally todavía porque sigue el flujo
                }
                // Si llegamos aquí es que falló después de todos los reintentos
                setIsInvalid(true);
                throw new Error('No se pudo obtener el código QR tras varios intentos. Es posible que la instancia esté dañada.');
            }

            const data: QRCodeData = await response.json();

            console.log('Green API QR Response:', data);

            if (data.type === 'qrCode' && data.message) {
                setQrCode(data.message);
                setStatus('waiting');

                // Limpiar intervalos previos para evitar duplicados en memoria
                if (qrRefreshInterval.current) clearInterval(qrRefreshInterval.current);
                if (statusCheckInterval.current) clearInterval(statusCheckInterval.current);

                // Start QR refresh interval (every 15 seconds)
                qrRefreshInterval.current = setInterval(() => {
                    refreshQR();
                }, 15000);

                // Start status check interval (every 3 seconds)
                statusCheckInterval.current = setInterval(() => {
                    checkStatus();
                }, 3000);

                console.log('✅ QR Code cargado silenciosamente');
            } else {
                console.error('Unexpected response from Green API:', data);
                toast({
                    title: "Error",
                    description: `Respuesta inesperada de Green API: ${JSON.stringify(data)}`,
                    variant: "destructive"
                });
            }
        } catch (error: any) {
            console.error('Error getting QR code:', error);
            if (error.message === 'INSTANCIA_INVALIDA') {
                setIsInvalid(true);
                const msg = "Esta instancia ya no existe o su token es inválido en Green API. Por favor, bórrala permanentemente para crear una nueva.";
                toast({
                    title: "Instancia Inválida",
                    description: msg,
                    variant: "destructive"
                });
                if (onInvalidInstance) onInvalidInstance();
            } else {
                toast({
                    title: "Error",
                    description: error.message || "No se pudo obtener el código QR",
                    variant: "destructive"
                });
            }
        } finally {
            setLoading(false);
        }
    };

    const refreshQR = async () => {
        if (!idInstance || !apiToken) return;

        try {
            // Usar apiUrl del estado (que ya debería estar configurada)
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
            // Usar apiUrl del estado
            const response = await fetch(`${apiUrl}/waInstance${idInstance}/getStateInstance/${apiToken}`);

            if (response.ok) {
                const data = await response.json();
                setIsInvalid(false);

                console.log('Green API Status Response:', data);

                if (data.stateInstance === 'authorized') {
                    // Clear intervals
                    if (qrRefreshInterval.current) clearInterval(qrRefreshInterval.current);
                    if (statusCheckInterval.current) clearInterval(statusCheckInterval.current);

                    setStatus('connected');
                    setIsStarting(false);

                    // Evitar bucles: Si acabamos de desconectar (en los últimos 45s), no auto-sincronizamos
                    // Usamos localStorage porque las refs se pierden al recargar la página
                    const lastDisconnectKey = `last_disconnect_${idInstance}`;
                    const lastDisconnectTimeStr = localStorage.getItem(lastDisconnectKey);
                    const now = Date.now();
                    const recentlyDisconnected = lastDisconnectTimeStr
                        ? (now - parseInt(lastDisconnectTimeStr)) < 45000
                        : false;

                    // Bloque de sincronización robusto
                    if (!hasSynced && !isSyncing.current && !recentlyDisconnected) {
                        // Sincronizamos si:
                        // a) Estamos en flujo activo (waiting/starting)
                        // b) Es el primer chequeo y no hay rastro de desconexión reciente (Auto-repair mount)
                        const shouldSync = status === 'waiting' || status === 'starting' || isStarting || status === 'disconnected';

                        if (shouldSync) {
                            console.log('🔄 Sincronizando configuración y guardando conexión...');
                            saveToSupabase();
                        }
                    }
                } else if (data.stateInstance === 'starting') {
                    console.log('Instance is still starting...');
                    setIsStarting(true);

                    // Aseguramos que el polling siga activo
                    if (!statusCheckInterval.current) {
                        statusCheckInterval.current = setInterval(checkStatus, 5000);
                    }
                } else if (data.stateInstance === 'notAuthorized' || data.stateInstance === 'not_authorized') {
                    console.log('Instance is ready but not authorized. Triggering QR...');
                    setIsStarting(false);

                    // Si venimos de un estado inicial o de "starting", pedimos el QR
                    if (!qrCode && !loading) {
                        getQRCode();
                    }
                } else {
                    console.log('Status check:', data.stateInstance);
                }
            } else {
                console.error('Status check failed:', response.status);
                // Si falla con 401, 404 o cualquier error persistente (excepto 466), marcar como sospechoso
                if (response.status === 401 || response.status === 404 || response.status === 400) {
                    setIsInvalid(true);
                }
            }
        } catch (error) {
            console.error('Error checking status:', error);
            // Network errors or total failures are suspicious
            setIsInvalid(true);
        }
    };

    const saveToSupabase = async () => {
        if (isSyncing.current) return;
        isSyncing.current = true;
        setHasSynced(true);

        try {
            console.log('⚙️ Iniciando guardado en Supabase...');

            // 1. Configurar Webhooks automáticamente
            console.log('⚙️ Configurando Webhooks mediante Edge Function...');
            const { data, error: setupError } = await supabase.functions.invoke('setup-green-api-webhooks', {
                body: {
                    idInstance,
                    apiTokenInstance: apiToken,
                    apiUrl: apiUrl
                }
            });

            if (setupError || !data?.success) {
                console.warn('⚠️ No se pudieron configurar los webhooks automáticamente:', setupError || data?.error);
                toast({
                    title: "Aviso de Webhook",
                    description: "No pudimos configurar el receptor de mensajes. La conexión se guardará, pero podrías no recibir mensajes.",
                    variant: "destructive"
                });
            } else {
                console.log('✅ Webhooks configurados exitosamente');
            }

            // 2. Limpiar duplicados previos (Misma instancia para este usuario)
            console.log('🧹 Limpiando duplicados para la instancia:', idInstance);
            const { error: deleteError } = await supabase
                .from('communication_channels')
                .delete()
                .eq('user_id', userId)
                .eq('channel_type', 'whatsapp_green_api')
                .eq('channel_config->>idInstance', String(idInstance));

            if (deleteError) {
                console.warn('⚠️ Error limpiando duplicados (no crítico):', deleteError);
            }

            // 3. Guardar en Supabase (Limpio)
            console.log('🆕 Registrando nueva entrada en communication_channels...');
            const { error: saveError } = await supabase
                .from('communication_channels')
                .insert({
                    user_id: userId,
                    channel_type: 'whatsapp_green_api',
                    channel_config: {
                        idInstance: String(idInstance),
                        apiTokenInstance: apiToken,
                        apiUrl: apiUrl || 'https://7107.api.green-api.com',
                        connected_at: new Date().toISOString()
                    },
                    is_connected: true
                });

            if (saveError) throw saveError;

            console.log('✅ Conexión guardada con éxito en Supabase');
            toast({
                title: "¡WhatsApp Conectado!",
                description: "Sincronización completada con éxito.",
            });

            // Dar un tiempo para que Supabase propague antes de llamar onSuccess (reload)
            setTimeout(() => {
                isSyncing.current = false;
                onSuccess();
            }, 1500);

        } catch (error: any) {
            console.error('❌ Error fatal guardando en Supabase:', error);
            isSyncing.current = false;
            toast({
                title: "Error de Sincronización",
                description: error.message || "No se pudo guardar la configuración en la base de datos.",
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
                            Esto puede tardar hasta 2 minutos mientras Green API prepara tu línea.
                        </p>
                    )}
                    <p className="text-[10px] text-green-600 mt-4 text-center opacity-70">
                        * Al activar, se asignará una nueva instancia usando tu crédito de suscripción.
                    </p>
                </div>
            )}

            {(isStarting || loading) && !qrCode && (
                <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 flex flex-col items-center text-center">
                    <Loader2 className="h-12 w-12 text-blue-600 mb-4 animate-spin" />
                    <h4 className="font-bold text-blue-900 mb-2">Iniciando Instancia</h4>
                    <p className="text-sm text-blue-700 mb-2 max-w-xs">
                        Green API está preparando tu servidor dedicado. Esto suele tardar unos 2 minutos.
                    </p>
                    <div className="w-full bg-blue-200 h-2 rounded-full overflow-hidden mt-4">
                        <div
                            className="bg-blue-600 h-full transition-all duration-1000 ease-linear"
                            style={{ width: `${Math.min(100, (120 - startingTimeLeft) * 0.833)}%` }}
                        />
                    </div>
                </div>
            )}

            {isInvalid && (
                <div className="bg-red-50 p-6 rounded-xl border border-red-100 flex flex-col items-center text-center animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="bg-red-100 p-3 rounded-full mb-4">
                        <RefreshCw className="h-6 w-6 text-red-600" />
                    </div>
                    <h4 className="font-bold text-red-900 mb-2 italic">Instancia "Zombie" Detectada</h4>
                    <p className="text-sm text-red-700 mb-6 max-w-xs leading-relaxed">
                        Esta instancia existe en nuestra base de datos pero ha sido eliminada o invalidada en Green API.
                    </p>
                    <Button
                        onClick={() => onInvalidInstance && onInvalidInstance()}
                        variant="destructive"
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold shadow-lg"
                    >
                        Limpiar registros y resetear
                    </Button>
                    <p className="text-[10px] text-red-500 mt-4 opacity-70">
                        * Esto te permitirá solicitar una instancia nueva inmediatamente.
                    </p>
                </div>
            )}

            {initialIdInstance && status === 'disconnected' && !qrCode && !isStarting && !loading && !isInvalid && (
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
