
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Eye, Phone, Facebook, Instagram } from 'lucide-react';

interface ClientWithStats {
  id: string;
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
  };
}

const ClientStats = () => {
  const [clients, setClients] = useState<ClientWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchClientStats();
  }, []);

  const fetchClientStats = async () => {
    try {
      // Obtener todos los clientes
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('company_name');

      if (profilesError) throw profilesError;

      // Obtener estadísticas para cada cliente
      const clientsWithStats: ClientWithStats[] = [];

      for (const profile of profiles || []) {
        const { data: stats, error: statsError } = await supabase
          .from('statistics')
          .select('*')
          .eq('user_id', profile.user_id);

        if (statsError) {
          console.error('Error fetching stats for client:', profile.id, statsError);
          continue;
        }

        // Agregar estadísticas por canal
        const whatsapp_messages = stats?.filter(s => s.channel === 'whatsapp').reduce((sum, s) => sum + (s.total_messages || 0), 0) || 0;
        const facebook_messages = stats?.filter(s => s.channel === 'facebook').reduce((sum, s) => sum + (s.total_messages || 0), 0) || 0;
        const instagram_messages = stats?.filter(s => s.channel === 'instagram').reduce((sum, s) => sum + (s.total_messages || 0), 0) || 0;
        const whatsapp_leads = stats?.filter(s => s.channel === 'whatsapp').reduce((sum, s) => sum + (s.new_leads || 0), 0) || 0;
        const facebook_leads = stats?.filter(s => s.channel === 'facebook').reduce((sum, s) => sum + (s.new_leads || 0), 0) || 0;
        const instagram_leads = stats?.filter(s => s.channel === 'instagram').reduce((sum, s) => sum + (s.new_leads || 0), 0) || 0;

        clientsWithStats.push({
          ...profile,
          stats: {
            whatsapp_messages,
            facebook_messages,
            instagram_messages,
            whatsapp_leads,
            facebook_leads,
            instagram_leads,
            total_messages: whatsapp_messages + facebook_messages + instagram_messages,
            total_leads: whatsapp_leads + facebook_leads + instagram_leads,
          }
        });
      }

      setClients(clientsWithStats);
    } catch (error: any) {
      toast({
        title: "Error al cargar estadísticas",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getPlanBadge = (plan: string) => {
    const colors = {
      free: 'bg-gray-100 text-gray-800',
      premium: 'bg-blue-100 text-blue-800',
      enterprise: 'bg-purple-100 text-purple-800'
    };
    return colors[plan as keyof typeof colors] || colors.free;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Estadísticas por Cliente</CardTitle>
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
                  <TableHead>Mensajes Totales</TableHead>
                  <TableHead>Leads Totales</TableHead>
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
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3 text-green-500" />
                        <span className="text-sm">{client.stats.whatsapp_messages}M / {client.stats.whatsapp_leads}L</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Facebook className="h-3 w-3 text-blue-500" />
                        <span className="text-sm">{client.stats.facebook_messages}M / {client.stats.facebook_leads}L</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Instagram className="h-3 w-3 text-pink-500" />
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
                        onClick={() => setSelectedClient(selectedClient === client.id ? null : client.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Detalles expandidos del cliente seleccionado */}
          {selectedClient && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              {(() => {
                const client = clients.find(c => c.id === selectedClient);
                if (!client) return null;
                
                return (
                  <div>
                    <h4 className="font-medium mb-3">Detalles de {client.company_name}</h4>
                    <div className="grid gap-4 md:grid-cols-3">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">WhatsApp</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-1">
                            <div className="text-lg font-bold">{client.stats.whatsapp_messages}</div>
                            <div className="text-xs text-gray-500">Mensajes</div>
                            <div className="text-lg font-bold">{client.stats.whatsapp_leads}</div>
                            <div className="text-xs text-gray-500">Leads</div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Facebook</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-1">
                            <div className="text-lg font-bold">{client.stats.facebook_messages}</div>
                            <div className="text-xs text-gray-500">Mensajes</div>
                            <div className="text-lg font-bold">{client.stats.facebook_leads}</div>
                            <div className="text-xs text-gray-500">Leads</div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Instagram</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-1">
                            <div className="text-lg font-bold">{client.stats.instagram_messages}</div>
                            <div className="text-xs text-gray-500">Mensajes</div>
                            <div className="text-lg font-bold">{client.stats.instagram_leads}</div>
                            <div className="text-xs text-gray-500">Leads</div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientStats;
