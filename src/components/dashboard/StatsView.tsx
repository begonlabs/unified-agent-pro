
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, MessageSquare, Users, Bot, Phone, Facebook, Instagram, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

const StatsView = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [timeRange, setTimeRange] = useState('7d');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalMessages: 0,
    automatedMessages: 0,
    humanMessages: 0,
    responseRate: 0,
    newLeads: 0,
    totalClients: 0
  });

  const channelData = [
    { name: 'WhatsApp', messages: 1456, leads: 89, color: '#25D366' },
    { name: 'Facebook', messages: 892, leads: 45, color: '#1877F2' },
    { name: 'Instagram', messages: 499, leads: 22, color: '#E4405F' }
  ];

  const dailyData = [
    { date: '2024-01-01', messages: 245, leads: 12, responseRate: 92 },
    { date: '2024-01-02', messages: 312, leads: 18, responseRate: 95 },
    { date: '2024-01-03', messages: 278, leads: 15, responseRate: 89 },
    { date: '2024-01-04', messages: 389, leads: 24, responseRate: 97 },
    { date: '2024-01-05', messages: 445, leads: 31, responseRate: 93 },
    { date: '2024-01-06', messages: 398, leads: 28, responseRate: 96 },
    { date: '2024-01-07', messages: 467, leads: 35, responseRate: 98 }
  ];

  const automationData = [
    { name: 'Automatizados', value: stats.automatedMessages, color: '#10B981' },
    { name: 'Humanos', value: stats.humanMessages, color: '#3B82F6' }
  ];

  // Función para cargar estadísticas del usuario
  const fetchUserStats = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      console.log('🔍 Fetching stats for user:', user.id);
      
      // Obtener estadísticas del usuario desde la base de datos
      const { data: statsData } = await supabase
        .from('statistics')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(30); // Últimos 30 días
      
      if (statsData && statsData.length > 0) {
        // Calcular totales
        const totalStats = statsData.reduce((acc, stat) => ({
          totalMessages: acc.totalMessages + (stat.total_messages || 0),
          automatedMessages: acc.automatedMessages + (stat.automated_messages || 0),
          humanMessages: acc.humanMessages + (stat.human_messages || 0),
          newLeads: acc.newLeads + (stat.new_leads || 0),
          totalClients: acc.totalClients + (stat.leads_converted || 0)
        }), {
          totalMessages: 0,
          automatedMessages: 0,
          humanMessages: 0,
          newLeads: 0,
          totalClients: 0
        });
        
        // Calcular tasa de respuesta
        const responseRate = totalStats.totalMessages > 0 
          ? ((totalStats.automatedMessages + totalStats.humanMessages) / totalStats.totalMessages) * 100
          : 0;
        
        setStats({
          ...totalStats,
          responseRate: Math.round(responseRate * 100) / 100
        });
      }
      
      console.log('📊 Stats loaded for user:', user.id);
    } catch (error) {
      console.error('Error loading stats:', error);
      toast({
        title: "Error al cargar estadísticas",
        description: "No se pudieron cargar las estadísticas",
        variant: "destructive",
      });
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
        <h1 className="text-3xl font-bold">Estadísticas de {user.email}</h1>
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
          value={`${((stats.automatedMessages / stats.totalMessages) * 100).toFixed(1)}%`}
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
              <BarChart data={channelData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="messages" fill="#3B82F6" radius={[4, 4, 0, 0]} />
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
                <Bar yAxisId="left" dataKey="messages" fill="#3B82F6" />
                <Line yAxisId="right" type="monotone" dataKey="responseRate" stroke="#10B981" strokeWidth={3} />
              </LineChart>
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
    </div>
  );
};

export default StatsView;
