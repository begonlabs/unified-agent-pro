
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, MessageSquare, Bot, Activity, Globe } from 'lucide-react';

const GeneralStats = () => {
  // Datos de ejemplo para las estadísticas generales
  const generalMetrics = {
    totalUsers: 1247,
    totalMessages: 18569,
    automationRate: 67.8,
    activeChannels: 3,
    dailyActiveUsers: 342,
    monthlyGrowth: 12.5
  };

  const monthlyData = [
    { month: 'Ene', users: 890, messages: 12400, leads: 234 },
    { month: 'Feb', users: 945, messages: 13200, leads: 267 },
    { month: 'Mar', users: 1020, messages: 14800, leads: 298 },
    { month: 'Abr', users: 1150, messages: 16200, leads: 345 },
    { month: 'May', users: 1200, messages: 17500, leads: 389 },
    { month: 'Jun', users: 1247, messages: 18569, leads: 412 }
  ];

  const channelDistribution = [
    { name: 'WhatsApp', value: 45, color: '#25D366' },
    { name: 'Facebook', value: 30, color: '#1877F2' },
    { name: 'Instagram', value: 15, color: '#E4405F' },
    { name: 'Otros', value: 10, color: '#64748B' }
  ];

  const platformStats = [
    { platform: 'Web', users: 678, growth: '+8.2%' },
    { platform: 'Mobile', users: 569, growth: '+15.4%' },
    { platform: 'API', users: 234, growth: '+3.1%' }
  ];

  const StatCard = ({ title, value, icon: Icon, color, subtitle, trend }: any) => (
    <Card className="bg-zinc-800/50 border-zinc-700 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-mono font-medium text-zinc-300 uppercase tracking-wider">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-mono font-bold text-white">{value}</div>
        {subtitle && <p className="text-xs font-mono text-zinc-400 tracking-wide">{subtitle}</p>}
        {trend && (
          <div className="flex items-center mt-2">
            <TrendingUp className="h-3 w-3 text-green-400 mr-1" />
            <span className="text-xs font-mono text-green-400">{trend}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 bg-zinc-900 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-mono font-black uppercase tracking-widest text-white">Estadísticas Generales</h2>
        <p className="text-zinc-400 font-mono tracking-wide">
          Vista general del rendimiento de toda la plataforma
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Usuarios Totales"
          value={generalMetrics.totalUsers.toLocaleString()}
          icon={Users}
          color="text-blue-400"
          subtitle="Usuarios registrados"
          trend="+12.5%"
        />
        <StatCard
          title="Mensajes Totales"
          value={generalMetrics.totalMessages.toLocaleString()}
          icon={MessageSquare}
          color="text-green-400"
          subtitle="Este mes"
          trend="+8.3%"
        />
        <StatCard
          title="Automatización"
          value={`${generalMetrics.automationRate}%`}
          icon={Bot}
          color="text-purple-400"
          subtitle="Mensajes automatizados"
          trend="+2.1%"
        />
        <StatCard
          title="Usuarios Activos"
          value={generalMetrics.dailyActiveUsers}
          icon={Activity}
          color="text-orange-400"
          subtitle="Últimas 24 horas"
          trend="+5.7%"
        />
        <StatCard
          title="Canales Activos"
          value={generalMetrics.activeChannels}
          icon={Globe}
          color="text-cyan-400"
          subtitle="Plataformas conectadas"
        />
        <StatCard
          title="Crecimiento"
          value={`${generalMetrics.monthlyGrowth}%`}
          icon={TrendingUp}
          color="text-emerald-400"
          subtitle="Crecimiento mensual"
          trend="Tendencia positiva"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Growth */}
        <Card className="bg-zinc-800/50 border-zinc-700 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="font-mono text-white uppercase tracking-wider">Crecimiento Mensual</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                <XAxis dataKey="month" stroke="#a1a1aa" fontSize={12} fontFamily="monospace" />
                <YAxis stroke="#a1a1aa" fontSize={12} fontFamily="monospace" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#27272a', 
                    border: '1px solid #3f3f46', 
                    borderRadius: '4px',
                    fontFamily: 'monospace'
                  }} 
                />
                <Line type="monotone" dataKey="users" stroke="#3B82F6" strokeWidth={3} />
                <Line type="monotone" dataKey="leads" stroke="#10B981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Channel Distribution */}
        <Card className="bg-zinc-800/50 border-zinc-700 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="font-mono text-white uppercase tracking-wider">Distribución por Canal</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={channelDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  fontSize={12}
                  fontFamily="monospace"
                >
                  {channelDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#27272a', 
                    border: '1px solid #3f3f46', 
                    borderRadius: '4px',
                    fontFamily: 'monospace'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Message Volume Chart */}
      <Card className="bg-zinc-800/50 border-zinc-700 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="font-mono text-white uppercase tracking-wider">Volumen de Mensajes</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
              <XAxis dataKey="month" stroke="#a1a1aa" fontSize={12} fontFamily="monospace" />
              <YAxis stroke="#a1a1aa" fontSize={12} fontFamily="monospace" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#27272a', 
                  border: '1px solid #3f3f46', 
                  borderRadius: '4px',
                  fontFamily: 'monospace'
                }} 
              />
              <Bar dataKey="messages" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Platform Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {platformStats.map((platform) => (
          <Card key={platform.platform} className="bg-zinc-800/50 border-zinc-700 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-mono font-medium text-white uppercase tracking-wider">
                {platform.platform}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-zinc-400 font-mono">Usuarios Activos</span>
                  <span className="font-mono font-bold text-white">{platform.users.toLocaleString()}</span>
                </div>
                <div className="w-full bg-zinc-700 rounded-full h-2 mt-2">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-red-600 to-orange-600"
                    style={{ 
                      width: `${(platform.users / Math.max(...platformStats.map(p => p.users))) * 100}%`
                    }}
                  ></div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-400 font-mono">Crecimiento</span>
                <span className="font-mono font-bold text-green-400">{platform.growth}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default GeneralStats;
