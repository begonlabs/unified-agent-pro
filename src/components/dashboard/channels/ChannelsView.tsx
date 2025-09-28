import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Settings, AlertCircle, Smartphone } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { ChannelsViewProps, InstagramConfig } from './types';
import { useChannels } from './hooks/useChannels';
import { useChannelConnections } from './hooks/useChannelConnections';
import { useInstagramVerification } from './hooks/useInstagramVerification';
import { useChannelActions } from './hooks/useChannelActions';
import { ChannelCard } from './components/ChannelCard';
import { WhatsAppChannel } from './components/WhatsAppChannel';
import { FacebookChannel } from './components/FacebookChannel';
import { InstagramChannel } from './components/InstagramChannel';
import { ChannelStatus } from './components/ChannelStatus';
import { Phone, Facebook, Instagram } from 'lucide-react';

const ChannelsView: React.FC<ChannelsViewProps> = ({ user }) => {
  const { toast } = useToast();
  const { user: authUser } = useAuth();
  
  // Usar el usuario de auth si no se pasa como prop
  const currentUser = user || authUser;
  
  // Hooks principales
  const { channels, setChannels, loading, fetchChannels, getChannelStatus } = useChannels(currentUser);
  const { 
    isConnectingWhatsApp, 
    handleWhatsAppLogin, 
    handleFacebookLogin, 
    handleInstagramLogin 
  } = useChannelConnections(currentUser);
  const {
    igVerifications,
    setIgVerifications,
    isGeneratingCode,
    verificationPolling,
    notificationsShown,
    setNotificationsShown,
    generateInstagramVerificationCode,
    instagramNeedsVerification,
    getInstagramVerificationStatus
  } = useInstagramVerification(currentUser);
  const { handleDisconnectChannel, handleTestWebhook } = useChannelActions(currentUser);

  // Check for success parameters in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const successParam = urlParams.get('success');
    
    if (successParam === 'true') {
      setTimeout(() => {
        fetchChannels();
      }, 1000);
      
      const pageName = urlParams.get('page_name');
      const businessName = urlParams.get('business_name');
      const phoneNumber = urlParams.get('phone_number');
      const channel = urlParams.get('channel');
      
      if (channel === 'whatsapp' && businessName) {
        toast({
          title: "WhatsApp conectado exitosamente",
          description: `Empresa: ${businessName}${phoneNumber ? ` - ${phoneNumber}` : ''}`,
        });
      } else if (pageName && channel) {
        toast({
          title: "Canal reconectado exitosamente",
          description: `${channel === 'facebook' ? 'Facebook' : 'Canal'} actualizado: ${pageName}`,
        });
      }
      
      // Limpiar URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [fetchChannels, toast]);

  // Auto-detect Instagram channels that need verification on load
  useEffect(() => {
    if (channels.length > 0 && currentUser) {
      const instagramChannels = channels.filter(c => c.channel_type === 'instagram');
      
      instagramChannels.forEach(channel => {
        const config = channel.channel_config as InstagramConfig;
        const needsVerification = instagramNeedsVerification(config);
        const hasExistingVerification = igVerifications[channel.id];
        const isConnected = getChannelStatus('instagram');
        const notificationKey = `instagram-verification-${channel.id}`;
        
        // Only show notification for connected Instagram that needs verification
        // and only if we haven't shown it before
        if (isConnected && needsVerification && !hasExistingVerification && !config?.verified_at && !notificationsShown.has(notificationKey)) {
          setTimeout(() => {
            toast({
              title: "Instagram detectado - Verificación requerida",
              description: `@${config?.username} está conectado pero necesita verificación para recibir mensajes automáticamente.`,
            });
            
            // Mark this notification as shown
            setNotificationsShown(prev => new Set(prev).add(notificationKey));
          }, 3000);
        }
      });
    }
  }, [channels, currentUser, igVerifications, toast, getChannelStatus, instagramNeedsVerification, notificationsShown, setNotificationsShown]);

  // Handlers para acciones de canales
  const handleDisconnect = (channelId: string) => {
    handleDisconnectChannel(channelId, channels, setChannels);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ 
      title: "📋 Código copiado al portapapeles",
      description: "Ahora pégalo en un mensaje de Instagram"
    });
  };

  // Show loading state while auth is being checked
  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Verificando autenticación...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error if user is not authenticated
  if (!currentUser) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">No autenticado</h2>
            <p className="text-muted-foreground mb-4">Debes iniciar sesión para acceder a esta página</p>
            <Button onClick={() => window.location.href = '/auth'}>
              Ir a Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-12 lg:mt-0">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="p-2 sm:p-3 rounded-lg bg-gradient-to-r from-[#3a0caa] to-[#710db2]">
            <Settings className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-transparent bg-gradient-to-r from-[#3a0caa] to-[#710db2] bg-clip-text">
              Configuración de Canales
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Conecta tus redes sociales de manera sencilla
              {channels.length > 0 && (
                <span className="block sm:inline sm:ml-2 mt-1 sm:mt-0">
                  • {channels.length} canal{channels.length !== 1 ? 'es' : ''} 
                  {channels.some(c => c.channel_type === 'instagram' && c.is_connected) && (
                    <span className="ml-1 text-pink-600 font-medium flex items-center">
                      <Smartphone className="h-3 w-3 mr-1" /> Instagram detectado
                    </span>
                  )}
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="text-xs sm:text-sm">Configuración</span>
        </div>
      </div>

      {/* Channel Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* WhatsApp */}
        <ChannelCard
          title="WhatsApp Business"
          icon={Phone}
          color="bg-green-600"
          connected={getChannelStatus('whatsapp')}
          description="Conecta tu número de WhatsApp Business"
        >
          <WhatsAppChannel
            channels={channels}
            isConnectingWhatsApp={isConnectingWhatsApp}
            onConnect={handleWhatsAppLogin}
            onReconnect={handleWhatsAppLogin}
            onDisconnect={handleDisconnect}
          />
        </ChannelCard>

        {/* Facebook */}
        <ChannelCard
          title="Facebook Messenger"
          icon={Facebook}
          color="bg-blue-600"
          connected={getChannelStatus('facebook')}
          description="Conecta tus páginas de Facebook"
        >
          <FacebookChannel
            channels={channels}
            onConnect={handleFacebookLogin}
            onReconnect={handleFacebookLogin}
            onDisconnect={handleDisconnect}
            onTestWebhook={handleTestWebhook}
          />
        </ChannelCard>

        {/* Instagram */}
        <ChannelCard
          title="Instagram Direct"
          icon={Instagram}
          color="bg-pink-600"
          connected={getChannelStatus('instagram')}
          description="Conecta tus cuentas de Instagram"
        >
          <InstagramChannel
            channels={channels}
            onConnect={handleInstagramLogin}
            onReconnect={handleInstagramLogin}
            onDisconnect={handleDisconnect}
            instagramNeedsVerification={instagramNeedsVerification}
            igVerifications={igVerifications}
            isGeneratingCode={isGeneratingCode}
            verificationPolling={verificationPolling}
            onGenerateVerificationCode={generateInstagramVerificationCode}
            onCopyCode={handleCopyCode}
          />
        </ChannelCard>
      </div>

      {/* Channel Status */}
      <ChannelStatus
        channels={channels}
        getChannelStatus={getChannelStatus}
        instagramNeedsVerification={instagramNeedsVerification}
      />
    </div>
  );
};

export default ChannelsView;
