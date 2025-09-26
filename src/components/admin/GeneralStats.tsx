
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { supabaseSelect, handleSupabaseError } from '@/lib/supabaseUtils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import logoWhite from '@/assets/logo_white.png';
import { 
  Users, 
  MessageSquare, 
  UserPlus, 
  TrendingUp,
  Phone,
  Facebook,
  Instagram,
  MessageCircle
} from 'lucide-react';

interface GeneralStatsData {
  total_clients: number;
  free_clients: number;
  premium_clients: number;
  enterprise_clients: number;
  total_messages_platform: number;
  total_leads_platform: number;
  whatsapp_messages: number;
  facebook_messages: number;
  instagram_messages: number;
  whatsapp_leads: number;
  facebook_leads: number;
  instagram_leads: number;
  total_conversations: number;
  active_clients: number;
  inactive_clients: number;
}

const GeneralStats = () => {
  const [stats, setStats] = useState<GeneralStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchGeneralStats = useCallback(async () => {
    try {
      setLoading(true);

      // Obtener estadísticas de clientes por plan
      const { data: profiles, error: profilesError } = await supabaseSelect(
        supabase
          .from('profiles')
          .select('plan_type, is_active')
      );

      if (profilesError) throw profilesError;

      // Contar clientes por plan
      const planCounts = {
        free: 0,
        premium: 0,
        enterprise: 0,
        active: 0,
        inactive: 0
      };

      for (const profile of profiles || []) {
        if (profile.is_active) {
          planCounts.active++;
        } else {
          planCounts.inactive++;
        }

        switch (profile.plan_type) {
          case 'free':
            planCounts.free++;
            break;
          case 'premium':
            planCounts.premium++;
            break;
          case 'enterprise':
            planCounts.enterprise++;
            break;
        }
      }

      // Obtener estadísticas de mensajes por canal
      const { data: conversations, error: conversationsError } = await supabaseSelect(
        supabase
          .from('conversations')
          .select('id, channel')
      );

      if (conversationsError) throw conversationsError;

      const channelStats = {
        whatsapp: { messages: 0, leads: 0 },
        facebook: { messages: 0, leads: 0 },
        instagram: { messages: 0, leads: 0 }
      };

      // Contar mensajes por canal
      for (const conversation of conversations || []) {
        const { data: messages, error: messagesError } = await supabaseSelect(
          supabase
            .from('messages')
            .select('id')
            .eq('conversation_id', conversation.id)
        );

        if (messagesError) {
          continue;
        }

        const channel = conversation.channel as keyof typeof channelStats;
        if (channelStats[channel]) {
          channelStats[channel].messages += messages?.length || 0;
        }
      }

      // Obtener leads por canal desde CRM
      const { data: crmClients, error: crmError } = await supabaseSelect(
        supabase
          .from('crm_clients')
          .select('source')
      );

      if (!crmError) {
        // Contar leads por canal
        for (const client of crmClients || []) {
          const source = client.source as keyof typeof channelStats;
          if (channelStats[source]) {
            channelStats[source].leads += 1;
          }
        }
      }

      // Calcular totales
      const totalMessages = channelStats.whatsapp.messages + channelStats.facebook.messages + channelStats.instagram.messages;
      const totalLeads = channelStats.whatsapp.leads + channelStats.facebook.leads + channelStats.instagram.leads;
      const totalConversations = conversations?.length || 0;

      const generalStats: GeneralStatsData = {
        total_clients: profiles?.length || 0,
        free_clients: planCounts.free,
        premium_clients: planCounts.premium,
        enterprise_clients: planCounts.enterprise,
        total_messages_platform: totalMessages,
        total_leads_platform: totalLeads,
        whatsapp_messages: channelStats.whatsapp.messages,
        facebook_messages: channelStats.facebook.messages,
        instagram_messages: channelStats.instagram.messages,
        whatsapp_leads: channelStats.whatsapp.leads,
        facebook_leads: channelStats.facebook.leads,
        instagram_leads: channelStats.instagram.leads,
        total_conversations: totalConversations,
        active_clients: planCounts.active,
        inactive_clients: planCounts.inactive
      };

      setStats(generalStats);
    } catch (error: unknown) {
      const errorInfo = handleSupabaseError(error, "Error al cargar estadísticas generales");
      toast({
        title: errorInfo.title,
        description: errorInfo.description,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchGeneralStats();
  }, [fetchGeneralStats]);

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i}>
            <CardContent className="flex items-center justify-center h-32">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-muted-foreground text-sm">Cargando estadísticas...</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-48">
          <div className="text-center">
            <p className="text-gray-500 mb-2">No se pudieron cargar las estadísticas</p>
            <button 
              onClick={fetchGeneralStats}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              Reintentar
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estadísticas de Clientes */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <div className="relative">
            <img src={logoWhite} alt="OndAI Logo" className="h-6 w-6" />
          </div>
          <span className="text-transparent bg-gradient-to-r from-[#3a0caa] to-[#710db2] bg-clip-text">Resumen de Clientes</span>
        </h3>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Clientes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_clients}</div>
              <p className="text-xs text-muted-foreground">Usuarios registrados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Plan Gratuito</CardTitle>
              <Users className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.free_clients}</div>
              <p className="text-xs text-muted-foreground">
                {stats.total_clients > 0 ? Math.round((stats.free_clients / stats.total_clients) * 100) : 0}% del total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Plan Premium</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.premium_clients}</div>
              <p className="text-xs text-muted-foreground">
                {stats.total_clients > 0 ? Math.round((stats.premium_clients / stats.total_clients) * 100) : 0}% del total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Plan Enterprise</CardTitle>
              <Users className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.enterprise_clients}</div>
              <p className="text-xs text-muted-foreground">
                {stats.total_clients > 0 ? Math.round((stats.enterprise_clients / stats.total_clients) * 100) : 0}% del total
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Estadísticas Generales de la Plataforma */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <div className="relative">
            <img src={logoWhite} alt="OndAI Logo" className="h-6 w-6" />
          </div>
          <span className="text-transparent bg-gradient-to-r from-[#3a0caa] to-[#710db2] bg-clip-text">Actividad de la Plataforma</span>
        </h3>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Mensajes</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_messages_platform?.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Mensajes procesados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
              <UserPlus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_leads_platform?.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Leads generados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversaciones</CardTitle>
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_conversations?.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Conversaciones activas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clientes Activos</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active_clients}</div>
              <p className="text-xs text-muted-foreground">
                {stats.total_clients > 0 ? Math.round((stats.active_clients / stats.total_clients) * 100) : 0}% del total
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Estadísticas por Canal */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <div className="relative">
            <img src={logoWhite} alt="OndAI Logo" className="h-6 w-6" />
          </div>
          <span className="text-transparent bg-gradient-to-r from-[#3a0caa] to-[#710db2] bg-clip-text">Actividad por Canal</span>
        </h3>
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">WhatsApp</CardTitle>
              <MessageCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <div className="text-xl font-bold">{stats.whatsapp_messages?.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">Mensajes</p>
                </div>
                <div>
                  <div className="text-xl font-bold">{stats.whatsapp_leads?.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">Leads</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Facebook</CardTitle>
              <Facebook className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <div className="text-xl font-bold">{stats.facebook_messages?.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">Mensajes</p>
                </div>
                <div>
                  <div className="text-xl font-bold">{stats.facebook_leads?.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">Leads</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Instagram</CardTitle>
              <Instagram className="h-4 w-4 text-pink-500" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <div className="text-xl font-bold">{stats.instagram_messages?.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">Mensajes</p>
                </div>
                <div>
                  <div className="text-xl font-bold">{stats.instagram_leads?.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">Leads</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default GeneralStats;
