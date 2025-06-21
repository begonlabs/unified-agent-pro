
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  MessageSquare, 
  UserPlus, 
  TrendingUp,
  Phone,
  Facebook,
  Instagram
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
}

const GeneralStats = () => {
  const [stats, setStats] = useState<GeneralStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchGeneralStats();
  }, []);

  const fetchGeneralStats = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_general_stats')
        .select('*')
        .single();

      if (error) throw error;
      setStats(data);
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

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i}>
            <CardContent className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
          <p className="text-gray-500">No se pudieron cargar las estadísticas</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estadísticas de Clientes */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Resumen de Clientes</h3>
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
        <h3 className="text-lg font-semibold mb-4">Actividad de la Plataforma</h3>
        <div className="grid gap-6 md:grid-cols-2">
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
        </div>
      </div>

      {/* Estadísticas por Canal */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Actividad por Canal</h3>
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">WhatsApp</CardTitle>
              <Phone className="h-4 w-4 text-green-500" />
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
