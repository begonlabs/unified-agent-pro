
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { supabaseSelect, handleSupabaseError } from '@/lib/supabaseUtils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Eye, Phone, Facebook, Instagram, MessageCircle, User, X } from 'lucide-react';

interface ClientWithStats {
  id: string;
  user_id: string;
  company_name: string;
  email: string;
  plan_type: string;
  is_active: boolean;
  stats: {
    whatsapp_messages: number;
    facebook_messages: number;
    instagram_messages: number;
    whatsapp_leads: number;
    facebook_leads: number;
    instagram_leads: number;
    total_messages: number;
    total_leads: number;
    total_conversations: number;
    response_rate: number;
  };
}

const ClientStats = () => {
  const [clients, setClients] = useState<ClientWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<ClientWithStats | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();

  const fetchClientStats = useCallback(async () => {
    try {
      setLoading(true);
      
      // Obtener todos los perfiles de usuarios
      const { data: profiles, error: profilesError } = await supabaseSelect(
        supabase
          .from('profiles')
          .select('*')
          .order('company_name')
      );

      if (profilesError) throw profilesError;

      // Obtener estadísticas para cada cliente
      const clientsWithStats: ClientWithStats[] = [];

      for (const profile of profiles || []) {
        // Obtener conversaciones del usuario
        const { data: conversations, error: conversationsError } = await supabaseSelect(
          supabase
            .from('conversations')
            .select('id, channel, created_at')
            .eq('user_id', profile.user_id)
        );

        if (conversationsError) {
          continue;
        }

        // Obtener mensajes por canal
        const channelStats = {
          whatsapp: { messages: 0, leads: 0 },
          facebook: { messages: 0, leads: 0 },
          instagram: { messages: 0, leads: 0 }
        };

        // Obtener mensajes para cada conversación
        for (const conversation of conversations || []) {
          const { data: messages, error: messagesError } = await supabaseSelect(
            supabase
              .from('messages')
              .select('sender_type, created_at')
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

        // Obtener leads (clientes CRM) por canal
        const { data: crmClients, error: crmError } = await supabaseSelect(
          supabase
            .from('crm_clients')
            .select('source, created_at')
            .eq('user_id', profile.user_id)
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

        // Calcular estadísticas totales
        const totalMessages = channelStats.whatsapp.messages + channelStats.facebook.messages + channelStats.instagram.messages;
        const totalLeads = channelStats.whatsapp.leads + channelStats.facebook.leads + channelStats.instagram.leads;
        const totalConversations = conversations?.length || 0;
        
        // Calcular tasa de respuesta (simplificado)
        const responseRate = totalMessages > 0 ? Math.round((totalMessages / totalConversations) * 100) / 100 : 0;

        clientsWithStats.push({
          ...profile,
          stats: {
            whatsapp_messages: channelStats.whatsapp.messages,
            facebook_messages: channelStats.facebook.messages,
            instagram_messages: channelStats.instagram.messages,
            whatsapp_leads: channelStats.whatsapp.leads,
            facebook_leads: channelStats.facebook.leads,
            instagram_leads: channelStats.instagram.leads,
            total_messages: totalMessages,
            total_leads: totalLeads,
            total_conversations: totalConversations,
            response_rate: responseRate
          }
        });
      }

      setClients(clientsWithStats);
    } catch (error: unknown) {
      const errorInfo = handleSupabaseError(error, "Error al cargar estadísticas de clientes");
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
    fetchClientStats();
  }, [fetchClientStats]);

  const openClientDetails = (client: ClientWithStats) => {
    setSelectedClient(client);
    setIsModalOpen(true);
  };

  const closeClientDetails = () => {
    setSelectedClient(null);
    setIsModalOpen(false);
  };

  const getPlanBadge = (plan: string) => {
    const colors = {
      free: 'bg-gray-100 text-gray-800',
      premium: 'bg-blue-100 text-blue-800',
      enterprise: 'bg-purple-100 text-purple-800'
    };
    return colors[plan as keyof typeof colors] || colors.free;
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'whatsapp':
        return <MessageCircle className="h-3 w-3 text-green-500" />;
      case 'facebook':
        return <Facebook className="h-3 w-3 text-blue-500" />;
      case 'instagram':
        return <Instagram className="h-3 w-3 text-pink-500" />;
      default:
        return <User className="h-3 w-3 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-48">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando estadísticas de clientes...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-blue-600" />
            Estadísticas por Cliente
          </CardTitle>
          <CardDescription>
            Resumen de actividad y rendimiento de cada cliente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Mensajes</TableHead>
                  <TableHead>Leads</TableHead>
                  <TableHead>Conversaciones</TableHead>
                  <TableHead>Tasa Respuesta</TableHead>
                  <TableHead>WhatsApp</TableHead>
                  <TableHead>Facebook</TableHead>
                  <TableHead>Instagram</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{client.company_name}</div>
                        <div className="text-sm text-gray-500">{client.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPlanBadge(client.plan_type)}>
                        {client.plan_type.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{client.stats.total_messages.toLocaleString()}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{client.stats.total_leads.toLocaleString()}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{client.stats.total_conversations.toLocaleString()}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{client.stats.response_rate.toFixed(2)}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {getChannelIcon('whatsapp')}
                        <span className="text-sm">{client.stats.whatsapp_messages}M / {client.stats.whatsapp_leads}L</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {getChannelIcon('facebook')}
                        <span className="text-sm">{client.stats.facebook_messages}M / {client.stats.facebook_leads}L</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {getChannelIcon('instagram')}
                        <span className="text-sm">{client.stats.instagram_messages}M / {client.stats.instagram_leads}L</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={client.is_active ? "default" : "secondary"}>
                        {client.is_active ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openClientDetails(client)}
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal de detalles del cliente */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Detalles de {selectedClient?.company_name}
            </DialogTitle>
          </DialogHeader>
          
          {selectedClient && (
            <div className="space-y-6">
              {/* Información general del cliente */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Información General</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Empresa:</span>
                        <span className="font-medium">{selectedClient.company_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Email:</span>
                        <span className="font-medium">{selectedClient.email}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Plan:</span>
                        <Badge className={getPlanBadge(selectedClient.plan_type)}>
                          {selectedClient.plan_type.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Estado:</span>
                        <Badge variant={selectedClient.is_active ? "default" : "secondary"}>
                          {selectedClient.is_active ? "Activo" : "Inactivo"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Estadísticas por canal */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Estadísticas por Canal</h3>
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        {getChannelIcon('whatsapp')}
                        WhatsApp
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Mensajes:</span>
                          <span className="font-bold text-lg">{selectedClient.stats.whatsapp_messages}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Leads:</span>
                          <span className="font-bold text-lg">{selectedClient.stats.whatsapp_leads}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        {getChannelIcon('facebook')}
                        Facebook
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Mensajes:</span>
                          <span className="font-bold text-lg">{selectedClient.stats.facebook_messages}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Leads:</span>
                          <span className="font-bold text-lg">{selectedClient.stats.facebook_leads}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        {getChannelIcon('instagram')}
                        Instagram
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Mensajes:</span>
                          <span className="font-bold text-lg">{selectedClient.stats.instagram_messages}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Leads:</span>
                          <span className="font-bold text-lg">{selectedClient.stats.instagram_leads}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Resumen de actividad */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Resumen de Actividad</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{selectedClient.stats.total_messages.toLocaleString()}</div>
                      <div className="text-sm text-gray-500">Total Mensajes</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{selectedClient.stats.total_leads.toLocaleString()}</div>
                      <div className="text-sm text-gray-500">Total Leads</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{selectedClient.stats.total_conversations.toLocaleString()}</div>
                      <div className="text-sm text-gray-500">Conversaciones</div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">{selectedClient.stats.response_rate.toFixed(2)}</div>
                      <div className="text-sm text-gray-500">Tasa Respuesta</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientStats;
