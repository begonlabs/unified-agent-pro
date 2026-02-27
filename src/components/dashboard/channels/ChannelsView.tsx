import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Settings, AlertCircle, Smartphone, Lock, ArrowUpCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { ChannelsViewProps, InstagramConfig } from './types';
import { NotificationService } from '@/components/notifications';
import { EmailService } from '@/services/emailService';
import { useChannels } from './hooks/useChannels';
import { useChannelConnections } from './hooks/useChannelConnections';
import { useChannelActions } from './hooks/useChannelActions';
import { ChannelCard } from './components/ChannelCard';
import { WhatsAppChannel } from './components/WhatsAppChannel';
import { FacebookChannel } from './components/FacebookChannel';
import { InstagramChannel } from './components/InstagramChannel';
import { ChannelStatus } from './components/ChannelStatus';
import { WhatsAppIcon, FacebookIcon, InstagramIcon } from '@/components/icons/ChannelIcons';
import { useProfile } from '@/components/dashboard/profile/hooks/useProfile';
import { getChannelPermissions, getPermissionsDescription } from '@/lib/channelPermissions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAdmin } from '@/hooks/useAdmin';

const ChannelsView: React.FC<ChannelsViewProps> = ({ user }) => {
  const { toast } = useToast();
  const { user: authUser } = useAuth();

  // Usar el usuario de auth si no se pasa como prop
  const currentUser = user || authUser;

  // Obtener perfil y permisos
  const { profile } = useProfile(currentUser);
  const permissions = profile ? getChannelPermissions(profile) : null;
  const { isAdmin } = useAdmin(currentUser as any);

  // Hooks principales
  const { channels, setChannels, loading, fetchChannels, getChannelStatus } = useChannels(currentUser);
  const {
    isConnectingWhatsApp,
    handleWhatsAppLogin,
    handleFacebookLogin,
    handleInstagramLogin
  } = useChannelConnections(currentUser);
  const {
    handleDisconnectChannel,
    handleTestWebhook,
    handleHardDeleteChannel,
    handleClearAllWhatsAppChannels
  } = useChannelActions(currentUser);

  // Check for success parameters in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const successParam = urlParams.get('success');

    if (successParam === 'true' && currentUser?.id) {
      setTimeout(() => {
        fetchChannels();
      }, 1000);

      // Crear notificación de conexión exitosa
      const pageName = urlParams.get('page_name');
      const businessName = urlParams.get('business_name');
      const phoneNumber = urlParams.get('phone_number');
      const channel = urlParams.get('channel');

      let title = '';
      let description = '';
      let channelName = '';

      switch (channel) {
        case 'whatsapp':
          channelName = 'WhatsApp Business';
          title = 'WhatsApp conectado exitosamente';
          description = businessName && phoneNumber
            ? `Empresa: ${businessName} - Teléfono: ${phoneNumber}`
            : 'Tu cuenta de WhatsApp Business ha sido conectada';
          break;
        case 'facebook':
          channelName = 'Facebook Messenger';
          title = 'Facebook conectado exitosamente';
          description = pageName
            ? `Página: ${pageName}`
            : 'Tu página de Facebook ha sido conectada';
          break;
        case 'instagram':
          channelName = 'Instagram Direct';
          title = 'Instagram conectado exitosamente';
          description = 'Tu cuenta de Instagram ha sido conectada';
          break;
        default:
          channelName = 'Canal';
          title = 'Canal conectado exitosamente';
          description = 'El canal ha sido conectado correctamente';
      }

      NotificationService.createNotification(
        currentUser.id,
        'channel_connection',
        title,
        description,
        {
          priority: 'high',
          metadata: {
            channel_type: channel || 'unknown',
            channel_name: channelName,
            page_name: pageName,
            business_name: businessName,
            phone_number: phoneNumber
          },
          action_url: '/dashboard/channels',
          action_label: 'Ver configuración'
        }
      ).catch(error => {
        console.error('Error creating connection notification:', error);
      });

      // Enviar correo de conexión exitosa
      EmailService.shouldSendEmail(currentUser.id, 'channels').then(shouldSend => {
        if (shouldSend && currentUser.email) {
          const template = EmailService.getTemplates().channelConnected(
            currentUser.email.split('@')[0],
            channelName,
            channel || 'unknown'
          );
          EmailService.sendEmail({
            to: currentUser.email,
            template,
            priority: 'high'
          }).catch(error => {
            console.error('Error sending connection email:', error);
          });
        }
      });

      // Limpiar URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [fetchChannels, currentUser?.id]);



  // Handlers para acciones de canales
  const handleDisconnect = async (channelId: string) => {
    await handleDisconnectChannel(channelId, channels, setChannels);
  };

  const handleHardDelete = async (channelId: string) => {
    await handleHardDeleteChannel(channelId, channels, setChannels);
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

      {/* Plan Limits Banner */}
      {profile && permissions && (
        <Alert className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-blue-100 rounded-full">
              <Lock className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <AlertTitle className="text-blue-800 font-semibold flex items-center gap-2">
                Tu Plan: {profile.plan_type === 'free' ? 'Trial Gratuito' : profile.plan_type.charAt(0).toUpperCase() + profile.plan_type.slice(1)}
                {profile.is_trial && <span className="text-xs bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full">Prueba</span>}
              </AlertTitle>
              <AlertDescription className="text-blue-700 mt-1">
                <p className="mb-2">{getPermissionsDescription(profile)}</p>
                <div className="flex flex-wrap gap-2 text-sm">
                  {(() => {
                    const uniqueTotal = new Set();
                    const uniqueWhatsApp = new Set();

                    channels.forEach(c => {
                      const type = c.channel_type === 'whatsapp_green_api' ? 'whatsapp' : c.channel_type;
                      const id = c.channel_type === 'whatsapp_green_api'
                        ? (c.channel_config as any)?.idInstance
                        : c.id;

                      uniqueTotal.add(`${type}_${id}`);
                      if (type === 'whatsapp') uniqueWhatsApp.add(id);
                    });

                    return (
                      <>
                        <span className={`px-2 py-1 rounded-md ${uniqueTotal.size >= permissions.maxChannels && permissions.maxChannels !== -1 ? 'bg-red-100 text-red-700' : 'bg-white text-blue-700'}`}>
                          Canales totales: {uniqueTotal.size} / {permissions.maxChannels === -1 ? 'Ilimitados' : permissions.maxChannels}
                        </span>
                        {permissions.maxWhatsappChannels !== -1 && (
                          <span className={`px-2 py-1 rounded-md ${uniqueWhatsApp.size >= permissions.maxWhatsappChannels ? 'bg-red-100 text-red-700' : 'bg-white text-blue-700'}`}>
                            WhatsApp: {uniqueWhatsApp.size} / {permissions.maxWhatsappChannels}
                          </span>
                        )}
                      </>
                    );
                  })()}
                </div>
              </AlertDescription>
            </div>
            <Button
              variant="outline"
              className="hidden sm:flex border-blue-300 text-blue-700 hover:bg-blue-100"
              onClick={() => window.location.href = '/dashboard?view=profile&tab=subscription'}
            >
              <ArrowUpCircle className="mr-2 h-4 w-4" />
              Mejorar Plan
            </Button>
          </div>
        </Alert>
      )}

      {/* Channel Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* WhatsApp */}
        <ChannelCard
          title="WhatsApp Business"
          icon={WhatsAppIcon}
          color="bg-transparent"
          connected={getChannelStatus('whatsapp')}
          description="Conecta tu WhatsApp Business"
        >
          <WhatsAppChannel
            channels={channels}
            isConnectingWhatsApp={isConnectingWhatsApp}
            onConnect={handleWhatsAppLogin}
            onReconnect={handleWhatsAppLogin}
            onDisconnect={handleDisconnect}
            onHardDelete={handleHardDelete}
            permissions={permissions}
            profile={profile}
          />
        </ChannelCard>

        {/* Facebook */}
        <ChannelCard
          title="Facebook Messenger"
          icon={FacebookIcon}
          color="bg-transparent"
          connected={getChannelStatus('facebook')}
          description="Conecta tus páginas de Facebook"
        >
          <FacebookChannel
            channels={channels}
            onConnect={handleFacebookLogin}
            onReconnect={handleFacebookLogin}
            onDisconnect={handleDisconnect}
            onTestWebhook={handleTestWebhook}
            permissions={permissions}
            profile={profile}
          />
        </ChannelCard>

        {/* Instagram */}
        <ChannelCard
          title="Instagram Direct"
          icon={InstagramIcon}
          color="bg-transparent"
          connected={getChannelStatus('instagram')}
          description="Conecta tus cuentas de Instagram"
        >
          <InstagramChannel
            channels={channels}
            onConnect={handleInstagramLogin}

            onReconnect={handleInstagramLogin}
            onDisconnect={handleDisconnect}
            permissions={permissions}
            profile={profile}
          />
        </ChannelCard>
      </div>

      {/* Channel Status */}
      <div className="flex justify-between items-center">
        <ChannelStatus
          channels={channels}
          getChannelStatus={getChannelStatus}
          onHardDelete={handleHardDelete}
        />
      </div>
      {/* Admin Only: Clear All Button (Hidden for regular users for safety) */}
      {isAdmin && (
        <div className="pt-8 border-t border-slate-100 mt-8">
          <div className="bg-red-50/50 p-4 rounded-xl border border-red-100 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-red-100 p-2 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-red-900">Zona de Administración</p>
                <p className="text-xs text-red-700">Estas acciones son globales y agresivas. Úsalas con precaución.</p>
              </div>
            </div>
            <Button
              variant="destructive"
              size="sm"
              className="bg-red-600 hover:bg-red-700 font-bold shadow-sm"
              onClick={() => handleClearAllWhatsAppChannels(channels, setChannels)}
            >
              LIMPIAR TODO WHATSAPP
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChannelsView;
