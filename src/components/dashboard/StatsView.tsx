
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, MessageSquare, Users, Bot, Phone, Facebook, Instagram, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useRefreshListener } from '@/hooks/useDataRefresh';

// Tipos TypeScript para las estadísticas
interface ChannelStat {
  name: string;
  messages: number;
  leads: number;
  color: string;
}

interface DailyStat {
  date: Date;
  messages: number;
  leads: number;
  responseRate: number;
}

interface FormattedDailyStat {
  date: string;
  messages: number;
  leads: number;
  responseRate: number;
}

const StatsView = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [timeRange, setTimeRange] = useState('7d');

  // 🔄 Escuchar eventos de refresh de datos
  useRefreshListener(
    async () => {
      console.log('🔄 StatsView: Refreshing statistics data');
      await fetchUserStats();
    },
    'stats'
  );
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalMessages: 0,
    automatedMessages: 0,
    humanMessages: 0,
    clientMessages: 0,
    responseRate: 0,
    newLeads: 0,
    totalClients: 0,
    totalConversations: 0
  });
  const [channelData, setChannelData] = useState<ChannelStat[]>([]);
  const [dailyData, setDailyData] = useState<FormattedDailyStat[]>([]);

  // Datos dinámicos cargados desde la base de datos

  const automationData = [
    { name: 'Automatizados', value: stats.automatedMessages, color: '#10B981' },
    { name: 'Humanos', value: stats.humanMessages, color: '#3B82F6' }
  ];

  // Función para cargar estadísticas del usuario usando consultas directas a tablas base
  const fetchUserStats = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      console.log('🔍 Fetching stats for user:', user.id);
      
      // 1. Obtener conversaciones del usuario
      const { data: conversations, error: conversationsError } = await supabase
        .from('conversations')
        .select(`
          id,
          channel,
          created_at,
          client_id,
          messages (
            id,
            sender_type,
            is_automated,
            created_at
          )
        `)
        .eq('user_id', user.id);
      
      if (conversationsError) {
        throw conversationsError;
      }
      
      // 2. Obtener clientes del usuario
      const { data: clients, error: clientsError } = await supabase
        .from('crm_clients')
        .select('id, status, created_at')
        .eq('user_id', user.id);
      
      if (clientsError) {
        throw clientsError;
      }
      
      console.log('Raw data loaded:', { 
        conversations: conversations?.length || 0, 
        clients: clients?.length || 0 
      });
      
      // 3. Procesar estadísticas generales
      let totalMessages = 0;
      let automatedMessages = 0;
      let humanMessages = 0;
      let clientMessages = 0;
      let conversationsWithResponse = 0;
      
      const channelStats: Record<string, ChannelStat> = {};
      const dailyStats: Record<string, DailyStat> = {};
      const currentDate = new Date();
      const sevenDaysAgo = new Date(currentDate.getTime() - (7 * 24 * 60 * 60 * 1000));
      
      conversations?.forEach(conversation => {
        const messages = conversation.messages || [];
        const hasResponse = messages.some(m => 
          m.sender_type === 'ai' || m.sender_type === 'agent' || m.sender_type === 'human' || m.is_automated
        );
        
        if (hasResponse) {
          conversationsWithResponse++;
        }
        
        // Estadísticas por canal
        const channel = conversation.channel;
        if (!channelStats[channel]) {
          channelStats[channel] = {
            name: channel === 'whatsapp' ? 'WhatsApp' :
                  channel === 'facebook' ? 'Facebook' :
                  channel === 'instagram' ? 'Instagram' : channel,
            messages: 0,
            leads: 0,
            color: channel === 'whatsapp' ? '#25D366' :
                   channel === 'facebook' ? '#1877F2' :
                   channel === 'instagram' ? '#E4405F' : '#6B7280'
          };
        }
        
        messages.forEach(message => {
          totalMessages++;
          channelStats[channel].messages++;
          
          if (message.sender_type === 'ai' || message.is_automated) {
            automatedMessages++;
          } else if (message.sender_type === 'agent' || message.sender_type === 'human') {
            humanMessages++;
          } else if (message.sender_type === 'client') {
            clientMessages++;
          }
          
          // Estadísticas diarias (últimos 7 días)
          const messageDate = new Date(message.created_at);
          if (messageDate >= sevenDaysAgo) {
            const dateKey = messageDate.toDateString();
            if (!dailyStats[dateKey]) {
              dailyStats[dateKey] = {
                date: messageDate,
                messages: 0,
                leads: 0,
                responseRate: 0
              };
            }
            dailyStats[dateKey].messages++;
          }
        });
      });
      
      // 4. Procesar estadísticas de clientes
      const totalClients = clients?.length || 0;
      const newLeads = clients?.filter(client => {
        const createdAt = new Date(client.created_at);
        return createdAt >= sevenDaysAgo;
      }).length || 0;
      
      // Contar leads por canal (aproximación basada en conversaciones con cliente)
      conversations?.forEach(conversation => {
        if (conversation.client_id) {
          const channel = conversation.channel;
          if (channelStats[channel]) {
            channelStats[channel].leads++;
          }
        }
      });
      
      // 5. Calcular tasa de respuesta
      const responseRate = conversations?.length > 0 
        ? Math.round((conversationsWithResponse / conversations.length) * 100 * 100) / 100
        : 0;
      
      // 6. Actualizar estados
      setStats({
        totalMessages,
        automatedMessages,
        humanMessages,
        clientMessages,
        responseRate,
        newLeads,
        totalClients,
        totalConversations: conversations?.length || 0
      });
      
      // 7. Formatear datos por canal
      const formattedChannels = Object.values(channelStats);
      setChannelData(formattedChannels);
      
      // 8. Formatear datos diarios
      const formattedDailyData: FormattedDailyStat[] = Object.values(dailyStats)
        .sort((a: DailyStat, b: DailyStat) => a.date.getTime() - b.date.getTime())
        .map((day: DailyStat) => ({
          date: day.date.toLocaleDateString('es-ES', {
            month: '2-digit',
            day: '2-digit'
          }),
          messages: day.messages,
          leads: day.leads,
          responseRate: day.responseRate
        }));
      
      setDailyData(formattedDailyData);
      
      console.log('Stats processed successfully:', {
        totalMessages,
        automatedMessages,
        humanMessages,
        responseRate,
        channels: formattedChannels.length,
        dailyData: formattedDailyData.length
      });
      
    } catch (error) {
      console.error('Error loading stats:', error);
      toast({
        title: "Error al cargar estadísticas",
        description: error instanceof Error ? error.message : "No se pudieron cargar las estadísticas",
        variant: "destructive",
      });
      
      // En caso de error, mantener datos vacíos
      setStats({
        totalMessages: 0,
        automatedMessages: 0,
        humanMessages: 0,
        clientMessages: 0,
        responseRate: 0,
        newLeads: 0,
        totalClients: 0,
        totalConversations: 0
      });
      setChannelData([]);
      setDailyData([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id, toast]);

  // Cargar estadísticas cuando el usuario esté autenticado
  useEffect(() => {
    if (user && !authLoading) {
      fetchUserStats();
    }
  }, [user, authLoading, fetchUserStats]);

  const StatCard = ({ title, value, icon: Icon, color, subtitle }: { 
    title: string; 
    value: string | number; 
    icon: React.ComponentType<{ className?: string }>; 
    color: string; 
    subtitle?: string; 
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </CardContent>
    </Card>
  );

  // Mostrar loading mientras se verifica autenticación
  if (authLoading) {
    return (
      <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Verificando autenticación...</p>
          </div>
        </div>
      </div>
    );
  }

  // Mostrar error si el usuario no está autenticado
  if (!user) {
    return (
      <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">No autenticado</h2>
            <p className="text-muted-foreground mb-4">Debes iniciar sesión para ver las estadísticas</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold mt-12 lg:mt-0">Estadísticas de {user.email}</h1>
        <div className="flex gap-2">
          {['24h', '7d', '30d', '90d'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                timeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-muted-foreground">Cargando estadísticas...</p>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Mensajes Totales"
          value={stats.totalMessages.toLocaleString()}
          icon={MessageSquare}
          color="text-blue-600"
          subtitle="+12% vs mes anterior"
        />
        <StatCard
          title="Tasa de Respuesta"
          value={`${stats.responseRate}%`}
          icon={TrendingUp}
          color="text-green-600"
          subtitle="+2.3% vs mes anterior"
        />
        <StatCard
          title="Nuevos Leads"
          value={stats.newLeads}
          icon={Users}
          color="text-purple-600"
          subtitle="+8% vs mes anterior"
        />
        <StatCard
          title="Mensajes IA"
          value={`${stats.totalMessages > 0 ? ((stats.automatedMessages / stats.totalMessages) * 100).toFixed(1) : '0.0'}%`}
          icon={Bot}
          color="text-emerald-600"
          subtitle="Automatización"
        />
        </div>
      )}

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Messages per Channel */}
        <Card>
          <CardHeader>
            <CardTitle>Mensajes por Canal</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={channelData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12 }}
                  axisLine={{ stroke: '#e0e0e0' }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  axisLine={{ stroke: '#e0e0e0' }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar 
                  dataKey="messages" 
                  radius={[2, 2, 0, 0]}
                  maxBarSize={40}
                >
                  {channelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>


        {/* Automation Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribución de Mensajes</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={automationData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {automationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Channel Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {channelData.map((channel) => (
          <Card key={channel.name}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium">{channel.name}</CardTitle>
              {channel.name === 'WhatsApp' && <Phone className="h-5 w-5 text-green-600" />}
              {channel.name === 'Facebook' && <Facebook className="h-5 w-5 text-blue-600" />}
              {channel.name === 'Instagram' && <Instagram className="h-5 w-5 text-pink-600" />}
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Mensajes</span>
                  <span className="font-bold">{channel.messages.toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                  <div
                    className="h-2 rounded-full"
                    style={{ 
                      width: `${(channel.messages / Math.max(...channelData.map(c => c.messages))) * 100}%`,
                      backgroundColor: channel.color
                    }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Leads</span>
                  <span className="font-bold">{channel.leads}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                  <div
                    className="h-2 rounded-full"
                    style={{ 
                      width: `${(channel.leads / Math.max(...channelData.map(c => c.leads))) * 100}%`,
                      backgroundColor: channel.color
                    }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 gap-6">
        {/* Daily Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Actividad Diaria</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Line yAxisId="left" type="monotone" dataKey="messages" stroke="#3B82F6" strokeWidth={2} name="Mensajes" />
                <Line yAxisId="right" type="monotone" dataKey="responseRate" stroke="#10B981" strokeWidth={2} name="Tasa de Respuesta %" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StatsView;
